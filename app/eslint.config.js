const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // Route files are composition-only: data + hooks + components. Visible UI
    // (Text, buttons), inputs, modals and StyleSheet belong in components/.
    // This rule is what keeps the componentized structure from regressing.
    files: ['app/**/*.tsx'],
    ignores: [
      'app/_layout.tsx', // root layout still hosts the update/shutdown modals
      'app/+not-found.tsx',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-native',
              importNames: ['Text', 'TextInput', 'TouchableOpacity', 'StyleSheet', 'Modal'],
              message:
                'Route files are composition-only. Build or extend a component in components/ (AppText, Button, SettingsRow, BottomSheet, …) instead.',
            },
          ],
        },
      ],
    },
  },
]);
