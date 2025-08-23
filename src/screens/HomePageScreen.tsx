import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import HamburgerMenu from '../components/HamburgerMenu';

const { width } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'HomePage'>;

interface CardData {
  id: string;
  title: string;
  backgroundColor: string;
  iconName: string;
  iconColor: string;
  imageSource?: any;
  route?: 'Purchase' | 'Sales' | 'Inventory' | 'History';
}

const HomePage: React.FC<Props> = ({ navigation, route }) => {
  const { name, email, photo } = route.params;

  const cardData: CardData[] = [
    {
      id: '1',
      title: 'Purchase',
      backgroundColor: '#FFC947',
      iconName: 'shopping-bag',
      iconColor: '#FF6B6B',
      imageSource: require('../assests/purchase.png'), // Add your image path
      route: 'Purchase',
    },
    {
      id: '2',
      title: 'Sales',
      backgroundColor: '#A78BFA',
      iconName: 'trending-up',
      iconColor: '#10B981',
      imageSource: require('../assests/sales.png'), // Add your image path
      route: 'Sales',
    },
    {
      id: '3',
      title: 'Inventory',
      backgroundColor: '#F3E8D0',
      iconName: 'inventory',
      iconColor: '#F59E0B',
      imageSource: require('../assests/Inventory.png'), // Add your image path
      route: 'Inventory',
    },
    {
      id: '4',
      title: 'History',
      backgroundColor: '#FFC947',
      iconName: 'history',
      iconColor: '#8B5CF6',
      imageSource: require('../assests/InventoryHistory.png'), // Add your image path
      route: 'History',
    },
  ];

  const handleCardPress = (card: CardData) => {
    if (!email) {
      console.error('Email is required for this action');
      return;
    }

    switch (card.route) {
      case 'Purchase':
        navigation.navigate('ManagePurchaseTransactions', {
          name,
          email,
          photo,
        });
        break;
      case 'Sales':
        navigation.navigate('ManageSalesTransactions', {
          name,
          email,
          photo,
        });
        break;
      case 'Inventory':
        navigation.navigate('ManageInventoryTransactions', {
          name,
          email,
          photo,
        });
        break;
      case 'History':
        console.log('History feature coming soon');
        break;
      default:
        console.log(`${card.title} pressed`);
    }
  };

  const handleDownloadBalanceSheet = () => {
    console.log('Download Balance Sheet pressed');
  };

  const renderCard = (card: CardData) => (
    <TouchableOpacity
      key={card.id}
      style={[styles.card, { backgroundColor: card.backgroundColor }]}
      onPress={() => handleCardPress(card)}
      activeOpacity={0.8}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardImageContainer}>
          {card.imageSource ? (
            <Image source={card.imageSource} style={styles.cardImage} />
          ) : (
            <Icon name={card.iconName} size={40} color={card.iconColor} />
          )}
        </View>
        <Text style={styles.cardTitle}>{card.title}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <HamburgerMenu userName={name} userEmail={email} userPhoto={photo} />
        <Text style={styles.userName}>{name}</Text>
        <TouchableOpacity style={styles.notificationButton}>
          <Icon name="notifications-none" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.downloadContainer}>
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={handleDownloadBalanceSheet}
          activeOpacity={0.8}
        >
          <Text style={styles.downloadText}>Download Balance Sheet 📄</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.cardsContainer}
      >
        {cardData.map(renderCard)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    padding: 8,
    marginRight: 12,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  notificationButton: {
    padding: 8,
  },
  downloadContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  downloadButton: {
    backgroundColor: '#FF9500',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    shadowColor: '#FF9500',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  downloadText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  cardsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  card: {
    height: 120,
    borderRadius: 20,
    marginBottom: 20,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  cardImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  cardDecoration: {
    position: 'absolute',
    right: -20,
    top: -20,
    zIndex: 1,
  },
});

export default HomePage;
