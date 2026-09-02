import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import React, {useState, useEffect, useCallback, useMemo} from 'react';
import RootScroll from '../../components/scroll-view';
import Header from '../../components/header-with-skip';
import {adjust} from '../../helpers/common-functions';
import {pallette} from '../../utils/pallette';
import {bold, medium, regular, semibold} from '../../utils/fonts';
import {h, w} from '../../constants/dimensions';
import strings from '../../utils/strings';
import StationsService from '../../axios/Apis';
import { useAuth } from '../../hooks/useAuth';
import Toast from 'react-native-toast-message';

const MyFranchises = ({navigation, route}: any) => {
  const [franchises, setFranchises] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState('main');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ Get userId from App Context
  // STATE-1: auth from Redux
  const { userId } = useAuth();

  // Load franchises from API on component mount
  useEffect(() => {
    if (userId) {
      loadFranchisesFromAPI();
    } else {
      showErrorToast('User ID not available. Please login again.');
    }
  }, [userId]);

  // ✅ Show success toast
  const showSuccessToast = (message: string) => {
    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: message,
      position: 'top',
      visibilityTime: 3000,
    });
  };

  // ✅ Show error toast
  const showErrorToast = (message: string) => {
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: message,
      position: 'top',
      visibilityTime: 4000,
    });
  };

  // ✅ Show info toast
  const showInfoToast = (message: string) => {
    Toast.show({
      type: 'info',
      text1: 'Info',
      text2: message,
      position: 'top',
      visibilityTime: 3000,
    });
  };

  // ✅ Load franchises from API only
  const loadFranchisesFromAPI = async () => {
    if (!userId) {
      showErrorToast('User ID not available');
      return;
    }

    setLoading(true);
    
    try {
      // Call the API to get requested franchises
      const response = await StationsService.getRequestedFranchises(userId);
      
      if (response.success && response.data) {
        if (response.data.length === 0) {
          setFranchises([]);
          if (refreshing) {
            showInfoToast('No franchise requests found');
          }
          return;
        }

        // Transform API data to match our component format
        const transformedFranchises = response.data.map((franchise: any, index: number) => ({
          id: franchise.id?.toString() || `franchise-${index}-${Date.now()}`,
          name: franchise.stationName || 'Unnamed Station',
          location: franchise.address || 'Location not available',
          locationType: franchise.category || 'FRANCHISE',
          active: 0, // Default value
          total: franchise.chargerCapacity || 0,
          chargerTypes: 'AC/DC', // Default value
          powerCapacity: '50 kW', // Default value
          operatingHours: '24/7', // Default value
          status: franchise.status === true ? 'approved' : 'pending',
          image: require('../../assets/images/franchises/f1.png'),
          createdAt: new Date().toISOString(),
          // API specific fields
          apiData: {
            sitename: franchise.sitename,
            franchiseName: franchise.franchiseName,
            mobileNumber: franchise.mobileNumber,
            email: franchise.email,
            latitude: franchise.latitude,
            longitude: franchise.longitude,
            category: franchise.category,
            userId: franchise.userId,
            chargerCapacity: franchise.chargerCapacity
          }
        }));
        
        setFranchises(transformedFranchises);
        
        if (refreshing) {
          showSuccessToast('Franchise list refreshed');
        }
        
      } else {
        const errorMsg = response.message || 'Failed to fetch franchises';
        showErrorToast(errorMsg);
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Network error occurred';
      showErrorToast(errorMsg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ✅ Handle pull to refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadFranchisesFromAPI();
  };

  // ✅ Handle new franchise from navigation params
  useEffect(() => {
    if (route.params?.newFranchise) {
      const newFranchise = route.params.newFranchise;
      
      // Add to local state immediately for better UX
      setFranchises(prev => {
        const exists = prev.find(f => f.id === newFranchise.id);
        let updatedFranchises;
        
        if (!exists) {
          updatedFranchises = [...prev, {
            ...newFranchise,
            id: newFranchise.id || Date.now().toString(),
            createdAt: new Date().toISOString(),
            status: newFranchise.status || 'pending'
          }];
          
          showSuccessToast('New franchise request added');
        } else {
          updatedFranchises = prev;
        }
        
        return updatedFranchises;
      });
      
      // Clear the param and show list page
      navigation.setParams({newFranchise: undefined});
      setCurrentPage('list');
      
      // Refresh from API to get the actual data
      setTimeout(() => {
        loadFranchisesFromAPI();
      }, 1000);
    }
  }, [route.params?.newFranchise, navigation]);

  const handleRequestFranchise = () => {
    if (!userId) {
      showErrorToast('User ID not available. Please login again.');
      return;
    }
    
    navigation.navigate(strings.reqfranchise, {
      userId: userId
    });
  };

  const handleViewFranchises = () => {
    if (franchises.length === 0) {
      showInfoToast('No franchise requests yet');
      return;
    }
    setCurrentPage('list');
  };

  const handleBackToMain = () => {
    setCurrentPage('main');
  };

  const handleFranchisePress = (franchise: any) => {
    // navigation.navigate('FranchiseDetails', { franchise });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return pallette.primary || '#4CAF50';
      case 'pending':
        return pallette.warning || '#FF9800';
      case 'rejected':
        return pallette.red || '#F44336';
      default:
        return pallette.grey;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'pending':
        return 'Pending Review';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Unknown';
    }
  };

  // Main Page Component
  const MainPage = () => (
    <View style={styles.Container}>
      <RootScroll>
        <Header
          onback={() => navigation.goBack()}
          active={1}
          onSkip={() => {}}
          skippable={false}
          hastitle={true}
          title={'My Franchises'}
        />
        
        {/* REQUEST FRANCHISE SECTION */}
        <View style={styles.requestSection}>
          <View style={styles.imageContainer}>
            <Image
              source={require('../../assets/images/onboarding/on3.png')}
              style={styles.image}
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.heading}>
              Own the Future with Evya{'\n'}EV Charging Stations!
            </Text>
            <Text style={styles.subHeading}>
              Partner with EVya and launch your franchise today to profit in the booming EV charging market!
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleRequestFranchise}
            style={styles.requestButton}>
            <Text style={styles.requestButtonText}>Request New Franchise</Text>
          </TouchableOpacity>
        </View>

        {/* VIEW EXISTING FRANCHISES SECTION */}
        <View style={styles.viewSection}>
          <View style={styles.viewContent}>
            <Text style={styles.viewTitle}>View Your Franchise Requests</Text>
            <Text style={styles.viewSubtitle}>
              Check the status of your submitted franchise applications and manage your existing requests
            </Text>
            <TouchableOpacity
              onPress={handleViewFranchises}
              style={styles.viewButton}>
              <Text style={styles.viewButtonText}>
                {franchises.length > 0 
                  ? `View My Franchises (${franchises.length})` 
                  : 'View My Franchises'
                }
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </RootScroll>
      <Toast />
    </View >
  );

  // PERF-5: virtualized franchise list (was RootScroll + .map)
  const renderFranchiseItem = useCallback(
    ({item: franchise}: {item: any}) => (
      <TouchableOpacity
        style={styles.franchiseCard}
        onPress={() => handleFranchisePress(franchise)}>
        <View style={styles.franchiseHeader}>
          <Image
            source={
              franchise?.image ||
              require('../../assets/images/franchises/f1.png')
            }
            style={styles.franchiseImage}
          />
          <View style={styles.franchiseInfo}>
            <Text style={styles.franchiseName}>{franchise?.name}</Text>
            <Text style={styles.franchiseLocation}>{franchise?.location}</Text>
            <Text style={styles.franchiseType}>{franchise?.locationType}</Text>
          </View>
        </View>

        <View style={styles.franchiseDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Site Name:</Text>
            <Text style={styles.detailValue}>
              {franchise?.apiData?.sitename || 'N/A'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category:</Text>
            <Text style={styles.detailValue}>
              {franchise?.apiData?.category || 'N/A'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Chargers:</Text>
            <Text style={styles.detailValue}>
              {franchise?.active || 0} / {franchise?.total || 0} Active
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Contact:</Text>
            <Text style={styles.detailValue}>
              {franchise?.apiData?.mobileNumber || 'N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusBadge,
              {backgroundColor: getStatusColor(franchise?.status)},
            ]}>
            <Text style={styles.statusText}>
              {getStatusText(franchise?.status)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [],
  );

  const franchiseKeyExtractor = useCallback(
    (item: any, index: number) => item.id?.toString() || `franchise-${index}`,
    [],
  );

  const FranchiseListPage = () => (
    <View style={styles.Container}>
      <Header
        onback={handleBackToMain}
        active={1}
        onSkip={() => {}}
        skippable={false}
        hastitle={true}
        title={'My Franchise Requests'}
      />

      {loading && franchises.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={pallette.primary} />
          <Text style={styles.loadingText}>Loading your franchises...</Text>
        </View>
      ) : (
        <FlatList
          data={franchises}
          keyExtractor={franchiseKeyExtractor}
          renderItem={renderFranchiseItem}
          contentContainerStyle={
            franchises.length === 0
              ? styles.emptyListState
              : styles.franchisesList
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[pallette.primary]}
            />
          }
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews
          ListEmptyComponent={
            <View style={styles.emptyListState}>
              <Image
                source={require('../../assets/images/onboarding/on3.png')}
                style={styles.emptyListImage}
              />
              <Text style={styles.emptyListText}>
                No franchise requests yet.{'\n'}Start by requesting your first
                franchise!
              </Text>
              <TouchableOpacity
                onPress={handleRequestFranchise}
                style={styles.emptyListButton}>
                <Text style={styles.emptyListButtonText}>Request Franchise</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
      <Toast />
    </View>
  );

  // Render the appropriate page based on currentPage state
  return currentPage === 'main' ? <MainPage /> : <FranchiseListPage />;
};

export default MyFranchises;

const styles = StyleSheet.create({
  // Loading States
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
Container: {
    flex: 1,
    backgroundColor: pallette.white,
    paddingTop:24,
  
  },
  // Main Page Styles
  requestSection: {
    backgroundColor: pallette.white,
    padding: w * 0.05,
    margin: w * 0.025,
    borderRadius: w * 0.04,
    shadowColor: pallette.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  imageContainer: {
    height: h * 0.2,
    width: w * 0.5,
    marginBottom: h * 0.02,
  },
  image: {
    height: '100%',
    width: '100%',
    resizeMode: 'contain',
  },
  textContainer: {
    width: '100%',
    marginBottom: h * 0.03,
  },
  heading: {
    fontSize: adjust(20),
    color: pallette.black,
    fontFamily: bold,
    textAlign: 'center',
    lineHeight: adjust(26),
    marginBottom: h * 0.015,
  },
  subHeading: {
    fontSize: adjust(14),
    color: pallette.grey,
    fontFamily: medium,
    textAlign: 'center',
    lineHeight: adjust(20),
  },
  requestButton: {
    height: h * 0.06,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: w * 0.04,
    backgroundColor: pallette.primary,
  },
  requestButtonText: {
    color: pallette.white,
    fontSize: adjust(14),
    fontFamily: medium,
  },
  
  // View Franchises Section
  viewSection: {
    backgroundColor: pallette.white,
    padding: w * 0.05,
    margin: w * 0.025,
    borderRadius: w * 0.04,
    shadowColor: pallette.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  viewContent: {
    alignItems: 'center',
  },
  viewTitle: {
    fontSize: adjust(18),
    color: pallette.black,
    fontFamily: bold,
    textAlign: 'center',
    marginBottom: h * 0.01,
  },
  viewSubtitle: {
    fontSize: adjust(14),
    color: pallette.grey,
    fontFamily: regular,
    textAlign: 'center',
    lineHeight: adjust(20),
    marginBottom: h * 0.03,
  },
  viewButton: {
    height: h * 0.06,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: w * 0.04,
    backgroundColor: pallette.secondary || '#6B7280',
  },
  viewButtonText: {
    color: pallette.primary,
    fontSize: adjust(14),
    fontFamily: medium,
  },

  // Empty List State
  emptyListState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: w * 0.1,
  },
  emptyListImage: {
    height: h * 0.2,
    width: w * 0.5,
    resizeMode: 'contain',
    marginBottom: h * 0.03,
  },
  emptyListText: {
    fontSize: adjust(16),
    color: pallette.grey,
    fontFamily: medium,
    textAlign: 'center',
    lineHeight: adjust(22),
    marginBottom: h * 0.03,
  },
  emptyListButton: {
    height: h * 0.06,
    width: w * 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: w * 0.04,
    backgroundColor: pallette.primary,
  },
  emptyListButtonText: {
    color: pallette.white,
    fontSize: adjust(14),
    fontFamily: medium,
  },

  // Franchise List Styles
  franchisesList: {
    padding: w * 0.025,
  },
  franchiseCard: {
    backgroundColor: pallette.white,
    borderRadius: w * 0.04,
    padding: w * 0.04,
    marginVertical: h * 0.01,
    shadowColor: pallette.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: pallette.primary,
  },
  franchiseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: h * 0.015,
  },
  franchiseImage: {
    height: h * 0.08,
    width: h * 0.08,
    borderRadius: w * 0.02,
    resizeMode: 'cover',
  },
  franchiseInfo: {
    flex: 1,
    marginLeft: w * 0.04,
  },
  franchiseName: {
    fontSize: adjust(16),
    color: pallette.black,
    fontFamily: semibold,
    marginBottom: 2,
  },
  franchiseLocation: {
    fontSize: adjust(12),
    color: pallette.grey,
    fontFamily: regular,
    marginBottom: 2,
  },
  franchiseType: {
    fontSize: adjust(11),
    color: pallette.primary,
    fontFamily: medium,
  },
  franchiseDetails: {
    marginBottom: h * 0.015,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: adjust(12),
    color: pallette.grey,
    fontFamily: regular,
  },
  detailValue: {
    fontSize: adjust(12),
    color: pallette.black,
    fontFamily: medium,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: h * 0.01,
  },
  statusBadge: {
    paddingHorizontal: w * 0.03,
    paddingVertical: w * 0.01,
    borderRadius: w * 0.02,
  },
  statusText: {
    fontSize: adjust(10),
    color: pallette.white,
    fontFamily: medium,
  },
});