import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { pallette } from '../../utils/pallette';
import { regular, semibold, bold } from '../../utils/fonts';
import { h, w } from '../../constants/dimensions';
import strings from '../../utils/strings';
import { useAuth } from '../../hooks/useAuth';
import { useGetWalletQuery } from '../../redux/api/baseApi';
import AlertMessage from '../../extra/alertmessage';

// Types
export interface Transaction {
  id: string;
  title: string;
  date: string;
  time: string;
  amount: string;
  isCredit: boolean;
  originalData?: any;
}

interface WalletData {
  id: number;
  accountBalance: number;
  currencyType: string | null;
  currencySymbol: string | null;
}

// PERF-4: memoized row for long transaction lists
export const TransactionItem: React.FC<{ item: Transaction }> = React.memo(({ item }) => (
  <View style={styles.transactionCard}>
    <View style={styles.transactionInfo}>
      <Text style={styles.transactionTitle}>{item.originalData?.comment}</Text>
      <Text style={styles.transactionDate}>
        {item.date} | {item.time}
      </Text>
    </View>
    <View style={styles.amountContainer}>
      <Text style={[styles.transactionAmount, item.isCredit ? styles.credit : styles.debit]}>
        {item.amount}
      </Text>
    </View>
  </View>
));

const WalletAndTransactions: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  // STATE-1: auth from Redux via useAuth
  const { userId } = useAuth();
  // STATE-2: wallet via RTK Query (cache + dedup + background refetch)
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetWalletQuery(userId as string, {
    skip: !userId,
    refetchOnFocus: true,
    refetchOnMountOrArgChange: 30,
  });

  const [alertComponent, setAlertComponent] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const walletData: WalletData | null = data?.wallet ?? null;
  const allTransactions: Transaction[] = useMemo(
    () => (data?.transactions as Transaction[]) || [],
    [data?.transactions],
  );
  const transactions = useMemo(() => allTransactions.slice(0, 5), [allTransactions]);

  // Refresh when route params change (from TopUpWallet)
  React.useEffect(() => {
    if (route.params?.refresh || route.params?.timestamp) {
      refetch();
      navigation.setParams({ refresh: false });
    }
  }, [route.params?.refresh, route.params?.timestamp, refetch, navigation]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

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

  const handleAddMoney = () => {
    navigation.navigate(strings.addmoney, {
      onGoBack: () => refetch(),
    });
  };

  const handleViewAllTransactions = () => {
    navigation.navigate(strings.recenttransactions, {
      transactions: allTransactions,
      onGoBack: () => refetch(),
    });
  };

  const loading = isLoading || (!data && isFetching);
  const errorMessage =
    isError
      ? (error as any)?.error || (error as any)?.data || 'Failed to load wallet data'
      : null;

  return (
    <View style={styles.container}>
      {/* Balance Section */}
      <LinearGradient
        start={{ x: 0, y: 0 }}
        style={styles.balanceGradient}
        colors={[pallette.l1, pallette.l2, pallette.l3, pallette.l4, pallette.l5]}>
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceText}>Balance</Text>
            <TouchableOpacity style={styles.rfidButton} onPress={handleRFID}>
              <Text style={styles.rfidText}>Request RFID</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.amountText}>
            {walletData ? `₹ ${Number(walletData.accountBalance || 0).toFixed(2)}` : '₹ 0.00'}
          </Text>
          <View style={styles.row}>
            <TouchableOpacity style={styles.addMoneyButton} onPress={handleAddMoney} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color={pallette.primary} />
              ) : (
                <Text style={styles.addMoneyText}>Add Money</Text>
              )}
            </TouchableOpacity>
            <Text style={styles.poweredBy}>Powered by {'\n'} Razorpay</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Recent Transactions Header */}
      <View style={styles.transactionHeader}>
        <Text style={styles.transactionTitleText}>Recent Transactions</Text>
        <TouchableOpacity onPress={handleViewAllTransactions}>
          <Text style={styles.viewAllText}>View All →</Text>
        </TouchableOpacity>
      </View>

      {/* Transactions List */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color={pallette.primary} />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{String(errorMessage)}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <TransactionItem item={item} />}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[pallette.primary]}
              tintColor={pallette.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No transactions found</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
                <Text style={styles.retryButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
      {alertComponent}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: pallette.white,
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  balanceGradient: {
    borderRadius: w * 0.03,
  },
  balanceCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
  },
  balanceText: {
    color: pallette.white,
    fontSize: 16,
    fontFamily: regular,
  },
  amountText: {
    color: pallette.white,
    fontSize: 28,
    fontFamily: bold,
    marginVertical: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
  },
  addMoneyButton: {
    backgroundColor: pallette.white,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
    minWidth: 100,
    minHeight: 40,
    justifyContent: 'center',
  },
  addMoneyText: {
    color: pallette.primary,
    fontSize: 16,
    fontFamily: semibold,
    textAlign: 'center',
  },
  poweredBy: {
    color: pallette.white,
    fontSize: 16,
    marginTop: 10,
    opacity: 0.8,
    textAlign: 'right',
    fontFamily: regular,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: h * 0.02,
  },
  transactionTitleText: {
    fontSize: 18,
    fontFamily: semibold,
    color: pallette.black,
  },
  viewAllText: {
    fontSize: 14,
    color: pallette.primary,
    fontFamily: bold,
  },
  listContainer: {
    paddingBottom: 16,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: pallette.white,
    padding: 14,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: pallette.mediumgrey,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontFamily: semibold,
    color: pallette.black,
  },
  transactionDate: {
    fontSize: 12,
    color: pallette.grey,
    marginTop: 4,
    fontFamily: regular,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionAmount: {
    fontSize: 16,
    fontFamily: semibold,
    paddingEnd: 20,
  },
  credit: {
    color: pallette.primary,
  },
  debit: {
    color: pallette.red,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: pallette.grey,
    textAlign: 'center',
    fontFamily: regular,
  },
  errorText: {
    fontSize: 16,
    color: pallette.red,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: regular,
  },
  retryButton: {
    backgroundColor: pallette.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: pallette.white,
    fontSize: 16,
    fontFamily: semibold,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rfidButton: {
    backgroundColor: pallette.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  rfidText: {
    color: pallette.primary,
    fontSize: 12,
    fontFamily: semibold,
  },
  emptyText: {
    fontSize: 16,
    color: pallette.grey,
    fontFamily: regular,
  },
});

export default WalletAndTransactions;
