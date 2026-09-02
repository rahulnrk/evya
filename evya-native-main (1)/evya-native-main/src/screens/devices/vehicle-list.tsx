import React, { useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  Easing,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { h, w } from "../../constants/dimensions";
import { pallette } from "../../utils/pallette";
import { semibold, bold } from "../../utils/fonts";
import { nav } from "../../helpers/common-functions";
import strings from "../../utils/strings";
import CachedRemoteImage from "../../components/cached-remote-image";
import { useAuth } from "../../hooks/useAuth";
import { useGetUserVehiclesQuery } from "../../redux/api/baseApi";

/**
 * Vehicle type interface
 */
interface Vehicle {
  id: string;
  make: string;
  isPrimary?: boolean;
  model: string;
  registrationNo: string;
  image: string;
}

/**
 * AnimatedCard Component
 * - Handles individual vehicle card display
 * - Includes press animation and navigation to Vehicle Details page
 */
const AnimatedCard: React.FC<{ item: Vehicle; navigation: any }> = ({ item, navigation }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  /** Scale down card on press in */
  const onPressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.96,
      duration: 120,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  /** Scale back card on press out */
  const onPressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 120,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  /** Navigate to Vehicle Details screen */
  const handleNavigate = () => {
    navigation.navigate(strings.Vehiclepage, { vehicle: item });
  };

  return (
    <TouchableWithoutFeedback
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={handleNavigate}
    >
      <Animated.View style={[styles.vehicleCard, { transform: [{ scale: scaleAnim }] }]}>
        <CachedRemoteImage
          uri={typeof item.image === "string" ? item.image : null}
          fallback={require("../../assets/images/home/vehicle.png")}
          style={styles.vehicleImage}
          cdnWidth={320}
          resizeMode="cover"
        />
        <View style={styles.vehicleInfo}>
          <Text style={styles.ownerText}>
            {item.make}{" "}
            {item.isPrimary && <Text style={styles.primaryText}>Primary</Text>}
          </Text>
          <Text style={styles.vehicleName}>{item.model}</Text>
          <Text style={styles.vehicleNumber}>{item.registrationNo}</Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

/**
 * VehicleListScreen — STATE-2: vehicles via RTK Query; STATE-1: userId from Redux
 */
const VehicleListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { userId } = useAuth();
  const {
    data: vehicles,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetUserVehiclesQuery(userId as string, {
    skip: !userId,
    refetchOnFocus: true,
    refetchOnMountOrArgChange: 60,
  });

  const list = (vehicles as Vehicle[]) || [];

  if (isLoading && list.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={pallette.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={list}
        keyExtractor={(item, index) => String(item?.id ?? index)}
        renderItem={({ item }) => <AnimatedCard item={item} navigation={navigation} />}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={() => refetch()}
            colors={[pallette.primary]}
            tintColor={pallette.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>
              {isError ? "Failed to load vehicles" : "No vehicles yet"}
            </Text>
          </View>
        }
      />

      <TouchableWithoutFeedback
        onPress={() => nav(navigation, strings.addvehicle, { from: "vehicles" })}
      >
        <View style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add Vehicle</Text>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};

export default VehicleListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 15,
    color: pallette.grey,
    fontFamily: semibold,
  },
  listContainer: {
    paddingBottom: 20,
  },
  vehicleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: pallette.white,
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: pallette.mediumgrey,
  },
  vehicleImage: {
    width: w * 0.2,
    height: h * 0.07,
    resizeMode: "contain",
    marginRight: 12,
  },
  vehicleInfo: {
    flex: 1,
  },
  ownerText: {
    fontSize: 14,
    color: pallette.black,
    fontFamily: semibold,
  },
  primaryText: {
    fontSize: 12,
    color: pallette.primary,
    fontFamily: semibold,
  },
  vehicleName: {
    fontSize: 16,
    fontFamily: bold,
    color: pallette.black,
  },
  vehicleNumber: {
    fontSize: 14,
    color: pallette.grey,
    fontFamily: semibold,
  },
  arrow: {
    fontSize: 22,
    color: pallette.grey,
  },
  addButton: {
    borderWidth: 1.5,
    borderColor: pallette.primary,
    paddingVertical: h * 0.018,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    backgroundColor: pallette.white,
    shadowColor: pallette.primary,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  addButtonText: {
    color: pallette.primary,
    fontSize: 16,
    fontFamily: bold,
  },
});
