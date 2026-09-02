import { FlatList, StyleSheet, Text, View } from 'react-native';
import React, { useCallback } from 'react';
import Header from '../../components/header-with-skip';
import { TransactionItem, Transaction } from './wallet-card-and-transactions';
import { useNavigation, useRoute } from '@react-navigation/native';

const TX_ROW_HEIGHT = 72;

const RecentTransactions = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { transactions = [] } = (route.params as { transactions?: Transaction[] }) || {};

  const renderItem = useCallback(
    ({ item }: { item: Transaction }) => <TransactionItem item={item} />,
    [],
  );

  const keyExtractor = useCallback((item: Transaction, index: number) => item.id || `tx-${index}`, []);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: TX_ROW_HEIGHT,
      offset: TX_ROW_HEIGHT * index,
      index,
    }),
    [],
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', paddingTop: 20 }}>
      <Header
        onback={() => navigation.goBack()}
        active={1}
        onSkip={() => {}}
        skippable={false}
        hastitle={true}
        title={'Recent Transactions'}
      />

      <FlatList
        data={transactions}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={7}
        removeClippedSubviews
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', padding: 20 }}>
            <Text>No transactions found</Text>
          </View>
        }
      />
    </View>
  );
};

export default RecentTransactions;

const styles = StyleSheet.create({
  listContainer: {
    padding: 16
    
  },
});