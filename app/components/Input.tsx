import React from 'react';
import {
  TextInput,
  StyleSheet,
  View,
  Text,
  TextInputProps,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: object;
  renderLeft?: () => React.ReactNode;
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

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
    // Maintain focus when toggling password visibility
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      )}
      <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: error ? colors.error : colors.border }]}>
        {renderLeft && renderLeft()}
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            {
              color: colors.text,
            },
            renderLeft && { paddingLeft: 8 },
            style,
          ]}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={isPassword && !isPasswordVisible}
          {...props}
          {...(isPassword && {
            textContentType: 'password',
          })}
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
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
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
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  eyeIcon: {
    paddingRight: 16,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
});
