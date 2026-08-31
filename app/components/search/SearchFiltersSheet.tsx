import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ROLES } from '@/constants/roles';
import { INDUSTRIES } from '@/constants/industries';
import Button from '@/components/Button';
import BottomSheet from '@/components/ui/BottomSheet';
import FilterGroup from '@/components/ui/FilterGroup';

interface SearchFiltersSheetProps {
  visible: boolean;
  onClose: () => void;
  roles: string[];
  industries: string[];
  onToggleRole: (id: string) => void;
  onToggleIndustry: (id: string) => void;
  onClear: () => void;
  onApply: () => void;
}

/** "Filters" bottom sheet: Roles + Industries groups with Clear / Apply. */
export default function SearchFiltersSheet({
  visible,
  onClose,
  roles,
  industries,
  onToggleRole,
  onToggleIndustry,
  onClear,
  onApply,
}: SearchFiltersSheetProps) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Filters"
      footer={
        <View style={styles.footer}>
          <Button title="Clear" onPress={onClear} variant="outline" style={styles.footerButton} />
          <Button title="Apply" onPress={onApply} style={styles.footerButton} />
        </View>
      }
    >
      <FilterGroup title="Roles" options={ROLES} selected={roles} onToggle={onToggleRole} />
      <FilterGroup title="Industries" options={INDUSTRIES} selected={industries} onToggle={onToggleIndustry} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
  },
  footerButton: {
    flex: 1,
  },
});
