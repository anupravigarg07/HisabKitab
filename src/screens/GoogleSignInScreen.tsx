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
import { RootStackParamList } from '../../App';
import GoogleSignInService from '../services/GoogleSignInService/GoogleSignInService';

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  titleBlack: {
    color: '#1A1A1A',
  },
  titleOrange: {
    color: '#F59E0B',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 60,
  },
  button: {
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    paddingHorizontal: 50,
    borderRadius: 30,
    position: 'absolute',
    bottom: 60,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
