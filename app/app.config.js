// Dynamic Expo config.
//
// app.json holds the static config. This file layers one dynamic value on
// top: `extra.apiUrl` is sourced from EXPO_PUBLIC_API_URL (see .env) instead
// of being hand-typed into app.json. That value is your machine's current
// LAN IP, which changes across networks/DHCP leases — hardcoding it in
// app.json silently goes stale and every API call in the app then times out
// trying to reach an IP that no longer exists.
//
// Expo automatically loads .env into process.env before evaluating this
// file (visible in `expo start` logs as "env: export EXPO_PUBLIC_API_URL").

module.exports = ({ config }) => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  if (!apiUrl) {
    // eslint-disable-next-line no-console
    console.warn(
      '[app.config.js] EXPO_PUBLIC_API_URL is not set in .env — falling back to ' +
        `app.json extra.apiUrl ("${config.extra?.apiUrl}"), which may be stale.`
    );
  }

  return {
    ...config,
    extra: {
      ...config.extra,
      apiUrl: apiUrl || config.extra?.apiUrl,
    },
  };
};
