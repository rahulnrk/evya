import {StyleSheet, Text, View} from 'react-native';
import React, { useState } from 'react';
import RootScroll from '../../components/scroll-view';

import {adjust} from '../../helpers/common-functions';
import {pallette} from '../../utils/pallette';
import {semibold} from '../../utils/fonts';
import Header from '../../components/header-with-skip';
import TopTabs from '../../components/top-tabs';
import VehicleListScreen from './vehicle-list';
import DeviceListScreen from './devices-list';

const Devices: React.FC<{ navigation: any }> = ({ navigation }) => {
  const tabs = ['Vehicles','Chargers']
  const [selected, setSelected] = useState(tabs[0])
  return (
    <RootScroll>
      <Header 
      title="My Devices"
     onback={() => navigation.goBack()} // You can leave empty if BackArrow is inside Header
        active={1}
        onSkip={() => {}}
        skippable={false}
        hastitle={true}
      />
       <TopTabs
        tabs={tabs}
        onTabChange={(index) => setSelected(tabs[index])}
      />
      {
        selected == tabs[0] ?
        <VehicleListScreen navigation={navigation}/>
        :
        <DeviceListScreen/>
      }
    </RootScroll>
  );
};

export default Devices;

const styles = StyleSheet.create({
  text: {
    fontSize: adjust(12),
    color: pallette.black,
    fontFamily:semibold,
  },
});
