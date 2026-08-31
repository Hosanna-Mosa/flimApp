import { useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { api } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { uploadMediaToCloudinary } from '@/utils/media';
import { startRazorpayWebCheckout } from '@/utils/payments';
import { VERIFICATION_PLAN, DocumentItem } from '@/constants/verification';

// --- PAYMENTS ---
// Razorpay *web* checkout is the single payment path on both iOS and Android:
// the app opens Razorpay's hosted page in the system browser, the user pays
// there, and the browser deep-links back. No native payment SDK is bundled and
// no in-app WebView is used. See utils/payments.ts for why.
// ----------------

export type VerificationStatus =
  | 'LOADING'
  | 'NONE'
  | 'PENDING_DOCS'
  | 'APPROVED_DOCS'
  | 'ACTIVE'
  | 'REJECTED';

/**
 * All Verification-screen logic: the status machine (re-read on focus), the
 * badge payment via Razorpay web checkout, and the application form
 * (category, reason, documents, sequential Cloudinary uploads). The screen
 * and its components stay presentational.
 */
export function useVerification() {
  const { colors } = useTheme();
  const { token, user, refreshUser } = useAuth();

  const [status, setStatus] = useState<VerificationStatus>('LOADING');
  const [requestData, setRequestData] = useState<any>(null);

  // Payment State
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Form State
  const [verificationType, setVerificationType] = useState('CREATOR');
  const [reason, setReason] = useState('');
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Draft for the document being added (type + optional display name)
  const [tempDocName, setTempDocName] = useState('');
  const [tempDocType, setTempDocType] = useState('ID_DOCUMENT');

  // Latest auth values via refs so fetchStatus keeps a stable identity.
  // refreshUser() replaces `user`, so depending on it directly re-created this
  // callback → re-ran the focus effect → refreshed again, in a loop.
  const userRef = useRef(user);
  const refreshUserRef = useRef(refreshUser);
  const tokenRef = useRef(token);
  userRef.current = user;
  refreshUserRef.current = refreshUser;
  tokenRef.current = token;

  const fetchStatus = useCallback(async () => {
    try {
      // Only the very first load shows the loading state; later refreshes
      // keep the current card on screen until the new status arrives.
      const token = tokenRef.current;
      const updatedUser = await refreshUserRef.current();
      const vStatus = updatedUser?.verificationStatus || userRef.current?.verificationStatus || 'none';

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
  }, []);

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

  /**
   * Opens the system document picker for the drafted type/name. Returns true
   * when a document was added (caller closes the sheet).
   */
  const handleAddDocument = async (): Promise<boolean> => {
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
        return true;
      }
    } catch {
      Alert.alert('Error', 'Failed to pick document');
    }
    return false;
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

  return {
    status,
    requestData,
    isProcessingPayment,
    handlePayment,
    form: {
      verificationType,
      setVerificationType,
      reason,
      setReason,
      documents,
      isSubmitting,
      uploadProgress,
      removeDocument,
      submit: handleSubmit,
    },
    docDraft: {
      type: tempDocType,
      setType: setTempDocType,
      name: tempDocName,
      setName: setTempDocName,
      add: handleAddDocument,
    },
  };
}
