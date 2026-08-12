import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

const COLORS = {
  surfaceContainerLowest: '#ffffff',
  onSurface: '#191c1e',
  outline: '#c5c6ce',
  secondary: '#055db6',
};

interface DateTimeFieldProps {
  label?: string;
  value: Date | null;
  onChange: (date: Date) => void;
  placeholder?: string;
  minimumDate?: Date;
}

function formatDisplay(d: Date) {
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function DateTimeField({
  label,
  value,
  onChange,
  placeholder = 'Select date & time',
  minimumDate,
}: DateTimeFieldProps) {
  // Android shows date then time sequentially; iOS shows a datetime spinner in a modal.
  const [androidMode, setAndroidMode] = useState<'date' | 'time' | null>(null);
  const [iosOpen, setIosOpen] = useState(false);
  const [temp, setTemp] = useState<Date>(value || new Date());

  const openPicker = () => {
    setTemp(value || new Date());
    if (Platform.OS === 'android') {
      setAndroidMode('date');
    } else {
      setIosOpen(true);
    }
  };

  const onAndroidChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (event.type === 'dismissed' || !selected) {
      setAndroidMode(null);
      return;
    }
    if (androidMode === 'date') {
      // Keep the chosen date, carry over previous time, then ask for time
      const next = new Date(temp);
      next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      setTemp(next);
      setAndroidMode('time');
    } else {
      const next = new Date(temp);
      next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      setAndroidMode(null);
      onChange(next);
    }
  };

  const onIosChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (selected) setTemp(selected);
  };

  const confirmIos = () => {
    setIosOpen(false);
    onChange(temp);
  };

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity style={styles.control} onPress={openPicker} activeOpacity={0.7}>
        <Text style={[styles.controlText, !value && styles.placeholder]} numberOfLines={1}>
          {value ? formatDisplay(value) : placeholder}
        </Text>
        <Ionicons name="calendar-outline" size={18} color={COLORS.outline} />
      </TouchableOpacity>

      {/* Android: imperative sequential pickers */}
      {Platform.OS === 'android' && androidMode && (
        <DateTimePicker
          value={temp}
          mode={androidMode}
          is24Hour={false}
          display="default"
          minimumDate={androidMode === 'date' ? minimumDate : undefined}
          onChange={onAndroidChange}
        />
      )}

      {/* iOS: datetime spinner inside a modal with a Done button */}
      {Platform.OS === 'ios' && (
        <Modal visible={iosOpen} transparent animationType="fade" onRequestClose={() => setIosOpen(false)}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setIosOpen(false)}>
            <View style={styles.iosSheet}>
              <View style={styles.iosHeader}>
                <TouchableOpacity onPress={() => setIosOpen(false)}>
                  <Text style={styles.iosCancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.iosTitle}>{label || 'Select date & time'}</Text>
                <TouchableOpacity onPress={confirmIos}>
                  <Text style={styles.iosDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={temp}
                mode="datetime"
                display="spinner"
                minimumDate={minimumDate}
                onChange={onIosChange}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  controlText: { fontSize: 14, color: COLORS.onSurface, fontWeight: '500', flex: 1, marginRight: 8 },
  placeholder: { color: '#94a3b8', fontWeight: '400' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  iosSheet: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
  },
  iosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  iosTitle: { fontSize: 15, fontWeight: '700', color: COLORS.onSurface },
  iosCancel: { fontSize: 15, color: '#64748b' },
  iosDone: { fontSize: 15, color: COLORS.secondary, fontWeight: '700' },
});
