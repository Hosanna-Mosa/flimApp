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
} from 'react-native';
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
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { uploadMediaToCloudinary } from '@/utils/media';
import api from '@/utils/api';

const VERIFICATION_TYPES = [
  { label: 'Content Creator', value: 'CREATOR' },
  { label: 'Celebrity', value: 'CELEBRITY' },
  { label: 'Brand', value: 'BRAND' },
  { label: 'Public Figure', value: 'PUBLIC_FIGURE' },
  { label: 'Journalist', value: 'JOURNALIST' },
];

const DOCUMENT_TYPES = [
  { label: 'ID Document (Govt ID)', value: 'ID_DOCUMENT' },
  { label: 'Proof of Work (Credits, Portfolio)', value: 'PROOF_OF_WORK' },
  { label: 'Social Media Link (Public profile)', value: 'SOCIAL_LINK' },
  { label: 'Other Documentation', value: 'OTHER' },
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

  const [status, setStatus] = useState<'LOADING' | 'NONE' | 'PENDING_DOCS' | 'APPROVED_DOCS' | 'ACTIVE' | 'REJECTED'>('LOADING');
  const [requestData, setRequestData] = useState<any>(null);
  
  // Step 2: Plans State
  const [selectedPlan, setSelectedPlan] = useState<'1_MONTH' | '3_MONTHS' | '6_MONTHS' | '9_MONTHS' | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

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

  useFocusEffect(
    useCallback(() => {
      fetchStatus();
    }, [])
  );

  const fetchStatus = async () => {
    try {
      setStatus('LOADING');
      // Always refresh user to get latest status
      const updatedUser = await refreshUser();
      
      const vStatus = updatedUser?.verificationStatus || user?.verificationStatus || 'none';
      
      if (vStatus === 'none') {
        setStatus('NONE');
      } else if (vStatus === 'pending_docs') {
        const response = await api.getVerificationStatus(token || undefined) as any;
        setRequestData(response);
        
        // Fallback: even if user.verificationStatus is still 'pending_docs', 
        // if the request itself is APPROVED, move to stage 3.
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
  };

  const PLANS = [
    { id: '1_MONTH', label: '1 Month', price: '₹499', description: 'Perfect for starters' },
    { id: '3_MONTHS', label: '3 Months', price: '₹1299', description: 'Most popular choice', popular: true },
    { id: '6_MONTHS', label: '6 Months', price: '₹2199', description: 'Best value for professionals' },
    { id: '9_MONTHS', label: '9 Months', price: '₹2999', description: 'The power creator package' },
  ] as const;

  const handlePayment = async (planId: '1_MONTH' | '3_MONTHS' | '6_MONTHS' | '9_MONTHS') => {
    try {
      setIsProcessingPayment(true);
      
      // Step 1: Create Order on Backend
      const order = await api.apiCreateSubscriptionOrder(planId, token || undefined);
      
      // Step 2: In a real app, this would open the Razorpay Native Modal.
      // Since we can't do that here, we'll simulate a successful payment for now.
      // If you are using react-native-razorpay, the code would be:
      /*
      var options = {
        description: 'Verification Badge Subscription',
        image: 'https://i.imgur.com/3g7Y69t.png',
        currency: order.currency,
        key: order.keyId,
        amount: order.amount,
        name: 'FilmyConnect',
        order_id: order.orderId,
        prefill: {
          email: user?.email,
          contact: user?.phone,
          name: user?.name
        },
        theme: {color: colors.primary}
      }
      RazorpayCheckout.open(options).then(async (data) => {
        await api.apiVerifySubscriptionPayment({
          razorpay_order_id: data.razorpay_order_id,
          razorpay_payment_id: data.razorpay_payment_id,
          razorpay_signature: data.razorpay_signature
        }, token);
        fetchStatus();
      })
      */
      
      // For this demo/setup, we will just show an alert or proceed if you want to skip actual Razorpay UI.
      Alert.alert(
        'Payment Demo', 
        `In a real build, we would open Razorpay checkout for ${planId} plan (${PLANS.find(p => p.id === planId)?.price}). Proceed with simulated success?`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setIsProcessingPayment(false) },
          { 
            text: 'Success', 
            onPress: async () => {
              try {
                // We simulate the callback from Razorpay
                // We actually call the backend with a special 'simulated_success' signature 
                // which the backend will accept ONLY in development mode.
                await api.apiVerifySubscriptionPayment({
                  razorpay_order_id: order.orderId,
                  razorpay_payment_id: `pay_simulated_${Date.now()}`,
                  razorpay_signature: 'simulated_success'
                }, token || undefined);

                Alert.alert('Success', 'Payment simulated and verified in database!');
                fetchStatus();
                // refreshUser to update global auth state
                await refreshUser();
              } catch (e: any) {
                Alert.alert('Error', e.message || 'Payment verification failed');
              } finally {
                setIsProcessingPayment(false);
              }
            }
          }
        ]
      );

    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to initiate payment');
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
        // Determine type for Cloudinary
        const isImage = doc.uri.match(/\.(jpg|jpeg|png|webp)$/i);
        const cloudinaryType = isImage ? 'image' : 'script';
        
        const uploadResult = await uploadMediaToCloudinary(
          { uri: doc.uri, name: doc.name },
          cloudinaryType,
          token!,
          (percent) => {
             // Basic progress tracking for multiple files
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

  if (status === 'LOADING') {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (status === 'PENDING_DOCS') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerTitle: 'Verification Status' }} />
        <View style={styles.statusCard}>
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
        </View>
      </View>
    );
  }

  if (status === 'APPROVED_DOCS') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerTitle: 'Select a Plan' }} />
        <ScrollView contentContainerStyle={styles.planContainer}>
          <View style={styles.planHeader}>
            <CheckCircle2 size={48} color="#4CAF50" />
            <Text style={[styles.planTitle, { color: colors.text }]}>Documents Verified!</Text>
            <Text style={[styles.planSubtitle, { color: colors.textSecondary }]}>
              Your documents have been approved. Pick a plan to activate your badge.
            </Text>
          </View>

          <View style={styles.planGrid}>
            {PLANS.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  selectedPlan === plan.id && { borderColor: colors.primary, borderWidth: 2 }
                ]}
                onPress={() => setSelectedPlan(plan.id)}
              >
                {('popular' in plan) && (
                  <View style={[styles.popularBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.popularText}>POPULAR</Text>
                  </View>
                )}
                <Text style={[styles.planLabel, { color: colors.text }]}>{plan.label}</Text>
                <Text style={[styles.planPrice, { color: colors.text }]}>{plan.price}</Text>
                <Text style={[styles.planDesc, { color: colors.textSecondary }]}>{plan.description}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.planFooter}>
             <Button 
               title={isProcessingPayment ? "Processing..." : "Pay Now with Razorpay"} 
               onPress={() => selectedPlan && handlePayment(selectedPlan)} 
               disabled={!selectedPlan || isProcessingPayment}
               loading={isProcessingPayment}
               size="large"
             />
             <Text style={[styles.secureText, { color: colors.textSecondary }]}>
               Secure payment via Razorpay. Badge activated instantly.
             </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (status === 'ACTIVE') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerTitle: 'Verification Status' }} />
        <View style={styles.statusCard}>
          <CheckCircle2 size={64} color="#4CAF50" />
          <Text style={[styles.statusTitle, { color: colors.text }]}>You're Verified!</Text>
          <Text style={[styles.statusDesc, { color: colors.textSecondary }]}>
            Congratulations! Your account has been verified. The verification badge is now visible on your profile.
          </Text>
          <BadgeCheck size={100} color="#FFFFFF" fill={colors.primary} style={{ marginTop: 20 }} />
          <Button title="Go to Profile" onPress={() => router.push('/profile')} style={{ marginTop: 32, width: '100%' }} />
        </View>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Apply for Verification',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
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
                Reason: {requestData.adminNotes || 'Doesn\'t meet requirements at this time.'}
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
              style={{ height: 120, textAlignVertical: 'top' }}
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

      {/* Type Picker Modal */}
      <Modal visible={showTypePicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Category</Text>
            {VERIFICATION_TYPES.map((type) => (
              <TouchableOpacity 
                key={type.value}
                style={[styles.modalOption, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setVerificationType(type.value);
                  setShowTypePicker(false);
                }}
              >
                <Text style={[styles.modalOptionText, { color: colors.text }]}>{type.label}</Text>
              </TouchableOpacity>
            ))}
            <Button title="Cancel" onPress={() => setShowTypePicker(false)} variant="outline" style={{ marginTop: 16 }} />
          </View>
        </View>
      </Modal>

      {/* Doc Type Selection Modal */}
      <Modal visible={showDocTypePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background, paddingBottom: 40 }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Document</Text>
            <Input
              label="Document Name (e.g. Passport, Portfolio)"
              value={tempDocName}
              onChangeText={setTempDocName}
              placeholder="Optional name..."
            />
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Document Type</Text>
            <View style={styles.typeGrid}>
               {DOCUMENT_TYPES.map((type) => (
                 <TouchableOpacity 
                   key={type.value}
                   style={[
                     styles.typeOption, 
                     { borderColor: colors.border },
                     tempDocType === type.value && { backgroundColor: `${colors.primary}20`, borderColor: colors.primary }
                   ]}
                   onPress={() => setTempDocType(type.value)}
                 >
                   <Text style={[styles.typeOptionText, { color: colors.text }]}>{type.label}</Text>
                 </TouchableOpacity>
               ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
                <Button title="Cancel" onPress={() => setShowDocTypePicker(false)} variant="outline" style={{ flex: 1 }} />
                <Button title="Choose File" onPress={handleAddDocument} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </>
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
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { padding: 24, borderRadius: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  modalOption: { paddingVertical: 16, borderBottomWidth: 1 },
  modalOptionText: { fontSize: 16 },
  
  inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeOption: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  typeOptionText: { fontSize: 12, fontWeight: '500' },

  planContainer: { padding: 20 },
  planHeader: { alignItems: 'center', marginBottom: 32 },
  planTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 16 },
  planSubtitle: { fontSize: 15, textAlign: 'center', marginTop: 8, lineHeight: 22 },
  planGrid: { gap: 16 },
  planCard: { padding: 20, borderRadius: 20, borderWidth: 1, position: 'relative', overflow: 'hidden' },
  popularBadge: { 
    position: 'absolute', 
    top: 0, 
    right: 0, 
    paddingHorizontal: 12, 
    paddingVertical: 4, 
    borderBottomLeftRadius: 12 
  },
  popularText: { color: '#000', fontSize: 10, fontWeight: '900' },
  planLabel: { fontSize: 18, fontWeight: 'bold' },
  planPrice: { fontSize: 24, fontWeight: '900', marginTop: 4 },
  planDesc: { fontSize: 13, marginTop: 8 },
  planFooter: { marginTop: 32, gap: 16, alignItems: 'center' },
  secureText: { fontSize: 12, textAlign: 'center' },
});
