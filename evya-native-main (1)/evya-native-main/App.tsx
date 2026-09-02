import { StatusBar, StyleSheet } from 'react-native';
import React from 'react';
import { PaperProvider } from 'react-native-paper';
import { AppProvider } from './src/contexts/app-context';
import { LocationProvider } from './src/contexts/LocationContext';
import RootNav from './src/routes/root-navigation';
import Toast from 'react-native-toast-message';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/redux/store';
import { ChargingProvider } from './src/contexts/ChargingContext';
import { RefreshProvider } from './src/contexts/RefreshContext';

const App = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <RefreshProvider>
          <ChargingProvider>
            <LocationProvider>
              <PaperProvider>
                <AppProvider>
                  <StatusBar barStyle={'dark-content'} />
                  <RootNav />
                  <Toast />
                </AppProvider>
              </PaperProvider>
            </LocationProvider>
          </ChargingProvider>
        </RefreshProvider>
      </PersistGate>
    </Provider>
  );
};

export default App;

const styles = StyleSheet.create({});
