require('dotenv').config();
const { execSync } = require('child_process');
const path = require('path');

// Simple logger since we're in scripts folder
const logger = {
  info: (msg) => console.log(msg),
  error: (msg) => console.error(msg),
};

const runAllSeeds = async () => {
  try {
    logger.info('🌱 Starting database seeding...\n');

    // Step 1: Clear database
    logger.info('Step 1: Clearing existing data...');
    execSync('node scripts/clearDatabase.js', { stdio: 'inherit' });

    // Step 2: Seed users
    logger.info('\nStep 2: Seeding users...');
    execSync('node scripts/seedUsers.js', { stdio: 'inherit' });

    // Step 3: Seed posts
    logger.info('\nStep 3: Seeding posts...');
    execSync('node scripts/seedPosts.js', { stdio: 'inherit' });

    logger.info('\n\n🎉 All seeding completed successfully!');
    logger.info('\n📊 Database Summary:');
    logger.info('✅ 6 Users created');
    logger.info('✅ 8 Posts created');
    logger.info('\n🔑 Test Login Credentials:');
    logger.info('  Email: raj@example.com');
    logger.info('  Password: password123');
    logger.info('\n  Other test emails:');
    logger.info('  - priya@example.com');
    logger.info('  - arjun@example.com');
    logger.info('  - maya@example.com');
    logger.info('  - vikram@example.com');
    logger.info('  - ananya@example.com');
    logger.info('  (All passwords: password123)\n');

    process.exit(0);
  } catch (error) {
    logger.error('Error running seeds:', error);
    process.exit(1);
  }
};

runAllSeeds();
