import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import TeacherLayout from '../../components/TeacherLayout';

export default function TeacherClassesScreen() {
  return (
    <TeacherLayout activeTab="Classes">
      <View style={styles.container}>
        <Text style={styles.text}>Teacher Classes (Coming Soon)</Text>
      </View>
    </TeacherLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, color: '#64748b' },
});
