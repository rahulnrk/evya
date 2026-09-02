import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {Login} from '../screens/login';
import strings from '../utils/strings';
import {ProfileScreen} from '../screens/account';
import {AddVehicleScreen} from '../screens/add-vehicle';
import PrivacyPolicy from '../screens/station-details/PrivacyPolicy';

const Stack = createNativeStackNavigator();
const AuthNav = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name={strings.login} component={Login} />
      <Stack.Screen name={strings.profile} component={ProfileScreen} />
      <Stack.Screen name={strings.addvehicle} component={AddVehicleScreen} />
       <Stack.Screen name={strings.privacypolicy} component={PrivacyPolicy}/>
    </Stack.Navigator>
  );
};

export default AuthNav;

const styles = StyleSheet.create({});
