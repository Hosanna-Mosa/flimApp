import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { PortfolioItem } from '@/hooks/usePortfolio';

interface PortfolioFormProps {
  value: PortfolioItem;
  onChange: (patch: Partial<PortfolioItem>) => void;
  onCancel: () => void;
  onAdd: () => void;
}

/** Inline "add a link" card: title, category, URL and Cancel / Add Item. */
export default function PortfolioForm({ value, onChange, onCancel, onAdd }: PortfolioFormProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.form, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Input
        label="Project Title"
        placeholder="e.g., Short Film, Commercial"
        value={value.title}
        onChangeText={(text) => onChange({ title: text })}
      />
      <Input
        label="Category / Role"
        placeholder="e.g., Actor, Director, Editor"
        value={value.type}
        onChangeText={(text) => onChange({ type: text })}
        containerStyle={styles.field}
      />
      <Input
        label="URL Link"
        placeholder="https://youtube.com/..."
        value={value.url}
        onChangeText={(text) => onChange({ url: text })}
        keyboardType="url"
        autoCapitalize="none"
        containerStyle={styles.field}
      />
      <View style={styles.actions}>
        <Button
          title="Cancel"
          onPress={onCancel}
          variant="outline"
          size="small"
          style={[styles.button, { backgroundColor: colors.surface }]}
        />
        <Button title="Add Item" onPress={onAdd} size="small" style={styles.button} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  field: {
    marginTop: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  button: {
    paddingVertical: 10,
    borderRadius: 10,
  },
});
