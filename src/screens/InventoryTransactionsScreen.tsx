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
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Picker } from '@react-native-picker/picker';
import HamburgerMenu from '../components/HamburgerMenu';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import GoogleSheetsService from '../services/GoogleSheetServices/GoogleSheetsService';
import { InventoryFormData } from '../types/TransactionTypes';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'InventoryTransactionsScreen'
>;

interface CalculatedInventoryItem {
  id: string;
  date: string;
  productName: string;
  quantity: number;
  availableQuantity: number;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  totalValue: number;
  totalPurchaseValue: number;
  totalSalesValue: number;
  averagePurchasePrice: number;
  notes: string;
  status: string;
  lastPurchaseDate?: string;
  lastSaleDate?: string;
}

const InventoryTransactionsScreen: React.FC<Props> = ({ route }) => {
  const { name, email, photo } = route.params;

  if (!email) {
    Alert.alert('Error', 'User email is required');
    return null;
  }

  const [isModalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingInventory, setIsFetchingInventory] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<
    CalculatedInventoryItem[]
  >([]);
  const [formData, setFormData] = useState({
    productName: '',
    purchasePrice: '',
    sellingPrice: '',
    quantity: '',
    unit: 'Kg',
    notes: '',
  });

  useEffect(() => {
    fetchAndCalculateInventory();
  }, []);

  const fetchAndCalculateInventory = async () => {
    setIsFetchingInventory(true);
    try {
      const rawInventoryArray =
        await GoogleSheetsService.calculateCurrentInventory(email);

      // Map to ensure all required fields have default values
      const inventoryArray: CalculatedInventoryItem[] = rawInventoryArray.map(
        item => ({
          id: item.id,
          date: item.date || new Date().toISOString(),
          productName: item.productName || '',
          quantity: item.quantity ?? 0,
          availableQuantity: item.availableQuantity ?? 0,
          unit: item.unit || 'Kg',
          purchasePrice: item.purchasePrice ?? 0,
          sellingPrice: item.sellingPrice ?? 0,
          totalValue: item.totalValue ?? 0,
          totalPurchaseValue: item.totalPurchaseValue ?? 0,
          totalSalesValue: item.totalSalesValue ?? 0,
          averagePurchasePrice: item.averagePurchasePrice ?? 0,
          notes: item.notes || '',
          status: item.status || 'Active',
          lastPurchaseDate: item.lastPurchaseDate,
          lastSaleDate: item.lastSaleDate,
        }),
      );

      inventoryArray.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

      setInventoryItems(inventoryArray);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      Alert.alert('Error', 'Failed to load inventory data');
    } finally {
      setIsFetchingInventory(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAndCalculateInventory();
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

    const quantityNum = Number(quantity);
    const purchasePriceNum = purchasePrice ? Number(purchasePrice) : 0;
    const sellingPriceNum = sellingPrice ? Number(sellingPrice) : 0;

    if (isNaN(quantityNum) || quantityNum <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid quantity');
      return;
    }

    if (purchasePrice && (isNaN(purchasePriceNum) || purchasePriceNum < 0)) {
      Alert.alert('Validation Error', 'Please enter a valid purchase price');
      return;
    }

    if (sellingPrice && (isNaN(sellingPriceNum) || sellingPriceNum < 0)) {
      Alert.alert('Validation Error', 'Please enter a valid selling price');
      return;
    }

    setIsLoading(true);

    try {
      await GoogleSheetsService.savePurchaseTransaction(email, {
        name: productName,
        amount: purchasePriceNum,
        quantity: quantityNum,
        unit,
        notes:
          notes ||
          `Manual inventory addition${
            sellingPriceNum ? ` - Selling Price: ₹${sellingPriceNum}` : ''
          }`,
      });

      Alert.alert('Success', 'Inventory item added successfully!');
      setFormData({
        productName: '',
        purchasePrice: '',
        sellingPrice: '',
        quantity: '',
        unit: 'Kg',
        notes: '',
      });
      setModalVisible(false);
      await fetchAndCalculateInventory();
    } catch (error) {
      console.error('Error saving inventory item:', error);
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
      setFormData({
        productName: '',
        purchasePrice: '',
        sellingPrice: '',
        quantity: '',
        unit: 'Kg',
        notes: '',
      });
    }
  };

  const formatCurrency = (amount: number): string => {
    return `₹${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const getStockStatus = (
    availableQty: number,
  ): { text: string; color: string } => {
    if (availableQty <= 0) return { text: 'Out of Stock', color: '#FF4444' };
    else if (availableQty <= 5) return { text: 'Low Stock', color: '#FF8C00' };
    else return { text: 'In Stock', color: '#4CAF50' };
  };

  const renderInventoryContent = () => {
    if (isFetchingInventory) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#FF8C00" />
          <Text style={styles.loaderText}>Loading inventory...</Text>
        </View>
      );
    }

    if (inventoryItems.length > 0) {
      return (
        <View style={styles.transactionsContainer}>
          {inventoryItems.map(item => {
            const stockStatus = getStockStatus(item.availableQuantity);

            return (
              <View key={item.id} style={styles.transactionCard}>
                <View style={styles.transactionInfo}>
                  <View style={styles.productHeader}>
                    <Text style={styles.transactionName}>
                      {item.productName}
                    </Text>
                    <View
                      style={[
                        styles.stockBadge,
                        { backgroundColor: stockStatus.color },
                      ]}
                    >
                      <Text style={styles.stockBadgeText}>
                        {stockStatus.text}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.transactionDetails}>
                    Available: {item.availableQuantity} {item.unit} • Avg:{' '}
                    {formatCurrency(item.averagePurchasePrice)}
                  </Text>

                  {item.sellingPrice > 0 && (
                    <Text style={styles.sellingPriceText}>
                      Selling Price: {formatCurrency(item.sellingPrice)}
                    </Text>
                  )}

                  <Text style={styles.valueText}>
                    Total Value: {formatCurrency(item.totalPurchaseValue)}
                  </Text>

                  {(item.lastPurchaseDate || item.lastSaleDate) && (
                    <Text style={styles.dateText}>
                      Last Activity:{' '}
                      {formatDate(
                        item.lastPurchaseDate || item.lastSaleDate || '',
                      )}
                    </Text>
                  )}

                  {item.notes && (
                    <Text style={styles.transactionNotes}>{item.notes}</Text>
                  )}
                </View>

                <View style={styles.quantityDisplay}>
                  <Text
                    style={[
                      styles.quantityNumber,
                      { color: stockStatus.color },
                    ]}
                  >
                    {item.availableQuantity}
                  </Text>
                  <Text style={styles.quantityUnit}>{item.unit}</Text>
                </View>
              </View>
            );
          })}
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
        <Text style={styles.emptyText}>No inventory items found</Text>
        <Text style={styles.emptySubText}>
          Add purchase transactions to build your inventory
        </Text>
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
        <Text style={styles.tabTitle}>Inventory</Text>
        <Text style={styles.tabSubtitle}>
          Calculated from purchases & sales
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderInventoryContent()}
      </ScrollView>

      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>Add Inventory</Text>
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
              <Text style={styles.modalTitle}>Add Inventory Item</Text>
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
              showsVerticalScrollIndicator
              contentContainerStyle={styles.scrollContent}
            >
              <TextInput
                placeholder="Product Name"
                value={formData.productName}
                onChangeText={text => handleInputChange('productName', text)}
                style={styles.inputField}
                editable={!isLoading}
              />

              <TextInput
                placeholder="Purchase Price"
                value={formData.purchasePrice}
                onChangeText={text => handleInputChange('purchasePrice', text)}
                style={styles.inputField}
                keyboardType="numeric"
                editable={!isLoading}
              />

              <TextInput
                placeholder="Selling Price (optional)"
                value={formData.sellingPrice}
                onChangeText={text => handleInputChange('sellingPrice', text)}
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
                multiline
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
                {isLoading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default InventoryTransactionsScreen;

// ---------- Styles ----------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
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
  tabTitle: { fontSize: 16, fontWeight: '500', color: '#000' },
  tabSubtitle: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  content: { flex: 1, paddingHorizontal: 20 },
  transactionsContainer: { paddingTop: 20, paddingBottom: 100 },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionInfo: { flex: 1, paddingRight: 15 },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  transactionName: { fontSize: 16, fontWeight: '600', color: '#000', flex: 1 },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 10,
  },
  stockBadgeText: { fontSize: 10, fontWeight: '600', color: '#FFFFFF' },
  transactionDetails: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF8C00',
    marginBottom: 2,
  },
  sellingPriceText: { fontSize: 12, color: '#4CAF50', marginBottom: 2 },
  valueText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    marginBottom: 2,
  },
  dateText: { fontSize: 11, color: '#888', marginBottom: 2 },
  transactionNotes: { fontSize: 11, color: '#666', marginTop: 2 },
  quantityDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  quantityNumber: { fontSize: 20, fontWeight: 'bold' },
  quantityUnit: { fontSize: 12, color: '#666', fontWeight: '500' },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  illustration: { width: 250, height: 250, marginBottom: 20 },
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
  addButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  loaderText: { fontSize: 16, color: '#666', marginTop: 10, fontWeight: '500' },

  // Modal
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
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#000' },
  closeButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: { fontSize: 16, color: '#666', fontWeight: 'bold' },
  modalScrollView: { flex: 1, paddingHorizontal: 24 },
  scrollContent: { paddingVertical: 20, paddingBottom: 10 },
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
  notesField: { minHeight: 80, textAlignVertical: 'top' },
  pickerContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    marginBottom: 16,
    minHeight: 50,
    justifyContent: 'center',
  },
  picker: { color: '#000', backgroundColor: 'transparent' },
  saveButton: {
    backgroundColor: '#FF8C00',
    paddingVertical: 16,
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: { backgroundColor: '#ccc' },
  saveButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
});
