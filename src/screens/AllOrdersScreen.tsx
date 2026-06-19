import React, {useCallback, useMemo, useState} from 'react';
import {FlatList, RefreshControl, StyleSheet, TextInput, TouchableOpacity, View} from 'react-native';
import {Search} from 'lucide-react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../theme/ThemeContext';
import {usePrintJob} from '../context/PrintJobContext';
import Header from '../components/Header';
import OrderCard from '../components/OrderCard';
import type {Order} from '../types';
import {Text} from '../components/Text';
import {scale, moderateScale} from '../utils/responsive';

interface Props {
  navigation: any;
  route?: {params?: {filter?: string}};
}

type Filter = 'all' | 'pending' | 'completed' | 'failed';

const FILTERS: {key: Filter; label: string}[] = [
  {key: 'all', label: 'All'},
  {key: 'pending', label: 'Pending'},
  {key: 'completed', label: 'Completed'},
  {key: 'failed', label: 'Cancelled'},
];

export default function AllOrdersScreen({navigation, route}: Props) {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const {orders, refreshOrders} = usePrintJob();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshOrders();
    } finally {
      setRefreshing(false);
    }
  }, [refreshOrders]);

  const initialFilter = useMemo(() => {
    const f = route?.params?.filter;
    if (f === 'inProgress' || f === 'pending') return 'pending';
    if (f === 'completed') return 'completed';
    if (f === 'failed') return 'failed';
    return 'all';
  }, [route?.params?.filter]);

  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [search, setSearch] = useState('');

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (filter !== 'all') {
      if (filter === 'pending') {
        result = result.filter(o => o.status === 0);
      } else if (filter === 'completed') {
        result = result.filter(o => o.status === 2);
      } else if (filter === 'failed') {
        result = result.filter(o => o.status === 1);
      }
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(o =>
        o.orderRef.toLowerCase().includes(q) ||
        o.files.some(f => f.file.name.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [orders, filter, search]);

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);
  const handleOrderPress = useCallback((order: Order) => {
    navigation.navigate('OrderDetail', {orderId: order.id});
  }, [navigation]);

  const renderOrder = useCallback(
    ({item}: {item: Order}) => <OrderCard order={item} onPress={handleOrderPress} variant="list" />,
    [handleOrderPress],
  );

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Header title="Orders" showBack onBack={handleBack} />

      <View style={styles.headerSection}>
        <Text style={[styles.headerTitle, {color: colors.text}]}>Orders</Text>
        <Text style={[styles.headerSubtitle, {color: colors.textSecondary}]}>Manage and track your print jobs.</Text>

        <View style={[styles.searchBox, {backgroundColor: colors.surface, borderColor: colors.border}]}>
          <Search size={moderateScale(16)} color={colors.textMuted} strokeWidth={2} />
          <TextInput
            style={[styles.searchInput, {color: colors.text}]}
            placeholder="Search orders by ID or file name..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.filterRow}>
          {FILTERS.map(f => {
            const active = filter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={[
                  styles.filterChip,
                  {borderColor: colors.border},
                  active && {backgroundColor: colors.primary, borderColor: colors.primary},
                ]}>
                <Text style={[
                  styles.filterText, {color: colors.textSecondary},
                  active && {color: colors.background, fontFamily: 'Geist-Bold'},
                ]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={item => item.id}
        renderItem={renderOrder}
        contentContainerStyle={[styles.listContent, {paddingBottom: insets.bottom + scale(32)}]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.textMuted}
            colors={[colors.primary]}
            progressBackgroundColor={colors.card}
          />
        }
        ItemSeparatorComponent={() => <View style={{height: scale(10)}} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, {color: colors.textMuted}]}>No orders found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  headerSection: {paddingHorizontal: scale(20), marginBottom: scale(14)},
  headerTitle: {fontSize: moderateScale(26), fontFamily: 'Geist-Bold', marginBottom: scale(3)},
  headerSubtitle: {fontSize: moderateScale(14), marginBottom: scale(20)},
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: scale(8),
    borderWidth: 1, borderRadius: scale(8), paddingHorizontal: scale(12), paddingVertical: scale(9),
    marginBottom: scale(14),
  },
  searchInput: {flex: 1, fontSize: moderateScale(14), padding: 0, fontFamily: 'Geist-Regular'},
  filterRow: {flexDirection: 'row', gap: scale(6), flexWrap: 'wrap'},
  filterChip: {
    paddingVertical: scale(7), paddingHorizontal: scale(14),
    borderRadius: scale(100), borderWidth: 1,
  },
  filterText: {fontSize: moderateScale(12), fontFamily: 'Geist-Medium'},
  listContent: {paddingHorizontal: scale(20)},
  emptyState: {paddingVertical: scale(48), alignItems: 'center'},
  emptyText: {fontSize: moderateScale(14)},
});
