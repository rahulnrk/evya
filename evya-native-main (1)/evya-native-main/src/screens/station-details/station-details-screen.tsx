import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Linking,
  Share,
  Alert,
  ActivityIndicator
} from "react-native";
import { h, w } from "../../constants/dimensions";
import { pallette } from "../../utils/pallette";
import TopTabs from "../../components/top-tabs";
import Icon from "react-native-vector-icons/MaterialIcons";
import { bold, regular, medium } from "../../utils/fonts";
import Header from "../../components/header-with-skip";
import StationsService from "../../axios/Apis";
import strings from "../../utils/strings";
import { useAuth } from "../../hooks/useAuth";
import Toast from 'react-native-toast-message';

interface ConnectorCardProps {
  portId: string;
  slot: string;
  connectorType: string;
  price: string;
  status: string;
  currentType: string;
  capacity: string;
  selected: any;
  onPress: () => void;
  reservationInfo?: string;
}

interface ChargerTabProps {
  name: string;
  isActive: boolean;
  onPress: () => void;
}

interface ContactSectionProps {
  station: any;
}

interface EVChargingScreenProps {
  navigation: any;
  route: any;
}

const STATUS_CONFIG = {
  Available: {
    bgColor: pallette.secondary,
    textColor: pallette.primary,
    text: "Available",
    headerBg: pallette.secondary
  },
  Preparing: {
    bgColor: pallette.secondary,
    textColor: pallette.primary,
    text: " Preparing",
    headerBg: pallette.secondary
  },
  Charging: {
    bgColor: "#FFF6E6",
    textColor: pallette.gold,
    text: "Charging",
    headerBg: "#FFF6E6"
  },
  Reserved: {
    bgColor: pallette.lightred,
    textColor: pallette.red,
    text: "Reserved",
    headerBg: pallette.lightred
  },
  Unavailable: {
    bgColor: pallette.lightgrey,
    textColor: pallette.grey,
    text: "Inactive",
    headerBg: pallette.lightgrey
  },
  Unknown: {
    bgColor: pallette.lightgrey,
    textColor: pallette.grey,
    text: "Unknown",
    headerBg: pallette.lightgrey
  }
};

const ConnectorCard: React.FC<ConnectorCardProps> = ({
  portId,
  slot,
  connectorType,
  price,
  status,
  currentType,
  capacity,
  selected,
  onPress,
  reservationInfo,
}) => {
  const getStatusInfo = (status: string) => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || {
      bgColor: pallette.lightgrey,
      textColor: pallette.grey,
      text: status,
      headerBg: pallette.lightgrey
    };
  };

  const statusInfo = getStatusInfo(status);
  const isSelected = selected?.slot === slot;
  const isDisabled = status !== "Available" && status !== "Charging" && status !== "Reserved" && status !== "Preparing";
  const hasReservationInfo = reservationInfo && reservationInfo !== "No active reservation";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      disabled={isDisabled}
      style={[
        styles.connectorCard,
        { 
          borderColor: isSelected ? pallette.primary : pallette.mediumgrey, 
          borderWidth: 1.5 
        },
        isDisabled && styles.disabledCard,
      ]}
    >
      <View style={[
        styles.headerContainer, 
        { backgroundColor: isSelected ? pallette.primary : statusInfo.headerBg }
      ]}>
        <Text style={[
          styles.slotText, 
          { color: isSelected ? pallette.white : pallette.black }
        ]}>
          {`Port ${slot}`}
        </Text>

        {hasReservationInfo && (
          <Text
            style={[
              styles.reservationText,
              { color: isSelected ? pallette.white : pallette.primary },
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {reservationInfo}
          </Text>
        )}

        <Text style={[
          styles.statusText, 
          { color: isSelected ? pallette.white : statusInfo.textColor }
        ]}>
          {statusInfo.text}
        </Text>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailColumn}>
          <Image 
            source={require("../../assets/images/chargers/c1.png")} 
            style={styles.connectorIcon} 
            resizeMode="contain" 
          />
          <Text style={styles.detailValue}>{connectorType}</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.detailColumn}>
          <Text style={styles.detailLabel}>Price</Text>
          <Text style={styles.detailValue}>{price}</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.detailColumn}>
          <Text style={styles.detailLabel}>Level</Text>
          <Text style={styles.detailValue}>{currentType || "AC/DC"}</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.detailColumn}>
          <Text style={styles.detailLabel}>Power</Text>
          <Text style={styles.detailValue}>{capacity || "Varies"}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const ChargerTab: React.FC<ChargerTabProps> = ({ name, isActive, onPress }) => (
  <TouchableOpacity 
    style={[
      styles.chargerTab, 
      isActive && styles.chargerTabActive
    ]} 
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[
      styles.chargerTabText, 
      isActive && styles.chargerTabTextActive
    ]}>
      {name}
    </Text>
  </TouchableOpacity>
);

const AmenitiesSection: React.FC = () => {
  const amenities = [
    { name: "Restrooms", icon: "wc" },
    { name: "Lounge", icon: "weekend" },
    { name: "Wi-Fi", icon: "wifi" },
    { name: "Shopping", icon: "shopping-cart" },
    { name: "Cafe", icon: "local-cafe" },
    { name: "Mechanic", icon: "handyman" },
  ];

  return (
    <View style={styles.amenitiesSection}>
      <Text style={styles.sectionTitle}>Amenities</Text>
      <View style={styles.amenitiesGrid}>
        {amenities.map((amenity, index) => (
          <View key={`amenity-${index}`} style={styles.amenityItem}>
            <Icon name={amenity.icon} size={24} color={pallette.primary} />
            <Text style={styles.amenityText}>{amenity.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const ContactSection: React.FC<ContactSectionProps> = ({ station }) => {
  const contactData = station.originalData || station;
  
  return (
    <View style={styles.contactSection}>
      <Text style={styles.sectionTitle}>Contact Details</Text>

      <View style={styles.contactItem}>
        <Icon name="location-on" size={20} color={pallette.primary} />
        <View style={styles.contactText}>
          <Text style={styles.contactLabel}>Location</Text>
          <Text style={styles.contactValue}>
            {contactData.locations?.[0]?.address || station.address || "Address not available"}
          </Text>
        </View>
      </View>

      <View style={styles.contactItem}>
        <Icon name="phone" size={20} color={pallette.primary} />
        <View style={styles.contactText}>
          <Text style={styles.contactLabel}>Contact Details</Text>
          <Text style={styles.contactValue}>
            {contactData.managerName || "Not available"}
          </Text>
          <Text style={styles.contactValue}>
            {contactData.managerPhone || "Not available"}
          </Text>
          
        </View>
      </View>
    </View>
  );
};

const EVChargingScreen: React.FC<EVChargingScreenProps> = ({ navigation, route }) => {
  const [station, setStation] = useState<any>(null);
  const [selectedCharger, setSelectedCharger] = useState<any>(null);
  const [selectedConnector, setSelectedConnector] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [connectorAvailability, setConnectorAvailability] = useState<{[key: string]: any}>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [favoriteStations, setFavoriteStations] = useState([]);
  const [isStationFavorite, setIsStationFavorite] = useState(false);
  const [loadingFavStatus, setLoadingFavStatus] = useState(false);

  // STATE-1: auth from Redux
  const { userId } = useAuth();

 console.log("station",station);

  const fetchPortAvailability = async (portId: string) => {
    try {
      setIsLoading(true);
      const response = await StationsService.portavaliablity(portId);
console.log(response.data);
      if (response.data && response.data.portId) {
        const availabilityData = {
          portId: response.data.portId,
          status: response.data.status,
          durationHours: response.data.durationHours || 0,
          durationMinutes: response.data.durationMinutes || 0,
          calculatedAmount: response.data.calculatedAmount,
          unitsConsumed: response.data.unitsConsumed || 0.0,
          billingUnits: response.data.billingUnits,
          max_power_kW: response.data.max_power_kW || 0.0,
          billingAmount: response.data.billingAmount || 0.0,
          durationText: response.data.durationText
        };

        setConnectorAvailability(prev => ({
          ...prev,
          [portId]: availabilityData
        }));

        return availabilityData;
      }
      return null;
    } catch (error) {
      console.error('Error checking availabilty:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const transformStationData = (stationData: any) => {
    if (!stationData) return null;
    
    const sourceData = stationData.originalData || stationData;
    console.log(sourceData);
    return {
      id: sourceData.siteId || stationData.id,
      evya: (sourceData.ownerOrgId || stationData.ownerOrgId) != null ? true : false,
      name: sourceData.siteName || stationData.name,
      address: sourceData.locations?.[0]?.address || stationData.address || "--",
      image: require("../../assets/images/chargingstation.png"),
      coordinates: {
        latitude: parseFloat(sourceData.locations?.[0]?.latitude) || stationData.coordinates?.latitude,
        longitude: parseFloat(sourceData.locations?.[0]?.longitude) || stationData.coordinates?.longitude,
      },
      available: stationData.available || sourceData.availablePorts || 0,
      totalPorts: stationData.totalPorts || sourceData.totalPorts || 0,
      power: stationData.power || "--",
      current_type: stationData.current_type || "--",
      price: stationData.price || "--",
      managerName: stationData.managerName || sourceData.managerName || "---",
      managerEmail: stationData.managerEmail || sourceData.managerEmail || "---",
      managerPhone: stationData.managerPhone || sourceData.managerPhone || "---",
      chargers: (sourceData.stations || []).map((stationItem: any, index: number) => ({
        name: stationItem.stationName || `Charger ${index + 1}`,
        stationId: stationItem.stationId,
        status: stationItem.status || "---",
        connectors: (stationItem.ports || []).map((port: any, portIndex: number) => ({
          slot: ` ${portIndex + 1}`,
          connectorType: port.connectorType || "---",
          price: `₹${port.billingAmount || 0}/${port["billing units"] || "kWh"}`,
          status: port.statusNotifications?.[0]?.status || "---",
          currentType: port.powerType || stationItem["current Type"] || "---",
          capacity: `${port.powerCapacity} kW`|| "---" ,
          portId: port.portId || portIndex,
          connectorName: port.connectorName || `Port-${portIndex + 1}`,
        }))
      }))
    };
  };
// In your Station Details screen
useEffect(() => {
  const loadStationData = async () => {
    try {
      // Check if we have station data from params
      if (route.params?.station) {
        const stationData = typeof route.params.station === "string"
          ? JSON.parse(route.params.station)
          : route.params.station;
        
        console.log('Received station data:', stationData);
        
        // Check if this came from scan screen
        const fromScan = route.params?.screen === 'scan';
        
        if (fromScan) {
          // Data from scan screen is already transformed and complete
          setStation(stationData);
        } else {
          // Data from other screens might need additional fetching
          const siteId = stationData.siteId;
          
          if (siteId) {
            const res = await StationsService.stationById(siteId);
            
            // Handle array response - take first element if it's an array
            const stationResult = Array.isArray(res.data) && res.data.length > 0 
              ? res.data[0]
              : res.data;
            
            console.log('Fetched station data:', stationResult);
            setStation(stationResult);
          } else {
            // Use the stationData directly if no siteId
            const stationResult = Array.isArray(stationData) && stationData.length > 0 
              ? stationData[0]
              : stationData;
            setStation(stationResult);
          }
        }
      }
    } catch (error) {
      console.error("Error loading station data:", error);
      Alert.alert("Error", "Failed to load station data");
    }
  };

  loadStationData();
}, [route.params]);

useEffect(() => {
    if (station && !selectedCharger) {
      const transformed = transformStationData(station);
      if (transformed && transformed.chargers.length > 0) {
        setSelectedCharger(transformed.chargers[0]);
        
        transformed.chargers.forEach((charger: any) => {
          charger.connectors.forEach((connector: any) => {
            if (connector.portId) {
              fetchPortAvailability(connector.portId.toString());
            }
          });
        });
      }
    }
  }, [station, selectedCharger]);

  // Check favorite status when station or userId changes
  useEffect(() => {
    if (userId && station) {
      const transformed = transformStationData(station);
      if (transformed?.id) {
        checkIfStationIsFavorite(transformed.id);
      }
    }
  }, [userId, station]);

  const handleSelectConnector = (connector: any) => {
    setSelectedConnector({ 
      ...connector, 
      fullSlot: `${selectedCharger?.name} - ${connector.slot}` 
    });
  };

  const openGoogleMaps = () => {
    const transformed = transformStationData(station);
    if (transformed?.coordinates?.latitude && transformed?.coordinates?.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${transformed.coordinates.latitude},${transformed.coordinates.longitude}`;
      Linking.openURL(url);
    } else {
      Alert.alert("Error", "Station coordinates not available");
    }
  };

  const handleShareStation = (stationData: any) => {
    const shareOptions = {
      message: `EV charging station: ${stationData.name}\nAddress: ${stationData.address}\nAvailable ports: ${stationData.available}/${stationData.totalPorts}`,
      title: 'EV Charging Station'
    };
    Share.share(shareOptions);
  };

  
   // Define checkIfStationIsFavorite function BEFORE useEffect
  const checkIfStationIsFavorite = async (stationId: string) => {
    if (!userId || !stationId) return;
    
    setLoadingFavStatus(true);
    try {
      const response = await StationsService.getFavoriteStations(userId);
      console.log(response)
      if (response.success) {
        if (Array.isArray(response.data)) {
          // Check if current station exists in favorites
          const exists = response.data.some(fav => 
            fav.siteId === stationId
          );
          setIsStationFavorite(exists);
        } else if (response.data?.message) {
          // Handle "No favorite stations" message
          if (response.data.message.includes('No favourite stations')) {
            setIsStationFavorite(false);
          }
        }
      }
    } catch (error) {
      console.error('Error checking favorite status:', error);
    } finally {
      setLoadingFavStatus(false);
    }
  };

  const handleAddToFavorites = async (stationData: any) => {
    if (!userId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'User ID not available',
       position: 'top',
        visibilityTime: 3000,
      });
      return;
    }
    
    if (!stationData?.id) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Station data not available',
        position: 'top',
        visibilityTime: 3000,
      });
      return;
    }
    
    try {
      console.log(stationData);
      console.log(stationData?.id)
      console.log(userId)
      const response = await StationsService.addFavoriteStation(userId, {siteId:stationData?.id});
      console.log(response);
      if (response.success==201) {
        
            Toast.show({
              type: 'success',
              text1: 'Success',
              text2: 'Station added to favorites!',
              position: 'top',
              visibilityTime: 3000,
            });
            setIsStationFavorite(true);
           } else {
        throw new Error(response.message || 'Failed to add to favorites ');
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to add to favorites',
       position: 'top',
        visibilityTime: 4000,
      });
    }
  };

  const handleRemoveFavorite = async (stationData: any) => {
    if (!userId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'User ID not available',
        position: 'top',
        visibilityTime: 3000,
      });
      return;
    }
    
    if (!stationData?.id) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Station data not available',
        position: 'top',
        visibilityTime: 3000,
      });
      return;
    }
    
    try {
      const response = await StationsService.deleteFavoriteStation(userId);
      console.log(response);
      if (response.success) {
        if (response.data?.message) {
          if (response.data.message.includes('Deleted successfully')) {
            Toast.show({
              type: 'success',
              text1: 'Removed',
              text2: 'Station removed from favorites',
             position: 'top',
              visibilityTime: 3000,
            });
            setIsStationFavorite(false);
          }
        }
      } else {
        throw new Error(response.message || 'Failed to remove from favorites');
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to remove from favorites',
       position: 'top',
        visibilityTime: 4000,
      });
    }
  };

  if (!station) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading station data...</Text>
      </View>
    );
  }

  const transformedStation = transformStationData(station);
  console.log("transformedStation",transformedStation)
  if (!transformedStation) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Error processing station data</Text>
      </View>
    );
  }


  const tabs = ["Chargers", "Information"];
  
  const isConnectorAvailableForConnect = selectedConnector && 
    (connectorAvailability[selectedConnector.portId]?.status === "Available" ||  
    connectorAvailability[selectedConnector.portId]?.status === "Preparing");
  
  const isConnectorAvailableForBooking = selectedConnector && 
    (connectorAvailability[selectedConnector.portId]?.status === "Available" || 
     connectorAvailability[selectedConnector.portId]?.status === "Reserved" || 
     connectorAvailability[selectedConnector.portId]?.status === "Charging");
     console.log(selectedConnector);
 console.log(isConnectorAvailableForBooking)
 console.log(isConnectorAvailableForConnect)
  return (
    <View style={styles.container}>
      <Header
        onback={() => navigation.goBack()}
        active={1}
        onSkip={() => {}}
        skippable={false}
        hastitle={true}
        title={'Station Details'}
      />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stationImageContainer}>
          <Image source={transformedStation.image} style={styles.stationImage} />
        </View>

        <View style={styles.stationInfo}>
          <View style={styles.stationHeader}>
            <Text style={styles.stationName}>
              {transformedStation.name || "Charging Station"}
            </Text>
             <View style={styles.stationHeader}>
            {loadingFavStatus ? (
              <TouchableOpacity style={styles.iconButton} disabled>
                <ActivityIndicator size="small" color={pallette.primary} />
              </TouchableOpacity>
            ) : isStationFavorite ? (
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => handleRemoveFavorite(transformedStation)}
              >
                <Icon name="favorite" size={24} color={pallette.red} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => handleAddToFavorites(transformedStation)}
              >
                <Icon name="favorite-border" size={24} color={pallette.primary} />
              </TouchableOpacity>

            ) }
             <TouchableOpacity 
                // style={styles.iconButton} 
                onPress={() => handleShareStation(transformedStation)}
              >
                <Icon name="share" size={24} color={pallette.primary} />
              </TouchableOpacity></View>
          </View>
          <View style={styles.addressContainer}>
            <Icon name="location-on" size={16} color={pallette.grey} />
            <Text style={styles.addressText}>{transformedStation.address}</Text>
          </View>
        </View>

        <TopTabs tabs={tabs} onTabChange={setActiveTab} />

        {activeTab === 0 ? (
          <View style={styles.chargersContainer}>
            {/* PERF-5: horizontal FlatList for charger tabs */}
            <FlatList
              horizontal
              data={transformedStation.chargers}
              keyExtractor={(charger: any, index: number) =>
                String(charger.stationId || index)
              }
              showsHorizontalScrollIndicator={false}
              style={styles.chargerTabsContainer}
              contentContainerStyle={styles.chargerTabsContent}
              renderItem={({ item: charger }) => (
                <ChargerTab
                  name={charger.name}
                  isActive={selectedCharger?.stationId === charger.stationId}
                  onPress={() => {
                    setSelectedCharger(charger);
                    setSelectedConnector(null);
                  }}
                />
              )}
            />

            <View style={styles.connectorsSection}>
              <Text style={styles.sectionTitle}>Select a Connector</Text>
              <View style={styles.connectorsListContainer}>
                <FlatList
                  data={selectedCharger?.connectors || []}
                  keyExtractor={(item, index) => `${item.portId}-${index}`}
                  renderItem={({ item }) => {
                    const availability = connectorAvailability[item.portId];
                    const displayStatus = availability?.status || item.status;
                    const reservationInfo = availability?.durationText;
                    
                    return (
                      <ConnectorCard
                        portId={`${item.portId}`}
                        slot={`${item.slot}`}
                        connectorType={item.connectorType}
                        price={item.price}
                        status={displayStatus}
                        currentType={item.currentType}
                        capacity={item.capacity}
                        selected={selectedConnector}
                        onPress={() => handleSelectConnector(item)}
                        reservationInfo={reservationInfo}
                      />
                    );
                  }}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.infoSection}>
            <AmenitiesSection />
            <ContactSection station={station} />
          </View>
        )}
      </ScrollView>

      <View>
        {transformedStation.evya ? (
          // Evya Station - Book & Connect buttons
          <View style={styles.actionBar}>
            <TouchableOpacity
              style={[
                styles.actionButton, 
                styles.bookButton, 
                !isConnectorAvailableForBooking && styles.disabledButton
                
              ]}
              onPress={() => isConnectorAvailableForBooking && navigation.navigate("Book Charger", { 
                station: transformedStation, 
                connector: selectedConnector, 
                Charger: selectedCharger
              })}
              disabled={!isConnectorAvailableForBooking}
            >
              <Text style={[
                styles.bookButtonText, 
                !isConnectorAvailableForBooking && styles.disabledButtonText
              ]}>
                Book Now
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton, 
                styles.connectButton, 
                !isConnectorAvailableForConnect && styles.disabledButton
              ]}
              onPress={() => {
                if (isConnectorAvailableForConnect) {
                  navigation.navigate(strings.checkin, { 
                    station: transformedStation, 
                    connector: selectedConnector,    
                    Charger: selectedCharger,
                    button:'pay & charge',
                  });
                  
                }
              }}
              disabled={!isConnectorAvailableForConnect}
            >
              <Text style={[
                styles.connectButtonText, 
                !isConnectorAvailableForConnect && styles.disabledButtonText
              ]}>
                Connect
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Non-Evya Station - Navigate & Check In buttons
          <View style={styles.actionBar}>
            <TouchableOpacity
              style={[
                styles.actionButton, 
                styles.bookButton
              ]}
              onPress={openGoogleMaps}
            >
              <Text style={styles.bookButtonText}>
                Navigate
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton, 
                styles.connectButton
              ]}
              onPress={() => {navigation.navigate(strings.feedbackcheckin)}}
            >
              <Text style={styles.connectButtonText}>
                Check In
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: pallette.white,
    paddingTop: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: pallette.white,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: regular,
    color: pallette.black,
  },
  errorText: {
    fontSize: 16,
    fontFamily: regular,
    color: pallette.red,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  stationImageContainer: {
    alignItems: "center",
    marginVertical: 0,
  },
  stationImage: {
    width: w * 0.9,
    height: h * 0.25,
    resizeMode: "contain",
  },
  stationInfo: {
    paddingHorizontal: 16,
  },
  stationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 0,
  },
  stationName: {
    fontSize: 18,
    fontFamily: bold,
    color: pallette.black,
  },
  actionIcons: {
    flexDirection: "row",
  },
  
  iconButton: {
    marginLeft: 1,
    paddingEnd:10,
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  addressText: {
    fontSize: 11,
    fontFamily: regular,
    color: pallette.grey,
    marginLeft: 4,
  },
  chargersContainer: {
    padding: 16,
  },
  chargerTabsContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  chargerTabsContent: {
    paddingHorizontal: 8,
  },
  chargerTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: pallette.lightgrey,
    marginRight: 8,
  },
  chargerTabActive: {
    backgroundColor: pallette.primary,
  },
  chargerTabText: {
    color: pallette.grey,
    fontFamily: medium,
  },
  chargerTabTextActive: {
    color: pallette.white,
    fontFamily: medium,
  },
  connectorsSection: {
    marginBottom: 16,
  },
  connectorsListContainer: {
    minHeight: 200,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: bold,
    color: pallette.black,
    marginBottom: 12,
  },
  infoSection: {
    padding: 16,
  },
  amenitiesSection: {
    marginBottom: 24,
  },
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  amenityItem: {
    width: "30%",
    alignItems: "center",
    marginBottom: 16,
  },
  amenityText: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: regular,
    textAlign: "center",
    color: pallette.black,
  },
  contactSection: {
    marginBottom: 24,
  },
  contactItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  contactText: {
    marginLeft: 12,
    flex: 1,
  },
  contactLabel: {
    fontSize: 16,
    fontFamily: bold,
    marginBottom: 4,
    color: pallette.black,
  },
  contactValue: {
    fontSize: 14,
    fontFamily: regular,
    color: pallette.grey,
  },
  actionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 16,
    backgroundColor: pallette.white,
    borderTopWidth: 1,
    borderTopColor: pallette.mediumgrey,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  bookButton: {
    backgroundColor: pallette.white,
    borderWidth: 1,
    borderColor: pallette.primary,
    marginRight: 12,
  },
  connectButton: {
    backgroundColor: pallette.primary,
  },
  disabledButton: {
    backgroundColor: pallette.mediumgrey,
    borderColor: pallette.mediumgrey,
  },
  bookButtonText: {
    color: pallette.primary,
    fontSize: 16,
    fontFamily: bold,
  },
  connectButtonText: {
    color: pallette.white,
    fontSize: 16,
    fontFamily: bold,
  },
  disabledButtonText: {
    color: pallette.grey,
  },
  connectorCard: {
    backgroundColor: pallette.white,
    borderRadius: 12,
    margin: 6,
    flex: 1,
    overflow: "hidden",
  },
  disabledCard: {
    opacity: 0.7,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  slotText: {
    fontSize: 14,
    fontFamily: medium,
    flex: 1,
  },
  reservationText: {
    fontSize: 10,
    fontFamily: regular,
    flex: 2,
    textAlign: 'center',
    marginHorizontal: 4,
  },
  statusText: {
    fontSize: 14,
    fontFamily: medium,
    flex: 1,
    textAlign: 'right',
  },
  connectorIcon: {
    width: 23,
    height: 23,
    marginRight: 8,
  },
  detailsContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: pallette.mediumgrey,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  detailColumn: {
    flex: 1,
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: regular,
    color: pallette.grey,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: medium,
    color: pallette.black,
  },
  separator: {
    width: 1,
    height: "100%",
    backgroundColor: pallette.mediumgrey,
  },
});

export default EVChargingScreen;

