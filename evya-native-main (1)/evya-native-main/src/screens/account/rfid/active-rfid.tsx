import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import Toast from "react-native-toast-message";
import LinearGradient from "react-native-linear-gradient";

import StationsService from "../../../axios/Apis";
import { pallette } from "../../../utils/pallette";
import { semibold, regular } from "../../../utils/fonts";
import { h, w } from "../../../constants/dimensions";
import { useGetUserRFIDsQuery } from "../../../redux/api/baseApi";

/**
 * Active RFID tab — STATE-2: shared useGetUserRFIDsQuery cache (deduped with Request tab)
 */
const ActiveRFIDScreen = ({ userId }: { userId?: string }) => {
  const {
    data: rfids = [],
    isLoading,
    isFetching,
    refetch,
  } = useGetUserRFIDsQuery(userId as string, {
    skip: !userId,
    refetchOnFocus: true,
    refetchOnMountOrArgChange: 60,
  });

  const activeRFIDs = useMemo(
    () => (rfids || []).filter((r: any) => r.status?.toLowerCase() === "active"),
    [rfids],
  );

  const toggleRFID = async (rfid: string) => {
    try {
      const res = await StationsService.toggleRFIDStatus(rfid);

      if (res.success) {
        Toast.show({
          type: "success",
          text1: `RFID ${rfid} Deactivated`,
          text2: `RFID ${rfid} deactivated successfully`,
          position: "top",
          visibilityTime: 3000,
        });
        refetch();
      } else {
        Toast.show({
          type: "error",
          text1: "Failed",
          text2: `Unable to deactivate RFID ${rfid}`,
          position: "top",
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Network Error",
        text2: "Something went wrong",
        position: "top",
      });
      console.log("Toggle RFID Error:", error);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "-";
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const renderItem = ({ item }: { item: any }) => (
    <LinearGradient
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      colors={[
        pallette.l1,
        pallette.l2,
        pallette.l3,
        pallette.l4,
        pallette.l5,
      ]}
      style={styles.card}
    >
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.value}>{item.rfId}</Text>

      <View style={styles.watermarkContainer}>
        <Image
          source={require("../../../assets/images/account/rfid.jpeg")}
          style={styles.rfidWatermark}
        />
        <Text style={styles.rfidWatermarkText}>RFID</Text>
      </View>

      <View style={styles.cardDetails}>
        <Text style={styles.info}>Status: {item.status}</Text>

        <View style={styles.expiryRow}>
          <Text style={styles.info}>
            Expiry: {formatDate(item.expiryDate)}
          </Text>

          <TouchableOpacity
            style={styles.activeBtn}
            onPress={() => toggleRFID(item.rfId)}
          >
            <Text style={styles.activeText}>Deactivate</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );

  if (isLoading && !rfids?.length) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={pallette.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {activeRFIDs && activeRFIDs.length > 0 ? (
        <FlatList
          data={activeRFIDs}
          keyExtractor={(item) => String(item.rfId)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={() => refetch()}
              colors={[pallette.primary]}
            />
          }
        />
      ) : (
        <View style={styles.noDataContainer}>
          <Image
            source={require("../../../assets/images/account/rfid.jpeg")}
            style={styles.noDataImage}
          />
          <Text style={styles.noDataText}>No Active RFIDs</Text>
        </View>
      )}
      <Toast />
    </View>
  );
};

export default ActiveRFIDScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: pallette.white,
    padding: 16,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    paddingBottom: 16,
  },
  name: {
    position: "absolute",
    top: 15,
    left: 20,
    fontSize: 18,
    color: pallette.white,
    fontFamily: semibold,
  },
  value: {
    position: "absolute",
    top: 15,
    right: 20,
    fontSize: 18,
    color: pallette.white,
    fontFamily: semibold,
  },
  expiryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  activeBtn: {
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  activeText: {
    color: pallette.white,
    fontSize: 12,
    fontFamily: semibold,
  },
  card: {
    height: h * 0.24,
    borderRadius: 16,
    marginBottom: 16,
    padding: 20,
    width: "100%",
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  watermarkContainer: {
    position: "absolute",
    alignSelf: "center",
    alignItems: "center",
    top: "15%",
  },
  rfidWatermark: {
    width: 160,
    height: 120,
    resizeMode: "contain",
    opacity: 0.15,
  },
  rfidWatermarkText: {
    fontSize: 26,
    fontFamily: semibold,
    color: pallette.white,
    opacity: 0.27,
    marginTop: -10,
  },
  cardDetails: {
    zIndex: 2,
  },
  info: {
    fontSize: 13,
    color: pallette.white,
    fontFamily: regular,
    marginTop: 2,
  },
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
    fontSize: 16,
    color: pallette.grey,
    fontFamily: semibold,
  },
});
