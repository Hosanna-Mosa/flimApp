import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Modal, SafeAreaView, Platform } from 'react-native';
import Input from './Input';
import CountryPicker from './CountryPicker';
import { Country } from '@/utils/country';
import { useTheme } from '@/contexts/ThemeContext';
import { getExampleNumber, AsYouType } from 'libphonenumber-js';
import examples from 'libphonenumber-js/examples.mobile.json';
import { X } from 'lucide-react-native';

interface PhoneInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  countryCode: string;
  callingCode: string;
  onSelectCountry: (country: Country) => void;
  error?: string;
  placeholder?: string;
}

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
  const [modalVisible, setModalVisible] = useState(false);

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

  const handleSelect = (country: Country) => {
    onSelectCountry(country);
    setModalVisible(false);
  };

  return (
    <>
      <Input
        label={label}
        placeholder={placeholder || exampleNumber}
        keyboardType="phone-pad"
        value={value}
        onChangeText={handleTextChange}
        error={error}
        renderLeft={() => (
          <TouchableOpacity
            style={[styles.countryPickerButton, { borderRightColor: colors.border }]}
            onPress={() => setModalVisible(true)}
          >
            <Text style={[styles.countryCodeText, { color: colors.primary }]}>+{callingCode}</Text>
          </TouchableOpacity>
        )}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Country</Text>
            <TouchableOpacity 
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <CountryPicker 
            onSelect={handleSelect} 
            selectedCountryCode={countryCode} 
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  countryPickerButton: {
    paddingLeft: 16,
    paddingRight: 12,
    justifyContent: 'center',
    borderRightWidth: 1,
    marginRight: 8,
    alignSelf: 'stretch',
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
});
