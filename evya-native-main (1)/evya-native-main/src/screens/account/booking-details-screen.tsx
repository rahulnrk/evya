import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import RootScroll from '../../components/scroll-view';
import Header from '../../components/header-with-skip';
import BookingDetailsComponent from '../station-details/booking-details';
import { pallette } from '../../utils/pallette';

/**
 * Booking Details Screen
 * 
 * Displays detailed information about a specific booking including
 * station details, timing, pricing, and booking status.
 * 
 * @component
 * @returns {JSX.Element} Rendered booking details screen
 */
const BookingDetails = () => {
  const navigation = useNavigation();

  /**
   * Handle back button press
   * Navigates back to the previous screen
   */
  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
     <View style={styles.container}>
     <Header
        onback={handleBackPress}
        active={1}
        onSkip={() => {}}
        skippable={false}
        hastitle={true}
        title={'Booking Details'}
      />
    <RootScroll>
      <BookingDetailsComponent/>
    </RootScroll></View>
  );
};

export default BookingDetails;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor:pallette.white ,
     paddingTop: 24,
  },
});
 