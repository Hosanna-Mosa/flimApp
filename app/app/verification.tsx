import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// --- PAYMENT IMPORTS ---
// 1. Razorpay (Android)
let RazorpayCheckoutNative: any = null;
if (Platform.OS === 'android') {
  try {
    RazorpayCheckoutNative = require('react-native-razorpay').default;
  } catch (e) {
    console.log('[Razorpay] Native module not available');
  }
}

// 2. Apple IAP (iOS)
let IAP: any = null;
if (Platform.OS === 'ios') {
  try {
    IAP = require('react-native-iap');
  } catch (e) {
    console.log('[IAP] Native module not available (expected in Expo Go)');
  }
}
// -----------------------

import { Stack, useRouter, useFocusEffect } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import {
  BadgeCheck,
  FileText,
  Plus,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  Shield,
  Briefcase,
  Link2,
  FilePlus,
  LucideIcon,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { uploadMediaToCloudinary } from '@/utils/media';
import api from '@/utils/api';
import RazorpayCheckout from '@/components/RazorpayCheckout';

const IOS_PRODUCT_ID = 'com.filmyconnect.account.verification';

const VERIFICATION_TYPES = [
  { label: 'Content Creator', value: 'CREATOR' },
  { label: 'Celebrity', value: 'CELEBRITY' },
  { label: 'Brand', value: 'BRAND' },
  { label: 'Public Figure', value: 'PUBLIC_FIGURE' },
  { label: 'Journalist', value: 'JOURNALIST' },
];

interface DocTypeOption {
  label: string;
  value: string;
  icon: LucideIcon;
  desc: string;
}

const DOCUMENT_TYPES: DocTypeOption[] = [
  { label: 'Govt ID', value: 'ID_DOCUMENT', icon: Shield, desc: 'Passport, Pan, Aadhar' },
  { label: 'Portfolio', value: 'PROOF_OF_WORK', icon: Briefcase, desc: 'Credits, Proof of Work' },
  { label: 'Social Link', value: 'SOCIAL_LINK', icon: Link2, desc: 'Public Presence' },
  { label: 'Other', value: 'OTHER', icon: FilePlus, desc: 'Additional docs' },
];

interface DocumentItem {
  type: string;
  name: string;
  uri: string;
}

export default function VerificationScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { token, user, refreshUser } = useAuth();
  const insets = useSafeAreaInsets();

  const [status, setStatus] = useState<'LOADING' | 'NONE' | 'PENDING_DOCS' | 'APPROVED_DOCS' | 'ACTIVE' | 'REJECTED'>('LOADING');
  const [requestData, setRequestData] = useState<any>(null);

  // Payment States
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [iapProduct, setIapProduct] = useState<any>(null);
  
  // Razorpay Specific States
  const [razorpayModalVisible, setRazorpayModalVisible] = useState(false);
  const [razorpayOptions, setRazorpayOptions] = useState<any>(null);

  // Form State
  const [verificationType, setVerificationType] = useState('CREATOR');
  const [reason, setReason] = useState('');
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Modal State
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showDocTypePicker, setShowDocTypePicker] = useState(false);
  const [tempDocName, setTempDocName] = useState('');
  const [tempDocType, setTempDocType] = useState('ID_DOCUMENT');

  // --- iOS IAP Setup ---
  useEffect(() => {
    if (Platform.OS !== 'ios' || !IAP) return;

    let purchaseUpdateSubscription: any;
    let purchaseErrorSubscription: any;

    const setupIAP = async () => {
      try {
        console.log('[IAP] Initializing connection...');
        await IAP.initConnection();
        
        purchaseUpdateSubscription = IAP.purchaseUpdatedListener(async (purchase: any) => {
          const receipt = purchase.transactionReceipt;
          if (receipt) {
            console.log('[IAP] Purchase successful, verifying with backend:', purchase.transactionId);
            try {
              await handleIAPPurchaseSuccess(purchase);
            } catch (err) {
              console.error('[IAP] handleIAPPurchaseSuccess failed:', err);
            }
          }
        });

        purchaseErrorSubscription = IAP.purchaseErrorListener((error: any) => {
          console.warn('[IAP] Purchase error:', error);
          if (error.code !== 'E_USER_CANCELLED') {
            Alert.alert('Purchase Failed', error.message || 'An error occurred during the purchase.');
          }
          setIsProcessingPayment(false);
        });

        const products = await IAP.getProducts({ skus: [IOS_PRODUCT_ID] });
        if (products && products.length > 0) {
          setIapProduct(products[0]);
        }
      } catch (error) {
        console.error('[IAP] Setup failed:', error);
      }
    };

    setupIAP();

    return () => {
      if (purchaseUpdateSubscription) purchaseUpdateSubscription.remove();
      if (purchaseErrorSubscription) purchaseErrorSubscription.remove();
      try { IAP.endConnection(); } catch (e) {}
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchStatus();
    }, [fetchStatus])
  );

  const fetchStatus = useCallback(async () => {
    try {
      setStatus('LOADING');
      const updatedUser = await refreshUser();
      const vStatus = updatedUser?.verificationStatus || user?.verificationStatus || 'none';

      if (vStatus === 'none') {
        setStatus('NONE');
      } else if (vStatus === 'pending_docs') {
        const response = await api.getVerificationStatus(token || undefined) as any;
        setRequestData(response);

        if (response && response.status === 'APPROVED') {
          setStatus('APPROVED_DOCS');
        } else if (response && response.status === 'REJECTED') {
          setStatus('REJECTED');
        } else {
          setStatus('PENDING_DOCS');
        }
      } else if (vStatus === 'approved_docs') {
        setStatus('APPROVED_DOCS');
      } else if (vStatus === 'active') {
        setStatus('ACTIVE');
      } else if (vStatus === 'rejected') {
        const response = await api.getVerificationStatus(token || undefined) as any;
        setRequestData(response);
        setStatus('REJECTED');
      }
    } catch (error) {
      console.error('Failed to fetch verification status:', error);
      setStatus('NONE');
    }
  }, [refreshUser, token, user]);

  // --- Main Payment Handler ---
  const handlePayment = async () => {
    if (Platform.OS === 'android') {
      await handleRazorpayPayment();
    } else if (Platform.OS === 'ios') {
      await handleAppleIAP();
    }
  };

  // --- Android Razorpay Logic ---
  const handleRazorpayPayment = async () => {
    try {
      setIsProcessingPayment(true);
      const planId = '1_MONTH'; // Standard plan
      
      // Step 1: Create Order on Backend
      const order = await api.apiCreateSubscriptionOrder(planId, token || undefined);
      if (!order || !order.orderId) {
        throw new Error('Invalid order response from server');
      }

      // Step 2: Prepare options for checkout
      const options = {
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'FilmyConnect',
        description: `Verification Badge - ${planId}`,
        prefill: {
          email: user?.email || '',
          contact: user?.phone || '',
          name: user?.name || ''
        },
        theme: { color: colors.primary },
        retry: { enabled: true, max_count: 3 },
      };

      if (RazorpayCheckoutNative) {
        RazorpayCheckoutNative.open(options)
          .then((data: any) => {
            handleRazorpaySuccess({ ...data, razorpay_order_id: order.orderId });
          })
          .catch((error: any) => {
            handleRazorpayFailure(error);
          })
          .finally(() => {
            setIsProcessingPayment(false);
          });
      } else {
        setRazorpayOptions(options);
        setRazorpayModalVisible(true);
        setIsProcessingPayment(false);
      }
    } catch (error: any) {
      console.error('[Razorpay] Initiation failed:', error);
      Alert.alert('Payment Error', error.message || 'Failed to initiate payment');
      setIsProcessingPayment(false);
    }
  };

  const handleRazorpaySuccess = async (response: any) => {
    try {
      setIsProcessingPayment(true);
      setRazorpayModalVisible(false);
      await api.apiVerifySubscriptionPayment({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature
      }, token || undefined);

      Alert.alert('Success', 'Verification badge activated successfully!');
      fetchStatus();
      await refreshUser();
    } catch (e: any) {
      console.error('[Razorpay] Verification failed:', e);
      Alert.alert('Error', e.message || 'Payment verification failed');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleRazorpayFailure = (error: any) => {
    setRazorpayModalVisible(false);
    Alert.alert('Payment Failed', error.description || 'Transaction could not be completed');
  };

  // --- iOS Apple IAP Logic ---
  const handleAppleIAP = async () => {
    if (!IAP) {
      Alert.alert(
        'Feature Unavailable',
        'In-App Purchases are not available in Expo Go. Please use a Development Build (npx expo run:ios) to test this feature.'
      );
      return;
    }

    try {
      setIsProcessingPayment(true);
      console.log('[IAP] Requesting purchase for:', IOS_PRODUCT_ID);
      await IAP.requestPurchase({ sku: IOS_PRODUCT_ID });
    } catch (error: any) {
      console.error('[IAP] Purchase request failed:', error);
      if (error.code !== 'E_USER_CANCELLED') {
        Alert.alert('Error', error.message || 'Failed to initiate purchase');
      }
      setIsProcessingPayment(false);
    }
  };

  const handleIAPPurchaseSuccess = async (purchase: any) => {
    try {
      const transactionId = purchase.transactionId;
      await api.verifyBadge(transactionId!, token || undefined);
      await IAP.finishTransaction({ purchase, isConsumable: true });

      Alert.alert('Success', 'Verification badge activated successfully!');
      fetchStatus();
      await refreshUser();
    } catch (error: any) {
      console.error('[IAP] Backend verification failed:', error);
      Alert.alert('Error', error.message || 'Payment verification failed. Please contact support.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleRestorePurchases = async () => {
    if (!IAP) return;
    try {
      setIsProcessingPayment(true);
      const purchases = await IAP.getAvailablePurchases();
      if (purchases.length > 0) {
        const hasVerification = purchases.find((p: any) => p.productId === IOS_PRODUCT_ID);
        if (hasVerification) {
          Alert.alert('Restore', 'Previous purchase found. Verifying with backend...');
          await handleIAPPurchaseSuccess(hasVerification);
        } else {
          Alert.alert('Restore', 'No previous verification purchase found.');
        }
      } else {
        Alert.alert('Restore', 'No previous purchases found.');
      }
      setIsProcessingPayment(false);
    } catch (error) {
      console.error('[IAP] Restore failed:', error);
      Alert.alert('Error', 'Failed to restore purchases.');
      setIsProcessingPayment(false);
    }
  };

  const handleAddDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setDocuments([
          ...documents,
          {
            type: tempDocType,
            name: tempDocName || asset.name,
            uri: asset.uri,
          },
        ]);
        setTempDocName('');
        setShowDocTypePicker(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      Alert.alert('Required', 'Please explain why you want to be verified');
      return;
    }
    if (documents.length === 0) {
      Alert.alert('Required', 'Please add at least one supporting document');
      return;
    }

    try {
      setIsSubmitting(true);
      setUploadProgress(0);

      const uploadedDocs = [];
      const totalDocs = documents.length;

      for (let i = 0; i < totalDocs; i++) {
        const doc = documents[i];
        const isImage = doc.uri.match(/\.(jpg|jpeg|png|webp)$/i);
        const cloudinaryType = isImage ? 'image' : 'script';

        const uploadResult = await uploadMediaToCloudinary(
          { uri: doc.uri, name: doc.name },
          cloudinaryType,
          token!,
          (percent) => {
            const overallProgress = Math.round(((i * 100) + percent) / totalDocs);
            setUploadProgress(overallProgress);
          }
        );

        uploadedDocs.push({
          type: doc.type,
          url: uploadResult.url,
          name: doc.name,
        });
      }

      if (!token) {
        Alert.alert('Error', 'Session expired. Please log in again.');
        return;
      }

      await api.submitVerificationRequest({
        verificationType,
        reason,
        documents: uploadedDocs,
      }, token);

      Alert.alert('Success', 'Verification request submitted successfully!', [
        { text: 'OK', onPress: () => fetchStatus() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (status === 'PENDING_DOCS') {
      return (
        <ScrollView 
          contentContainerStyle={[styles.statusCard, { paddingBottom: insets.bottom + 20 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Clock size={64} color={colors.primary} />
          <Text style={[styles.statusTitle, { color: colors.text }]}>Documents Under Review</Text>
          <Text style={[styles.statusDesc, { color: colors.textSecondary }]}>
            Your verification request is currently being reviewed by our team.
            We'll notify you once a decision is made. Then you can pick a plan.
          </Text>
          <View style={[styles.infoBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Submitted on:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {requestData ? new Date(requestData.createdAt).toLocaleDateString() : 'Loading...'}
            </Text>
            <Text style={[styles.infoLabel, { color: colors.textSecondary, marginTop: 8 }]}>Type:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{requestData?.verificationType}</Text>
          </View>
          <Button title="Back to Settings" onPress={() => router.back()} variant="outline" style={{ marginTop: 24, width: '100%' }} />
        </ScrollView>
      );
    }

    if (status === 'APPROVED_DOCS') {
      return (
        <ScrollView 
          contentContainerStyle={[styles.planContainer, { paddingBottom: insets.bottom + 20 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.planHeader}>
            <CheckCircle2 size={48} color="#4CAF50" />
            <Text style={[styles.planTitle, { color: colors.text }]}>Documents Verified!</Text>
            <Text style={[styles.planSubtitle, { color: colors.textSecondary }]}>
              Your documents have been approved. Activate your verification badge to stand out.
            </Text>
          </View>

          <View style={styles.planGrid}>
            <TouchableOpacity
              style={[
                styles.planCard,
                { backgroundColor: colors.card, borderColor: colors.primary, borderWidth: 2 }
              ]}
              activeOpacity={0.8}
            >
              <View style={[styles.popularBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.popularText}>1 Month</Text>
              </View>
              <Text style={[styles.planLabel, { color: colors.text }]}>Verification Badge</Text>
              <Text style={[styles.planPrice, { color: colors.text }]}>
                {Platform.OS === 'ios' && iapProduct ? iapProduct.localizedPrice : '₹149'}
              </Text>
              <Text style={[styles.planDesc, { color: colors.textSecondary }]}>
                Get a blue checkmark on your profile and stand out in the community.
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.planFooter}>
            <Button
              title={isProcessingPayment ? "Processing..." : (Platform.OS === 'android' ? "Pay Now with Razorpay" : "Pay Now with Apple Pay")}
              onPress={handlePayment}
              disabled={isProcessingPayment}
              loading={isProcessingPayment}
              size="large"
            />
            
            {Platform.OS === 'ios' && (
              <TouchableOpacity onPress={handleRestorePurchases} style={{ marginTop: 12 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 13, textDecorationLine: 'underline' }}>
                  Restore Purchase
                </Text>
              </TouchableOpacity>
            )}

            {Platform.OS === 'ios' && !IAP && (
              <Text style={{ color: colors.error, fontSize: 12, marginTop: 12, textAlign: 'center' }}>
                Warning: Payments are disabled in Expo Go.
              </Text>
            )}
            
            <Text style={[styles.secureText, { color: colors.textSecondary, marginTop: 20 }]}>
              Secure payment via {Platform.OS === 'android' ? 'Razorpay' : 'Apple In-App Purchase'}. Badge activated instantly.
            </Text>
          </View>
        </ScrollView>
      );
    }

    if (status === 'ACTIVE') {
      return (
        <View style={[styles.statusCard, { paddingBottom: insets.bottom + 20 }]}>
          <CheckCircle2 size={64} color="#4CAF50" />
          <Text style={[styles.statusTitle, { color: colors.text }]}>You're Verified!</Text>
          <Text style={[styles.statusDesc, { color: colors.textSecondary }]}>
            Congratulations! Your account has been verified. The verification badge is now visible on your profile.
          </Text>
          <BadgeCheck size={100} color="#FFFFFF" fill={colors.primary} style={{ marginTop: 20 }} />
          <Button title="Go to Profile" onPress={() => router.push('/profile')} style={{ marginTop: 32, width: '100%' }} />
        </View>
      );
    }

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView 
          style={[styles.container, { backgroundColor: colors.background }]}
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.intro}>
              <BadgeCheck size={48} color={colors.primary} />
              <Text style={[styles.title, { color: colors.text }]}>Get Verified</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Verified accounts have blue checkmarks next to their names to show that we've confirmed they're the real presence of the professionals they represent.
              </Text>
            </View>

            {status === 'REJECTED' && (
              <View style={[styles.rejectionCard, { backgroundColor: `${colors.error}10`, borderColor: colors.error }]}>
                <View style={styles.rejectionHeader}>
                  <XCircle size={20} color={colors.error} />
                  <Text style={[styles.rejectionTitle, { color: colors.error }]}>Request Declined</Text>
                </View>
                <Text style={[styles.rejectionReason, { color: colors.text }]}>
                  Reason: {requestData?.adminNotes || 'Doesn\'t meet requirements at this time.'}
                </Text>
                <Text style={[styles.rejectionText, { color: colors.textSecondary }]}>
                  You can apply again after ensuring all requirements are met.
                </Text>
              </View>
            )}

            <View style={styles.form}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>1. Professional Category</Text>
              <TouchableOpacity
                style={[styles.pickerTrigger, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setShowTypePicker(true)}
              >
                <Text style={{ color: colors.text }}>
                  {VERIFICATION_TYPES.find(t => t.value === verificationType)?.label}
                </Text>
                <ChevronDown size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>2. Confirm Notability</Text>
              <Input
                label="Why should you be verified?"
                placeholder="Explain your professional standing, achievements, or media presence..."
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={4}
                style={{ height: 120, textAlignVertical: 'top', paddingTop: Platform.OS === 'ios' ? 12 : 0 }}
              />

              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>3. Supporting Documents</Text>
                <TouchableOpacity
                  style={[styles.addBtn, { backgroundColor: colors.primary }]}
                  onPress={() => setShowDocTypePicker(true)}
                >
                  <Plus size={16} color="#000" />
                  <Text style={styles.addBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Upload govt ID, portoflio links, or press articles.
              </Text>

              <View style={styles.docList}>
                {documents.length === 0 ? (
                  <View style={[styles.emptyDocs, { borderColor: colors.border }]}>
                    <HelpCircle size={24} color={colors.textSecondary} />
                    <Text style={{ color: colors.textSecondary, marginTop: 8 }}>No documents added yet</Text>
                  </View>
                ) : (
                  documents.map((doc, idx) => (
                    <View key={idx} style={[styles.docItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <FileText size={20} color={colors.primary} />
                      <View style={styles.docInfo}>
                        <Text style={[styles.docName, { color: colors.text }]} numberOfLines={1}>{doc.name}</Text>
                        <Text style={[styles.docType, { color: colors.textSecondary }]}>
                          {DOCUMENT_TYPES.find(d => d.value === doc.type)?.label}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => removeDocument(idx)}>
                        <X size={20} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>

              <Button
                title={isSubmitting ? `Submitting (${uploadProgress}%)` : 'Submit Application'}
                onPress={handleSubmit}
                loading={isSubmitting}
                style={{ marginTop: 32 }}
                size="large"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerTitle: status === 'APPROVED_DOCS' ? 'Activate Badge' :
            status === 'PENDING_DOCS' || status === 'ACTIVE' ? 'Verification Status' :
              'Apply for Verification',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />

      {renderContent()}

      {/* Type Picker Modal */}
      <Modal visible={showTypePicker} transparent animationType="slide" onRequestClose={() => setShowTypePicker(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => setShowTypePicker(false)}
          />
          <View style={[styles.bottomSheet, { backgroundColor: colors.surface }]}>
            <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />

            <View style={styles.sheetHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Apply for Category</Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Choose the professional category that best describes you
              </Text>
            </View>

            <View style={styles.docTypeGrid}>
              {VERIFICATION_TYPES.map((type) => {
                const isSelected = verificationType === type.value;
                return (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.docTypeCard,
                      { backgroundColor: colors.card, borderColor: isSelected ? colors.primary : colors.border },
                      isSelected && { borderWidth: 2 }
                    ]}
                    onPress={() => {
                      setVerificationType(type.value);
                      setShowTypePicker(false);
                    }}
                  >
                    <View style={[styles.iconCircle, { backgroundColor: isSelected ? `${colors.primary}20` : colors.background }]}>
                      <BadgeCheck size={20} color={isSelected ? colors.primary : colors.textSecondary} />
                    </View>
                    <View style={styles.docTypeInfo}>
                      <Text style={[styles.docTypeLabel, { color: isSelected ? colors.primary : colors.text }]}>{type.label}</Text>
                    </View>
                    <View style={[styles.radio, { borderColor: isSelected ? colors.primary : colors.border }]}>
                      {isSelected && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Button title="Cancel" onPress={() => setShowTypePicker(false)} variant="outline" />
            <View style={{ height: insets.bottom }} />
          </View>
        </View>
      </Modal>

      {/* Doc Type Selection Modal */}
      <Modal visible={showDocTypePicker} transparent animationType="slide" onRequestClose={() => setShowDocTypePicker(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => setShowDocTypePicker(false)}
          />
          <View style={[styles.bottomSheet, { backgroundColor: colors.surface }]}>
            <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />

            <View style={styles.sheetHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Document</Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Choose the type of document you want to upload
              </Text>
            </View>

            <View style={styles.docTypeGrid}>
              {DOCUMENT_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = tempDocType === type.value;
                return (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.docTypeCard,
                      { backgroundColor: colors.card, borderColor: isSelected ? colors.primary : colors.border },
                      isSelected && { borderWidth: 2 }
                    ]}
                    onPress={() => setTempDocType(type.value)}
                  >
                    <View style={[styles.iconCircle, { backgroundColor: isSelected ? `${colors.primary}20` : colors.background }]}>
                      <Icon size={20} color={isSelected ? colors.primary : colors.textSecondary} />
                    </View>
                    <View style={styles.docTypeInfo}>
                      <Text style={[styles.docTypeLabel, { color: isSelected ? colors.primary : colors.text }]}>{type.label}</Text>
                      <Text style={[styles.docTypeDesc, { color: colors.textSecondary }]}>{type.desc}</Text>
                    </View>
                    <View style={[styles.radio, { borderColor: isSelected ? colors.primary : colors.border }]}>
                      {isSelected && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.nameInputContainer}>
              <Input
                label="Document Name (Optional)"
                value={tempDocName}
                onChangeText={setTempDocName}
                placeholder="e.g. My Portfolio.pdf"
                style={{ backgroundColor: colors.background }}
              />
            </View>

            <View style={styles.sheetActionRow}>
              <Button
                title="Cancel"
                onPress={() => setShowDocTypePicker(false)}
                variant="outline"
                style={{ flex: 1 }}
              />
              <Button
                title="Continue to Upload"
                onPress={handleAddDocument}
                style={{ flex: 1.5 }}
              />
            </View>
            <View style={{ height: insets.bottom }} />
          </View>
        </View>
      </Modal>

      {/* Razorpay Component (only used on Android) */}
      <RazorpayCheckout
        visible={razorpayModalVisible}
        options={razorpayOptions}
        onSuccess={handleRazorpaySuccess}
        onFailure={handleRazorpayFailure}
        onClose={() => setRazorpayModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  intro: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 28, fontWeight: 'bold', marginTop: 12 },
  subtitle: { fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },

  statusCard: { flex: 1, padding: 40, alignItems: 'center', justifyContent: 'center' },
  statusTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 24 },
  statusDesc: { fontSize: 16, textAlign: 'center', marginTop: 12, lineHeight: 24 },
  infoBox: { width: '100%', padding: 20, borderRadius: 16, marginTop: 32 },
  infoLabel: { fontSize: 12, textTransform: 'uppercase', fontWeight: 'bold' },
  infoValue: { fontSize: 16, fontWeight: '600', marginTop: 4 },

  rejectionCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 24 },
  rejectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  rejectionTitle: { fontWeight: 'bold', fontSize: 16 },
  rejectionReason: { fontWeight: '600', marginBottom: 4 },
  rejectionText: { fontSize: 13 },

  form: { paddingBottom: 40 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold' },
  sectionSubtitle: { fontSize: 12, marginTop: 4, marginBottom: 12 },

  pickerTrigger: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 8,
  },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addBtnText: { color: '#000', fontWeight: 'bold', fontSize: 13 },

  docList: { gap: 12 },
  emptyDocs: { height: 100, borderStyle: 'dashed', borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  docItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1 },
  docInfo: { flex: 1, marginLeft: 12 },
  docName: { fontWeight: '600', fontSize: 14 },
  docType: { fontSize: 11, marginTop: 2 },

  planContainer: { padding: 20, alignItems: 'center' },
  planHeader: { alignItems: 'center', marginBottom: 32 },
  planTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 12 },
  planSubtitle: { fontSize: 15, textAlign: 'center', marginTop: 8, lineHeight: 22 },
  
  planGrid: { width: '100%', marginBottom: 32 },
  planCard: {
    padding: 24,
    borderRadius: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 12,
  },
  popularText: { color: '#000', fontWeight: 'bold', fontSize: 10 },
  planLabel: { fontSize: 18, fontWeight: 'bold' },
  planPrice: { fontSize: 32, fontWeight: 'bold', marginVertical: 8 },
  planDesc: { fontSize: 14, lineHeight: 20 },

  planFooter: { width: '100%', alignItems: 'center' },
  secureText: { fontSize: 12, textAlign: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalDismissArea: { flex: 1 },
  bottomSheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetHeader: { marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  modalSubtitle: { fontSize: 14, marginTop: 4 },

  docTypeGrid: { gap: 12, marginBottom: 24 },
  docTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  docTypeInfo: { flex: 1 },
  docTypeLabel: { fontSize: 16, fontWeight: '600' },
  docTypeDesc: { fontSize: 12, marginTop: 2 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5 },

  nameInputContainer: { marginBottom: 24 },
  sheetActionRow: { flexDirection: 'row', gap: 12 },
});
