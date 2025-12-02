import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules } from 'react-native';
import { persistKeywords, persistZone } from '../src/helpers/detectorStorage';

describe('persistKeywords helper', () => {
  it('stores keyword arrays and notifies native module', async () => {
    const keywords = ['alert', 'todo'];
    await persistKeywords(keywords);

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'detector_keywords',
      JSON.stringify(keywords),
    );
    expect(NativeModules.DetectorModule.updateKeywords).toHaveBeenCalledWith(
      keywords,
    );
  });

  it('falls back to empty array when input is invalid', async () => {
    await persistKeywords(null);

    expect(AsyncStorage.setItem).toHaveBeenLastCalledWith(
      'detector_keywords',
      JSON.stringify([]),
    );
    expect(NativeModules.DetectorModule.updateKeywords).toHaveBeenCalledWith(
      [],
    );
  });
});

describe('persistZone helper', () => {
  it('saves the provided boundaries and updates native module', async () => {
    await persistZone({ minX: 10, maxX: 600, minY: 20, maxY: 400 });

    expect(AsyncStorage.setItem).toHaveBeenLastCalledWith(
      'detector_zone',
      JSON.stringify({ minX: 10, maxX: 600, minY: 20, maxY: 400 }),
    );
    expect(NativeModules.DetectorModule.updateZone).toHaveBeenCalledWith(
      10,
      600,
      20,
      400,
    );
  });

  it('applies default edges when values are missing', async () => {
    await persistZone({});

    expect(AsyncStorage.setItem).toHaveBeenLastCalledWith(
      'detector_zone',
      JSON.stringify({ minX: 0, maxX: 1080, minY: 0, maxY: 1920 }),
    );
    expect(NativeModules.DetectorModule.updateZone).toHaveBeenCalledWith(
      0,
      1080,
      0,
      1920,
    );
  });
});
