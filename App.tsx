import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import GoogleSignInScreen from './src/screens/GoogleSignInScreen';

import ManagePurchaseTransactions from './src/screens/PurchaseTransactionsScreen';
import ManageSalesTransactions from './src/screens/SalesTransactionsScreen';
import ManageInventoryTransactions from './src/screens/InventoryTransactionsScreen';
import HomePage from './src/screens/HomePageScreen';

export type RootStackParamList = {
  GoogleSignIn: undefined;

  HomePage: {
    name: string;
    email: string;
    photo?: string;
  };

  ManagePurchaseTransactions: {
    name: string;
    email: string;
    photo?: string;
  };
  ManageSalesTransactions: {
    name: string;
    email: string;
    photo?: string;
  };
  ManageInventoryTransactions: {
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
            name="ManagePurchaseTransactions"
            component={ManagePurchaseTransactions}
          />
          <Stack.Screen
            name="ManageSalesTransactions"
            component={ManageSalesTransactions}
          />
          <Stack.Screen
            name="ManageInventoryTransactions"
            component={ManageInventoryTransactions}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
};

export default App;
