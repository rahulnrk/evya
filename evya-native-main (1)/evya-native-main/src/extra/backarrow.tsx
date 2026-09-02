import React from 'react';
import {TouchableOpacity, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons'; // You can use Feather, MaterialIcons too
import {pallette} from '../utils/pallette'; // adjust path

const BackArrow = () => {
  const navigation = useNavigation();

  return (
    <TouchableOpacity style={styles.container} onPress={() => navigation.goBack()}>
      <Icon name="arrow-back" size={26} color={pallette.black} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop:20,
    padding: 10,
  },
});

export default BackArrow;
