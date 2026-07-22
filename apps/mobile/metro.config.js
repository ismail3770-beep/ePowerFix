/**
 * Metro configuration for ePowerFix mobile app
 * Simple config — no NativeWind, uses inline styles
 */
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch all files within the monorepo
config.watchFolders = [monorepoRoot];

// Let Metro know where to resolve packages
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Ensure packages that use private class fields (#field syntax) are
// transpiled by Babel so hermesc can compile them.
// react-native-reanimated ships ESM with private class fields in lib/module/
const defaultIgnore =
  'node_modules[\\/\\\\](?!((react-native|@react-native(-community)?)\\/|(expo([a-z_-]*)\\/)|react-navigation|@react-navigation\\/|@unimodules\\/|unimodules|sentry-expo|native-base|react-native-svg))';
config.transformer.transformIgnorePatterns = [defaultIgnore];

module.exports = config;
