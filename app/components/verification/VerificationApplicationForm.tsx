import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BadgeCheck, Plus, ChevronDown } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import Input from '@/components/Input';
import Button from '@/components/Button';
import DocumentList from '@/components/verification/DocumentList';
import VerificationRejectionCard from '@/components/verification/VerificationRejectionCard';
import { VERIFICATION_TYPES, DocumentItem } from '@/constants/verification';

interface VerificationApplicationFormProps {
  /** Show the "Request Declined" notice above the form. */
  rejected?: boolean;
  /** Admin notes for the declined request. */
  rejectionNotes?: string;
  verificationType: string;
  reason: string;
  onChangeReason: (value: string) => void;
  documents: DocumentItem[];
  isSubmitting: boolean;
  /** 0–100, shown in the submit button label while uploading. */
  uploadProgress: number;
  onOpenTypePicker: () => void;
  onOpenDocPicker: () => void;
  onRemoveDocument: (index: number) => void;
  onSubmit: () => void;
}

/**
 * The "Get Verified" application: intro, category trigger, reason input,
 * supporting documents, and the submit button. Owns its own keyboard
 * avoidance (iOS offset 90 clears the native header) so the route stays clean.
 */
export default function VerificationApplicationForm({
  rejected = false,
  rejectionNotes,
  verificationType,
  reason,
  onChangeReason,
  documents,
  isSubmitting,
  uploadProgress,
  onOpenTypePicker,
  onOpenDocPicker,
  onRemoveDocument,
  onSubmit,
}: VerificationApplicationFormProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        style={[styles.flex, { backgroundColor: colors.background }]}
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

          {rejected && <VerificationRejectionCard adminNotes={rejectionNotes} />}

          <View style={styles.form}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>1. Professional Category</Text>
            <TouchableOpacity
              style={[styles.pickerTrigger, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={onOpenTypePicker}
            >
              <Text style={{ color: colors.text }}>
                {VERIFICATION_TYPES.find(t => t.value === verificationType)?.label}
              </Text>
              <ChevronDown size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <Text style={[styles.sectionTitle, styles.sectionTitleSpaced, { color: colors.text }]}>2. Confirm Notability</Text>
            <Input
              label="Why should you be verified?"
              placeholder="Explain your professional standing, achievements, or media presence..."
              value={reason}
              onChangeText={onChangeReason}
              multiline
              numberOfLines={4}
              style={styles.reasonInput}
            />

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>3. Supporting Documents</Text>
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: colors.primary }]}
                onPress={onOpenDocPicker}
              >
                <Plus size={16} color={colors.onPrimary} />
                <Text style={[styles.addBtnText, { color: colors.onPrimary }]}>Add</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Upload govt ID, portoflio links, or press articles.
            </Text>

            <DocumentList documents={documents} onRemove={onRemoveDocument} />

            <Button
              title={isSubmitting ? `Submitting (${uploadProgress}%)` : 'Submit Application'}
              onPress={onSubmit}
              loading={isSubmitting}
              style={styles.submit}
              size="large"
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 20 },
  intro: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '700', marginTop: 12 },
  subtitle: { fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },

  form: { paddingBottom: 40 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  sectionTitleSpaced: { marginTop: 24 },
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
  reasonInput: { height: 120, textAlignVertical: 'top', paddingTop: Platform.OS === 'ios' ? 12 : 0 },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addBtnText: { fontWeight: '700', fontSize: 14 },

  submit: { marginTop: 32 },
});
