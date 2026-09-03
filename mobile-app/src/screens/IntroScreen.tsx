import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// @ts-ignore
const schoolLogo = require('../../assets/school-logo.png');

const NAVY = '#031632';

export default function IntroScreen({ onDone }: { onDone: () => void }) {
  const handleContinue = async () => {
    await AsyncStorage.setItem('has_seen_intro', 'true');
    onDone();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />

      <View style={styles.center}>
        <Image source={schoolLogo} style={styles.logo} resizeMode="contain" />
        <Text style={styles.schoolName}>PHJC School Azhin Kasa</Text>
        <Text style={styles.motto}>Excellence through Hardwork &amp; Perseverance</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleContinue} activeOpacity={0.85}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NAVY,
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingBottom: 48,
    paddingTop: 80,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 160,
    height: 160,
    marginBottom: 24,
  },
  schoolName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  motto: {
    fontSize: 14,
    color: '#93a5c4',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: NAVY,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
