import { NativeModules } from 'react-native';

const { DetectorModule } = NativeModules;

// ใช้เชื่อมโยง React Native → Native เพื่อให้แอปสามารถสั่ง openApp ได้
const NavigationHelper = {
  openApp(packageName) {
    if (!packageName || !DetectorModule?.openApp) {
      return;
    }
    DetectorModule.openApp(packageName);
  },
  openDefaultTarget() {
    // เป็นตัวอย่างการเปิดแอปเป้าหมายผ่าน Native
    this.openApp('com.google.android.youtube');
  },
};

export default NavigationHelper;
