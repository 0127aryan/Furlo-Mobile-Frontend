require('./scripts/patch-metro-onedrive');

const { getDefaultConfig } = require('expo/metro-config');

module.exports = getDefaultConfig(__dirname);
