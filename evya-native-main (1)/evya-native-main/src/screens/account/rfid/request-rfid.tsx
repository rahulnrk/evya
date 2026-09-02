import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { pallette } from "../../../utils/pallette";
import StationsService from "../../../axios/Apis";
import AlertMessage from "../../../extra/alertmessage";
import strings from "../../../utils/strings";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { useGetUserRFIDsQuery } from "../../../redux/api/baseApi";

/**
 * Request RFID tab — STATE-2: shared useGetUserRFIDsQuery cache (deduped with Active tab)
 */
const RequestRFIDScreen = ({ userId }: { userId?: string }) => {
  const navigation = useNavigation<any>();
  const [alertComponent, setAlertComponent] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);

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

  // Non-active cards (pending / inactive) — same filter as before
  const list = useMemo(
    () =>
      (rfids || [])
        .filter((r: any) => r.status?.toLowerCase() !== "active")
        .slice()
        .reverse(),
    [rfids],
  );

  const handleActivate = async (item: any) => {
    try {
      setActionLoading(true);
      const res = await StationsService.toggleRFIDStatus(item.rfId);

      if (res.success) {
        Toast.show({
          type: "success",
          text1: `RFID ${item.rfId} Activated`,
          text2: `RFID ${item.rfId} activated successfully`,
          position: "top",
          visibilityTime: 3000,
        });
        refetch();
      } else {
        Toast.show({
          type: "error",
          text1: "Activation Failed",
          text2: `Failed to activate RFID ${item.rfId}`,
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
      console.log("Activate RFID Error:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (!status) return pallette.grey;
    const s = status.toLowerCase();
    if (s === "inactive") return pallette.lightred;
    if (s === "pending") return pallette.gold;
    return pallette.grey;
  };

  const handleRFID = () => {
    setAlertComponent(
      <AlertMessage
        message="Are you sure you want to request RFID?"
        showConfirm={true}
        onClose={(confirmed: any) => {
          setAlertComponent(null);
          if (confirmed) {
            navigation.navigate(strings.rfid);
          }
        }}
      />,
    );
  };

  const getStatusText = (status: string) => {
    if (!status) return "";
    const s = status.toLowerCase();
    if (s === "inactive") return "INACTIVE";
    if (s === "pending") return "PENDING";
    return status.toUpperCase();
  };

  const renderCard = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.rfidId}>#{item.rfId || item.orderId}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + "20" },
          ]}
        >
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>

      {item.phone && <Text style={styles.infoText}>{item.phone}</Text>}
      {item.email && <Text style={styles.infoText}>{item.email}</Text>}
      {item.address && <Text style={styles.infoText}>{item.address}</Text>}
      {item.rfidCount && <Text style={styles.infoText}>Count: {item.rfidCount}</Text>}
      {item.expiryDate && (
        <Text style={styles.infoText}>
          Expiry: {new Date(item.expiryDate).toLocaleDateString()}
        </Text>
      )}

      {item.status?.toLowerCase() === "inactive" && (
        <TouchableOpacity
          style={styles.activateButton}
          onPress={() => handleActivate(item)}
          disabled={actionLoading}
        >
          <Text style={styles.activateButtonText}>Activate</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {isLoading && list.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={pallette.primary} />
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => String(item.rfId || item.orderId)}
          renderItem={renderCard}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={() => refetch()}
              colors={[pallette.primary]}
            />
          }
          contentContainerStyle={{ padding: 20, paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No RFIDs to activate</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity style={styles.addButton} onPress={handleRFID}>
        <Text style={styles.addButtonText}>＋ Request RFID</Text>
      </TouchableOpacity>
      {alertComponent}
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: pallette.white },
  card: {
    backgroundColor: pallette.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: pallette.lightgrey,
    elevation: 3,
    shadowColor: pallette.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  rfidId: { fontWeight: "700", fontSize: 17, color: pallette.primary },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "transparent",
  },
  statusText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  infoText: { fontSize: 14, color: pallette.black, marginBottom: 6, lineHeight: 20 },
  activateButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: pallette.primary,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    zIndex: 10,
  },
  activateButtonText: { fontWeight: "600", color: pallette.white, fontSize: 15 },
  addButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: pallette.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    elevation: 4,
    shadowColor: pallette.black,
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  addButtonText: { color: pallette.white, fontSize: 16, fontWeight: "700" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 60 },
  emptyText: { fontSize: 16, fontWeight: "600", color: pallette.grey },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
});

export default RequestRFIDScreen;
