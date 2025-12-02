import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { persistZone } from '../helpers/detectorStorage';

const STORAGE_KEY = 'detector_zone';

const defaultZone = {
  minX: '0',
  maxX: '1080',
  minY: '0',
  maxY: '2400',
};

export default function ZoneSettingScreen() {
  const [zoneValues, setZoneValues] = useState(defaultZone);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(stored => {
      if (!stored) {
        return;
      }
      try {
        const parsed = JSON.parse(stored);
        setZoneValues({
          minX: parsed.minX?.toString() ?? defaultZone.minX,
          maxX: parsed.maxX?.toString() ?? defaultZone.maxX,
          minY: parsed.minY?.toString() ?? defaultZone.minY,
          maxY: parsed.maxY?.toString() ?? defaultZone.maxY,
        });
      } catch (error) {
        console.warn('ZoneSettingScreen: invalid stored data', error);
      }
    });
  }, []);

  const updateField = (key, value) => {
    setZoneValues(previous => ({ ...previous, [key]: value }));
  };

  const applyZone = async () => {
    const minX = parseInt(zoneValues.minX, 10) || 0;
    const maxX = parseInt(zoneValues.maxX, 10) || 1080;
    const minY = parseInt(zoneValues.minY, 10) || 0;
    const maxY = parseInt(zoneValues.maxY, 10) || 1920;

    const payload = { minX, maxX, minY, maxY };
    await persistZone(payload);
  };

  const renderInput = (label, keyName) => (
    <View style={styles.row} key={keyName}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={zoneValues[keyName]}
        onChangeText={text => updateField(keyName, text)}
        placeholder="0"
        testID={`zone-input-${keyName}`}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>กำหนดโซนที่สนใจ</Text>
      {renderInput('minX (ซ้าย)', 'minX')}
      {renderInput('maxX (ขวา)', 'maxX')}
      {renderInput('minY (บน)', 'minY')}
      {renderInput('maxY (ล่าง)', 'maxY')}
      <TouchableOpacity
        testID="save-zone-button"
        style={styles.saveButton}
        onPress={applyZone}
      >
        <Text style={styles.saveButtonText}>บันทึกโซน</Text>
      </TouchableOpacity>
      <Text style={styles.helperText}>
        ระบบจะใช้ค่าเหล่านี้เปรียบเทียบกับค่า getBoundsInScreen ของแต่ละ node
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontWeight: '700', marginBottom: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  label: { flex: 1, fontSize: 14, color: '#555555' },
  input: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    padding: 6,
    textAlign: 'right',
  },
  saveButton: {
    marginTop: 8,
    backgroundColor: '#0b5ed7',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  saveButtonText: { color: '#ffffff', fontWeight: '700' },
  helperText: { marginTop: 12, color: '#777777', fontSize: 12 },
});
