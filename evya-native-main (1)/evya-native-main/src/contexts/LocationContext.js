import React, { createContext, useContext, useState, useEffect } from 'react';
import { PermissionsAndroid, Platform, Alert } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

const LocationContext = createContext();

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

export const LocationProvider = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [displayLocation, setDisplayLocation] = useState('Fetching...');
  const [fullLocation, setFullLocation] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const requestLocationPermission = async () => {
    try {
      let granted = false;
      if (Platform.OS === 'android') {
        granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location to show nearby charging stations',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        granted = granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        granted = true; // iOS handled by Geolocation.requestAuthorization
      }

      setPermissionGranted(granted);
      if (granted) {
        getCurrentLocation();
      } else {
        setError('Location permission denied');
        setDisplayLocation('Permission denied');
        setLoading(false);
      }
      return granted;
    } catch (err) {
      console.warn('Location permission error:', err);
      setError('Permission request failed');
      setDisplayLocation('Error');
      setLoading(false);
      return false;
    }
  };

  const getCurrentLocation = () => {
    setLoading(true);

    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        //  const latitude= 17.6868; const longitude=83.2185;
        setCurrentLocation({ latitude, longitude, timestamp: position.timestamp });
        await reverseGeocode(latitude, longitude);
        setLoading(false);
      },
      (error) => {
        console.warn('Location error:', error);
        setError(error.message);
        setDisplayLocation('Unavailable');
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 10000,
      }
    );
  };

  const reverseGeocode = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
        { headers: { 'User-Agent': 'EVYA-App/1.0 prasadkalavalaplli70@gmail.com' } }
      );

      const data = await response.json();
      const address = data?.address || {};
      const area = address.neighbourhood || address.suburb || address.city_district || '';
      const building = address.building || address.amenity || address.landuse || '';
      const city = address.city || address.town || address.village || '';
      const state = address.state || '';
      const country = address.country || '';
      const road = address.road || '';
      const houseNumber = address.house_number || '';

      const displayLoc = area || city || state || 'Current location';
      let fullLocText = '';
      if (building) fullLocText += building;
      if (houseNumber && road) {
        fullLocText += fullLocText ? `, ${houseNumber} ${road}` : `${houseNumber} ${road}`;
      } else if (road) {
        fullLocText += fullLocText ? `, ${road}` : road;
      }
      if (area) fullLocText += fullLocText ? `, ${area}` : area;
      if (city) fullLocText += fullLocText ? `, ${city}` : city;
      if (state) fullLocText += fullLocText ? `, ${state}` : state;
      if (country) fullLocText += fullLocText ? `, ${country}` : country;

      setDisplayLocation(displayLoc);
      setFullLocation(fullLocText || displayLoc);
    } catch (error) {
      console.warn('Geocoding error:', error);
      setDisplayLocation('Unknown');
      setFullLocation('Location details unavailable');
    }
  };

  const refreshLocation = () => {
    if (permissionGranted) {
      getCurrentLocation();
    } else {
      requestLocationPermission();
    }
  };

  useEffect(() => {
    requestLocationPermission();
  }, []);

  return (
    <LocationContext.Provider
      value={{
        currentLocation,
        displayLocation,
        fullLocation,
        loading,
        error,
        permissionGranted,
        refreshLocation,
        requestLocationPermission,
      }}>
      {children}
    </LocationContext.Provider>
  );
};
