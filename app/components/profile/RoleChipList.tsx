import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutChangeEvent } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import Chip from '@/components/ui/Chip';

interface RoleChipListProps {
  roles: string[];
  /** Optional formatter (e.g. id → label). Defaults to the raw value. */
  getLabel?: (role: string) => string;
}

// One chip row: Chip medium height (~28px) + wrap gap.
const ROW_HEIGHT = 28;
const GAP = 8;

/**
 * Role chips that show a single row by default with a "See more" toggle when
 * they overflow — however many chips fit the width. Used on both profile
 * screens so the behaviour is identical.
 */
export default function RoleChipList({ roles, getLabel }: RoleChipListProps) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);

  if (!roles || roles.length === 0) return null;

  const overflows = contentHeight > ROW_HEIGHT + GAP / 2;

  const onContentLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h !== contentHeight) setContentHeight(h);
  };

  return (
    <View>
      <View style={[styles.clip, !expanded && { maxHeight: ROW_HEIGHT }]}>
        <View style={styles.wrap} onLayout={onContentLayout}>
          {roles.map((role, idx) => (
            <Chip key={`${role}-${idx}`} label={getLabel ? getLabel(role) : role} tone="neutral" />
          ))}
        </View>
      </View>
      {overflows && (
        <TouchableOpacity onPress={() => setExpanded((v) => !v)} hitSlop={8} style={styles.toggle}>
          <Text style={[styles.toggleText, { color: colors.primary }]}>
            {expanded ? 'See less' : 'See more'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  toggle: {
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
