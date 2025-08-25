import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import HamburgerMenu from '../components/HamburgerMenu';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import GoogleSheetsService from '../services/GoogleSheetServices/GoogleSheetsService';
import { InventoryTransaction } from '../types/TransactionTypes';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ManageInventoryTransactions'
>;

type FormData = {
  productName: string;
  purchasePrice: string;
  sellingPrice: string;
  quantity: string;
  unit: string;
  notes: string;
};

const ManageInventoryTransactions: React.FC<Props> = ({ route }) => {
  const { email } = route.params;

  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    productName: '',
    purchasePrice: '',
    sellingPrice: '',
    quantity: '',
    unit: '',
    notes: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchTransactions = async () => {
    try {
      const data = await GoogleSheetsService.getInventoryTransactions(
        email,
        'inventory',
      );
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching inventory transactions:', error);
      Alert.alert('Error', 'Failed to fetch inventory transactions.');
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    const { productName, purchasePrice, sellingPrice, quantity, unit, notes } =
      formData;

    if (!productName || !quantity || !unit) {
      Alert.alert(
        'Validation Error',
        'Please fill all required fields (Product Name, Quantity, Unit)',
      );
      return;
    }

    if (
      purchasePrice &&
      (isNaN(Number(purchasePrice)) || Number(purchasePrice) < 0)
    ) {
      Alert.alert('Validation Error', 'Please enter a valid purchase price');
      return;
    }

    if (
      sellingPrice &&
      (isNaN(Number(sellingPrice)) || Number(sellingPrice) < 0)
    ) {
      Alert.alert('Validation Error', 'Please enter a valid selling price');
      return;
    }

    if (isNaN(Number(quantity)) || Number(quantity) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid quantity');
      return;
    }

    setIsLoading(true);

    try {
      await GoogleSheetsService.saveInventoryTransaction(email, 'inventory', {
        productName,
        purchasePrice: purchasePrice ? Number(purchasePrice) : undefined,
        sellingPrice: sellingPrice ? Number(sellingPrice) : undefined,
        quantity: Number(quantity),
        unit,
        notes,
      });

      Alert.alert('Success', 'Inventory item saved successfully!');
      setFormData({
        productName: '',
        purchasePrice: '',
        sellingPrice: '',
        quantity: '',
        unit: '',
        notes: '',
      });
      setModalVisible(false);
      await fetchTransactions();
    } catch (error) {
      console.error('Error saving inventory transaction:', error);
      Alert.alert('Error', 'Failed to save inventory item. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Icon name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Inventory</Text>
        <HamburgerMenu />
      </View>

      {/* Transactions List */}
      {isLoading ? (
        <ActivityIndicator size="large" color="#007BFF" />
      ) : (
        <ScrollView style={styles.transactionList}>
          {transactions.length === 0 ? (
            <Text style={styles.noData}>No inventory transactions found</Text>
          ) : (
            transactions.map(txn => (
              <View key={txn.id} style={styles.transactionCard}>
                <Text style={styles.transactionText}>
                  <Text style={styles.bold}>Product:</Text> {txn.productName}
                </Text>
                <Text style={styles.transactionText}>
                  <Text style={styles.bold}>Qty:</Text> {txn.quantity}{' '}
                  {txn.unit}
                </Text>
                <Text style={styles.transactionText}>
                  <Text style={styles.bold}>Purchase Price:</Text>{' '}
                  {txn.purchasePrice ?? '-'}
                </Text>
                <Text style={styles.transactionText}>
                  <Text style={styles.bold}>Selling Price:</Text>{' '}
                  {txn.sellingPrice ?? '-'}
                </Text>
                <Text style={styles.transactionText}>
                  <Text style={styles.bold}>Notes:</Text> {txn.notes || '-'}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Floating Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Icon name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Inventory</Text>
            <ScrollView>
              <TextInput
                style={styles.input}
                placeholder="Product Name"
                value={formData.productName}
                onChangeText={value => handleInputChange('productName', value)}
              />
              <TextInput
                style={styles.input}
                placeholder="Purchase Price"
                keyboardType="numeric"
                value={formData.purchasePrice}
                onChangeText={value =>
                  handleInputChange('purchasePrice', value)
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Selling Price"
                keyboardType="numeric"
                value={formData.sellingPrice}
                onChangeText={value => handleInputChange('sellingPrice', value)}
              />
              <TextInput
                style={styles.input}
                placeholder="Quantity"
                keyboardType="numeric"
                value={formData.quantity}
                onChangeText={value => handleInputChange('quantity', value)}
              />
              <TextInput
                style={styles.input}
                placeholder="Unit (e.g. kg, pcs)"
                value={formData.unit}
                onChangeText={value => handleInputChange('unit', value)}
              />
              <TextInput
                style={[styles.input, { height: 80 }]}
                placeholder="Notes"
                multiline
                value={formData.notes}
                onChangeText={value => handleInputChange('notes', value)}
              />
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#ccc' }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#007BFF' }]}
                onPress={handleSave}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ManageInventoryTransactions;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    elevation: 3,
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  transactionList: { padding: 10 },
  noData: { textAlign: 'center', marginTop: 20, color: '#666' },
  transactionCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
  },
  transactionText: { fontSize: 14, color: '#444', marginBottom: 3 },
  bold: { fontWeight: 'bold' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#007BFF',
    borderRadius: 50,
    padding: 15,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    marginLeft: 10,
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});
