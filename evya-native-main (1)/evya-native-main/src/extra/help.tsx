import React, { useEffect, useState } from "react";
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
import axios from "axios";
import { pallette } from "../utils/pallette";
import NeedHelpPopup from "./NeedHelpScreen";
import { useNavigation } from "@react-navigation/native";
import Header from "../components/header-with-skip";
import Toast from 'react-native-toast-message';
import AlertMessage from "../extra/alertmessage";
import StationsService from "../axios/Apis";
import { useAuth } from "../hooks/useAuth";

interface Note {
  id: number;
  title: string;
  notes: string;
}

interface Ticket {
  id: number;
  ticketId: string;
  issue: string;
  category: string;
  email?: string;
  status: string;
  comment?: string | null;
  notes?: Note[] | null;
  createdDate?: string | null;
}

const HelpScreen: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTab, setActiveTab] = useState<"open" | "closed">("open");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [alertComponent, setAlertComponent] = useState<React.ReactNode>(null);
  const navigation = useNavigation();
  // STATE-1: auth from Redux
  const { userId } = useAuth();
  // Fetch tickets from backend
  const fetchTickets = async () => {
    try {
      if (!refreshing) setLoading(true);
      const res = await StationsService.getTickets(userId)
      console.log("Fetched tickets:", res.data);
      setTickets(res.data || []);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      Toast.show({
        type: 'error',
        text1: 'Failed to load tickets',
        text2: 'Please check your connection and try again',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Filter tickets based on tab
  const filteredTickets = tickets.filter(
    (t) =>
      t.status &&
      (activeTab === "open"
        ? t.status.toLowerCase() === "open"||t.status.toLowerCase() === "inprogress"
        : ["closed", "resolved"].includes(t.status.toLowerCase()))
  );
console.log(tickets);
  // Add new ticket
  const addTicket = async (ticketData: Partial<Ticket> & { type: string; userId: number }) => {
    try {
      setLoading(true);
      const res = await StationsService.createTicket(
        ticketData
      );
      Toast.show({
        type: 'success',
        text1: 'Ticket Created Successfully',
        text2: `Ticket #${res.data.ticketId} has been created`,
      });

      // Append new ticket to state so it shows immediately
      setTickets((prev) => [res.data, ...prev]);
    } catch (error: any) {
      console.error("Error creating ticket:", error.response || error);
      Toast.show({
        type: 'error',
        text1: 'Failed to Create Ticket',
        text2: error?.response?.data?.message || 'Please try again later',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle delete ticket
  const handleDeleteTicket = (ticket: Ticket) => {
    setAlertComponent(
      <AlertMessage
        message={`Delete Ticket #${ticket.ticketId}?`}
        showConfirm={true}
        onClose={async (confirmed: boolean) => {
          setAlertComponent(null);
          if (!confirmed) return;

          try {
            // Simulate delete API call
            await StationsService.deleteTicket(
              ticket.id
            );
            
            setTickets(prev => prev.filter(t => t.id !== ticket.id));
            
            Toast.show({
              type: 'success',
              text1: 'Ticket Deleted',
              text2: `Ticket #${ticket.ticketId} has been deleted`,
            });
          } catch (error) {
            Toast.show({
              type: 'error',
              text1: 'Delete Failed',
              text2: 'Failed to delete ticket. Please try again.',
            });
          }
        }}
      />
    );
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'open') return pallette.primary;
    if (statusLower === 'closed') return pallette.lightred;
    if (statusLower === 'resolved') return pallette.l2;
    if (statusLower === 'inprogress') return pallette.gold;
    return pallette.grey;
  };

  const getStatusText = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'open') return 'OPEN';
    if (statusLower === 'closed') return 'CLOSED';
    if (statusLower === 'resolved') return 'RESOLVED';
    if (statusLower === 'in progress') return 'IN PROGRESS';
    return status.toUpperCase();
  };

  const renderTicket = ({ item }: { item: Ticket }) => (
    <View style={styles.ticketCard}>
      <View style={styles.ticketHeader}>
        <View style={styles.ticketIdContainer}>
          <Text style={styles.ticketId}>#{item.ticketId}</Text>
          <Text style={styles.ticketCategory}>{item.category}</Text>
        </View>
        {/* <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => handleDeleteTicket(item)}
      >
        <Text style={styles.deleteButtonText}>Delete </Text>
      </TouchableOpacity> */}
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.ticketStatus, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
        </View>
        
      </View>
      
      <Text style={styles.ticketIssue}>{item.issue}</Text>
      
      {item.comment ? (
        <View style={styles.commentContainer}>
          <Text style={styles.commentLabel}>Description:</Text>
          <Text style={styles.comment}>💬 {item.comment}</Text>
        </View>
      ) : null}
      
      {item.notes?.length ? (
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Notes:</Text>
          {item.notes.map((n) => (
            <View key={n.id} style={styles.noteItem}>
              <Text style={styles.noteTitle}> {n.title}</Text>
              <Text style={styles.noteText}>{n.notes}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {item.createdDate && (
        <Text style={styles.createdDate}>
          Created: {new Date(item.createdDate).toLocaleDateString()}
        </Text>
      )}

      
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Header
        onback={() => navigation.goBack()}
        active={1}
        onSkip={() => {}}
        skippable={false}
        hastitle={true}
        title={'Help Center'}
      />

     

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "open" && styles.activeTab]}
          onPress={() => setActiveTab("open")}
        >
          <Text style={[styles.tabText, activeTab === "open" && styles.activeTabText]}>
            Open Issues
          </Text>
          {activeTab === "open" && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "closed" && styles.activeTab]}
          onPress={() => setActiveTab("closed")}
        >
          <Text style={[styles.tabText, activeTab === "closed" && styles.activeTabText]}>
            Closed / Resolved
          </Text>
          {activeTab === "closed" && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      {/* Ticket Count */}
      <View style={styles.ticketCountContainer}>
        <Text style={styles.ticketCountText}>
          {filteredTickets.length} {activeTab === "open" ? "open" : "closed"} tickets
        </Text>
      </View>

      {/* Ticket List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={pallette.primary} />
          <Text style={styles.loadingText}>Loading tickets...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTickets}
          keyExtractor={(item) => item.ticketId}
          renderItem={renderTicket}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchTickets();
              }}
              colors={[pallette.primary]}
              tintColor={pallette.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}></Text>
              <Text style={styles.emptyText}>
                No {activeTab === "open" ? "open" : "closed"} tickets
              </Text>
              <Text style={styles.emptySubText}>
                {activeTab === "open" 
                  ? "All your issues have been resolved!" 
                  : "No closed or resolved tickets yet"}
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
 {/* Add Ticket Button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => setPopupVisible(true)}
          disabled={loading}
        >
          <Text style={styles.addButtonText}>＋ Create Ticket</Text>
        </TouchableOpacity>
      </View>
      {/* NeedHelpPopup */}
      <NeedHelpPopup
        visible={popupVisible}
        onClose={() => setPopupVisible(false)}
        onSubmit={(ticketData) => {
          addTicket({
            ...ticketData,
            type: "Ticket",
            userId: userId,
            status: "Open",
            orgId: 1,
            priority: "High",
          });
          setPopupVisible(false);
        }}
      />

      {/* Alert Component */}
      {alertComponent}

      <Toast position="top" visibilityTime={4000} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: pallette.white, 
    paddingTop: 24,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: pallette.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: pallette.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addButtonText: {
    color: pallette.white,
    fontSize: 16,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: pallette.white,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 6,
    position: 'relative',
  },
  activeTab: {
    // backgroundColor: pallette.white,
    // elevation: 2,
    // shadowColor: pallette.black,
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabText: { 
    fontSize: 14, 
    color: pallette.grey,
    fontWeight: '500',
  },
  activeTabText: { 
    color: pallette.primary, 
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -4,
    width: '40%',
    height: 3,
    backgroundColor: pallette.primary,
    borderRadius: 2,
  },
  ticketCountContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  ticketCountText: {
    fontSize: 14,
    color: pallette.grey,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: pallette.grey,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  ticketCard: {
    backgroundColor: pallette.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: pallette.lightgrey,
    elevation: 2,
    shadowColor: pallette.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  ticketIdContainer: {
    flex: 1,
  },
  ticketId: { 
    fontWeight: "bold", 
    fontSize: 16,
    color: pallette.black,
    marginBottom: 4,
  },
  ticketCategory: { 
    fontSize: 14, 
    color: pallette.primary,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  ticketStatus: { 
    fontSize: 10, 
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  ticketIssue: { 
    fontSize: 14, 
    color: pallette.black,
    lineHeight: 20,
    marginBottom: 8,
  },
  commentContainer: {
    backgroundColor: pallette.lightprimary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  commentLabel: {
    fontSize: 12,
    color: pallette.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  comment: { 
    fontSize: 13, 
    color: pallette.black,
    lineHeight: 18,
  },
  notesContainer: { 
    marginBottom: 8,
  },
  notesLabel: {
    fontSize: 12,
    color: pallette.grey,
    fontWeight: '600',
    marginBottom: 6,
  },
  noteItem: {
    marginBottom: 6,
  },
  noteTitle: {
    fontSize: 13,
    color: pallette.black,
    fontWeight: '600',
    marginBottom: 2,
  },
  noteText: {
    fontSize: 13,
    color: pallette.grey,
    lineHeight: 16,
  },
  createdDate: {
    fontSize: 12,
    color: pallette.grey,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  deleteButton: {
    backgroundColor: pallette.lightred,
    paddingHorizontal:8,
    paddingVertical:3,
    borderRadius: 6,
    alignItems: 'center',
    marginEnd:6
  },
  deleteButtonText: {
    color: pallette.red,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: pallette.black,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubText: {
    fontSize: 14,
    color: pallette.grey,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default HelpScreen;