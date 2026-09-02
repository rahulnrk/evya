import {FlatList, StyleSheet, View, TouchableOpacity, Text} from 'react-native';
import React, {useRef} from 'react';
import CarInfo from './car-info';
import {h, w} from '../../constants/dimensions';
import {pallette} from '../../utils/pallette';
import {nav} from '../../helpers/common-functions';
import strings from '../../utils/strings';
import {regular, semibold} from '../../utils/fonts';

/**
 * Vehicle interface defining the structure of vehicle data
 */
interface Vehicle {
  id?: string;
  isAddCard?: boolean;
  connectorType?: string;
  model?: string;
  registrationNo?: string;
  battery?: string;
  tracking?: string;
  [key: string]: any;
}

/**
 * CarList Component Props interface
 */
interface CarListProps {
  vehicles: Vehicle[];
  active: number;
  setActive: (index: number) => void;
  navigation: any;
}

/**
 * CarList Component - Horizontal scrollable list of vehicles with pagination indicators
 * Displays vehicle cards and an "Add Vehicle" card at the end
 */
const CarList = ({
  vehicles,
  active,
  setActive,
  navigation,
}: CarListProps) => {
  //vishal added
   if (!vehicles || vehicles.length === 0) {
    return null;
  }
  const flatListRef = useRef<FlatList>(null);

  /**
   * Creates extended vehicles array with "Add Vehicle" card appended
   * @returns {Vehicle[]} Extended array including the add card
   */
  const extendedVehicles = [...vehicles, {isAddCard: true}];

  console.log("vehicles",vehicles)
  /**
   * Handles navigation to add vehicle screen with scroll reset
   * Scrolls back to first item before navigating for better UX
   */
  const handleAddVehicleNavigation = (): void => {
    flatListRef.current?.scrollToIndex({index: 0, animated: true});
    nav(navigation, strings.addvehicle, {from: 'vehicles'});
  };

  /**
   * Handles scroll end event to update active pagination indicator
   * @param {Object} event - Scroll event object
   */
  const handleScrollEnd = (event: any): void => {
  const contentOffsetX = event.nativeEvent.contentOffset.x;
  const newIndex = Math.round(contentOffsetX / w);
  if (newIndex >= vehicles.length) return;

  setActive(newIndex);
};

  /**
   * Renders individual vehicle item or add vehicle card
   * @param {Object} param0 - Item and index from FlatList
   * @returns {JSX.Element} Vehicle card or add card component
   */
  const renderVehicleItem = ({
    item,
    index,
  }: {
    item: Vehicle;
    index: number;
  }): JSX.Element => {
    if (item.isAddCard) {
      return (
        <View style={styles.itemWrapper}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleAddVehicleNavigation}
            style={styles.addCard}>
            <Text style={styles.addCardText}>+ Add Vehicle</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.itemWrapper}>
        <CarInfo info={item} />
      </View>
    );
  };

  console.log("vehicles length:", vehicles.length);
console.log("active index:", active);
  /**
   * Renders pagination indicators below the carousel
   * @returns {JSX.Element} Pagination indicators container
   */
  const renderPaginationIndicators = (): JSX.Element => (
    <View style={styles.indicatorContainer}>
      {vehicles.map((_: Vehicle, index: number) => (
        <View
          key={index}
          style={[
            styles.indicator,
            {
              width: index === active ? w * 0.04 : 5,
              backgroundColor:
                index === active ? pallette.primary : pallette.grey,
            },
          ]}
        />
      ))}
    </View>
  );

 
  return (
  <View style={styles.container}>
    <FlatList
      ref={flatListRef}
      data={extendedVehicles}
      renderItem={renderVehicleItem}
      keyExtractor={(_, index) => index.toString()}
      horizontal
      showsHorizontalScrollIndicator={false}
      pagingEnabled
      onMomentumScrollEnd={handleScrollEnd}
      snapToAlignment="center"
      decelerationRate="fast"
      snapToInterval={w}
    />

    {renderPaginationIndicators()}
  </View>
);
};

const styles = StyleSheet.create({
  indicatorContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
  // mar  ginTop: h * 0.01,
  },
  indicator: {
  height: 6,
  width: 10,
  borderRadius: 5,
  marginHorizontal: 5,
},

  /** ✅ FIX: Ensure paging & centering works correctly */
  itemWrapper: {
    width: w,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /** ✅ FIX: Prevent cards from going behind absolute-positioned map */
  listContent: {
    paddingBottom: h * 0.5,
  },

  addCard: {
    width: w * 0.4,
    height: h * 0.12,
    margin: h * 0.01,
    backgroundColor: pallette.lightgrey,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: w * 0.05,
    borderRadius: 12,
    shadowColor: pallette.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addCardText: {
    color: pallette.primary,
    fontSize: 18,
    fontFamily: semibold,
  },
});

export default CarList;