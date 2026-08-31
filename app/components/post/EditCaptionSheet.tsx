import React from 'react';
import { View, StyleSheet } from 'react-native';
import BottomSheet from '@/components/ui/BottomSheet';
import Input from '@/components/Input';
import Button from '@/components/Button';

interface EditCaptionSheetProps {
  visible: boolean;
  value: string;
  loading: boolean;
  onChange: (text: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

/** Bottom sheet for the post author to rewrite the caption. */
export default function EditCaptionSheet({
  visible,
  value,
  loading,
  onChange,
  onClose,
  onSubmit,
}: EditCaptionSheetProps) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Edit Caption"
      scroll={false}
      footer={
        <View style={styles.footer}>
          <Button title="Cancel" onPress={onClose} variant="outline" style={styles.action} disabled={loading} />
          <Button
            title="Update"
            onPress={onSubmit}
            loading={loading}
            style={styles.action}
            disabled={!value.trim() || loading}
          />
        </View>
      }
    >
      <Input
        placeholder="Write a caption..."
        value={value}
        onChangeText={onChange}
        multiline
        numberOfLines={4}
        autoFocus
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
  },
  action: {
    flex: 1,
  },
});
