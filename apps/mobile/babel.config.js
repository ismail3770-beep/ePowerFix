module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // Force hermes-v0 profile so that private class fields (#field)
      // are transpiled before reaching hermesc 0.12.0 (shipped with RN 0.79.x)
      // which does not support ES private class fields natively.
      ['babel-preset-expo', { unstable_transformProfile: 'hermes-v0' }],
    ],
    plugins: ['react-native-reanimated/plugin'],
  };
};
