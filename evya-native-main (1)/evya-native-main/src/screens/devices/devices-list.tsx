import React from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { h, w } from "../../constants/dimensions";
import { pallette } from "../../utils/pallette";
import { semibold, regular } from "../../utils/fonts";
import { adjust } from "../../helpers/common-functions";
import CachedRemoteImage from "../../components/cached-remote-image";

/**
 * Device Interface
 * Represents each charger or device in the list
 */
interface Device {
  id: string;
  owner: string;
  isPrimary?: boolean;
  name: string;
  numberPlate: string;
  image: any;
}

/**
 * Sample Device Data (Empty initially)
 * Replace this with your API or Redux data later
 */
const vehicles: Device[] = [];

/**
 * Component: DeviceItem
 * Renders each individual charger card
 */
const DeviceItem: React.FC<{ item: Device }> = ({ item }) => (
  <View style={styles.deviceCard}>
    <CachedRemoteImage
      uri={typeof item.image === "string" ? item.image : null}
      fallback={require("../../assets/images/devices/d3.png")}
      style={styles.deviceImage}
      cdnWidth={320}
      resizeMode="cover"
    />
    <View style={styles.deviceInfo}>
      <Text style={styles.ownerText}>
        {item.owner}{" "}
        {item.isPrimary && <Text style={styles.primaryText}>Primary</Text>}
      </Text>
      <Text style={styles.deviceName}>{item.name}</Text>
      <Text style={styles.deviceNumber}>{item.numberPlate}</Text>
    </View>
    <TouchableOpacity>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  </View>
);

/**
 * Component: DeviceListScreen
 * Displays list of chargers or "No chargers found" if empty
 */
const DeviceListScreen: React.FC = () => {
  const hasDevices = vehicles.length > 0;

  return (
    <View style={styles.container}>
      {hasDevices ? (
        <>
          {/* Device List */}
          <FlatList
            data={vehicles}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <DeviceItem item={item} />}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />

          {/* Add Charger Button */}
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>+ Add Charger</Text>
          </TouchableOpacity>
        </>
      ) : (
        // No Chargers Found State
        <View style={styles.noDataContainer}>
          <Image
            source={require("../../assets/images/devices/d3.png")}
            style={styles.noDataImage}
          />
          <Text style={styles.noDataText}>No chargers found</Text>

          {/* Add Charger Button still visible */}
          {/* <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>+ Add Charger</Text>
          </TouchableOpacity> */}
        </View>
      )}
    </View>
  );
};

export default DeviceListScreen;

/**
 * ---------------------------
 * STYLES
 * ---------------------------
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: pallette.white,
    padding: 16,
  },
  listContainer: {
    paddingBottom: 16,
  },

  /** Device Card */
  deviceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: pallette.white,
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: pallette.mediumgrey,
    shadowColor: pallette.black,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deviceImage: {
    width: w * 0.18,
    height: h * 0.07,
    resizeMode: "contain",
    marginRight: 12,
  },
  deviceInfo: {
    flex: 1,
  },
  ownerText: {
    fontSize: adjust(12),
    color: pallette.black,
    fontFamily: regular,
  },
  primaryText: {
    fontSize: adjust(11),
    color: pallette.primary,
    fontFamily: semibold,
    marginLeft: 6,
  },
  deviceName: {
    fontSize: adjust(15),
    color: pallette.black,
    fontFamily: semibold,
    marginTop: 2,
  },
  deviceNumber: {
    fontSize: adjust(13),
    color: pallette.grey,
    fontFamily: regular,
  },
  arrow: {
    fontSize: adjust(20),
    color: pallette.grey,
  },

  /** Add Charger Button */
  addButton: {
    borderWidth: 1.5,
    borderColor: pallette.primary,
    paddingVertical: h * 0.018,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    backgroundColor: pallette.white,
    shadowColor: pallette.primary,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  addButtonText: {
    color: pallette.primary,
    fontSize: adjust(15),
    fontFamily: semibold,
  },

  /** No Data Section */
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noDataImage: {
    width: w * 0.3,
    height: h * 0.1,
    resizeMode: "contain",
    marginBottom: 10,
    opacity: 0.7,
  },
  noDataText: {
    fontSize: adjust(14),
    color: pallette.grey,
    fontFamily: semibold,
    marginBottom: 16,
  },
});
