import { StyleSheet, View } from 'react-native';
import React, { useState } from 'react';

import TopTabs from '../../../components/top-tabs';
import Header from '../../../components/header-with-skip';
import RequestRFIDScreen from './request-rfid';
import ActiveRFIDScreen from './active-rfid';
import { useAuth } from '../../../hooks/useAuth';
import { pallette } from '../../../utils/pallette';

const RFIDTabs = ({ navigation }: { navigation: any }) => {
  // STATE-1: userId from Redux (single source of truth)
  const { userId } = useAuth();

  const tabs = ['Request RFIDs','Active RFIDs'];
  const [selected, setSelected] = useState(tabs[0]);

  return (
    <View  style={styles.container}>

      <Header
        title="RFID"
        onback={() => navigation.goBack()}
        active={1}
        onSkip={() => {}}
        skippable={false}
        hastitle={true}
      />

      <TopTabs
        tabs={tabs}
        onTabChange={(index) => setSelected(tabs[index])}
      />

      <View style={{flex:1}}>
        {
          selected === tabs[0]
          ?
          <RequestRFIDScreen userId={userId}/>
          :
          <ActiveRFIDScreen userId={userId}/>
        }
      </View>

    </View>
  );
};

export default RFIDTabs;

const styles = StyleSheet.create({
    container: { 
      flex: 1, 
      backgroundColor: pallette.white,
      marginTop: 25,
    },
});