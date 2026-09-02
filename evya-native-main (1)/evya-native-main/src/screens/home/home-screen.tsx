// Home.tsx
import RootScroll from '../../components/scroll-view';
import Header from './header';
import React, { useState, useEffect, useMemo } from 'react';
import CarList from './car-info-list';
import MapSection from './map-section';
import { pallette } from '../../utils/pallette';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import { nav } from '../../helpers/common-functions';
import strings from '../../utils/strings';
import FilterTabs from './FilterTabs';
import { getUserDetails } from '../../redux/AuthSlice';
import { useCharging } from '../../contexts/ChargingContext';
import OnGoingBooking from './on-going-booking';
import WebMapSection from '../map/WebMapSection';
import { h } from '../../constants/dimensions';
import GreenSpinner from './loader';
import { useAuth } from '../../hooks/useAuth';
import { useAppDispatch } from '../../redux/store';

// Get screen dimensions
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Helper functions
const formatChargingTime = (timeString: string): string => {
  if (!timeString) return '0:00';
  
  const parts = timeString.split(':');
  if (parts.length === 3) {
    const hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    
    if (hours === 0) {
      return `${minutes} min`;
    } else {
      return `${hours}:${minutes}`;
    }
  }
  
  return timeString || '0:00';
};

const formatCurrency = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `₹${num.toFixed(2)}`;
};

const formatDate = (): string => {
  return new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

// Memoize heavy components
const MemoizedCarList = React.memo(CarList);
const MemoizedMapSection = React.memo(MapSection);
const MemoizedFilterTabs = React.memo(FilterTabs);

const Home = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  // PERF-4: atomic selectors via useAuth (not object-literal useSelector)
  const { userId, user, vehicles, loading, userDataLoaded } = useAuth();
  const { chargingSession, liveChargingData } = useCharging();

  const [activevehicle, setActivevehicle] = useState(0);

  // PERF-4: fetch user once when missing — not on every tab focus (unmountOnBlur=false)
  useEffect(() => {
    if (userId && (!user || Object.keys(user).length === 0)) {
      dispatch(getUserDetails(userId));
    }
  }, [userId, user, dispatch]);

  // Show loading state if data is being fetched
  if (loading && !userDataLoaded) {
    return (
      <>
        <Header
          franchises={() => nav(navigation, strings.franchises, { franchises: [] })}
          profile={() => nav(navigation, strings.account)}
        />
        <RootScroll>
          <View >
          <GreenSpinner/>
          </View>
        </RootScroll>
      </>
    );
  }

  // Determine if we should show the charging banner
  const shouldShowChargingBanner = chargingSession && 
    chargingSession.isCharging === true &&
    liveChargingData?.status !== 'Completed' && 
    liveChargingData?.status !== 'Stopped';

  return (
    <>
      <Header
        franchises={() => nav(navigation, strings.franchises, { franchises: [] })}
        profile={() => nav(navigation, strings.account)}
      />
      <View style={styles.container}>
        {/* Car Card Section - 20% height */}
        <View style={styles.carContainer}>
          {shouldShowChargingBanner ? (
            <OnGoingBooking
              stationName={chargingSession.stationName}
              address={chargingSession.siteAddress}
              date={formatDate()}
              timeSlot={liveChargingData ? formatChargingTime(liveChargingData.chargingTime) : 'Now - Ongoing'}
              onNavigatePress={() => nav(navigation, strings.charging)}
              onBookingPress={() => nav(navigation, strings.charging)}
              show={true}
              
              percentage={liveChargingData?.percentage || 0}
              chargingTime={liveChargingData ? formatChargingTime(liveChargingData.chargingTime) : '0:00'}
              cost={formatCurrency(liveChargingData?.cost || '0.00')}
              units={liveChargingData?.units || 0}
              status={liveChargingData?.status || 'Charging'}
              
              onRefreshData={undefined}
            />
          ) : (
            <MemoizedCarList
              vehicles={vehicles}
              active={activevehicle}
              setActive={setActivevehicle}
              navigation={navigation}
            />
          )}
        </View>

        {/* Map Card Section - 68% height */}
        <View style={styles.mapContainer}>
          <WebMapSection />
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // Optional: background color for the gap area
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: pallette.grey,
  },
  
  // Car card takes 20% of screen height
  carContainer: {
   flex: 2,
    marginTop: 12,
    backgroundColor: '#fff',
  },
  
  // Map card takes 68% of screen height
  mapContainer: {
  flex: 7,
  backgroundColor: '#fff',
  marginHorizontal: 10,   // ✅ only left & right
  // marginBottom: 10,       // ✅ bottom space
  borderRadius: 25,
  overflow: 'hidden',
},
  
  // When no vehicles, map takes remaining space
  fullMap: {
    height: h * 0.92, // 92% when no car card (20% car + 4% gap + 68% map)
    marginTop: 12,
  }
});

export default Home;