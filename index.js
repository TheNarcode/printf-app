/**
 * @format
 */

import 'fast-text-encoding';
import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';
import { backgroundMessageHandler } from './src/services/notifications';

// Register background/killed-state FCM handler.
// Must be at module scope — before AppRegistry.registerComponent.
messaging().setBackgroundMessageHandler(backgroundMessageHandler);

AppRegistry.registerComponent(appName, () => App);
