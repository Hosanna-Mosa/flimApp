require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../server/src/models/Admin.model');
const { ALL_ADMIN_ROLES } = require('../server/src/constants/adminRoles');

/**
 * Change an existing admin's role, or list who currently holds what.
 *
 * Until the Admins & Roles screen exists this is the only supported way to
 * grant OPERATIONS_ADMIN, which no account can have yet — the role was added
 * after every current admin was created.
 *
 *   node scripts/setAdminRole.js --list
 *   node scripts/setAdminRole.js someone@example.com OPERATIONS_ADMIN
 */
const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const [emailArg, roleArg] = process.argv.slice(2);

  if (emailArg === '--list' || !emailArg) {
    const admins = await Admin.find().select('name email role lastLoginAt').sort({ role: 1 });
    if (!admins.length) {
      console.log('No admin accounts exist. Run scripts/createAdmin.js first.');
    } else {
      console.log('\nCurrent admins:\n');
      for (const a of admins) {
        const seen = a.lastLoginAt ? a.lastLoginAt.toISOString().slice(0, 10) : 'never';
        console.log(`  ${a.role.padEnd(20)} ${a.email.padEnd(34)} ${a.name.padEnd(22)} last login: ${seen}`);
      }
    }
    console.log(`\nAvailable roles: ${ALL_ADMIN_ROLES.join(', ')}`);
    console.log('Usage: node scripts/setAdminRole.js <email> <ROLE>\n');
    process.exit(0);
  }

  if (!roleArg) {
    console.error('Missing role. Usage: node scripts/setAdminRole.js <email> <ROLE>');
    process.exit(1);
  }

  if (!ALL_ADMIN_ROLES.includes(roleArg)) {
    console.error(`Unknown role "${roleArg}". Expected one of: ${ALL_ADMIN_ROLES.join(', ')}`);
    process.exit(1);
  }

  const admin = await Admin.findOne({ email: String(emailArg).toLowerCase() });
  if (!admin) {
    console.error(`No admin found with email ${emailArg}`);
    process.exit(1);
  }

  const previous = admin.role;
  if (previous === roleArg) {
    console.log(`${admin.email} is already ${roleArg}. Nothing to do.`);
    process.exit(0);
  }

  admin.role = roleArg;
  await admin.save();

  console.log(`${admin.email}: ${previous} -> ${roleArg}`);
  process.exit(0);
};

run().catch((err) => {
  console.error('Failed to update admin role:', err);
  process.exit(1);
});
