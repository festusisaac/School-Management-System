import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Alert } from '../../utils/alert';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import withObservables from '@nozbe/with-observables';
import AccountingLayout from '../../components/AccountingLayout';
import Dropdown, { DropdownOption } from '../../components/Dropdown';
import DateTimeField from '../../components/DateTimeField';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useSectionStore } from '../../store/sectionStore';
import { apiGet } from '../../services/api';
import { database } from '../../database';
import Expense from '../../database/models/Expense';
import { performGlobalSync } from '../../hooks/useAutoSync';

const COLORS = {
  surface: '#f7f9fb',
  surfaceContainerLowest: '#ffffff',
  onSurface: '#191c1e',
  outline: '#c5c6ce',
  primary: '#031632',
  secondary: '#055db6',
  expense: '#d97706',
};

const PAYMENT_METHODS = [
  { label: 'Bank Transfer', value: 'BANK_TRANSFER' },
  { label: 'Cash', value: 'CASH' },
  { label: 'Cheque', value: 'CHEQUE' },
  { label: 'POS', value: 'POS' },
];

const CATS_CACHE = 'expense_categories_cache';
const VENDORS_CACHE = 'expense_vendors_cache';

interface Props {
  expenses: Expense[];
}

function ExpensesScreenBase({ expenses }: Props) {
  const { user } = useAuthStore();
  const { settings } = useSettingsStore();
  const activeSectionId = useSectionStore((s) => s.activeSectionId);
  const token = user?.token || '';
  const currency = settings?.currencySymbol || '₦';
  const money = (n: any) => `${currency}${Number(n || 0).toLocaleString()}`;

  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Section-scoped, newest first.
  const scoped = useMemo(() => {
    const list = expenses.filter((e) => !activeSectionId || e.schoolSectionId === activeSectionId);
    return list.sort((a, b) => {
      const da = new Date(a.expenseDate || (a.createdAt as any)).getTime();
      const db = new Date(b.expenseDate || (b.createdAt as any)).getTime();
      return db - da;
    });
  }, [expenses, activeSectionId]);

  const totalSpent = scoped.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await performGlobalSync().catch(() => {});
    setRefreshing(false);
  }, []);

  const fmt = (d?: string | Date) => {
    if (!d) return '';
    const date = new Date(d);
    return isNaN(date.getTime()) ? '' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderItem = ({ item }: { item: Expense }) => (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Ionicons name="wallet" size={20} color={COLORS.expense} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardName} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.cardMeta} numberOfLines={1}>
          {(item.categoryName || 'Uncategorized')}
          {item.vendorName ? ` • ${item.vendorName}` : ''} • {fmt(item.expenseDate || (item.createdAt as any))}
        </Text>
      </View>
      <Text style={styles.cardAmount}>-{money(item.amount)}</Text>
    </View>
  );

  return (
    <AccountingLayout activeTab="Expenses">
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Expenses</Text>
            <Text style={styles.subtitle}>Total: {money(totalSpent)}</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalOpen(true)}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addBtnText}>New</Text>
          </TouchableOpacity>
        </View>

        {scoped.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="wallet-outline" size={44} color="#94a3b8" />
            <Text style={styles.emptyText}>No expenses recorded yet.</Text>
          </View>
        ) : (
          <FlatList
            data={scoped}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 24, gap: 10 }}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          />
        )}
      </View>

      <ExpenseForm
        visible={modalOpen}
        token={token}
        tenantId={user?.tenantId || ''}
        sectionId={activeSectionId}
        onClose={() => setModalOpen(false)}
        onSuccess={() => setModalOpen(false)}
      />
    </AccountingLayout>
  );
}

interface FormProps {
  visible: boolean;
  token: string;
  tenantId: string;
  sectionId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function ExpenseForm({ visible, token, tenantId, sectionId, onClose, onSuccess }: FormProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [method, setMethod] = useState('BANK_TRANSFER');
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date | null>(new Date());

  // Load categories/vendors: refresh from API when online (and cache), else use cache.
  useEffect(() => {
    if (!visible) return;
    setTitle('');
    setAmount('');
    setCategoryId('');
    setVendorId('');
    setMethod('BANK_TRANSFER');
    setReference('');
    setDescription('');
    setDate(new Date());

    (async () => {
      const [cc, vc] = await Promise.all([AsyncStorage.getItem(CATS_CACHE), AsyncStorage.getItem(VENDORS_CACHE)]);
      if (cc) setCategories(JSON.parse(cc));
      if (vc) setVendors(JSON.parse(vc));
      if (token) {
        try {
          const [c, v] = await Promise.all([apiGet('/expenses/categories', token), apiGet('/expenses/vendors', token)]);
          const cats = Array.isArray(c) ? c : c?.data || [];
          const vens = Array.isArray(v) ? v : v?.data || [];
          setCategories(cats);
          setVendors(vens);
          AsyncStorage.setItem(CATS_CACHE, JSON.stringify(cats)).catch(() => {});
          AsyncStorage.setItem(VENDORS_CACHE, JSON.stringify(vens)).catch(() => {});
        } catch {
          // offline — keep cached values
        }
      }
    })();
  }, [visible, token]);

  const handleSubmit = async () => {
    if (!title.trim()) return Alert.alert('Missing title', 'Enter an expense title.');
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return Alert.alert('Invalid amount', 'Enter a valid amount.');
    if (!categoryId) return Alert.alert('Missing category', 'Select a category.');

    const catName = categories.find((c) => c.id === categoryId)?.name;
    const venName = vendors.find((v) => v.id === vendorId)?.name;
    const dateStr = (date || new Date()).toISOString().slice(0, 10);

    setSaving(true);
    try {
      // Offline-first: write to the local DB. WatermelonDB queues it and the
      // sync engine pushes it to the backend automatically when online.
      await database.write(async () => {
        await database.collections.get<Expense>('expenses').create((rec) => {
          rec.tenantId = tenantId;
          rec.title = title.trim();
          rec.amount = amt;
          rec.description = description.trim() || undefined;
          rec.expenseDate = dateStr;
          rec.status = 'PENDING';
          rec.paymentMethod = method;
          rec.categoryId = categoryId;
          rec.vendorId = vendorId || undefined;
          rec.categoryName = catName || undefined;
          rec.vendorName = venName || undefined;
          rec.referenceNumber = reference.trim() || undefined;
          rec.schoolSectionId = sectionId || undefined;
        });
      });
      performGlobalSync();
      onSuccess();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to record expense.');
    } finally {
      setSaving(false);
    }
  };

  const catOptions: DropdownOption[] = categories.map((c) => ({ label: c.name, value: c.id }));
  const vendorOptions: DropdownOption[] = vendors.map((v) => ({ label: v.name, value: v.id }));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modalRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Record Expense</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.onSurface} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>Title *</Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. Diesel for generator" placeholderTextColor="#94a3b8" />

            <Text style={styles.fieldLabel}>Amount *</Text>
            <TextInput style={styles.input} value={amount} onChangeText={setAmount} placeholder="0.00" placeholderTextColor="#94a3b8" keyboardType="numeric" />

            <Dropdown label="Category *" placeholder="Select category" value={categoryId} options={catOptions} onChange={setCategoryId} />
            <Dropdown label="Vendor (optional)" placeholder="Select vendor" value={vendorId} options={vendorOptions} onChange={setVendorId} />

            <Text style={styles.fieldLabel}>Payment Method</Text>
            <View style={styles.segment}>
              {PAYMENT_METHODS.map((m) => {
                const active = method === m.value;
                return (
                  <TouchableOpacity key={m.value} style={[styles.segBtn, active && styles.segBtnActive]} onPress={() => setMethod(m.value)}>
                    <Text style={[styles.segText, active && styles.segTextActive]}>{m.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <DateTimeField label="Date" mode="date" value={date} onChange={setDate} placeholder="Pick a date" />

            <Text style={styles.fieldLabel}>Reference (optional)</Text>
            <TextInput style={styles.input} value={reference} onChangeText={setReference} placeholder="Cheque no / txn ref" placeholderTextColor="#94a3b8" />

            <Text style={styles.fieldLabel}>Description (optional)</Text>
            <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Notes..." placeholderTextColor="#94a3b8" multiline />

            <TouchableOpacity style={[styles.submitBtn, saving && { opacity: 0.7 }]} onPress={handleSubmit} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />}
              <Text style={styles.submitText}>{saving ? 'Saving...' : 'Save Expense'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const EnhancedExpensesScreen = withObservables([], () => ({
  expenses: database.collections.get<Expense>('expenses').query().observe(),
}))(ExpensesScreenBase);

export default EnhancedExpensesScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.onSurface, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.secondary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.surfaceContainerLowest, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#f1f5f9' },
  avatar: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center' },
  cardName: { fontSize: 15, fontWeight: '700', color: COLORS.onSurface },
  cardMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  cardAmount: { fontSize: 15, fontWeight: '800', color: COLORS.expense },
  emptyCard: { backgroundColor: COLORS.surfaceContainerLowest, borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9', marginTop: 8, gap: 10 },
  emptyText: { fontSize: 14, color: '#64748b', textAlign: 'center' },

  modalRoot: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: COLORS.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '92%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: COLORS.onSurface },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: { backgroundColor: COLORS.surfaceContainerLowest, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.onSurface, marginBottom: 12 },
  textArea: { minHeight: 70, textAlignVertical: 'top' },
  segment: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  segBtn: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: COLORS.surfaceContainerLowest },
  segBtnActive: { backgroundColor: '#eff6ff', borderColor: COLORS.secondary },
  segText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  segTextActive: { color: COLORS.secondary },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.secondary, paddingVertical: 15, borderRadius: 12, marginTop: 8, marginBottom: 24 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
