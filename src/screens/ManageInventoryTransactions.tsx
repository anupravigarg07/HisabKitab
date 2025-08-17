import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import HamburgerMenu from '../components/HamburgerMenu';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import GoogleSheetsService from '../services/GoogleSheetsService';
import {
  SavedTransaction,
  InventoryTransaction,
} from '../types/transactionstypes';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ManageInventoryTransactions'
>;

const ManageInventoryTransactions: React.FC<Props> = ({ route }) => {
  const { name, email, photo } = route.params;

  if (!email) {
    Alert.alert('Error', 'User email is required');
    return null;
  }

  const [activeTab, setActiveTab] = useState('Inventory');
  const [isModalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingTransactions, setIsFetchingTransactions] = useState(true);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    sellingPrice: '',
    quantity: '',
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setIsFetchingTransactions(true);
    try {
      const data = await GoogleSheetsService.getInventoryTransactions(
        email,
        'inventory',
      );
      setTransactions(data);
    } catch (error) {
      console.error('Failed to fetch inventory transactions:', error);
    } finally {
      setIsFetchingTransactions(false);
    }
  };

  const handleSave = async () => {
    const { name: productName, sellingPrice, quantity } = formData;

    if (!productName || !sellingPrice || !quantity) {
      Alert.alert(
        'Validation Error',
        'Please fill all required fields (Product Name, Selling Price, and Quantity)',
      );
      return;
    }

    if (isNaN(Number(sellingPrice)) || Number(sellingPrice) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid selling price');
      return;
    }

    if (isNaN(Number(quantity)) || Number(quantity) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid quantity');
      return;
    }

    setIsLoading(true);

    try {
      // Save to 'inventory' sheet
      await GoogleSheetsService.saveInventoryTransaction(email, 'inventory', {
        name: productName,
        sellingPrice,
        quantity,
      });

      Alert.alert('Success', 'Inventory item saved successfully!');
      setFormData({ name: '', sellingPrice: '', quantity: '' });
      setModalVisible(false);

      await fetchTransactions();
    } catch (error) {
      console.error('Error saving inventory transaction:', error);
      Alert.alert('Error', 'Failed to save inventory item. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const closeModal = () => {
    if (!isLoading) {
      setModalVisible(false);
      setFormData({ name: '', sellingPrice: '', quantity: '' });
    }
  };

  const renderTransactionContent = () => {
    if (isFetchingTransactions) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#FF8C00" />
          <Text style={styles.loaderText}>Fetching inventory items...</Text>
        </View>
      );
    }

    if (transactions.length > 0) {
      return (
        <View style={styles.transactionsContainer}>
          {transactions.map((txn, index) => (
            <View key={index} style={styles.transactionCard}>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionName}>{txn.name}</Text>
                <Text style={styles.transactionDetails}>
                  Qty: {txn.quantity}
                </Text>
              </View>
              <Text style={styles.transactionAmount}>₹{txn.sellingPrice}</Text>
            </View>
          ))}
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Image
          source={require('../assests/emptytransactions.jpg')}
          style={styles.illustration}
          resizeMode="contain"
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <HamburgerMenu userName={name} userEmail={email} userPhoto={photo} />
        <Text style={styles.userName}>{name}</Text>
      </View>

      {/* Tab */}
      <View style={styles.tabSection}>
        <Text style={styles.tabTitle}>{activeTab}</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderTransactionContent()}
      </ScrollView>

      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>Add Inventory</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Inventory</Text>
              <TouchableOpacity
                onPress={closeModal}
                disabled={isLoading}
                style={styles.closeButton}
              >
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Product Name"
              placeholderTextColor="#999"
              value={formData.name}
              onChangeText={text => handleInputChange('name', text)}
              style={styles.inputField}
              editable={!isLoading}
            />

            <TextInput
              placeholder="Selling Price"
              placeholderTextColor="#999"
              value={formData.sellingPrice}
              onChangeText={text => handleInputChange('sellingPrice', text)}
              style={styles.inputField}
              keyboardType="numeric"
              editable={!isLoading}
            />

            <TextInput
              placeholder="Quantity"
              placeholderTextColor="#999"
              value={formData.quantity}
              onChangeText={text => handleInputChange('quantity', text)}
              style={styles.inputField}
              keyboardType="numeric"
              editable={!isLoading}
            />

            <TouchableOpacity
              style={[styles.saveButton, isLoading && styles.disabledButton]}
              onPress={handleSave}
              disabled={isLoading}
            >
              <Text style={styles.saveButtonText}>
                {isLoading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ManageInventoryTransactions;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  tabSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  tabTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  transactionsContainer: {
    paddingTop: 20,
    paddingBottom: 100,
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: '400',
    color: '#000',
    marginBottom: 4,
  },
  transactionDetails: {
    fontSize: 14,
    fontWeight: '300',
    color: '#666',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF8C00',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  illustration: {
    width: 250,
    height: 250,
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F8F8F8',
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
  },
  addButton: {
    backgroundColor: '#FF8C00',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  loaderText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    fontWeight: '500',
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    borderRadius: 15,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
  },
  closeIcon: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  inputField: {
    backgroundColor: '#F8F8F8',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 8,
    fontSize: 16,
    color: '#000',
    marginBottom: 16,
    borderWidth: 0,
  },
  saveButton: {
    backgroundColor: '#FF8C00',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
