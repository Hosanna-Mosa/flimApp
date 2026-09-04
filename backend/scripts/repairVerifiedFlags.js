require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../server/src/models/User.model');

/**
 * Reset badges that were never earned.
 *
 * The OTP endpoint used to set isVerified on signup, and set it again on every
 * subsequent login, because it read the field as "phone confirmed" rather than
 * "profile verified". That is fixed in otp.controller, but the accounts it
 * already marked stay marked — removing the cause does not undo the effect.
 *
 * A badge is legitimate only when the verification flow actually granted it:
 * verificationStatus 'active', which adminVerification.approve sets once the
 * documents pass and the subscription is paid. Everyone else with the flag got
 * it from the bug.
 *
 *   node scripts/repairVerifiedFlags.js          # dry run, changes nothing
 *   node scripts/repairVerifiedFlags.js --apply  # writes
 */
const run = async () => {
  const apply = process.argv.includes('--apply');
  await mongoose.connect(process.env.MONGODB_URI);

  const wronglyVerified = { isVerified: true, verificationStatus: { $ne: 'active' } };

  const [total, verified, legitimate, affected] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isVerified: true }),
    User.countDocuments({ isVerified: true, verificationStatus: 'active' }),
    User.countDocuments(wronglyVerified),
  ]);

  console.log('');
  console.log(`  users                        ${total}`);
  console.log(`  currently flagged verified   ${verified}`);
  console.log(`  legitimately verified        ${legitimate}   (verificationStatus 'active')`);
  console.log(`  to be reset                  ${affected}`);
  console.log('');

  if (affected > 0) {
    const sample = await User.find(wronglyVerified)
      .select('name phone verificationStatus createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    console.log('  most recent of those:');
    for (const u of sample) {
      console.log(
        `    ${(u.name || '(no name)').padEnd(24)} status=${String(u.verificationStatus).padEnd(16)} joined ${u.createdAt?.toISOString().slice(0, 10)}`
      );
    }
    console.log('');
  }

  if (!apply) {
    console.log('  DRY RUN — nothing written. Re-run with --apply to make the change.');
    console.log('');
    await mongoose.disconnect();
    process.exit(0);
  }

  // verifiedUntil is cleared alongside the flag; leaving a future expiry on an
  // unverified account would let anything that reads the date re-grant a badge
  // this script just removed.
  const result = await User.updateMany(wronglyVerified, {
    $set: { isVerified: false },
    $unset: { verifiedUntil: '' },
  });

  console.log(`  reset ${result.modifiedCount} account(s).`);
  console.log(`  still verified: ${await User.countDocuments({ isVerified: true })}`);
  console.log('');

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
