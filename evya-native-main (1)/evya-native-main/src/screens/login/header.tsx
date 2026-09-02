import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {h, w} from '../../constants/dimensions';
import {pallette} from '../../utils/pallette';
import Icon from 'react-native-vector-icons/FontAwesome6';

const Header = ({
  active,
  onback,
}: {
  active: number;
  onback: () => void;
}) => {
  return (
    <View style={styles.container}>
      {active != 0 ? (
        <TouchableOpacity onPress={() => onback()}>
          <Icon
            name={'arrow-left-long'}
            size={w * 0.05}
            color={pallette.black}
          />
        </TouchableOpacity>
      ) : (
        <View />
      )}
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  container: {
    height: h * 0.075,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
