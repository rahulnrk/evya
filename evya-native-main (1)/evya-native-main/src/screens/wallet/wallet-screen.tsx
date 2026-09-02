import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import RootScroll from '../../components/scroll-view';
import {mainstyles} from '../../helpers/app-styles';
import {adjust} from '../../helpers/common-functions';
import {pallette} from '../../utils/pallette';
import {semibold} from '../../utils/fonts';
import Header from '../../components/header-with-skip';
import WalletAndTransactions from './wallet-card-and-transactions';
import { useRoute } from '@react-navigation/native';

const Wallet = ({navigation}: any) => {
  const route = useRoute();
  
  return (
    <RootScroll>
      <Header 
      title="EVYA Wallet"
      hasback={false}
      onback={() => {}}
      active={1}
      onSkip={() => {}}
      skippable={false}
      hastitle={true}
      />
      <WalletAndTransactions navigation={navigation} route={route}/>
    </RootScroll>
  );
};

export default Wallet;

const styles = StyleSheet.create({
  text: {
    fontSize: adjust(12),
    color: pallette.black,
    fontFamily: semibold,
  },
});