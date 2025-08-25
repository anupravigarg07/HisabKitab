import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import GoogleSignInScreen from './src/screens/GoogleSignInScreen/GoogleSignInScreen';

import PurchaseTransactionsScreen from './src/screens/PurchaseTransactionsScreen/PurchaseTransactionsScreen';
import SalesTransactionsScreen from './src/screens/SalesTransactionsScreen/SalesTransactionsScreen';
import InventoryTransactionsScreen from './src/screens/InventoryTransactionsScreen/InventoryTransactionsScreen';
import HomePage from './src/screens/HomePageScreen/HomePageScreen';

export type RootStackParamList = {
  GoogleSignIn: undefined;

  HomePage: {
    name: string;
    email: string;
    photo?: string;
  };

  PurchaseTransactionsScreen: {
    name: string;
    email: string;
    photo?: string;
  };
  SalesTransactionsScreen: {
    name: string;
    email: string;
    photo?: string;
  };
  InventoryTransactionsScreen: {
    name: string;
    email: string;
    photo?: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="GoogleSignIn"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="GoogleSignIn" component={GoogleSignInScreen} />

          <Stack.Screen name="HomePage" component={HomePage} />

          <Stack.Screen
            name="PurchaseTransactionsScreen"
            component={PurchaseTransactionsScreen}
          />
          <Stack.Screen
            name="SalesTransactionsScreen"
            component={SalesTransactionsScreen}
          />
          <Stack.Screen
            name="InventoryTransactionsScreen"
            component={InventoryTransactionsScreen}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
};

export default App;
