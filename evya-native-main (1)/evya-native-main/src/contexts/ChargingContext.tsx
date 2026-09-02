// src/contexts/ChargingContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

// ===================================================================
// INTERFACES
// ===================================================================

export interface Station {
  id: string;
  name: string;
  address: string;
}

export interface Connector {
  portId: string;
  slot?: string;
  connectorId?: string;
  connectorType?: string;
  capacity?: string;
  price?: string;
  currentType?: string;
}

export interface Charger {
  id?: string;
  name: string;
  stationId: string;
}

export interface LiveChargingData {
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

export interface ChargingSession {
  isCharging: boolean;
  stationName: string;
  siteAddress: string;
  SiteId: string;
  stationId: string;
  connector: Connector;
  transactionId?: string;
  startTime: string;
}

export interface StartChargingInput {
  station: Station;
  charger: Charger;
  connector: Connector;
  transactionId?: string;
}

export interface ChargingContextProps {
  chargingSession: ChargingSession | null;
  liveChargingData: LiveChargingData | null;
  isCharging: boolean;
  startCharging: (data: StartChargingInput) => Promise<void>;
  stopCharging: () => Promise<void>;
  updateLiveChargingData: (data: LiveChargingData) => void;
  clearChargingSession: () => void;
  isLoading: boolean;
}

// ===================================================================
// CONTEXT CREATION
// ===================================================================

const ChargingContext = createContext<ChargingContextProps | null>(null);

// ===================================================================
// PROVIDER COMPONENT
// ===================================================================

export const ChargingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chargingSession, setChargingSession] = useState<ChargingSession | null>(null);
  const [liveChargingData, setLiveChargingData] = useState<LiveChargingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCharging, setIsCharging] = useState(false);
  
  const isStoppingRef = useRef(false);

  // LOAD SESSION ------------------------------------------------------
  useEffect(() => {
    const loadSession = async () => {
      try {
        setIsLoading(true);
        console.log('📥 Loading charging session...');

        const saved = await AsyncStorage.getItem('chargingSession');
        if (!saved) {
          console.log('📭 No saved session found');
          setIsLoading(false);
          return;
        }

        const session: ChargingSession = JSON.parse(saved);
        console.log('📄 Loaded session:', session);

        // Validate session
        const isValid = (
          session.isCharging !== undefined &&
          session.stationName &&
          session.siteAddress &&
          session.SiteId &&
          session.stationId &&
          session.connector?.portId &&
          session.startTime
        );

        if (!isValid) {
          console.log('❌ Invalid session. Clearing.');
          await AsyncStorage.removeItem('chargingSession');
          setChargingSession(null);
          setLiveChargingData(null);
          setIsCharging(false);
          setIsLoading(false);
          return;
        }

        // Check 24-hour expiry
        const start = new Date(session.startTime);
        const hours = (Date.now() - start.getTime()) / (1000 * 60 * 60);

        if (hours >= 24) {
          console.log('🗑 Session expired (24+ hours).');
          await AsyncStorage.removeItem('chargingSession');
          setChargingSession(null);
          setLiveChargingData(null);
          setIsCharging(false);
        } else {
          setChargingSession(session);
          setIsCharging(session.isCharging);
          console.log('✅ Session restored successfully');
        }
      } catch (error) {
        console.error('❌ Error loading session:', error);
        await AsyncStorage.removeItem('chargingSession');
        setChargingSession(null);
        setLiveChargingData(null);
        setIsCharging(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  // START CHARGING ----------------------------------------------------
  const startCharging = useCallback(async (data: StartChargingInput): Promise<void> => {
    try {
      // Prevent starting if already stopping
      if (isStoppingRef.current) {
        console.log('🚫 Start blocked - stop in progress');
        return;
      }

      // Check if already charging
      if (chargingSession?.isCharging) {
        console.log('⚠️ Already in a charging session');
        return;
      }

      console.log('🚀 Starting new charging session...');

      // Validate required fields
      if (!data.station?.id) throw new Error("Missing station.id");
      if (!data.charger?.stationId) throw new Error("Missing charger.stationId");
      if (!data.connector?.portId) throw new Error("Missing connector.portId");

      const sessionData: ChargingSession = {
        isCharging: true,
        stationName: data.charger.name,
        stationId: data.charger.stationId,
        SiteId: data.station.id,
        siteAddress: data.station.address,
        connector: data.connector,
        transactionId: data.transactionId,
        startTime: new Date().toISOString(),
      };

      console.log('💾 Saving session:', sessionData);

      // Update state and storage
      setChargingSession(sessionData);
      setIsCharging(true);
      await AsyncStorage.setItem('chargingSession', JSON.stringify(sessionData));

      console.log('✅ Charging session started and saved');

    } catch (error: any) {
      console.error('❌ Error in startCharging:', error);
      throw new Error(`Failed to start charging: ${error.message}`);
    }
  }, [chargingSession]);

  // STOP CHARGING -----------------------------------------------------
  const stopCharging = useCallback(async () => {
    try {
      // Prevent multiple stop calls
      if (isStoppingRef.current) {
        console.log('⚠️ Stop already in progress');
        return;
      }

      isStoppingRef.current = true;
      console.log('🛑 Stopping charging session...');

      // Clear session from state and storage
      setChargingSession(null);
      setLiveChargingData(null);
      setIsCharging(false);
      await AsyncStorage.removeItem('chargingSession');

      console.log('✅ Charging session stopped and cleared');

      // Reset stop flag after delay
      setTimeout(() => {
        isStoppingRef.current = false;
        console.log('🔄 Stop flag reset');
      }, 1000);

    } catch (error) {
      console.error('❌ Error stopping session:', error);
      isStoppingRef.current = false;
      throw error;
    }
  }, []);

  // UPDATE LIVE CHARGING DATA -----------------------------------------
  const updateLiveChargingData = useCallback((data: LiveChargingData) => {
    console.log('📊 Updating live charging data:', data);
    setLiveChargingData(data);
  }, []);

  // CLEAR CHARGING SESSION --------------------------------------------
  const clearChargingSession = useCallback(() => {
    console.log('🧹 Manually clearing charging session');
    setChargingSession(null);
    setLiveChargingData(null);
    setIsCharging(false);
    isStoppingRef.current = false;
    AsyncStorage.removeItem('chargingSession').catch(() => {
      console.log('⚠️ Failed to clear storage');
    });
  }, []);

  const value: ChargingContextProps = {
    chargingSession,
    liveChargingData,
    isCharging,
    startCharging,
    stopCharging,
    updateLiveChargingData,
    clearChargingSession,
    isLoading,
  };

  return <ChargingContext.Provider value={value}>{children}</ChargingContext.Provider>;
};

// ===================================================================
// CUSTOM HOOK
// ===================================================================

export const useCharging = (): ChargingContextProps => {
  const context = useContext(ChargingContext);
  if (!context) {
    throw new Error("useCharging must be used inside ChargingProvider");
  }
  return context;
};

