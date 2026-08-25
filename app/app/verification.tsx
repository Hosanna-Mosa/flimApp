import React, { useState, useCallback } from 'react';
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

// --- PAYMENTS ---
// Razorpay *web* checkout is the single payment path on both iOS and Android:
// the app opens Razorpay's hosted page in the system browser, the user pays
// there, and the browser deep-links back. No native payment SDK is bundled and
// no in-app WebView is used. See utils/payments.ts for why.
// ----------------

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
import { startRazorpayWebCheckout } from '@/utils/payments';

const VERIFICATION_PLAN = '1_MONTH';

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

  // Payment State
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

  useFocusEffect(
    useCallback(() => {
      fetchStatus();
    }, [fetchStatus])
  );

  // --- Payment Handler (Razorpay web checkout, iOS + Android) ---
  //
  // Everything happens in the system browser: this only kicks the flow off and
  // then reacts to the server-confirmed outcome that comes back.
  const handlePayment = async () => {
    if (isProcessingPayment) return;

    try {
      setIsProcessingPayment(true);

      const outcome = await startRazorpayWebCheckout({
        token: token || '',
        purpose: 'SUBSCRIPTION',
        planType: VERIFICATION_PLAN,
        themeColor: colors.primary,
      });

      if (outcome.status === 'success') {
        await refreshUser();
        await fetchStatus();
        Alert.alert('Payment Successful', 'Your verification badge is now active.');
        return;
      }

      if (outcome.status === 'pending') {
        // Captured but not yet confirmed to us (webhook still in flight, or the
        // browser was closed before the redirect). Re-reading status is the
        // right move, not re-charging.
        await fetchStatus();
        Alert.alert(
          'Payment Processing',
          'We are still confirming your payment with the bank. Your badge will activate automatically once it clears — pull to refresh in a minute.'
        );
        return;
      }

      if (outcome.status === 'cancelled') {
        // Silent: the user closed the payment page on purpose.
        return;
      }

      Alert.alert('Payment Failed', outcome.reason || 'Transaction could not be completed.');
    } catch (error: any) {
      console.error('[Payments] Checkout failed:', error);
      Alert.alert('Payment Error', error?.message || 'Failed to start payment. Please try again.');
    } finally {
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
            We&apos;ll notify you once a decision is made. Then you can pick a plan.
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

          {/* Razorpay web checkout runs on both platforms, so no iOS gate here. */}
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
                ₹149
              </Text>
              <Text style={[styles.planDesc, { color: colors.textSecondary }]}>
                Get a blue checkmark on your profile and stand out in the community.
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.planFooter}>
            <Button
              title={isProcessingPayment ? 'Processing...' : 'Pay Now with Razorpay'}
              onPress={handlePayment}
              disabled={isProcessingPayment}
              loading={isProcessingPayment}
              size="large"
            />

            <Text style={[styles.secureText, { color: colors.textSecondary, marginTop: 20 }]}>
              You&apos;ll be taken to Razorpay&apos;s secure page in your browser, then returned
              here automatically.
            </Text>
          </View>
        </ScrollView>
      );
    }

    if (status === 'ACTIVE') {
      return (
        <View style={[styles.statusCard, { paddingBottom: insets.bottom + 20 }]}>
          <CheckCircle2 size={64} color="#4CAF50" />
          <Text style={[styles.statusTitle, { color: colors.text }]}>You&apos;re Verified!</Text>
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
                Verified accounts have blue checkmarks next to their names to show that we&apos;ve confirmed they&apos;re the real presence of the professionals they represent.
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

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  intro: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '700', marginTop: 12 },
  subtitle: { fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },

  statusCard: { flex: 1, padding: 40, alignItems: 'center', justifyContent: 'center' },
  statusTitle: { fontSize: 24, fontWeight: '700', marginTop: 24 },
  statusDesc: { fontSize: 16, textAlign: 'center', marginTop: 12, lineHeight: 24 },
  infoBox: { width: '100%', padding: 20, borderRadius: 16, marginTop: 32 },
  infoLabel: { fontSize: 12, textTransform: 'uppercase', fontWeight: '700' },
  infoValue: { fontSize: 16, fontWeight: '600', marginTop: 4 },

  rejectionCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 24 },
  rejectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  rejectionTitle: { fontWeight: '700', fontSize: 16 },
  rejectionReason: { fontWeight: '600', marginBottom: 4 },
  rejectionText: { fontSize: 14 },

  form: { paddingBottom: 40 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
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
  addBtnText: { color: '#000', fontWeight: '700', fontSize: 14 },

  docList: { gap: 12 },
  emptyDocs: { height: 100, borderStyle: 'dashed', borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  docItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1 },
  docInfo: { flex: 1, marginLeft: 12 },
  docName: { fontWeight: '600', fontSize: 14 },
  docType: { fontSize: 12, marginTop: 2 },

  planContainer: { padding: 20, alignItems: 'center' },
  planHeader: { alignItems: 'center', marginBottom: 32 },
  planTitle: { fontSize: 24, fontWeight: '700', marginTop: 12 },
  planSubtitle: { fontSize: 16, textAlign: 'center', marginTop: 8, lineHeight: 22 },
  
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
  popularText: { color: '#000', fontWeight: '700', fontSize: 10 },
  planLabel: { fontSize: 18, fontWeight: '700' },
  planPrice: { fontSize: 32, fontWeight: '700', marginVertical: 8 },
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
  modalTitle: { fontSize: 20, fontWeight: '700' },
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
