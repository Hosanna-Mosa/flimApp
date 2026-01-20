import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import CountryPicker, { CountryCode, Country, DARK_THEME } from 'react-native-country-picker-modal';
import Input from './Input';
import { useTheme } from '@/contexts/ThemeContext';
import { getExampleNumber, AsYouType } from 'libphonenumber-js';
import examples from 'libphonenumber-js/examples.mobile.json';

interface PhoneInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  countryCode: CountryCode;
  callingCode: string;
  onSelectCountry: (country: Country) => void;
  error?: string;
  placeholder?: string;
}

const CUSTOM_DARK_THEME = {
  ...DARK_THEME,
  backgroundColor: '#1A1A1A',
  filterPlaceholderTextColor: '#888',
  activeOpacity: 0.5,
  itemHeight: 50,
};

export default function PhoneInput({
  label,
  value,
  onChangeText,
  countryCode,
  callingCode,
  onSelectCountry,
  error,
  placeholder,
}: PhoneInputProps) {
  const { colors } = useTheme();

  // Generate example number for the selected country
  const exampleNumber = React.useMemo(() => {
    try {
      const example = getExampleNumber(countryCode as any, examples);
      return example ? example.formatNational() : '98765 43210';
    } catch (e) {
      return '98765 43210';
    }
  }, [countryCode]);

  const handleTextChange = (text: string) => {
    // Keep only digits and plus sign
    const cleaned = text.replace(/[^\d+]/g, '');
    const formatter = new AsYouType(countryCode as any);
    const formatted = formatter.input(cleaned);
    onChangeText(formatted);
  };

  return (
    <Input
      label={label}
      placeholder={placeholder || exampleNumber}
      keyboardType="phone-pad"
      value={value}
      onChangeText={handleTextChange}
      error={error}
      renderLeft={() => (
        <View style={[styles.countryPickerWrapper, { borderRightColor: colors.border }]}>
          <CountryPicker
            countryCode={countryCode}
            withFilter
            withFlag
            withCallingCode
            withAlphaFilter
            withCallingCodeButton
            onSelect={onSelectCountry}
            theme={CUSTOM_DARK_THEME}
            containerButtonStyle={styles.countryPickerButton}
          />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  countryPickerWrapper: {
    paddingLeft: 12,
    justifyContent: 'center',
    borderRightWidth: 1,
    marginRight: 8,
  },
  countryPickerButton: {
    marginTop: 0,
  },
});
