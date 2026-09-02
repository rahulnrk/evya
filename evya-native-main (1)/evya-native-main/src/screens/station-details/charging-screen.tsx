// Charging.tsx (with context update)
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { useNavigation, useRoute, NavigationProp } from '@react-navigation/native';
import RootScroll from '../../components/scroll-view';
import Header from '../../components/header-with-skip';
import ChargingStatus from './charging-status';
import StationsService from '../../axios/Apis';
import { useCharging } from '../../contexts/ChargingContext';
import { useSelector } from 'react-redux';
import strings from '../../utils/strings';

interface LiveChargingData {
  power: number;
  percentage: number;
  chargingTime: string;
  totalTime: string;
  cost: string;
  totalCost: string;
  units: number;
  totalUnits: number;
  speed: number;
  transactionId?: string;
  status: string;
}

interface RouteParams {
  station?: any;
  connector?: any;
  transactionId?: string;
  charger?: any;
}

const Charging = () => {
  const route = useRoute();
  const navigation = useNavigation<NavigationProp<any>>();
  const { user } = useSelector((state: any) => state.auth);
  const { 
    chargingSession, 
    stopCharging, 
    startCharging, 
    isLoading: contextLoading,
    updateLiveChargingData, // Get this from context
  } = useCharging();
  
  const params = route.params as RouteParams || {};
  const { station, connector, transactionId, charger } = params;

  const [liveChargingData, setLiveChargingData] = useState<LiveChargingData>({
    power: 0,
    percentage: 0,
    chargingTime: '00:00:00',
    totalTime: '00:00:00',
    cost: '0.00',
    totalCost: '0.00',
    units: 0,
    totalUnits: 0,
    speed: 0,
    transactionId: transactionId,
    status: 'Charging',
  });

  const [isLoading, setIsLoading] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout>();

  /**
   * Initialize charging session when component mounts
   */
  useEffect(() => {
    const initializeSession = async () => {
      // Don't initialize if we already have a session
      if (chargingSession || !station || !connector) return;
      
      try {
        console.log("🚀 Initializing new charging session from params...");
        
        // Create connector object WITHOUT status from params
        const connectorWithoutStatus = {
          portId: connector.portId,
          slot: connector.slot,
          connectorId: connector.connectorId,
          connectorType: connector.connectorType,
          capacity: connector.capacity,
          currentType: connector.currentType,
          price: connector.price,
        };
        
        await startCharging({
          station: {
            id: station.id || station.SiteId,
            name: station.name || station.siteName,
            address: station.address || station.siteAddress
          },
          charger: {
            id: charger?.id,
            name: charger?.name,
            stationId: charger?.stationId || station.id || station.SiteId
          },
          connector: connectorWithoutStatus,
          transactionId: transactionId
        });
        
        console.log("✅ Charging session initialized");
      } catch (error) {
        console.error('Failed to start charging session:', error);
        Alert.alert('Error', 'Failed to start charging session');
      }
    };

    if (!contextLoading) {
      initializeSession();
    }
  }, [station, connector, chargingSession, transactionId, startCharging, charger, contextLoading]);

  /**
   * Fetches real-time charging data from API - ONLY SOURCE OF STATUS
   */
  const fetchChargingData = useCallback(async () => {
    // Use transactionId from params first, then from context
    const currentTransactionId = transactionId || chargingSession?.transactionId;
    
    if (!currentTransactionId) {
      console.log('No transaction ID available for polling');
      return;
    }

    try {
      setIsLoading(true);
      const response = await StationsService.getMeterValues(currentTransactionId);
      
      if (response.data) {
        const apiData = response.data;
        
        const apiStatus = apiData.status || 'Charging';
        
        const updatedData: LiveChargingData = {
          power: apiData.energyDelivered || apiData.currentPower || 0,
          percentage: apiData.soc || 0,
          chargingTime: apiData.durationFormatted || apiData.duration || '00:00:00',
          totalTime: apiData.durationFormatted || '00:00:00',
          cost: apiData.currentPrice || apiData.currentCost || '0.00',
          totalCost: apiData.currentPrice || '0.00',
          units: apiData.energyDelivered || 0,
          totalUnits: apiData.energyDelivered || 0,
          speed: apiData.power || apiData.chargingRate || 0,
          transactionId: apiData.transactionId || currentTransactionId,
          status: apiStatus,
        };

        setLiveChargingData(updatedData);
        
        // ✅ CRITICAL: Update the context with live data
        updateLiveChargingData(updatedData);

        // Auto-stop if charging is completed (based on API status)
        if (apiStatus === 'Completed' || apiStatus === 'Stopped' || apiStatus === 'Finishing') {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching charging data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [transactionId, chargingSession, updateLiveChargingData]);

  /**
   * Sets up polling interval for live charging data updates
   */
  useEffect(() => {
    if (!chargingSession?.transactionId && !transactionId) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      return;
    }

    // Initial data fetch
    fetchChargingData();

    // Set up polling every 30 seconds
    pollingIntervalRef.current = setInterval(fetchChargingData, 30000);

    // Cleanup
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [fetchChargingData, chargingSession, transactionId]);

  /**
   * Callback when charging session starts
   */
  const handleChargingStarted = useCallback((chargingData: any) => {
    console.log('Charging started:', chargingData);
  }, []);

  /**
   * Callback when charging session stops
   */
  const handleChargingStopped = useCallback(() => {
    console.log('Charging stopped');
  }, []);

  // Show loading while context is loading
  if (contextLoading) {
    return null;
  }

  // Use data from context (persisted session) or navigation params (new session)
  const currentStation = chargingSession ? {
    id: chargingSession.SiteId,
    name: chargingSession.stationName,
    address: chargingSession.siteAddress
  } : station;

  const currentCharger = chargingSession ? {
    name: chargingSession.stationName,
    stationId: chargingSession.stationId 
  } : charger;
  
  const currentConnector = chargingSession?.connector || connector;

  return (
    <RootScroll>
      <Header
        onback={() => navigation.navigate(strings.home)}
        active={1}
        onSkip={() => {}}
        skippable={false}
        hastitle={true}
        title={'Charging'}
      />
      <ChargingStatus
        power={liveChargingData.power}
        percentage={liveChargingData.percentage}
        chargingTime={liveChargingData.chargingTime}
        totalTime={liveChargingData.totalTime}
        cost={liveChargingData.cost}
        totalCost={liveChargingData.totalCost}
        units={liveChargingData.units}
        totalUnits={liveChargingData.totalUnits}
        speed={liveChargingData.speed}
        vehicleName={
          (user as any)?.vehicles?.[0]?.make
            ? `${(user as any).vehicles[0].make} ${(user as any).vehicles[0].model || ''}`.trim()
            : (user as any)?.vehicles?.[0]?.name || 'Vehicle'
        }
        vehicleNumber={
          (user as any)?.vehicles?.[0]?.licensePlate ||
          (user as any)?.vehicles?.[0]?.registrationNo ||
          '—'
        }
        station={currentStation}
        connector={currentConnector}
        charger={currentCharger}
        onChargingStarted={handleChargingStarted}
        onChargingStopped={handleChargingStopped}
        isLoading={isLoading}
        status={liveChargingData.status}
        onRefreshData={fetchChargingData}
      />
    </RootScroll>
  );
};

export default Charging;