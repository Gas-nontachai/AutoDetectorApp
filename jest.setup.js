/* eslint-env jest */

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve(null)),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  clear: jest.fn(() => Promise.resolve(null)),
}));

const { NativeModules } = require('react-native');

const DetectorModuleMock = {
  addListener: jest.fn(),
  removeListeners: jest.fn(),
  updateKeywords: jest.fn(),
  updateZone: jest.fn(),
  updateWhitelist: jest.fn(),
  openApp: jest.fn(),
};

NativeModules.DetectorModule = DetectorModuleMock;
