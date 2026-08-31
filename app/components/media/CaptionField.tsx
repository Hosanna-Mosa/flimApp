import React from 'react';
import Input from '@/components/Input';

interface CaptionFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  /** Box height in px (default 100). */
  height?: number;
  numberOfLines?: number;
  editable?: boolean;
}

/** Multiline, top-aligned Input for captions / post bodies. */
export default function CaptionField({
  label,
  placeholder,
  value,
  onChangeText,
  height = 100,
  numberOfLines = 4,
  editable = true,
}: CaptionFieldProps) {
  return (
    <Input
      label={label}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      multiline
      numberOfLines={numberOfLines}
      style={{ height, textAlignVertical: 'top' }}
      editable={editable}
    />
  );
}
