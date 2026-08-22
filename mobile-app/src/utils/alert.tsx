import React, { useCallback, useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertConfig {
  title: string;
  message?: string;
  buttons: AlertButton[];
}

const COLORS = {
  onSurface: '#191c1e',
  muted: '#5b6b7d',
  cancelBg: '#f1f5f9',
  cancelText: '#475569',
  secondary: '#055db6',
  secondaryBg: '#eff6ff',
  success: '#16a34a',
  successBg: '#dcfce7',
  warning: '#d97706',
  warningBg: '#fef3c7',
  error: '#ba1a1a',
  errorBg: '#fee2e2',
};

function resolveAccent(title: string, buttons: AlertButton[]) {
  if (buttons.some((b) => b.style === 'destructive')) {
    return { color: COLORS.error, bg: COLORS.errorBg, icon: 'warning' as const };
  }
  const t = title.toLowerCase();
  if (t.includes('error') || t.includes('failed') || t.includes('unauthorized')) {
    return { color: COLORS.error, bg: COLORS.errorBg, icon: 'close-circle' as const };
  }
  if (t.includes('success') || t.includes('submitted') || t.includes('saved') || t.includes('scheduled') || t.includes('downloaded')) {
    return { color: COLORS.success, bg: COLORS.successBg, icon: 'checkmark-circle' as const };
  }
  if (t.includes('missing') || t.includes('invalid') || t.includes('required') || t.includes('offline')) {
    return { color: COLORS.warning, bg: COLORS.warningBg, icon: 'alert-circle' as const };
  }
  return { color: COLORS.secondary, bg: COLORS.secondaryBg, icon: 'information-circle' as const };
}

let showAlertFn: ((config: AlertConfig) => void) | null = null;

/** Drop-in replacement for React Native's `Alert` — same static `.alert(...)` shape. */
export const Alert = {
  alert(title: string, message?: string, buttons?: AlertButton[]) {
    const finalButtons = buttons && buttons.length ? buttons : [{ text: 'OK', style: 'default' as const }];
    if (showAlertFn) {
      showAlertFn({ title, message, buttons: finalButtons });
    } else {
      console.warn('[Alert] Host not mounted yet:', title, message);
    }
  },
};

/** Mount once near the app root (see App.tsx) so Alert.alert() has somewhere to render. */
export function AlertHost() {
  const [config, setConfig] = useState<AlertConfig | null>(null);

  useEffect(() => {
    showAlertFn = setConfig;
    return () => {
      showAlertFn = null;
    };
  }, []);

  const handlePress = useCallback((btn: AlertButton) => {
    setConfig(null);
    btn.onPress?.();
  }, []);

  if (!config) return null;

  const accent = resolveAccent(config.title, config.buttons);
  const buttons = config.buttons;
  const stacked = buttons.length > 2;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => handlePress(buttons[buttons.length - 1])}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={[styles.iconWrap, { backgroundColor: accent.bg }]}>
            <Ionicons name={accent.icon} size={28} color={accent.color} />
          </View>
          <Text style={styles.title}>{config.title}</Text>
          {!!config.message && <Text style={styles.message}>{config.message}</Text>}
          <View style={[styles.buttonRow, stacked && styles.buttonColumn]}>
            {buttons.map((btn, i) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.button,
                    !stacked && styles.buttonFlex,
                    stacked && i > 0 && { marginTop: 8 },
                    isCancel ? styles.buttonCancel : { backgroundColor: isDestructive ? COLORS.error : accent.color },
                  ]}
                  onPress={() => handlePress(btn)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.buttonText, isCancel && styles.buttonTextCancel]}>{btn.text}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(3,22,50,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 17, fontWeight: '800', color: COLORS.onSurface, textAlign: 'center' },
  message: { fontSize: 14, color: COLORS.muted, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 22, alignSelf: 'stretch' },
  buttonColumn: { flexDirection: 'column' },
  button: { paddingVertical: 13, borderRadius: 12, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' },
  buttonFlex: { flex: 1 },
  buttonCancel: { backgroundColor: COLORS.cancelBg },
  buttonText: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
  buttonTextCancel: { color: COLORS.cancelText },
});
