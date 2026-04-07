import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { CheckCircle2, ArrowLeft } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import Button from '@/components/Button';
import { LinearGradient } from 'expo-linear-gradient';

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { amount, type } = useLocalSearchParams();

  // Prevent back button on Android to avoid going back to razorpay process
  useEffect(() => {
    const backAction = () => {
      handleDone();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, []);

  const handleDone = () => {
    // Go back to the wallet screen
    router.replace('/wallet');
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={['rgba(76, 175, 80, 0.1)', 'transparent']}
          style={styles.gradient}
        />
        
        <View style={styles.content}>
          <View style={[styles.iconContainer, { borderColor: `${colors.primary}40`, backgroundColor: `${colors.primary}10` }]}>
            <CheckCircle2 size={80} color="#4CAF50" />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            Payment Successful!
          </Text>
          
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            ₹{amount} has been {type === 'deposit' ? 'added to' : 'withdrawn from'} your wallet.
          </Text>

          <View style={[styles.receiptCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.receiptRow}>
              <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>Transaction Type</Text>
              <Text style={[styles.receiptValue, { color: colors.text }]}>
                {type === 'deposit' ? 'Wallet Deposit' : 'Wallet Withdrawal'}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.receiptRow}>
              <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>Amount</Text>
              <Text style={[styles.receiptValue, { color: colors.text, fontWeight: 'bold' }]}>₹{amount}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.receiptRow}>
              <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>Status</Text>
              <View style={[styles.statusBadge, { backgroundColor: '#4CAF5020' }]}>
                <Text style={styles.statusText}>Completed</Text>
              </View>
            </View>
          </View>

          <Button
            title="Go to Wallet"
            onPress={handleDone}
            style={styles.button}
            size="large"
          />
          
          <TouchableOpacity 
            style={styles.backLink}
            onPress={() => router.replace('/(tabs)/home')}
          >
            <Text style={{ color: colors.textSecondary }}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    height: '50%',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  receiptCard: {
    width: '100%',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 40,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  receiptLabel: {
    fontSize: 14,
  },
  receiptValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    width: '100%',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
  },
  button: {
    width: '100%',
    height: 56,
  },
  backLink: {
    marginTop: 24,
    padding: 10,
  },
});
