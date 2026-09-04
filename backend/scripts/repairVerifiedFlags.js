require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../server/src/models/User.model');

/**
 * Reset badges that were never earned.
 *
 * The OTP endpoint used to set isBadgeVerified on signup, and set it again on every
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

  // The field was renamed from isVerified to isBadgeVerified. Existing
  // documents still carry the old key, and mongoose will not see it, so every
  // account would silently read as unverified until the key is moved. Done
  // through the driver rather than the model because mongoose strips fields
  // the schema no longer declares.
  const raw = mongoose.connection.db.collection('users');

  const stale = await raw.countDocuments({ isVerified: { $exists: true } });
  if (stale > 0) {
    console.log(`\n  ${stale} document(s) still use the old isVerified key.`);
    if (apply) {
      const renamed = await raw.updateMany(
        { isVerified: { $exists: true } },
        { $rename: { isVerified: 'isBadgeVerified' } }
      );
      console.log(`  renamed on ${renamed.modifiedCount} document(s).`);
    }
  }

  const wronglyVerified = { isBadgeVerified: true, verificationStatus: { $ne: 'active' } };

  // Counted through the driver against either key. A dry run that queries only
  // the new field reports zero while the rename is still pending, which is the
  // opposite of what a dry run is for.
  const heldBadge = { $or: [{ isVerified: true }, { isBadgeVerified: true }] };

  const [total, verified, legitimate, affected] = await Promise.all([
    raw.countDocuments(),
    raw.countDocuments(heldBadge),
    raw.countDocuments({ ...heldBadge, verificationStatus: 'active' }),
    raw.countDocuments({ ...heldBadge, verificationStatus: { $ne: 'active' } }),
  ]);

  console.log('');
  console.log(`  users                        ${total}`);
  console.log(`  currently flagged verified   ${verified}`);
  console.log(`  legitimately verified        ${legitimate}   (verificationStatus 'active')`);
  console.log(`  to be reset                  ${affected}`);
  console.log('');

  if (affected > 0) {
    const sample = await raw
      .find({ ...heldBadge, verificationStatus: { $ne: 'active' } })
      .project({ name: 1, verificationStatus: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
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
    $set: { isBadgeVerified: false },
    $unset: { verifiedUntil: '' },
  });

  // Nothing recorded who had confirmed a phone before isPhoneVerified existed,
  // and it cannot be inferred after the fact. Existing accounts start false and
  // set it on their next OTP sign-in rather than being credited with a
  // confirmation that was never stored.
  const phoneDefaults = await User.updateMany(
    { isPhoneVerified: { $exists: false } },
    { $set: { isPhoneVerified: false } }
  );
  console.log(`  isPhoneVerified initialised on ${phoneDefaults.modifiedCount} account(s).`);

  console.log(`  reset ${result.modifiedCount} account(s).`);
  console.log(`  still verified: ${await User.countDocuments({ isBadgeVerified: true })}`);
  console.log('');

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
