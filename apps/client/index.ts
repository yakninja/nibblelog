import { registerRootComponent } from 'expo';
import * as Crypto from 'expo-crypto';

// Polyfill for crypto.getRandomValues (needed by uuid on React Native)
if (typeof crypto === 'undefined') {
  global.crypto = {
    getRandomValues: (array: any) => {
      const bytes = Crypto.getRandomBytes(array.length);
      for (let i = 0; i < bytes.length; i++) {
        array[i] = bytes[i];
      }
      return array;
    },
  } as any;
}

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
