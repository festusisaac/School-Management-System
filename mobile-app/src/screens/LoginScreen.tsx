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
  Image,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Alert } from '../utils/alert';
import { loginRequest } from '../services/api';
import { useAuthStore } from '../store/authStore';

// @ts-ignore
const schoolLogo = require('../../assets/school-logo.png');

const NAVY = '#12233d';
const MUTED = '#7488a0';
const ICON_COLOR = '#9fb2c6';

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
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);

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
        displayRole: data.user.role || data.user.roleObject?.name || normalizedRole,
        tenantId: data.user.tenantId,
        token: data.access_token,
        refreshToken: data.refresh_token,
        photo: data.user.photo,
      });
    } catch (err: any) {
      Alert.alert('Login Failed', err.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#eaf3fc', '#f9f6f1']} style={styles.flex}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero ── */}
          <View style={styles.hero}>
            <View style={styles.glowOuter} />
            <View style={styles.glowInner} />
            <Image source={schoolLogo} style={styles.logo} resizeMode="contain" />
            <Text style={styles.schoolName}>PHJC School Azhin Kasa</Text>
            <Text style={styles.tagline}>Excellence through Hardwork &amp; Perseverance</Text>
          </View>

          {/* ── Form Card ── */}
          <View style={styles.card}>
            <Text style={styles.cardHeading}>Sign in</Text>
            <Text style={styles.cardSub}>Enter your details to continue</Text>

            <Text style={styles.label}>User ID or Email</Text>
            <View style={[styles.inputWrapper, focusedField === 'email' && styles.inputWrapperFocused]}>
              <UserIcon />
              <TextInput
                style={styles.input}
                placeholder="Enter your credentials"
                placeholderTextColor="#a9b8c9"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
            <View style={[styles.inputWrapper, focusedField === 'password' && styles.inputWrapperFocused]}>
              <LockIcon />
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Enter your password"
                placeholderTextColor="#a9b8c9"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
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

            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.88}
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
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

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
    backgroundColor: '#f4f8fc',
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
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 26,
    paddingVertical: 40,
  },

  /* ── Hero ── */
  hero: {
    alignItems: 'center',
    marginBottom: 30,
  },
  glowOuter: {
    position: 'absolute',
    top: -30,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: '#cfe3f7',
    opacity: 0.45,
  },
  glowInner: {
    position: 'absolute',
    top: 4,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#ffffff',
    opacity: 0.55,
  },
  logo: {
    width: 92,
    height: 92,
    marginBottom: 14,
  },
  schoolName: {
    fontSize: 20,
    fontWeight: '800',
    color: NAVY,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  tagline: {
    fontSize: 12.5,
    color: MUTED,
    marginTop: 6,
    fontWeight: '500',
    textAlign: 'center',
  },

  /* ── Card ── */
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 26,
    padding: 26,
    shadowColor: '#12233d',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.1,
    shadowRadius: 28,
    elevation: 6,
  },
  cardHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: NAVY,
  },
  cardSub: {
    fontSize: 13,
    color: MUTED,
    marginTop: 3,
    marginBottom: 22,
  },

  /* ── Form Fields ── */
  label: {
    color: '#3d4f63',
    fontSize: 12.5,
    fontWeight: '700',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f8fc',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#f4f8fc',
    paddingHorizontal: 15,
  },
  inputWrapperFocused: {
    borderColor: '#bcd8f5',
    backgroundColor: '#ffffff',
  },
  input: {
    flex: 1,
    color: NAVY,
    fontSize: 15,
    paddingVertical: 14,
  },
  passwordInput: {
    paddingRight: 44,
  },
  eyeBtn: {
    position: 'absolute',
    right: 15,
    padding: 4,
  },

  /* ── Sign In Button ── */
  loginBtn: {
    backgroundColor: NAVY,
    borderRadius: 15,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 26,
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
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
});
