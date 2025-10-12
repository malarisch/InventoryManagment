import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.inventorymanagment',
  appName: 'inventorymanagment',
  webDir: 'out',
  ios: {
    scheme: 'App',
    preferredContentMode: 'mobile'
  },
  "server": {
    "url": "http://192.168.178.57:3000",
    "cleartext": true
  }
};

export default config;
