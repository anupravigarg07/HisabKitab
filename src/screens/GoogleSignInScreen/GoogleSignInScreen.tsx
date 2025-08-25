import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import GoogleSignInService from '../../services/GoogleSignInService/GoogleSignInService';
import { styles } from './GoogleSignInScreen.styles';

type NavigationType = NativeStackNavigationProp<
  RootStackParamList,
  'GoogleSignIn'
>;

const GoogleSignInScreen: React.FC = () => {
  const navigation = useNavigation<NavigationType>();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const userInfo = await GoogleSignInService.signIn();
      console.log('userInfo', userInfo);
      if (!userInfo) {
        Alert.alert('Sign-In Error', 'Failed to get user information');
        return;
      }

      const { name, email, photo } = userInfo.user;
      const firstName = name?.split(' ')[0] || 'User';

      navigation.replace('HomePage', {
        name: firstName,
        email: email || '',
        photo: photo || undefined,
      });
    } catch (error: any) {
      let msg = 'Something went wrong';
      if (error.code === 'SIGN_IN_CANCELLED') {
        msg = 'Sign-In Cancelled';
      } else if (error.code === 'IN_PROGRESS') {
        msg = 'Sign-In already in progress';
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        msg = 'Play Services not available';
      }
      Alert.alert('Sign-In Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        <Text style={styles.titleBlack}>Hisab</Text>
        <Text style={styles.titleOrange}>Kitab</Text>
      </Text>
      <Text style={styles.subtitle}>Budget Better. Live Smarter</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={handleGoogleSignIn}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Get Started</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default GoogleSignInScreen;
