import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import RootScroll from '../../components/scroll-view';
import Header from '../../components/header-with-skip';
import AccountTabs from './account';
import { pallette } from '../../utils/pallette';
import { regular, semibold } from '../../utils/fonts';
import { adjust } from '../../helpers/common-functions';

/**
 * Account Screen Component
 * 
 * Main account management screen that displays user account information
 * and navigation tabs for different account sections.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.navigation - Navigation object for screen transitions
 * @returns {JSX.Element} Rendered account screen
 */
const Account = ({ navigation }: any) => {
  /**
   * Handle back button press
   * Navigates back to previous screen
   */
  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
       <Header 
          title="Account"
          onback={handleBackPress}
          active={1}
          onSkip={() => {}}
          skippable={false}
          hastitle={true}
        />
      <RootScroll>
        {/* Header with back button and title */}
       
        
        {/* Account tabs for navigation between account sections */}
        <AccountTabs navigation={navigation}/>
      </RootScroll>
    </View>
  );
};

export default Account;

const styles = StyleSheet.create({
  /**
   * Main container style
   * Provides full screen background color
   */
  container: { 
    flex: 1, 
    backgroundColor: pallette.white ,
     paddingTop: 24,
  },
});