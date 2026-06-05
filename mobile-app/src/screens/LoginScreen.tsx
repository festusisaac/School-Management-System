import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
  StatusBar,
} from 'react-native';
import { loginRequest } from '../services/api';
import { useAuthStore } from '../store/authStore';

// @ts-ignore
const schoolLogo = require('../../assets/school-logo.png');

/* ── Minimal icon components (no external dependency) ── */
const UserIcon = () => (
  <View style={iconStyles.wrap}>
    <View style={iconStyles.userHead} />
    <View style={iconStyles.userBody} />
  </View>
);

const LockIcon = () => (
  <View style={iconStyles.wrap}>
    <View style={iconStyles.lockTop} />
    <View style={iconStyles.lockBody}>
      <View style={iconStyles.lockHole} />
    </View>
  </View>
);

const EyeIcon = ({ open }: { open: boolean }) => (
  <View style={iconStyles.eyeWrap}>
    <View style={[iconStyles.eyeOuter, !open && iconStyles.eyeClosed]}>
      <View style={iconStyles.eyeInner} />
    </View>
    {!open && <View style={iconStyles.eyeStrike} />}
  </View>
);

const ArrowIcon = () => (
  <View style={iconStyles.arrowWrap}>
    <View style={iconStyles.arrowLine} />
    <View style={iconStyles.arrowHead} />
  </View>
);

export default function LoginScreen() {
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter your User ID/Email and password.');
      return;
    }

    try {
      setLoading(true);
      const data = await loginRequest(email.trim(), password);
      let rawRole = (data.user.role || data.user.roleObject?.name || '').toLowerCase();
      let normalizedRole = rawRole;
      if (rawRole.includes('admin') || rawRole.includes('super admin')) {
        normalizedRole = 'admin';
      } else if (rawRole.includes('principal')) {
        normalizedRole = 'principal';
      } else if (rawRole.includes('teacher')) {
        normalizedRole = 'teacher';
      } else if (rawRole.includes('student')) {
        normalizedRole = 'student';
      } else if (rawRole.includes('parent')) {
        normalizedRole = 'parent';
      } else if (rawRole.includes('accountant') || rawRole.includes('bursar')) {
        normalizedRole = 'accountant';
      }

      setUser({
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        role: normalizedRole as any,
        tenantId: data.user.tenantId,
        token: data.access_token,
      });
    } catch (err: any) {
      Alert.alert('Login Failed', err.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#f5f7fa" />
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header: Logo + School Name ── */}
        <View style={styles.header}>
          <Image source={schoolLogo} style={styles.logo} resizeMode="contain" />
          <Text style={styles.schoolName}>PHJC School Azhin Kasa</Text>
          <Text style={styles.welcomeTitle}>Welcome to PHJC School</Text>
          <Text style={styles.welcomeSub}>Sign in to access your dashboard</Text>
        </View>

        {/* ── Form Card ── */}
        <View style={styles.card}>
          {/* Email / User ID */}
          <Text style={styles.label}>User ID or Email</Text>
          <View style={styles.inputWrapper}>
            <UserIcon />
            <TextInput
              style={styles.input}
              placeholder="Enter your credentials"
              placeholderTextColor="#a0aec0"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Password */}
          <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
          <View style={styles.inputWrapper}>
            <LockIcon />
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Enter your password"
              placeholderTextColor="#a0aec0"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword(!showPassword)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <EyeIcon open={showPassword} />
            </TouchableOpacity>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.loginBtnContent}>
                <Text style={styles.loginBtnText}>Sign In</Text>
                <ArrowIcon />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Secure Connection Indicator ── */}
        <View style={styles.secureRow}>
          <View style={styles.greenDot} />
          <Text style={styles.secureText}>Secure Institutional Connection Active</Text>
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Text style={styles.footerHelp}>
            Need help? <Text style={styles.footerLink}>Contact Support</Text>
          </Text>
          <View style={styles.footerLinks}>
            <Text style={styles.footerSmall}>Privacy Policy</Text>
            <Text style={styles.footerDot}>·</Text>
            <Text style={styles.footerSmall}>Terms of Service</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ── Color Constants ── */
const BLUE = '#1a56db';
const BLUE_DARK = '#1e40af';
const ICON_COLOR = '#94a3b8';

/* ── Icon Styles ── */
const iconStyles = StyleSheet.create({
  wrap: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  /* User */
  userHead: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: ICON_COLOR,
    marginBottom: 1,
  },
  userBody: {
    width: 14,
    height: 7,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderColor: ICON_COLOR,
  },
  /* Lock */
  lockTop: {
    width: 10,
    height: 6,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderColor: ICON_COLOR,
  },
  lockBody: {
    width: 14,
    height: 9,
    borderRadius: 2,
    backgroundColor: ICON_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockHole: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#f7fafc',
  },
  /* Eye */
  eyeWrap: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeOuter: {
    width: 18,
    height: 12,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: ICON_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeClosed: {
    opacity: 0.5,
  },
  eyeInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ICON_COLOR,
  },
  eyeStrike: {
    position: 'absolute',
    width: 20,
    height: 1.5,
    backgroundColor: ICON_COLOR,
    transform: [{ rotate: '-45deg' }],
  },
  /* Arrow */
  arrowWrap: {
    width: 18,
    height: 18,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  arrowLine: {
    width: 10,
    height: 1.5,
    backgroundColor: '#fff',
  },
  arrowHead: {
    width: 7,
    height: 7,
    borderTopWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: '#fff',
    transform: [{ rotate: '45deg' }],
    marginLeft: -4,
  },
});

/* ── Main Styles ── */
const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 30,
  },

  /* ── Header ── */
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  schoolName: {
    fontSize: 20,
    fontWeight: '800',
    color: BLUE_DARK,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a202c',
    marginTop: 18,
  },
  welcomeSub: {
    fontSize: 14,
    color: '#718096',
    marginTop: 4,
  },

  /* ── Card ── */
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e8ecf1',
  },

  /* ── Form Fields ── */
  label: {
    color: '#2d3748',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    color: '#1a202c',
    fontSize: 15,
    paddingVertical: 14,
  },
  passwordInput: {
    paddingRight: 44,
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    padding: 4,
  },

  /* ── Sign In Button ── */
  loginBtn: {
    backgroundColor: BLUE,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  /* ── Secure Connection ── */
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#48bb78',
    marginRight: 8,
  },
  secureText: {
    color: '#718096',
    fontSize: 13,
    fontWeight: '500',
  },

  /* ── Footer ── */
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 30,
  },
  footerHelp: {
    fontSize: 14,
    color: '#4a5568',
  },
  footerLink: {
    color: BLUE,
    fontWeight: '600',
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  footerSmall: {
    color: '#a0aec0',
    fontSize: 13,
  },
  footerDot: {
    color: '#a0aec0',
    marginHorizontal: 8,
    fontSize: 13,
  },
});
