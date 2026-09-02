import React, { useEffect, useState } from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import strings from '../utils/strings';
import {Splash} from '../screens/splash';
import {OnBoarding} from '../screens/on-boarding';
import AuthNav from './auth-navigation';
import TabNav from './app-navigation';
import { getValue } from '../helpers/common-functions';
import { ID } from '../constants/dimensions';

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: ["evya://"],  // custom scheme
  config: {
    screens: {
      [strings.app]: {
        screens: {
          [strings.hometab]: {
            screens: {
              [strings.bookcharger]: "booking", 
              [strings.stationdetails]:"stationdetails"// maps to booking screen
              
            },
          },
        },
      },
    },
  },
};
const RootNav = () => {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name={strings.landing} component={Splash} />
        <Stack.Screen name={strings.onboarding} component={OnBoarding} />
        <Stack.Screen name={strings.auth} component={AuthNav} />
        <Stack.Screen name={strings.app} component={TabNav} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNav;

const styles = StyleSheet.create({});
