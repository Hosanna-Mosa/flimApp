import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { X, Plus } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 5;

interface PollFormProps {
  question: string;
  onChangeQuestion: (text: string) => void;
  options: string[];
  onChangeOption: (text: string, index: number) => void;
  /** Shown only while there are more than two options. */
  onRemoveOption: (index: number) => void;
  /** Shown only while there are fewer than five options. */
  onAddOption: () => void;
}

/** Poll question input, one row per option (with ✕ remove), and "Add Option". */
export default function PollForm({
  question,
  onChangeQuestion,
  options,
  onChangeOption,
  onRemoveOption,
  onAddOption,
}: PollFormProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.pollForm}>
      <TextInput
        style={[styles.pollInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
        placeholder="Ask a question..."
        placeholderTextColor={colors.textSecondary}
        value={question}
        onChangeText={onChangeQuestion}
        autoFocus
      />
      {options.map((option, index) => (
        <View key={index} style={styles.pollOptionRow}>
          <TextInput
            style={[styles.pollOptionInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            placeholder={`Option ${index + 1}`}
            placeholderTextColor={colors.textSecondary}
            value={option}
            onChangeText={(text) => onChangeOption(text, index)}
          />
          {options.length > MIN_OPTIONS && (
            <TouchableOpacity
              onPress={() => onRemoveOption(index)}
              style={styles.removeButton}
              accessibilityRole="button"
              accessibilityLabel={`Remove option ${index + 1}`}
            >
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      ))}

      {options.length < MAX_OPTIONS && (
        <TouchableOpacity
          style={[styles.addOptionButton, { borderColor: colors.primary }]}
          onPress={onAddOption}
          accessibilityRole="button"
        >
          <Plus size={20} color={colors.primary} />
          <Text style={[styles.addOptionText, { color: colors.primary }]}>Add Option</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pollForm: {
    gap: 12,
    paddingBottom: 40,
  },
  pollInput: {
    padding: 12,
    fontSize: 18,
    borderRadius: 8,
    borderWidth: 1,
  },
  pollOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pollOptionInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  removeButton: {
    padding: 8,
  },
  addOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 8,
  },
  addOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
