import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';
import StationsService from '../../axios/Apis';
import Toast from 'react-native-toast-message';
import { pallette } from '../../utils/pallette';
import { h, w } from '../../constants/dimensions';
import { adjust } from '../../helpers/common-functions';
import { regular, medium, bold } from '../../utils/fonts';
import Header from '../../components/header-with-skip';
import AlertMessage from '../../extra/alertmessage';
import { Icon } from 'react-native-vector-icons/Icon';

const FavoriteStationsScreen = ({ navigation, route }) => {
  const { user } = useSelector((state: any) => state.auth);
  // STATE-1: auth from Redux
  const { userId } = useAuth();
  
  const [favoriteStations, setFavoriteStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addingFavorite, setAddingFavorite] = useState(false);
  
  // Alert states
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertCallback, setAlertCallback] = useState<(() => void) | null>(null);
  const [stationToRemove, setStationToRemove] = useState(null);

  // Get final userId (priority: context > redux)
  const finalUserId = userId || user?.userId;

  // Load favorite stations on mount
  useEffect(() => {
    if (finalUserId) {
      loadFavoriteStations();
    } else {
      setLoading(false);
      showErrorAlert('User ID not available. Please login again.');
    }
  }, [finalUserId]);

  // Show error alert
  const showErrorAlert = (message: string) => {
    setAlertMessage(message);
    setShowAlert(true);
    setAlertCallback(() => () => {
      navigation.goBack();
    });
  };

  // Show success toast
  const showSuccessToast = (message: string) => {
    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: message,
      position: 'top',
      visibilityTime: 3000,
    });
  };

  // Show error toast
  const showErrorToast = (message: string) => {
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: message,
      position: 'top',
      visibilityTime: 4000,
    });
  };

  // Show info toast
  const showInfoToast = (message: string) => {
    Toast.show({
      type: 'info',
      text1: 'Info',
      text2: message,
      position: 'top',
      visibilityTime: 3000,
    });
  };

  // Load favorite stations from API
  const loadFavoriteStations = async () => {
    if (!finalUserId) {
      showErrorToast('User ID not available');
      return;
    }
    
    setLoading(true);
    try {
      const response = await StationsService.getFavoriteStations(finalUserId);
      
      // Handle "No favorite stations" message
      if (response.success) {
        if (Array.isArray(response.data)) {
          setFavoriteStations(response.data);
        } else if (response.data?.message) {
          // Handle "No favorite stations" message
          if (response.data.message.includes('No favourite stations')) {
            setFavoriteStations([]);
            showInfoToast('No favorite stations found');
          } else {
            throw new Error(response.data.message);
          }
        } else {
          setFavoriteStations([]);
        }
      } else if (response.message && response.message.includes('No favourite stations found for this user')) {
        setFavoriteStations([]);
        showInfoToast('No favorite stations found');
      } else {
        throw new Error(response.data?.message || 'Failed to load favorite stations');
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to load favorite stations';
      
      if (errorMsg.includes('User not found')) {
        showErrorAlert(`User with ID ${finalUserId} not found. Please check your account.`);
      } else {
        showErrorToast(errorMsg);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle pull to refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadFavoriteStations();
  };

  // Show remove confirmation alert
  const showRemoveConfirmation = (stationId: number, stationName: string) => {
    setStationToRemove({ stationId, stationName });
    setAlertMessage(`Are you sure you want to remove "${stationName}" from favorites?`);
    setShowAlert(true);
    setAlertCallback(() => () => handleRemoveFavorite(stationId, stationName));
  };

  // Handle favorite station removal
  const handleRemoveFavorite = async (stationId: number, stationName: string) => {
    if (!finalUserId) {
      showErrorToast('User ID not available');
      return;
    }

    try {
      const response = await StationsService.deleteFavoriteStation(finalUserId, stationId);
      
      if (response.success) {
        if (response.data?.message) {
          if (response.data.message.includes('No favourite stations')) {
            showInfoToast('No favorite stations found');
          } else if (response.data.message.includes('Deleted successfully')) {
            showSuccessToast(`${stationName} removed from favorites`);
            // Remove from local state
            setFavoriteStations(prev => 
              prev.filter(station => station.siteId !== stationId)
            );
          }
          handleRefresh();
        }
      } else {
        throw new Error(response.data?.message || 'Failed to remove station from favorites');
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to remove station from favorites';
      showErrorToast(errorMsg);
    }
  };

  // Get station details by ID
  const getStationDetails = async (stationId: number) => {
    try {
      const response = await StationsService.siteDetailsbyId(stationId);
      return response.data;
    } catch (error) {
      console.error('Error fetching station details:', error);
      return null;
    }
  };

  // Handle station card press
  const handleStationCardPress = async (station: any) => {
    try {
      // Fetch latest station details
      const stationDetails = await getStationDetails(station.siteId);
      console.log(" stationDetails", stationDetails)
      // Navigate to station details with complete data
      navigation.navigate('StationDetails', {
        station: stationDetails || station,
        stationId: station.siteId,
      });
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to load station details';
      showErrorToast(errorMsg);
    }
  };

  // Get status color based on station status
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return pallette.primary;
      case 'inactive':
        return pallette.grey;
      case 'maintenance':
        return pallette.red;
      default:
        return pallette.mediumgrey;
    }
  };

  // Render favorite station item
  const renderFavoriteStation = ({ item }) => (
    <TouchableOpacity 
      onPress={() => handleStationCardPress(item)}
      activeOpacity={0.8}
      style={styles.cardTouchable}
    >
      <View style={styles.stationCard}>
        <View style={styles.franchiseHeader}>
          {/* Station Image */}
          <Image
            source={item.siteImage 
              ? require('../../assets/images/franchises/f1.png')
              : require('../../assets/images/franchises/f1.png')
            } 
            style={styles.franchiseImage} 
          />
          
          <View style={styles.franchiseInfo}>
            <Text style={styles.franchiseName}>{item.siteName}</Text>
            
            {/* Display location if available */}
            {item.location && (
              <View style={styles.locationContainer}>
               {/* <Icon name="location-on" size={16} color={pallette.grey} /> */}
                <Text style={styles.franchiseLocation} numberOfLines={2}>
                  {item.location}
                </Text>
              </View>
            )}
            
            {/* Station ID Badge */}
            {/* <View style={styles.idBadge}>
              <Text style={styles.idText}>ID: {item.siteId}</Text>
            </View> */}
          </View>
          
          {/* Remove Button */}
          <TouchableOpacity 
            style={styles.removeButton}
            onPress={() => showRemoveConfirmation(item.siteId, item.siteName)}
            disabled={addingFavorite}
          >
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        </View>
        
        {/* Status Indicator (if available) */}
        {item.stationStatus && (
          <View style={styles.statusRow}>
            <View 
              style={[
                styles.statusDot, 
                { backgroundColor: getStatusColor(item.stationStatus) }
              ]}
            />
            <Text style={styles.statusText}>{item.stationStatus}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No favorite stations yet</Text>
      <Text style={styles.emptySubtext}>
        Add stations to your favorites for quick access
      </Text>
      {/* <TouchableOpacity 
        style={styles.browseButton}
        onPress={() => navigation.navigate('StationsList')}
        
      >
        <Text style={styles.browseButtonText}>Browse Stations</Text>
      </TouchableOpacity> */}
    </View>
  );

  // Handle alert close
  const handleAlertClose = (confirmed: boolean) => {
    setShowAlert(false);
    setAlertMessage('');
    setStationToRemove(null);
    
    if (confirmed && alertCallback) {
      alertCallback();
    }
  };

  return (
    <View style={styles.container}>
      <Header
        onback={() => navigation.goBack()}
        hastitle={true}
        title="Favorite Stations"
        skippable={false}
      />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={pallette.primary} />
          <Text style={styles.loadingText}>Loading favorite stations...</Text>
        </View>
      ) : (
        <FlatList
          data={favoriteStations}
          renderItem={renderFavoriteStation}
          keyExtractor={(item) => item.siteId.toString()}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={[
            styles.listContainer,
            favoriteStations.length === 0 && styles.emptyListContainer
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[pallette.primary]}
              tintColor={pallette.primary}
            />
          }
        />
      )}
      
      {/* Alert Message Component */}
      <AlertMessage
        message={alertMessage}
        onClose={handleAlertClose}
        showConfirm={showAlert}
      />
      
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: pallette.white,
    paddingTop: 25,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: w * 0.1,
  },
  loadingText: {
    fontSize: adjust(14),
    color: pallette.grey,
    fontFamily: regular,
    marginTop: h * 0.02,
  },
  listContainer: {
    padding: w * 0.04,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  cardTouchable: {
    marginBottom: h * 0.015,
  },
  stationCard: {
    backgroundColor: pallette.white,
    borderRadius: w * 0.04,
    padding: w * 0.04,
    shadowColor: pallette.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: pallette.lightgrey,
  },
  franchiseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: h * 0.01,
  },
  franchiseImage: {
    height: h * 0.07,
    width: h * 0.07,
    borderRadius: w * 0.02,
    resizeMode: 'cover',
    backgroundColor: pallette.lightgrey,
  },
  franchiseInfo: {
    flex: 1,
    marginLeft: w * 0.04,
    justifyContent: 'center',
  },
  franchiseName: {
    fontSize: adjust(16),
    color: pallette.black,
    fontFamily: bold,
    marginBottom: h * 0.005,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: h * 0.005,
  },
  locationIcon: {
    width: 12,
    height: 12,
    marginRight: 4,
    tintColor: pallette.grey,
  },
  franchiseLocation: {
    fontSize: adjust(12),
    color: pallette.grey,
    fontFamily: regular,
    flex: 1,
  },
  idBadge: {
    backgroundColor: pallette.primaryLight,
    paddingHorizontal: w * 0.02,
    paddingVertical: h * 0.003,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: h * 0.003,
  },
  idText: {
    fontSize: adjust(10),
    color: pallette.primary,
    fontFamily: medium,
  },
  removeButton: {
    backgroundColor: pallette.red,
    paddingHorizontal: w * 0.03,
    paddingVertical: h * 0.008,
    borderRadius: w * 0.015,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: w * 0.02,
  },
  removeButtonText: {
    color: pallette.white,
    fontSize: adjust(12),
    fontFamily: medium,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: h * 0.01,
    paddingTop: h * 0.01,
    borderTopWidth: 1,
    borderTopColor: pallette.lightgrey,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: adjust(11),
    color: pallette.grey,
    fontFamily: regular,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: w * 0.1,
    paddingTop: h * 0.2,
  },
  emptyText: {
    fontSize: adjust(18),
    color: pallette.grey,
    fontFamily: bold,
    marginBottom: h * 0.01,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: adjust(14),
    color: pallette.grey,
    fontFamily: regular,
    textAlign: 'center',
    marginBottom: h * 0.03,
    lineHeight: adjust(20),
  },
  browseButton: {
    backgroundColor: pallette.primary,
    paddingHorizontal: w * 0.06,
    paddingVertical: h * 0.015,
    borderRadius: 10,
    marginTop: h * 0.02,
  },
  browseButtonText: {
    color: pallette.white,
    fontSize: adjust(14),
    fontFamily: medium,
  },
});

export default FavoriteStationsScreen;