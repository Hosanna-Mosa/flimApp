import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import EmptyState from '@/components/ui/EmptyState';
import PortfolioItemRow from '@/components/portfolio/PortfolioItemRow';
import { PortfolioItem } from '@/hooks/usePortfolio';

interface PortfolioListProps {
  items: PortfolioItem[];
  /** Own portfolio: shows the add (+) button and per-row remove. */
  editable: boolean;
  /** The inline add form; while it is shown the (+) and empty state are hidden. */
  form?: React.ReactNode;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

/** "Project Links (n)" header, optional inline form, the link rows, and the empty state. */
export default function PortfolioList({ items, editable, form, onAdd, onRemove }: PortfolioListProps) {
  const { colors } = useTheme();
  const formVisible = form !== undefined && form !== null && form !== false;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Project Links ({items.length})</Text>
        {editable && !formVisible && (
          <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={onAdd}>
            <Plus size={20} color={colors.onPrimary} />
          </TouchableOpacity>
        )}
      </View>

      {editable && form}

      {items.map((item, index) => (
        <PortfolioItemRow key={index} item={item} onRemove={editable ? () => onRemove(index) : undefined} />
      ))}

      {items.length === 0 && !formVisible && (
        <EmptyState
          title={editable ? 'No portfolio links added yet.' : 'No portfolio links shared yet.'}
          style={[styles.empty, { borderColor: colors.border }]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 10,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
});
