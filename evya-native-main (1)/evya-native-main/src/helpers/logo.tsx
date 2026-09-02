import {Image, StyleSheet, Text, View} from 'react-native';
import React from 'react';

const Logo = ({type = 'V', style}: {type?: string; style?: any}) => {
  return (
    <Image
      source={
        type == 'V'
          ? require('../assets/images/logov.png')
          : require('../assets/images/logoh.png')
      }
      style={[styles.logo, style]}
    />
  );
};

export default Logo;

const styles = StyleSheet.create({
  logo: {},
});
