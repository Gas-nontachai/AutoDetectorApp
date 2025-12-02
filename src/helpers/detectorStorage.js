import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules } from 'react-native';

const { DetectorModule } = NativeModules;

export const KEYWORD_STORAGE_KEY = 'detector_keywords';
export const ZONE_STORAGE_KEY = 'detector_zone';

export async function persistKeywords(keywords) {
  const payload = Array.isArray(keywords) ? keywords : [];
  await AsyncStorage.setItem(KEYWORD_STORAGE_KEY, JSON.stringify(payload));
  DetectorModule?.updateKeywords?.(payload);
}

export async function persistZone({ minX, maxX, minY, maxY }) {
  const zonePayload = {
    minX: typeof minX === 'number' ? minX : 0,
    maxX: typeof maxX === 'number' ? maxX : 1080,
    minY: typeof minY === 'number' ? minY : 0,
    maxY: typeof maxY === 'number' ? maxY : 1920,
  };
  await AsyncStorage.setItem(ZONE_STORAGE_KEY, JSON.stringify(zonePayload));
  DetectorModule?.updateZone?.(
    zonePayload.minX,
    zonePayload.maxX,
    zonePayload.minY,
    zonePayload.maxY,
  );
}
