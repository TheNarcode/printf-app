import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { BackHandler, FlatList, Pressable, RefreshControl, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { CustomAlertAPI } from '../components/CustomAlert';
import { Search, ListFilter, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { usePrintJob } from '../context/PrintJobContext';
import { useRefreshOrders } from '../hooks/useRefreshOrders';
import Header from '../components/Header';
import OrderCard from '../components/OrderCard';
import { EmptyState } from '../components/EmptyState';
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
  { key: 'failed', label: 'Failed' },
];

const VALID_FILTERS: Filter[] = ['payment_pending', 'in_progress', 'completed', 'failed', 'collected'];
const parseFilterParam = (f?: string): Filter[] => (VALID_FILTERS.includes(f as Filter) ? [f as Filter] : ['all']);

const OrderSeparator = () => <View style={{ height: scale(8) }} />;

export default function AllOrdersScreen({ navigation, route }: Props) {
  const { colors, commonStyles } = useTheme();
  const insets = useSafeAreaInsets();
  const { orders } = usePrintJob();
  const { isRefreshing, handleRefresh } = useRefreshOrders();

  const filterParam = route?.params?.filter;
  const [selectedFilters, setSelectedFilters] = useState<Filter[]>(() => parseFilterParam(filterParam));
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => { setSelectedFilters(parseFilterParam(filterParam)); }, [filterParam]);

  useEffect(() => {
    if (!showDropdown) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setShowDropdown(false);
      return true;
    });
    return () => subscription.remove();
  }, [showDropdown]);

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
      result = result.filter(o => (o.orderRef || o.id.slice(0, 5)).toLowerCase().includes(q) || o.files.some(f => f.file.name.toLowerCase().includes(q)));
    }
    return result;
  }, [orders, selectedFilters, search]);

  const renderOrder = useCallback(
    ({ item }: { item: Order }) => <OrderCard order={item} onPress={o => navigation.navigate('OrderDetail', { orderId: o.id })} />,
    [navigation],
  );

  return (
    <View style={commonStyles.screenContainer}>
      {showDropdown && <Pressable style={[StyleSheet.absoluteFill, { zIndex: 50 }]} onPress={() => setShowDropdown(false)} />}
      <Header title="All Orders" showBack onBack={useCallback(() => navigation.goBack(), [navigation])} />

      <View style={styles.headerSection}>
        <Text weight="bold" style={[styles.headerTitle, { color: colors.text }]}>Manage and track orders</Text>

        <View style={styles.filterRow}>
          <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Search size={moderateScale(16)} color={colors.textMuted} strokeWidth={2} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search by file name or order ID..."
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity style={[styles.filterBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => setShowDropdown(!showDropdown)} activeOpacity={0.7}>
            <ListFilter size={moderateScale(16)} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>

          {showDropdown && (
            <View style={[styles.dropdownPopover, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {FILTERS.map(f => {
                const isSelected = selectedFilters.includes(f.key);
                return (
                  <TouchableOpacity key={f.key} style={styles.dropdownItem} onPress={() => { toggleFilter(f.key); setShowDropdown(false); }} activeOpacity={0.7}>
                    <View style={[styles.checkbox, { borderColor: colors.border }, isSelected && { backgroundColor: colors.text, borderColor: colors.text }]}>
                      {isSelected && <Check size={moderateScale(12)} color={colors.background} strokeWidth={3} />}
                    </View>
                    <Text weight={isSelected ? 'bold' : 'medium'} style={[styles.dropdownItemText, { color: colors.text }]}>{f.label}</Text>
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
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + scale(32) }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.textMuted} colors={[colors.primary]} progressBackgroundColor={colors.card} />}
        ItemSeparatorComponent={OrderSeparator}
        ListEmptyComponent={<EmptyState title="No orders found" description="Try adjusting your search or filters." />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerSection: { paddingHorizontal: scale(20), paddingTop: scale(24), marginBottom: scale(20), zIndex: 10 },
  headerTitle: { fontSize: moderateScale(26), marginBottom: scale(14) },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: scale(8), position: 'relative', zIndex: 10 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: scale(8), borderWidth: 1, borderRadius: scale(8), paddingHorizontal: scale(12), height: scale(42) },
  searchInput: { flex: 1, fontSize: moderateScale(14), padding: 0 },
  filterBtn: { width: scale(42), height: scale(42), borderRadius: scale(8), borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  dropdownPopover: { position: 'absolute', top: scale(48), right: 0, width: scale(190), borderRadius: scale(12), borderWidth: 1, paddingVertical: scale(6), zIndex: 100, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10 },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', gap: scale(10), paddingVertical: scale(10), paddingHorizontal: scale(14) },
  checkbox: { width: scale(16), height: scale(16), borderRadius: scale(4), borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  dropdownItemText: { fontSize: moderateScale(14) },
  listContent: { paddingHorizontal: scale(20) },
});