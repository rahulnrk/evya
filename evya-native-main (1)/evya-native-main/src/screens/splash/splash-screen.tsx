import {Image, StyleSheet, Text, View} from 'react-native';
import React, {useContext, useEffect} from 'react';
import RootScroll from '../../components/scroll-view';
import {mainstyles} from '../../helpers/app-styles';
import {pallette} from '../../utils/pallette';
import {h, w} from '../../constants/dimensions';
import {adjust, nav} from '../../helpers/common-functions';
import {regular} from '../../utils/fonts';
import {useIsFocused} from '@react-navigation/native';
import {AppContext} from '../../contexts/app-context';
import Logo from '../../helpers/logo';
import strings from '../../utils/strings';

const Splash = ({navigation, route}: any) => {
  const context = useContext(AppContext);
  const {contextState: loginstate, contextLoaded} = context || {};
  const focused = useIsFocused();
  useEffect(() => {
    if (!focused || !contextLoaded) return;

    const timeout = setTimeout(() => {
      if (loginstate?.isAuthenticated) {
        nav(navigation, strings.app);
      } else if (loginstate?.onBoarded) {
        nav(navigation, strings.auth);
      } else {
        nav(navigation, strings.onboarding);
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [focused, contextLoaded]);
  return (
    <RootScroll>
      <View style={[mainstyles.fullscreen, styles.container]}>
        <Logo style={styles.logo} />
        <View style={styles.flashTextContainer}>
          <Image
            source={require('../../assets/images/flash.png')}
            style={styles.flashImage}
          />
          <Text style={styles.flashText}>{`Charging your \n experience`}</Text>
        </View>
      </View>
    </RootScroll>
  );
};

export default Splash;

const styles = StyleSheet.create({
  container: {
    backgroundColor: pallette.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    height: h * 0.3,
    width: w * 0.8,
    resizeMode: 'contain',
  },
  flashTextContainer: {
    position: 'absolute',
    bottom: h * 0.1,
    alignItems: 'center',
  },
  flashImage: {
    height: h * 0.04,
    width: w * 0.04,
    resizeMode: 'contain',
  },
  flashText: {
    fontSize: adjust(10),
    fontFamily: regular,
    color: pallette.grey,
    textAlign: 'center',
  },
});
