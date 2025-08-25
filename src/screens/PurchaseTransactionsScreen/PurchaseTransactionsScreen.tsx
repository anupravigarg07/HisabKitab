import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
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
import HamburgerMenu from '../../components/HamburgerMenu';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import GoogleSheetsService from '../../services/GoogleSheetServices/GoogleSheetsService';
import { PurchaseTransaction } from '../../types/TransactionTypes';
import { styles } from './PurchaseTransactionsScreen.styles';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'PurchaseTransactionsScreen'
>;

const PurchaseTransactionsScreen: React.FC<Props> = ({ route }) => {
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
    unit: 'Kg',
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

    const amountNum = Number(amount);
    const quantityNum = Number(quantity);

    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid purchasing price');
      return;
    }

    if (isNaN(quantityNum) || quantityNum <= 0) {
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
            amount: amountNum,
            quantity: quantityNum,
            unit,
            notes,
          },
        );
        Alert.alert('Success', 'Purchase transaction updated successfully!');
      } else {
        await GoogleSheetsService.savePurchaseTransaction(email, {
          name: transactionName,
          amount: amountNum,
          quantity: quantityNum,
          unit,
          notes,
        });
        Alert.alert('Success', 'Purchase transaction saved successfully!');
      }

      setFormData({
        name: '',
        amount: '',
        quantity: '',
        unit: 'Kg',
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
        unit: 'Kg',
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
      amount: String(txn.amount),
      quantity: String(txn.quantity),
      unit: txn.unit || 'Kg',
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

      {/* Modal Form */}
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
                  <Picker.Item label="Kg" value="Kg" />
                  <Picker.Item label="Litre" value="Litre" />
                  <Picker.Item label="Box" value="Box" />
                  <Picker.Item label="Piece" value="Piece" />
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

export default PurchaseTransactionsScreen;
