/* eslint-disable no-console */
/*
  Task: Verify Expo push notifications before APK build.
  Usage: node test-push.js
*/

// Try to use global fetch (Node 18+)
// If not available, you might need to install node-fetch: npm install node-fetch
const fetch = global.fetch || require('node-fetch');

const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send';

// ⚠️ HARDCODED TOKEN - REPLACE THIS BEFORE RUNNING
// Example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]'
const TARGET_TOKEN = 'ExponentPushToken[-3CaQuJiVPaA1ce4pqiPZf]';

async function sendPush() {
  if (!TARGET_TOKEN || TARGET_TOKEN.includes('REPLACE_WITH_YOUR_TOKEN')) {
    console.error('❌ Error: Please replace TARGET_TOKEN with a valid push token in test-push.js');
    console.log('You can find your token by checking the logs of the running app or checking your User document in DB.');
    process.exit(1);
  }

  const message = {
    to: TARGET_TOKEN,
    sound: 'default',
    title: 'Test Notification 🚀',
    body: 'This is a test message from test-push.js',
    data: { test: true, timestamp: Date.now() },
  };

  console.log('🚀 Sending push notification...');
  console.log('📦 Payload:', JSON.stringify(message, null, 2));

  try {
    const response = await fetch(EXPO_PUSH_API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    
    console.log('---------------------------------------------------');
    console.log('📡 Expo API Response:');
    console.log(JSON.stringify(result, null, 2));
    console.log('---------------------------------------------------');

    if (response.ok && (result.data?.status === 'ok' || result.data?.[0]?.status === 'ok')) {
      // Note: Expo API returns { data: { status: "ok", id: "..." } } or array if batch
      console.log('✅ Notification sent successfully!');
    } else {
      console.error('❌ Failed to send notification.');
      if (result.errors) {
        console.error('Errors:', result.errors);
      }
    }

  } catch (error) {
    console.error('❌ Network or Script Error:', error);
  }
}

sendPush();
