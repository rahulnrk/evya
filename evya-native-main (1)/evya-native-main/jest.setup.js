/* global jest */

// AsyncStorage (required by AppContext and ChargingContext)
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Optional native modules used transitively — keep tests from loading native bridges
jest.mock('react-native-geolocation-service', () => ({
  getCurrentPosition: jest.fn((success) =>
    success({ coords: { latitude: 0, longitude: 0, accuracy: 1 } }),
  ),
  watchPosition: jest.fn(() => 1),
  clearWatch: jest.fn(),
  stopObserving: jest.fn(),
  requestAuthorization: jest.fn(() => Promise.resolve('granted')),
}));

jest.mock('react-native-device-info', () => ({
  getUniqueId: jest.fn(() => Promise.resolve('test-device-id')),
  getVersion: jest.fn(() => '0.0.1'),
  getSystemName: jest.fn(() => 'Android'),
}));

jest.mock('react-native-toast-message', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => null,
    show: jest.fn(),
    hide: jest.fn(),
  };
});

jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');

jest.mock('react-native-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return ({ children, ...props }) => React.createElement(View, props, children);
});

jest.mock('react-native-webview', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: (props) => React.createElement(View, props),
    WebView: (props) => React.createElement(View, props),
  };
});

jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockMap = (props) => React.createElement(View, props);
  MockMap.Marker = (props) => React.createElement(View, props);
  MockMap.Callout = (props) => React.createElement(View, props);
  return {
    __esModule: true,
    default: MockMap,
    Marker: MockMap.Marker,
    Callout: MockMap.Callout,
    PROVIDER_GOOGLE: 'google',
  };
});

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  };
});

jest.mock('react-native-screens', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    enableScreens: jest.fn(),
    Screen: View,
    ScreenContainer: View,
    NativeScreen: View,
    NativeScreenContainer: View,
  };
});
