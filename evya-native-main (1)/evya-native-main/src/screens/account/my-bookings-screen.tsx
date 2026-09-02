import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import RootScroll from '../../components/scroll-view';
import Header from '../../components/header-with-skip';
import TopTabs from '../../components/top-tabs';
import ScheduleList from '../station-details/bookings-list';
import { pallette } from '../../utils/pallette';

/**
 * MyBookings Screen - Main screen for displaying user bookings across different statuses
 * Connects TopTabs and ScheduleList components with proper state management
 */
const MyBookings = ({ navigation }: any) => {
  const tabs = ['Upcoming', 'Completed', 'Cancelled'];
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);

  /**
   * Handles tab changes from TopTabs component
   * @param {number} index - The index of the selected tab
   */
  const handleTabChange = (index: number): void => {
    setActiveTabIndex(index);
  };

  return (
    <View style={styles.container}>
       <Header
          onback={() => navigation.goBack()}
          active={1}
          onSkip={() => {}}
          skippable={false}
          hastitle={true}
          title={'My Bookings'}
        />
         <TopTabs 
          tabs={tabs} 
          onTabChange={handleTabChange} 
        />
      <RootScroll>
       
        <ScheduleList 
          navigation={navigation} 
          activeTabIndex={activeTabIndex} 
        />
      </RootScroll>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: pallette.white,
    paddingTop:24,
  },
});

export default MyBookings;