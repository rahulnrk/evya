import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import React, { useCallback } from 'react';
import { mainstyles } from '../helpers/app-styles';
import { useRefresh } from '../contexts/RefreshContext';

interface RootScrollProps {
  children: React.ReactNode;
}

const RootScroll: React.FC<RootScrollProps> = ({ children }) => {
  const [refreshing, setRefreshing] = React.useState(false);
  const { triggerRefresh } = useRefresh();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      triggerRefresh();
      
      setTimeout(() => {
        setRefreshing(false);
      }, 1000);
    } catch (error) {
      console.error('Refresh error:', error);
      setRefreshing(false);
    }
  }, [triggerRefresh]);

  return (
    <ScrollView
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          colors={['#000000']}
          tintColor="#000000"
        />
      }
      style={mainstyles.container}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
};

export default RootScroll;

const styles = StyleSheet.create({});