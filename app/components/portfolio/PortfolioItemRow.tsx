import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { PortfolioItem } from '@/hooks/usePortfolio';

interface PortfolioItemRowProps {
  item: PortfolioItem;
  /** When set, an X on the right removes the link. */
  onRemove?: () => void;
}

/** One portfolio link: title, optional category, optional URL, optional remove. */
export default function PortfolioItemRow({ item, onRemove }: PortfolioItemRowProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
        {item.type && <Text style={[styles.type, { color: colors.textSecondary }]}>{item.type}</Text>}
        {item.url && (
          <Text style={[styles.url, { color: colors.primary }]} numberOfLines={1}>
            {item.url}
          </Text>
        )}
      </View>
      {onRemove && (
        <TouchableOpacity onPress={onRemove} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <X size={20} color={colors.error} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  content: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  type: {
    fontSize: 12,
    marginTop: 2,
  },
  url: {
    fontSize: 12,
    marginTop: 4,
  },
});
