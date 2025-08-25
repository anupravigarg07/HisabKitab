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
import { RootStackParamList } from '../../../App';
import HamburgerMenu from '../../components/HamburgerMenu';
import { styles } from './HomePageScreen.styles';

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
      imageSource: require('../assests/purchase.png'),
      route: 'Purchase',
    },
    {
      id: '2',
      title: 'Sales',
      backgroundColor: '#A78BFA',
      iconName: 'trending-up',
      iconColor: '#10B981',
      imageSource: require('../assests/sales.png'),
      route: 'Sales',
    },
    {
      id: '3',
      title: 'Inventory',
      backgroundColor: '#F3E8D0',
      iconName: 'inventory',
      iconColor: '#F59E0B',
      imageSource: require('../assests/Inventory.png'),
      route: 'Inventory',
    },
    {
      id: '4',
      title: 'History',
      backgroundColor: '#FFC947',
      iconName: 'history',
      iconColor: '#8B5CF6',
      imageSource: require('../assests/InventoryHistory.png'),
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
        navigation.navigate('PurchaseTransactionsScreen', {
          name,
          email,
          photo,
        });
        break;
      case 'Sales':
        navigation.navigate('SalesTransactionsScreen', {
          name,
          email,
          photo,
        });
        break;
      case 'Inventory':
        navigation.navigate('InventoryTransactionsScreen', {
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

export default HomePage;
