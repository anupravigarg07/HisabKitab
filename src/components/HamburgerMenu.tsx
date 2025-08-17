import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Image,
} from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface HamburgerMenuProps {
  userName?: string;
  userEmail?: string;
  userPhoto?: string;
}

interface MenuItem {
  id: string;
  label: string;
  iconName: string;
  action: () => void;
}

type NavigationType = NativeStackNavigationProp<RootStackParamList>;

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  userName = 'User',
  userEmail = 'user@email.com',
  userPhoto,
}) => {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [imageError, setImageError] = useState(false);
  const navigation = useNavigation<NavigationType>();

  const handleSignOut = async () => {
    try {
      await GoogleSignin.signOut();
      setIsMenuVisible(false);
      navigation.replace('GoogleSignIn');
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const handleNavigation = <T extends keyof RootStackParamList>(
    screen: T,
    params?: RootStackParamList[T],
  ) => {
    setIsMenuVisible(false);
    // @ts-expect-error: TS can't infer
    navigation.navigate(screen, params);
  };

  // Menu items array with working MaterialIcons names
  const menuItems: MenuItem[] = [
    {
      id: 'Home',
      label: 'Home',
      iconName: 'home',
      action: () =>
        handleNavigation('HomePage', {
          name: userName,
          email: userEmail,
          photo: userPhoto,
        }),
    },
    {
      id: 'purchase',
      label: 'Purchase',
      iconName: 'shopping-cart',
      action: () =>
        handleNavigation('ManagePurchaseTransactions', {
          name: userName,
          email: userEmail,
          photo: userPhoto,
        }),
    },
    {
      id: 'sales',
      label: 'Sales',
      iconName: 'trending-up',
      action: () =>
        handleNavigation('ManageSalesTransactions', {
          name: userName,
          email: userEmail,
          photo: userPhoto,
        }),
    },
    {
      id: 'inventory',
      label: 'Inventory',
      iconName: 'storage',
      action: () =>
        handleNavigation('ManageInventoryTransactions', {
          name: userName,
          email: userEmail,
          photo: userPhoto,
        }),
    },
    // {
    //   id: 'history',
    //   label: 'History',
    //   iconName: 'history',
    //   action: () =>
    //     handleNavigation('TransactionHistory', {
    //       name: userName,
    //       email: userEmail,
    //       photo: userPhoto,
    //     }),
    // },
    {
      id: 'logout',
      label: 'Logout',
      iconName: 'exit-to-app',
      action: handleSignOut,
    },
  ];

  return (
    <>
      <TouchableOpacity onPress={() => setIsMenuVisible(true)}>
        <Text style={styles.hamburgerText}>≡</Text>
      </TouchableOpacity>

      <Modal
        visible={isMenuVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsMenuVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.menuPanel}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.profileContainer}>
                {userPhoto && !imageError ? (
                  <Image
                    source={{ uri: userPhoto }}
                    style={styles.avatar}
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {userName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{userName}</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setIsMenuVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.menuItems}>
              {menuItems.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuItem}
                  onPress={item.action}
                >
                  <Icon name={item.iconName} size={20} color="#000" />
                  <Text style={styles.menuText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.overlay}
            onPress={() => setIsMenuVisible(false)}
          />
        </View>
      </Modal>
    </>
  );
};

export default HamburgerMenu;

const styles = StyleSheet.create({
  hamburgerText: {
    fontSize: 26,
    color: '#000',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  menuPanel: {
    width: '70%',
    height: '100%',
    backgroundColor: '#fff',
    paddingTop: 40,
    paddingHorizontal: 20,
    elevation: 5,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fca311',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  userInfo: {
    flexDirection: 'column',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  userCity: {
    fontSize: 13,
    color: '#888',
  },
  closeButton: {
    padding: 5,
  },
  closeIcon: {
    fontSize: 22,
    color: '#000',
  },
  menuItems: {
    marginTop: 30,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  menuText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#000',
  },
});
