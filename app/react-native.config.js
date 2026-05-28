// react-native.config.js
// Prevent react-native-razorpay from linking on iOS since payments are Android-only
// This avoids Apple Guideline 3.1.1 issues (third-party payment SDK in iOS binary)

module.exports = {
  dependencies: {
    'react-native-razorpay': {
      platforms: {
        ios: null, // Exclude from iOS native linking
      },
    },
  },
};
