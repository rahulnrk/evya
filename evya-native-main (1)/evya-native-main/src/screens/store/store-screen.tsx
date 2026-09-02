import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  SafeAreaView,
  TextInput,
  Dimensions,
  FlatList,
} from 'react-native';
import { pallette } from '../../utils/pallette';
import { regular, medium, semibold, bold, extrabold } from '../../utils/fonts';
const { width } = Dimensions.get('window');

const carsData = [
  {
    id: 1,
    title: 'New GLC – 2023',
    description: '10 DB PowerPulse Momentum: 5x8 AIL.',
    available: 7,
    miles: '30 Miles',
    fuelType: 'Fueled',
    transmission: 'Automatic',
    price: '$95,000',
    image: require('../../assets/images/devices/v1.png'),
    type: 'New',
    badge: 'Low Mileage'
  },
  {
    id: 2,
    title: 'Audi AG 3.5 – New',
    description: '3.5 DB PowerPulse Momentum: 6x8 AIL.',
    available: 2,
    miles: '100 Miles',
    fuelType: 'Fueled',
    transmission: 'Automatic',
    price: '$58,000',
    image: require('../../assets/images/devices/v2.png'),
    type: 'New',
    badge: 'Great Price'
  },
  {
    id: 3,
    title: 'Corolla Atits – 2023',
    description: '3.5 DB PowerPulse Momentum: 6x8 AIL.',
    available: 4,
    miles: '15000 Miles',
    fuelType: 'Fueled',
    transmission: 'CY1',
    price: '$45,000',
    image: require('../../assets/images/devices/v2.png'),
    type: 'Used',
    badge: 'Popular'
  },
  {
    id: 4,
    title: 'Ford Explorer 2023',
    description: '3.5 DB PowerPulse Momentum: 6x8 AIL.',
    available: 5,
    miles: '50 Miles',
    fuelType: 'Fueled',
    transmission: 'CY1',
    price: '$35,000',
    image: require('../../assets/images/devices/v3.png'),
    type: 'Used',
    badge: 'Great Price'
  },
  {
    id: 5,
    title: 'BMW X5 – 2023',
    description: '8 DB PowerPulse Momentum: 6x8 AIL.',
    available: 3,
    miles: '80 Miles',
    fuelType: 'Fueled',
    transmission: 'Automatic',
    price: '$85,000',
    image: require('../../assets/images/devices/v1.png'),
    type: 'New',
    badge: 'Low Mileage'
  },
  {
    id: 6,
    title: 'Mercedes C300 – 2023',
    description: '4.5 DB PowerPulse Momentum: 6x8 AIL.',
    available: 6,
    miles: '120 Miles',
    fuelType: 'Fueled',
    transmission: 'Automatic',
    price: '$65,000',
    image: require('../../assets/images/devices/v2.png'),
    type: 'New',
    badge: 'Great Price'
  }
];

const carTypes = ['SUV', 'Sedan', 'Hatchback', 'Coupe', 'Hybrid'];

const Store = () => {
  const [searchText, setSearchText] = React.useState('');
  const [selectedType, setSelectedType] = React.useState('SUV');

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Background Image with Title */}
      <View style={styles.heroSection}>
        <Image 
          source={require('../../assets/images/devices/v3.png')} 
          style={styles.heroImage}
          resizeMode="cover"
        />
        <View style={styles.heroOverlay}>
          <Text style={styles.headerTitle}>Find Your Perfect Ev</Text>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search your Evs by name, model or location..."
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor={pallette.grey}
            />
            <TouchableOpacity style={styles.searchButton}>
              <Text style={styles.searchButtonText}>Search Evs</Text>
            </TouchableOpacity>
          </View>

          {/* Car Type Filters */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterScrollContent}
          >
            {carTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeFilter,
                  selectedType === type && styles.selectedTypeFilter
                ]}
                onPress={() => setSelectedType(type)}
              >
                <Text style={[
                  styles.typeFilterText,
                  selectedType === type && styles.selectedTypeFilterText
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </View>
  );

  // PERF-5: virtualized 2-column car grid (was ScrollView + .map rows)
  const renderCarCard = useCallback(({ item: car }: { item: typeof carsData[0] }) => (
    <View style={styles.carCardWrapper}>
      <View style={styles.carCard}>
        <View style={styles.carImageContainer}>
          <Image
            source={car.image}
            style={styles.carImage}
            resizeMode="cover"
          />
          {car.badge && (
            <View
              style={[
                styles.badge,
                car.badge === 'Low Mileage' && styles.badgeBlue,
                car.badge === 'Great Price' && styles.badgeGreen,
                car.badge === 'Popular' && styles.badgeGold,
              ]}>
              <Text style={styles.badgeText}>{car.badge}</Text>
            </View>
          )}
          <View style={styles.availabilityBadge}>
            <Text style={styles.availabilityText}>({car.available})</Text>
          </View>
        </View>

        <View style={styles.carInfo}>
          <Text style={styles.carTitle}>{car.title}</Text>
          <Text style={styles.carDescription}>{car.description}</Text>

          <View style={styles.carDetails}>
            <Text style={styles.carDetail}>{car.miles}</Text>
            <Text style={styles.carDetail}>{car.fuelType}</Text>
            <Text style={styles.carDetail}>{car.transmission}</Text>
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.price}>{car.price}</Text>
            <TouchableOpacity style={styles.viewDetailsButton}>
              <Text style={styles.viewDetailsText}>View Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  ), []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={pallette.primary} />
      <FlatList
        data={carsData}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderCarCard}
        numColumns={2}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.carsGrid}
        columnWrapperStyle={styles.carRow}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={5}
        removeClippedSubviews
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: pallette.white,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: pallette.white,
  },
  heroSection: {
    height: 280, // Increased height to accommodate overlay content
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: bold,
    color: pallette.white,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    marginBottom: 20,
  },
  searchContainer: {
    width: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    height: 45,
    borderWidth: 1,
    borderColor: pallette.mediumgrey,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginRight: 12,
    fontFamily: regular,
    fontSize: 14,
    backgroundColor: pallette.white,
  },
  searchButton: {
    backgroundColor: pallette.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
  },
  searchButtonText: {
    color: pallette.white,
    fontFamily: medium,
    fontSize: 14,
    textAlign: 'center',
  },
  filterScroll: {
    width: '90%',
    height: 50,
  },
  filterScrollContent: {
    alignItems: 'center',
  },
  typeFilter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginRight: 10,
    borderWidth: 1,
    borderColor: pallette.white,
  },
  selectedTypeFilter: {
    backgroundColor: pallette.primary,
    borderColor: pallette.primary,
  },
  typeFilterText: {
    fontFamily: medium,
    fontSize: 12,
    color: pallette.white,
  },
  selectedTypeFilterText: {
    color: pallette.white,
  },
  carsGrid: {
    padding: 16,
  },
  carRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  carCardWrapper: {
    width: (width - 48) / 2, // 16px padding * 2 + 16px gap between cards
  },
  carCard: {
    backgroundColor: pallette.white,
    borderRadius: 12,
    shadowColor: pallette.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
    flex: 1,
  },
  carImageContainer: {
    position: 'relative',
    height: 120, // Reduced height for smaller cards
    backgroundColor: pallette.lightgrey,
  },
  carImage: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeBlue: {
    backgroundColor: pallette.l1,
  },
  badgeGreen: {
    backgroundColor: pallette.primary,
  },
  badgeGold: {
    backgroundColor: pallette.gold,
  },
  badgeText: {
    fontSize: 8,
    fontFamily: medium,
    color: pallette.white,
  },
  availabilityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: pallette.white,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    shadowColor: pallette.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  availabilityText: {
    fontSize: 10,
    fontFamily: medium,
    color: pallette.black,
  },
  carInfo: {
    padding: 12,
  },
  carTitle: {
    fontSize: 14,
    fontFamily: bold,
    color: pallette.black,
    marginBottom: 4,
  },
  carDescription: {
    fontSize: 11,
    fontFamily: regular,
    color: pallette.grey,
    marginBottom: 8,
  },
  carDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  carDetail: {
    fontSize: 10,
    fontFamily: regular,
    color: pallette.grey,
    flex: 1,
    textAlign: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontFamily: bold,
    color: pallette.primary,
  },
  viewDetailsButton: {
    backgroundColor: pallette.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewDetailsText: {
    fontSize: 10,
    fontFamily: medium,
    color: pallette.white,
  },
});

export default Store;