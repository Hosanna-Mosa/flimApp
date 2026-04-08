import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Platform,
  Linking,
} from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import {
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  History,
  TrendingUp,
  CreditCard,
  ChevronRight,
  X,
} from 'lucide-react-native';

import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/utils/api';
import Button from '@/components/Button';
import RazorpayCheckout from '@/components/RazorpayCheckout';
import { LinearGradient } from 'expo-linear-gradient';

export default function WalletScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { token, user, refreshUser } = useAuth();

  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [depositAmount, setDepositAmount] = useState('500');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const fetchWalletData = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      const data = await api.getWalletBalance(token || undefined);
      setBalance(data.balance);
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchWalletData();
    }, [])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchWalletData(false);
  };

  const handleDepositInitiate = () => {
    setDepositModalVisible(true);
  };

  const handleWithdrawInitiate = () => {
    if (balance <= 0) {
      Alert.alert('Insufficient Balance', 'You don\'t have any funds to withdraw.');
      return;
    }
    setWithdrawAmount(''); // Clear previous
    setWithdrawModalVisible(true);
  };

  const [razorpayModalVisible, setRazorpayModalVisible] = useState(false);
  const [razorpayOptions, setRazorpayOptions] = useState<any>(null);

  const executeDeposit = async () => {
    const amount = parseFloat(depositAmount);
    console.log('[Razorpay] Initiating deposit for amount:', amount);
    
    if (isNaN(amount) || amount <= 0) {
      console.error('[Razorpay] Invalid deposit amount:', depositAmount);
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    setDepositModalVisible(false);

    try {
      setIsProcessing(true);

      // Step 1: Create the intent on backend (returns real Razorpay Order ID)
      console.log('[Razorpay] Step 1: Creating order on backend...');
      const order = await api.createWalletOrder(amount, token || undefined);
      console.log('[Razorpay] Order created successfully:', order.id);

      // Step 2: Prepare the options for the WebView checkout
      const options = {
        key: order.keyId,
        order_id: order.id,
        name: 'FilmyApp',
        description: 'Wallet Deposit',
        prefill: {
          email: user?.email || '',
          contact: user?.phone || '',
          name: user?.name || ''
        },
        theme: { color: colors.primary },
        retry: { enabled: true, max_count: 3 },
        config: {
          display: {
            blocks: {
              upi: {
                name: 'UPI',
                instruments: [{ method: 'upi' }]
              }
            },
            sequence: ['block.upi', 'block.card', 'block.netbanking'],
            preferences: { show_default_blocks: true }
          }
        },
        _internal: {
          integration: 'reactjs',
          platform: 'mobile_app'
        }
      };

      console.log('[Razorpay] Step 2: Opening WebView with options:', JSON.stringify(options, null, 2));
      setRazorpayOptions(options);
      setRazorpayModalVisible(true);
      setIsProcessing(false);

    } catch (error: any) {
      console.error('[Razorpay] Step 1 Failed - Order creation error:', error);
      Alert.alert('Error', error.status === 404 ? 'User profile not found. Try logging out and back in' : (error.message || 'Failed to process transaction'));
      setIsProcessing(false);
    }
  };



  const handlePaymentSuccess = async (response: any) => {
    console.log('[Razorpay] Payment successful, verifying...');
    setRazorpayModalVisible(false);
    
    try {
      setIsProcessing(true);
      await api.verifyWalletPayment({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        amount: parseFloat(depositAmount)
      }, token || undefined);
      
      await refreshUser();
      setIsProcessing(false);

      router.push({
        pathname: '/wallet/success',
        params: { amount: depositAmount, type: 'deposit' }
      });
    } catch (err: any) {
      console.error('[Razorpay] Verification failed:', err);
      Alert.alert('Verification Failed', err.message || 'Failed to verify payment');
      setIsProcessing(false);
    }
  };

  const handlePaymentFailure = (error: any) => {
    console.error('[Razorpay] Payment failed:', error);
    setRazorpayModalVisible(false);
    const errorMsg = error.description || 'Transaction could not be completed';
    const errorCode = error.code ? ` (${error.code})` : '';
    Alert.alert('Payment Failed', errorMsg + errorCode);
  };

  const executeWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0 || amount > balance) {
      Alert.alert('Invalid Amount', `Please enter a valid amount (Max: ₹${balance}).`);
      return;
    }

    setWithdrawModalVisible(false);

    try {
      setIsProcessing(true);
      await api.withdrawWallet(amount, token || undefined);
      await refreshUser();

      Alert.alert('Withdrawal Successful', `₹${amount} has been withdrawn from your wallet.`);

      router.push({
        pathname: '/wallet/success',
        params: { amount: amount, type: 'withdrawal' }
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Withdrawal failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Wallet',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />

      {/* Deposit Amount Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={depositModalVisible}
        onRequestClose={() => setDepositModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Enter Amount</Text>
              <TouchableOpacity onPress={() => setDepositModalVisible(false)}>
                <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.currencySymbol, { color: colors.text }]}>₹</Text>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                keyboardType="numeric"
                value={depositAmount}
                onChangeText={setDepositAmount}
                autoFocus={true}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.quickAmounts}>
              {['100', '500', '1000', '2000'].map(val => (
                <TouchableOpacity
                  key={val}
                  style={[styles.quickAmountBtn, { backgroundColor: depositAmount === val ? colors.primary : colors.surface, borderColor: colors.border }]}
                  onPress={() => setDepositAmount(val)}
                >
                  <Text style={[styles.quickAmountText, { color: depositAmount === val ? '#000' : colors.text }]}>₹{val}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button
              title="Next"
              onPress={executeDeposit}
              variant="primary"
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>

      <RazorpayCheckout
        visible={razorpayModalVisible}
        options={razorpayOptions}
        onSuccess={handlePaymentSuccess}
        onFailure={handlePaymentFailure}
        onClose={() => setRazorpayModalVisible(false)}
      />

      {/* Withdraw Amount Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={withdrawModalVisible}
        onRequestClose={() => setWithdrawModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Withdraw Funds</Text>
              <TouchableOpacity onPress={() => setWithdrawModalVisible(false)}>
                <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ color: colors.textSecondary, marginBottom: 12 }}>Available Balance: ₹{balance}</Text>

            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.currencySymbol, { color: colors.text }]}>₹</Text>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                keyboardType="numeric"
                value={withdrawAmount}
                onChangeText={setWithdrawAmount}
                autoFocus={true}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <Button
              title="Next"
              onPress={executeWithdraw}
              variant="primary"
              style={styles.modalButton}
              disabled={!withdrawAmount || parseFloat(withdrawAmount) > balance}
            />
          </View>
        </View>
      </Modal>

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Balance Card */}
        <LinearGradient
          colors={['#1a1a1a', '#0a0a0a']}
          style={[styles.balanceCard, { borderColor: colors.border }]}
        >
          <View style={styles.balanceHeader}>
            <View style={[styles.iconBox, { backgroundColor: `${colors.primary}20` }]}>
              <WalletIcon size={24} color={colors.primary} />
            </View>
            <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Total Balance</Text>
          </View>

          <Text style={[styles.balanceAmount, { color: colors.text }]}>₹{balance.toLocaleString('en-IN')}</Text>

          <View style={styles.actionRow}>
            {balance === 0 ? (
              <Button
                title="Deposit Funds"
                onPress={handleDepositInitiate}
                style={styles.fullButton}
                loading={isProcessing}
              />
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.primary }]}
                  onPress={handleDepositInitiate}
                  disabled={isProcessing}
                >
                  <ArrowDownLeft size={20} color="#000" />
                  <Text style={styles.actionButtonText}>Deposit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
                  onPress={handleWithdrawInitiate}
                  disabled={isProcessing}
                >
                  <ArrowUpRight size={20} color={colors.text} />
                  <Text style={[styles.actionButtonText, { color: colors.text }]}>Withdraw</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </LinearGradient>


        {/* Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Transactions</Text>
            <TouchableOpacity>
              <Text style={{ color: colors.primary, fontSize: 13 }}>View All</Text>
            </TouchableOpacity>
          </View>

          {transactions.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <History size={40} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No transactions yet</Text>
            </View>
          ) : (
            <View style={styles.transactionList}>
              {transactions.slice(0, 10).map((tx, idx) => (
                <View key={idx} style={[styles.transactionItem, { borderBottomColor: colors.border }]}>
                  <View style={[
                    styles.txIconContainer,
                    { backgroundColor: tx.type === 'credit' ? '#4CAF5020' : '#FF525220' }
                  ]}>
                    {tx.type === 'credit' ?
                      <ArrowDownLeft size={20} color="#4CAF50" /> :
                      <ArrowUpRight size={20} color="#FF5252" />
                    }
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={[styles.txTitle, { color: colors.text }]}>{tx.description || 'Transaction'}</Text>
                    <Text style={[styles.txDate, { color: colors.textSecondary }]}>
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={[
                    styles.txAmount,
                    { color: tx.type === 'credit' ? '#4CAF50' : '#FF5252' }
                  ]}>
                    {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                  </Text>
                  <ChevronRight size={16} color={colors.textSecondary} style={{ marginLeft: 8 }} />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  balanceCard: {
    padding: 24,
    borderRadius: 28,
    borderWidth: 1,
    marginBottom: 32,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 42,
    fontWeight: '900',
    marginBottom: 24,
    letterSpacing: -1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  fullButton: {
    flex: 1,
    height: 56,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  gridItem: {
    flex: 1,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  gridLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    padding: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 14,
  },
  transactionList: {
    gap: 0,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  txIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
    marginLeft: 14,
  },
  txTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  txDate: {
    fontSize: 12,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    padding: 24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 20,
    height: 72,
    marginBottom: 24,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: 'bold',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 32,
    fontWeight: 'bold',
    height: '100%',
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  quickAmountBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalButton: {
    height: 56,
  },

});
