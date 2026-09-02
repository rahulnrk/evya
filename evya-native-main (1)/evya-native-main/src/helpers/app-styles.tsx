import {Platform, StatusBar, StyleSheet} from 'react-native';
import { h, w } from '../constants/dimensions';
import { pallette } from '../utils/pallette';

export const mainstyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: pallette.white,
    paddingTop: Platform.OS == 'android' ? (StatusBar?.currentHeight/2) : 0
  },
  fullscreen: {
    minHeight: h,
    width: w,
  },
});
