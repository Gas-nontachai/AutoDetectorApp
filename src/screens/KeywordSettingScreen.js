import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  NativeModules,
} from 'react-native';
import { persistKeywords } from '../helpers/detectorStorage';

const STORAGE_KEY = 'detector_keywords';
const { DetectorModule } = NativeModules;

export default function KeywordSettingScreen() {
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState([]);

  useEffect(() => {
    // Restore saved keywords and propagate to native when the screen mounts.
    AsyncStorage.getItem(STORAGE_KEY).then(stored => {
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setKeywords(parsed);
            DetectorModule?.updateKeywords(parsed);
          }
        } catch (error) {
          console.warn(
            'KeywordSettingScreen: failed to parse stored keywords',
            error,
          );
        }
      }
    });
  }, []);

  const saveKeywords = async nextKeywords => {
    setKeywords(nextKeywords);
    await persistKeywords(nextKeywords);
  };

  const addKeyword = async () => {
    const trimmed = keywordInput.trim();
    if (!trimmed) {
      return;
    }
    const merged = Array.from(new Set([trimmed, ...keywords]));
    setKeywordInput('');
    await saveKeywords(merged);
  };

  const removeKeyword = value => {
    const updated = keywords.filter(keyword => keyword !== value);
    saveKeywords(updated);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ตั้งค่า keyword คำที่ต้องการจับคู่</Text>
      <TextInput
        style={styles.input}
        placeholder="พิมพ์คำใหม่แล้วกดบันทึก"
        testID="keyword-input"
        value={keywordInput}
        onChangeText={setKeywordInput}
        onSubmitEditing={addKeyword}
        returnKeyType="done"
      />
      <TouchableOpacity
        testID="add-keyword-button"
        style={styles.saveButton}
        onPress={addKeyword}
      >
        <Text style={styles.saveButtonText}>เพิ่ม keyword แล้วบันทึก</Text>
      </TouchableOpacity>
      <ScrollView style={styles.keywordsList}>
        {keywords.map(keyword => (
          <View key={keyword} style={styles.keywordRow}>
            <Text style={styles.keywordText}>{keyword}</Text>
            <TouchableOpacity
              style={styles.keywordAction}
              onPress={() => removeKeyword(keyword)}
            >
              <Text style={styles.keywordActionText}>ลบ</Text>
            </TouchableOpacity>
          </View>
        ))}
        {keywords.length === 0 && (
          <Text style={styles.emptyText}>ยังไม่กำหนด keyword ใด ๆ</Text>
        )}
      </ScrollView>
      <Text style={styles.noteText}>
        ข้อมูลจะถูกส่งขึ้น Native เพื่อให้ AccessibilityService นำไปใช้งานทันที
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontWeight: '700', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
  },
  saveButton: {
    backgroundColor: '#0b5ed7',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveButtonText: { color: '#ffffff', fontWeight: '600' },
  keywordsList: { flex: 1 },
  keywordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomColor: '#ededed',
    borderBottomWidth: 1,
  },
  keywordText: { fontSize: 16 },
  keywordAction: {
    backgroundColor: '#f04444',
    paddingHorizontal: 10,
    borderRadius: 6,
    justifyContent: 'center',
  },
  keywordActionText: { color: '#ffffff', fontWeight: '600' },
  emptyText: { color: '#888888', marginTop: 12 },
  noteText: { fontSize: 12, color: '#777777', marginTop: 12 },
});
