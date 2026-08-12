import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  surfaceContainerLowest: '#ffffff',
  onSurface: '#191c1e',
  outline: '#c5c6ce',
  primary: '#031632',
  secondary: '#055db6',
};

export interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownProps {
  label?: string;
  placeholder?: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function Dropdown({
  label,
  placeholder = 'Select...',
  value,
  options,
  onChange,
  disabled = false,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity
        style={[styles.control, disabled && styles.controlDisabled]}
        onPress={() => !disabled && setOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.controlText, !selected && styles.placeholder]} numberOfLines={1}>
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={COLORS.outline} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label || 'Select an option'}</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Ionicons name="close" size={22} color={COLORS.onSurface} />
              </TouchableOpacity>
            </View>
            {options.length === 0 ? (
              <Text style={styles.emptyText}>No options available</Text>
            ) : (
              <FlatList
                data={options}
                keyExtractor={(item, idx) => `${item.value}-${idx}`}
                style={{ maxHeight: 360 }}
                renderItem={({ item }) => {
                  const isActive = item.value === value;
                  return (
                    <TouchableOpacity
                      style={[styles.option, isActive && styles.optionActive]}
                      onPress={() => {
                        onChange(item.value);
                        setOpen(false);
                      }}
                    >
                      <Text style={[styles.optionText, isActive && styles.optionTextActive]}>
                        {item.label}
                      </Text>
                      {isActive && <Ionicons name="checkmark" size={18} color={COLORS.secondary} />}
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
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
  controlDisabled: {
    backgroundColor: '#f1f5f9',
    opacity: 0.7,
  },
  controlText: {
    fontSize: 14,
    color: COLORS.onSurface,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  placeholder: { color: '#94a3b8', fontWeight: '400' },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 32,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: COLORS.onSurface },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  optionActive: { backgroundColor: '#eff6ff' },
  optionText: { fontSize: 15, color: COLORS.onSurface },
  optionTextActive: { color: COLORS.secondary, fontWeight: '600' },
  emptyText: { textAlign: 'center', color: '#94a3b8', paddingVertical: 24, fontSize: 14 },
});
