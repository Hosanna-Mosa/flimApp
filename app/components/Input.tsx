import React from 'react';
import {
  TextInput,
  StyleSheet,
  View,
  TextInputProps,
  TouchableOpacity,
  Platform,
  NativeSyntheticEvent,
  TextInputSelectionChangeEventData,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import AppText from '@/components/AppText';
import { fontSize } from '@/constants/typography';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: object;
  renderLeft?: () => React.ReactNode;
}

interface EditOp {
  start: number;
  end: number;
  insertedText: string;
}

/**
 * Calculates the exact edit range and insertion based on the previous selection
 * and the newly changed text from onChangeText.
 */
function getEditOperation(
  oldText: string,
  newText: string,
  prevSel: { start: number; end: number }
): EditOp {
  const oldLen = oldText.length;
  const newLen = newText.length;
  
  if (prevSel.start !== prevSel.end) {
    // A selection was active and replaced
    const deletedLen = prevSel.end - prevSel.start;
    const addedLen = Math.max(0, newLen - (oldLen - deletedLen));
    const insertedText = newText.slice(prevSel.start, prevSel.start + addedLen);
    return {
      start: prevSel.start,
      end: prevSel.end,
      insertedText
    };
  } else {
    // Cursor was at a single point
    if (newLen < oldLen) {
      // Deletion (backspace)
      const diff = oldLen - newLen;
      const start = Math.max(0, prevSel.start - diff);
      return {
        start,
        end: prevSel.start,
        insertedText: ''
      };
    } else {
      // Insertion
      const diff = newLen - oldLen;
      const insertedText = newText.slice(prevSel.start, prevSel.start + diff);
      return {
        start: prevSel.start,
        end: prevSel.start,
        insertedText
      };
    }
  }
}

export default function Input({
  label,
  error,
  style,
  containerStyle,
  secureTextEntry,
  renderLeft,
  ...props
}: InputProps) {
  const { colors } = useTheme();
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
  const inputRef = React.useRef<TextInput>(null);

  const isPassword = secureTextEntry !== undefined;
  
  // Support both controlled and uncontrolled usage
  const [localRealValue, setLocalRealValue] = React.useState(props.defaultValue || '');
  const realValue = props.value !== undefined ? props.value : localRealValue;

  const [unmaskedIndex, setUnmaskedIndex] = React.useState<number | null>(null);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectionRef = React.useRef<{ start: number; end: number }>({ start: 0, end: 0 });

  // Sync with external value changes (e.g. form reset or autofill)
  const prevPropValueRef = React.useRef(props.value);
  React.useEffect(() => {
    if (props.value !== prevPropValueRef.current) {
      prevPropValueRef.current = props.value;
      if (props.value !== undefined) {
        setUnmaskedIndex(null);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }
    }
  }, [props.value]);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const getDisplayValue = (real: string, unmasked: number | null, visible: boolean) => {
    if (!isPassword || visible) return real;
    return real.split('').map((char, index) => index === unmasked ? char : '•').join('');
  };

  const displayVal = getDisplayValue(realValue, unmaskedIndex, isPasswordVisible);

  const handleChangeText = (newText: string) => {
    if (!isPassword) {
      if (props.value === undefined) {
        setLocalRealValue(newText);
      }
      if (props.onChangeText) {
        props.onChangeText(newText);
      }
      return;
    }

    const prevDisplay = getDisplayValue(realValue, unmaskedIndex, isPasswordVisible);
    const prevSel = selectionRef.current || { start: prevDisplay.length, end: prevDisplay.length };

    let newReal = '';
    let insertedText = '';
    let insertIndex = 0;

    if (!newText.includes('•')) {
      // Complete replacement (autofill, paste, clear)
      newReal = newText;
      insertedText = newText;
      insertIndex = 0;
      
      const newCursor = newText.length;
      selectionRef.current = { start: newCursor, end: newCursor };
    } else {
      // Partial edit (typing or partial deletion/paste)
      const op = getEditOperation(prevDisplay, newText, prevSel);
      newReal = realValue.slice(0, op.start) + op.insertedText + realValue.slice(op.end);
      insertedText = op.insertedText;
      insertIndex = op.start;

      const newCursor = op.start + op.insertedText.length;
      selectionRef.current = { start: newCursor, end: newCursor };
    }

    if (props.value === undefined) {
      setLocalRealValue(newReal);
    }
    if (props.onChangeText) {
      props.onChangeText(newReal);
    }

    if (insertedText.length > 0) {
      // Something was typed: unmask the newest character
      const newUnmasked = insertIndex + insertedText.length - 1;
      setUnmaskedIndex(newUnmasked);

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setUnmaskedIndex(null);
      }, 5000); // 5 seconds delayed mask
    } else {
      // Something was deleted: mask immediately
      setUnmaskedIndex(null);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  };

  const handleSelectionChange = (e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
    selectionRef.current = e.nativeEvent.selection;
    if (props.onSelectionChange) {
      props.onSelectionChange(e);
    }
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(prev => {
      const nextVisible = !prev;
      if (!nextVisible) {
        // If hiding, mask everything immediately
        setUnmaskedIndex(null);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }
      return nextVisible;
    });
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <AppText variant="bodySemibold" style={styles.label}>{label}</AppText>
      )}
      <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: error ? colors.error : colors.border }]}>
        {renderLeft && renderLeft()}
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            { color: colors.text },
            renderLeft && { paddingLeft: 8 },
            isPassword && !isPasswordVisible && {
              fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
            },
            style,
          ]}
          placeholderTextColor={colors.textSecondary}
          {...props}
          value={displayVal}
          onChangeText={handleChangeText}
          onSelectionChange={handleSelectionChange}
          secureTextEntry={false}
          autoCorrect={isPassword ? false : props.autoCorrect}
          autoCapitalize={isPassword ? 'none' : props.autoCapitalize}
          autoComplete={isPassword ? 'off' : props.autoComplete}
          textContentType={isPassword ? 'password' : props.textContentType}
          keyboardType={
            isPassword
              ? (Platform.OS === 'android' ? 'visible-password' : 'default')
              : props.keyboardType || 'default'
          }
          keyboardAppearance="dark"
        />
        {isPassword && (
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={togglePasswordVisibility}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            {isPasswordVisible ? (
              <EyeOff size={20} color={colors.textSecondary} />
            ) : (
              <Eye size={20} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <AppText variant="caption" color={colors.error} style={styles.error}>{error}</AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    minHeight: 52,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: fontSize.base,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  eyeIcon: {
    paddingRight: 16,
  },
  error: {
    marginTop: 4,
  },
});
