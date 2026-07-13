module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@epowerfix/types': '../../packages/types/src',
            '@epowerfix/api-client': '../../packages/api-client/src',
            '@epowerfix/store': '../../packages/store/src',
            '@epowerfix/utils': '../../packages/utils/src',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
