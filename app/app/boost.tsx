import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  Zap,
  CheckCircle2,
  TrendingUp,
  Target,
  Users,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/utils/api';
import Button from '@/components/Button';
import { LinearGradient } from 'expo-linear-gradient';

const BOOST_PLANS = [
  {
    id: 'BASIC_BOOST',
    label: 'Standard Boost',
    price: 299,
    duration: '24 Hours',
    description: 'Get 2x more visibility in the feed',
    features: ['Priority feed placement', 'Enhanced profile visibility'],
  },
  {
    id: 'PRO_BOOST',
    label: 'Pro Boost',
    price: 799,
    duration: '3 Days',
    description: 'Maximum exposure for your profile',
    popular: true,
    features: ['Top priority in feed forever*', 'Featured profile badge', 'Reach 5x more people'],
  },
  {
    id: 'ULTRA_BOOST',
    label: 'Ultra Boost',
    price: 1499,
    duration: '7 Days',
    description: 'The ultimate growth package',
    features: ['Dominant feed placement', 'Discovery page feature', 'Smart audience targeting'],
  },
];

export default function BoostScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { token, user, refreshUser } = useAuth();

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBoost = async () => {
    if (!selectedPlan) return;
    
    const plan = BOOST_PLANS.find(p => p.id === selectedPlan);
    if (!plan) return;

    try {
      setIsProcessing(true);
      
      // Step 1: Simulated Payment
      // In a real app, we would call the wallet balance or Razorpay here.
      // But per user request: "click next button finish the payment and show success message"
      
      // We will call a new backend endpoint
      await api.boostProfile(plan.id, token || undefined);
      
      await refreshUser();
      
      Alert.alert(
        'Profile Boosted! 🚀',
        `Your profile is now boosted for ${plan.duration}. Your posts will appear first in everyone's feed!`,
        [
          { 
            text: 'Awesome', 
            onPress: () => router.push('/(tabs)/profile')
          }
        ]
      );

    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to boost profile');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Boost Profile',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />

      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={[colors.primary, '#9C27B0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Zap size={48} color="#000" />
          <Text style={styles.headerTitle}>Skyrocket Your Reach</Text>
          <Text style={styles.headerSubtitle}>
            Boosted profiles get priority placement in the global feed.
          </Text>
        </LinearGradient>

        <View style={styles.content}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Select a Plan</Text>
          
          {BOOST_PLANS.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                { backgroundColor: colors.card, borderColor: colors.border },
                selectedPlan === plan.id && { borderColor: colors.primary, borderWidth: 2 }
              ]}
              onPress={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <View style={[styles.popularBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.popularText}>BEST VALUE</Text>
                </View>
              )}
              
              <View style={styles.planHeader}>
                <View>
                  <Text style={[styles.planLabel, { color: colors.text }]}>{plan.label}</Text>
                  <Text style={[styles.planDuration, { color: colors.textSecondary }]}>{plan.duration}</Text>
                </View>
                <Text style={[styles.planPrice, { color: colors.text }]}>₹{plan.price}</Text>
              </View>

              <Text style={[styles.planDesc, { color: colors.textSecondary }]}>{plan.description}</Text>
              
              <View style={styles.featureList}>
                {plan.features.map((feature, idx) => (
                  <View key={idx} style={styles.featureItem}>
                    <CheckCircle2 size={14} color={colors.primary} />
                    <Text style={[styles.featureText, { color: colors.textSecondary }]}>{feature}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))}

          <Button
            title={isProcessing ? "Processing..." : "Boost My Profile Now"}
            onPress={handleBoost}
            disabled={!selectedPlan || isProcessing}
            loading={isProcessing}
            style={styles.boostButton}
            size="large"
          />
          
          <View style={styles.infoBox}>
            <TrendingUp size={20} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Users see boosted content 5.4x more often on average.
            </Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 16,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.7)',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  planCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomLeftRadius: 16,
  },
  popularText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  planDuration: {
    fontSize: 13,
    marginTop: 2,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '900',
  },
  planDesc: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  featureList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 13,
  },
  boostButton: {
    marginTop: 20,
    height: 64,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 32,
    paddingBottom: 40,
  },
  infoText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
});
