import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CustomAlertAPI } from '../components/CustomAlert';
import { Search, ListFilter, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { usePrintJob } from '../context/PrintJobContext';
import Header from '../components/Header';
import OrderCard from '../components/OrderCard';
import type { Order } from '../types';
import { Text } from '../components/Text';
import { scale, moderateScale } from '../utils/responsive';

interface Props {
  navigation: any;
  route?: { params?: { filter?: string } };
}

type Filter = 'all' | 'in_progress' | 'payment_pending' | 'completed' | 'collected' | 'failed';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All orders' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'payment_pending', label: 'Payment pending' },
  { key: 'completed', label: 'Completed' },
  { key: 'collected', label: 'Collected' },
  { key: 'failed', label: 'Failed' }
];

function OrderSeparator() {
  return <View style={{ height: scale(10) }} />;
}

export default function AllOrdersScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { orders, refreshOrders } = usePrintJob();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshOrders();
    } catch {
      CustomAlertAPI.alert(
        'Connection Error',
        'Unable to connect right now. Please try again later.',
      );
    } finally {
      setRefreshing(false);
    }
  }, [refreshOrders]);

  const initialFilter = useMemo(() => {
    const f = route?.params?.filter;
    if (f === 'payment_pending') return ['payment_pending'] as Filter[];
    if (f === 'in_progress') return ['in_progress'] as Filter[];
    if (f === 'completed') return ['completed'] as Filter[];
    if (f === 'failed') return ['failed'] as Filter[];
    if (f === 'collected') return ['collected'] as Filter[];
    return ['all'] as Filter[];
  }, [route?.params?.filter]);

  const [selectedFilters, setSelectedFilters] = useState<Filter[]>(initialFilter);
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Sync with nav params
  useEffect(() => {
    const f = route?.params?.filter;
    if (f === 'payment_pending') setSelectedFilters(['payment_pending']);
    else if (f === 'in_progress') setSelectedFilters(['in_progress']);
    else if (f === 'completed') setSelectedFilters(['completed']);
    else if (f === 'failed') setSelectedFilters(['failed']);
    else if (f === 'collected') setSelectedFilters(['collected']);
    else setSelectedFilters(['all']);
  }, [route?.params?.filter]);

  const toggleFilter = useCallback((f: Filter) => {
    setSelectedFilters(prev => {
      if (f === 'all') return ['all'];
      const next = prev.filter(x => x !== 'all');
      if (next.includes(f)) {
        const removed = next.filter(x => x !== f);
        return removed.length === 0 ? ['all'] : removed;
      }
      return [...next, f];
    });
  }, []);

  const filteredOrders = useMemo(() => {
    let result = orders;
    
    if (!selectedFilters.includes('all')) {
      result = result.filter(o => {
        if (selectedFilters.includes('payment_pending') && !o.paid) return true;
        if (selectedFilters.includes('in_progress') && o.status === 0 && o.paid) return true;
        if (selectedFilters.includes('completed') && o.status === 1) return true;
        if (selectedFilters.includes('failed') && o.status === 2) return true;
        if (selectedFilters.includes('collected') && o.status === 3) return true;
        return false;
      });
    }
    
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(o => {
        const displayId = (o.orderRef || o.id.slice(0, 5)).toLowerCase();
        if (displayId.includes(q)) return true;
        return o.files.some(f => f.file.name.toLowerCase().includes(q));
      });
    }
    return result;
  }, [orders, selectedFilters, search]);

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);
  const handleOrderPress = useCallback(
    (order: Order & { _payNowTrigger?: boolean }) => {
      navigation.navigate('OrderDetail', { orderId: order.id, _payNowTrigger: order._payNowTrigger });
    },
    [navigation],
  );

  const renderOrder = useCallback(
    ({ item }: { item: Order }) => (
      <OrderCard order={item} onPress={handleOrderPress} variant="list" />
    ),
    [handleOrderPress],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {showDropdown && (
        <Pressable 
          style={[StyleSheet.absoluteFill, { zIndex: 5 }]} 
          onPress={() => setShowDropdown(false)} 
        />
      )}
      <Header title="All Orders" showBack onBack={handleBack} />

      <View style={[styles.headerSection, { zIndex: 10 }]}>
        <Text style={[styles.headerTitle, { color: colors.text, marginBottom: scale(14) }]}>Manage and track orders</Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(8), marginBottom: scale(14), zIndex: 10 }}>
          <View
            style={[
              styles.searchBox,
              { backgroundColor: colors.surface, borderColor: colors.border, flex: 1, marginBottom: 0 },
            ]}
          >
            <Search
              size={moderateScale(16)}
              color={colors.textMuted}
              strokeWidth={2}
            />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search by file name or order ID..."
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
            />
          </View>
          <TouchableOpacity
            style={[
              styles.filterBtn,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => setShowDropdown(!showDropdown)}
            activeOpacity={0.7}
          >
            <ListFilter size={moderateScale(18)} color={!selectedFilters.includes('all') ? colors.primary : colors.text} />
          </TouchableOpacity>
          
          {showDropdown && (
            <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.text }]}>
              {FILTERS.map(f => {
                const active = selectedFilters.includes(f.key);
                return (
                  <TouchableOpacity
                    key={f.key}
                    style={styles.dropdownItem}
                    onPress={() => toggleFilter(f.key)}
                  >
                    <View style={[styles.checkbox, { borderColor: colors.border }, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                      {active && <Check size={moderateScale(12)} color={colors.background} strokeWidth={3} />}
                    </View>
                    <Text style={[styles.dropdownItemText, { color: colors.text }]}>{f.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={item => item.id}
        renderItem={renderOrder}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + scale(32) },
        ]}
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
        ItemSeparatorComponent={OrderSeparator}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No orders found
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerSection: { paddingHorizontal: scale(20), paddingTop: scale(24), marginBottom: scale(14) },
  headerTitle: {
    fontSize: moderateScale(26),
    fontFamily: 'Geist-Bold',
    marginBottom: scale(3),
  },
  headerSubtitle: { fontSize: moderateScale(14), marginBottom: scale(20) },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    borderWidth: 1,
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    height: scale(42),
    marginBottom: scale(14),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(14),
    padding: 0,
    fontFamily: 'Geist-Regular',
  },
  filterBtn: {
    width: scale(42),
    height: scale(42),
    borderRadius: scale(8),
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdown: {
    position: 'absolute',
    top: scale(50),
    right: 0,
    width: scale(180),
    borderRadius: scale(10),
    borderWidth: 1,
    paddingVertical: scale(6),
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    paddingVertical: scale(10),
    paddingHorizontal: scale(14),
  },
  checkbox: {
    width: scale(16),
    height: scale(16),
    borderRadius: scale(4),
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownItemText: {
    fontSize: moderateScale(14),
    fontFamily: 'Geist-Medium',
  },
  listContent: { paddingHorizontal: scale(20) },
  emptyState: { paddingVertical: scale(48), alignItems: 'center' },
  emptyText: { fontSize: moderateScale(14) },
});
