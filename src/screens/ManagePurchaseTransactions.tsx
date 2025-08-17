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
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Picker } from '@react-native-picker/picker';
import HamburgerMenu from '../components/HamburgerMenu';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import GoogleSheetsService from '../services/GoogleSheetsService';
import { PurchaseTransaction } from '../types/transactionstypes';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ManagePurchaseTransactions'
>;

const ManagePurchaseTransactions: React.FC<Props> = ({ route }) => {
  const { name, email, photo } = route.params;

  if (!email) {
    Alert.alert('Error', 'User email is required');
    return null;
  }

  const [activeTab, setActiveTab] = useState('Purchase');
  const [isModalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingTransactions, setIsFetchingTransactions] = useState(true);
  const [transactions, setTransactions] = useState<PurchaseTransaction[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    quantity: '',
    unit: 'Piece',
    notes: '',
  });
  const [editingTransaction, setEditingTransaction] =
    useState<PurchaseTransaction | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setIsFetchingTransactions(true);
    try {
      const data = await GoogleSheetsService.getPurchaseTransactions(email);
      setTransactions(data);
    } catch (error) {
      console.error('Failed to fetch purchase transactions:', error);
    } finally {
      setIsFetchingTransactions(false);
    }
  };

  const handleSave = async () => {
    const { name: transactionName, amount, quantity, unit, notes } = formData;

    if (!transactionName || !amount || !quantity) {
      Alert.alert(
        'Validation Error',
        'Please fill all required fields (Product Name, Purchasing Price, and Quantity)',
      );
      return;
    }

    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid purchasing price');
      return;
    }

    if (isNaN(Number(quantity)) || Number(quantity) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid quantity');
      return;
    }

    setIsLoading(true);

    try {
      if (editingTransaction) {
        await GoogleSheetsService.updatePurchaseTransactionById(
          email,
          editingTransaction.id,
          {
            name: transactionName,
            amount,
            quantity,
            unit,
            notes,
          },
        );
        Alert.alert('Success', 'Purchase transaction updated successfully!');
      } else {
        await GoogleSheetsService.savePurchaseTransaction(email, {
          name: transactionName,
          amount,
          quantity,
          unit,
          notes,
        });
        Alert.alert('Success', 'Purchase transaction saved successfully!');
      }

      setFormData({
        name: '',
        amount: '',
        quantity: '',
        unit: 'Piece',
        notes: '',
      });
      setModalVisible(false);
      setEditingTransaction(null);
      await fetchTransactions();
    } catch (error) {
      console.error('Error saving transaction:', error);
      Alert.alert('Error', 'Failed to save transaction. Please try again.');
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
      setFormData({
        name: '',
        amount: '',
        quantity: '',
        unit: 'Piece',
        notes: '',
      });
      setEditingTransaction(null);
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await GoogleSheetsService.deletePurchaseTransactionById(
                email,
                transactionId,
              );
              Alert.alert('Success', 'Transaction deleted successfully!');
              await fetchTransactions();
            } catch (error) {
              console.error('Error deleting transaction:', error);
              Alert.alert(
                'Error',
                'Failed to delete transaction. Please try again.',
              );
            }
          },
        },
      ],
    );
  };

  const handleEditTransaction = (txn: PurchaseTransaction) => {
    setFormData({
      name: txn.name,
      amount: txn.amount,
      quantity: txn.quantity,
      unit: txn.unit || 'Piece',
      notes: txn.notes || '',
    });
    setEditingTransaction(txn);
    setModalVisible(true);
  };

  const renderTransactionContent = () => {
    if (isFetchingTransactions) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#FF8C00" />
          <Text style={styles.loaderText}>Fetching transactions...</Text>
        </View>
      );
    }

    if (transactions.length > 0) {
      return (
        <View style={styles.transactionsContainer}>
          {transactions.map((txn, index) => (
            <View key={txn.id || index} style={styles.transactionCard}>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionName}>{txn.name}</Text>
                <Text style={styles.transactionDetails}>
                  {txn.quantity} {txn.unit} • ₹{txn.amount}
                </Text>
                {txn.notes ? (
                  <Text style={styles.transactionNotes}>{txn.notes}</Text>
                ) : null}
              </View>

              <View style={styles.actionIcons}>
                <TouchableOpacity
                  onPress={() => handleEditTransaction(txn)}
                  style={styles.iconButton}
                  activeOpacity={0.7}
                >
                  <Icon name="edit" size={22} color="#007BFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteTransaction(txn.id)}
                  style={styles.iconButton}
                  activeOpacity={0.7}
                >
                  <Icon name="delete" size={22} color="#FF4444" />
                </TouchableOpacity>
              </View>
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

      <View style={styles.tabSection}>
        <Text style={styles.tabTitle}>{activeTab}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderTransactionContent()}
      </ScrollView>

      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>Add Purchase</Text>
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
              <Text style={styles.modalTitle}>
                {editingTransaction ? 'Edit Purchase' : 'Add Purchase'}
              </Text>
              <TouchableOpacity
                onPress={closeModal}
                disabled={isLoading}
                style={styles.closeButton}
              >
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.scrollContent}
            >
              <TextInput
                placeholder="Product Name"
                value={formData.name}
                onChangeText={text => handleInputChange('name', text)}
                style={styles.inputField}
                editable={!isLoading}
              />

              <TextInput
                placeholder="Purchasing Price"
                value={formData.amount}
                onChangeText={text => handleInputChange('amount', text)}
                style={styles.inputField}
                keyboardType="numeric"
                editable={!isLoading}
              />

              <TextInput
                placeholder="Quantity"
                value={formData.quantity}
                onChangeText={text => handleInputChange('quantity', text)}
                style={styles.inputField}
                keyboardType="numeric"
                editable={!isLoading}
              />

              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.unit}
                  onValueChange={value => handleInputChange('unit', value)}
                  enabled={!isLoading}
                  style={styles.picker}
                >
                  <Picker.Item label="Piece" value="Piece" />
                  <Picker.Item label="Kg" value="Kg" />
                  <Picker.Item label="Litre" value="Litre" />
                  <Picker.Item label="Box" value="Box" />
                </Picker>
              </View>

              <TextInput
                placeholder="Notes (optional)"
                value={formData.notes}
                onChangeText={text => handleInputChange('notes', text)}
                style={[styles.inputField, styles.notesField]}
                editable={!isLoading}
                multiline={true}
                numberOfLines={3}
                textAlignVertical="top"
              />
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveButton, isLoading && styles.disabledButton]}
              onPress={handleSave}
              disabled={isLoading}
            >
              <Text style={styles.saveButtonText}>
                {isLoading
                  ? 'Saving...'
                  : editingTransaction
                  ? 'Update'
                  : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ManagePurchaseTransactions;

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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  transactionDetails: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF8C00',
    marginTop: 2,
  },
  transactionNotes: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
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
    paddingVertical: 50,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    borderRadius: 15,
    padding: 0,
    maxHeight: '90%',
    minHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  modalScrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scrollContent: {
    paddingVertical: 20,
    paddingBottom: 10,
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
    minHeight: 50,
  },
  notesField: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    marginBottom: 16,
    minHeight: 50,
    justifyContent: 'center',
  },
  picker: {
    color: '#000',
    backgroundColor: 'transparent',
  },
  saveButton: {
    backgroundColor: '#FF8C00',
    paddingVertical: 16,
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  actionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 12,
    padding: 4,
  },
});
