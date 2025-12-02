import React, { useEffect, useMemo, useState } from 'react';
import {
  NativeEventEmitter,
  NativeModules,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import KeywordSettingScreen from './src/screens/KeywordSettingScreen';
import ZoneSettingScreen from './src/screens/ZoneSettingScreen';
import NavigationHelper from './src/NavigationHelper';

const { DetectorModule } = NativeModules;
const detectorEventEmitter = DetectorModule
  ? new NativeEventEmitter(DetectorModule)
  : null;

const SCREEN_NAMES = {
  keywords: 'Keywords',
  zones: 'Zones',
};

// ขอบเขตที่ไม่ต้องทำ: Auto click ปุ่ม “Buy Now”, Auto click ปุ่ม “Purchase”, ตะลุยหลายหน้าอัตโนมัติ,
// ทำธุรกรรมแทนผู้ใช้, Bot automation ใน marketplace จริง

export default function App() {
  const [activeScreen, setActiveScreen] = useState(SCREEN_NAMES.keywords);
  const [detectionLog, setDetectionLog] = useState([]);
  const [recentHit, setRecentHit] = useState(null);
  const [detectedPackage, setDetectedPackage] = useState(null);

  const defaultWhitelist = useMemo(
    () => ['com.android.settings', 'com.google.android.youtube'],
    [],
  );

  useEffect(() => {
    // Push whitelist to Kotlin native once so service knows which packages to inspect.
    if (DetectorModule?.updateWhitelist) {
      DetectorModule.updateWhitelist(defaultWhitelist);
    }
    // Kick off a default zone that covers conservative area until the user saves their own.
    DetectorModule?.updateZone?.(0, 1080, 0, 2400);
  }, [defaultWhitelist]);

  useEffect(() => {
    if (!detectorEventEmitter) {
      return undefined;
    }

    const subscription = detectorEventEmitter.addListener(
      'ScreenTextDetected',
      payload => {
        const logEntry = {
          text: payload?.text ?? '---',
          packageName: payload?.packageName ?? 'unknown',
          timestamp: Date.now(),
        };
        setDetectionLog(previous => [logEntry, ...previous].slice(0, 8));
        setRecentHit(logEntry.text);
        setDetectedPackage(logEntry.packageName);
      },
    );

    return () => subscription.remove();
  }, []);

  const ActiveScreenComponent =
    activeScreen === SCREEN_NAMES.keywords
      ? KeywordSettingScreen
      : ZoneSettingScreen;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.headerBar}>
        {Object.values(SCREEN_NAMES).map(screenName => (
          <TouchableOpacity
            key={screenName}
            style={
              activeScreen === screenName
                ? styles.activeTabButton
                : styles.tabButton
            }
            onPress={() => setActiveScreen(screenName)}
          >
            <Text
              style={
                activeScreen === screenName
                  ? styles.activeTabText
                  : styles.tabText
              }
            >
              {screenName}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.body}>
        <View style={styles.contentWrapper}>
          <ActiveScreenComponent />
        </View>

        <View style={styles.statusWrapper}>
          <Text style={styles.sectionTitle}>Realtime hits</Text>
          <View style={styles.statusRow}>
            <Text style={styles.label}>Last keyword</Text>
            <Text style={styles.value}>{recentHit ?? 'ยังไม่มีข้อมูล'}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.label}>From app</Text>
            <Text style={styles.value}>
              {detectedPackage ?? 'รอการตรวจจับ'}
            </Text>
          </View>
          <View style={styles.navigationRow}>
            <Text style={styles.label}>วิธีส่งผู้ใช้ไปจุดเป้าหมาย</Text>
            <TouchableOpacity
              style={styles.navigationButton}
              onPress={() => NavigationHelper.openApp('com.android.settings')}
            >
              <Text style={styles.navigationButtonText}>เปิด Settings</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.logScroll}>
            {detectionLog.map(row => (
              <View
                key={`${row.timestamp}-${row.packageName}`}
                style={styles.logRow}
              >
                <Text style={styles.logText}>{row.packageName}</Text>
                <Text style={styles.logText}>"{row.text}"</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f2f3f5' },
  headerBar: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#ffffff',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#dddddd',
  },
  activeTabButton: {
    flex: 1,
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#0b5ed7',
  },
  tabText: { textAlign: 'center', color: '#666666', fontWeight: '600' },
  activeTabText: { textAlign: 'center', color: '#0b5ed7', fontWeight: '700' },
  body: { flex: 1, padding: 12 },
  contentWrapper: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  statusWrapper: {
    flex: 1,
    marginTop: 6,
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 10,
  },
  sectionTitle: { fontWeight: '700', marginBottom: 6 },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: { color: '#444444' },
  value: { fontWeight: '600', color: '#111111' },
  navigationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  navigationButton: {
    backgroundColor: '#0b5ed7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  navigationButtonText: { color: '#ffffff', fontWeight: '700' },
  logScroll: { maxHeight: 140 },
  logRow: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  logText: { fontSize: 13 },
});
