import React from 'react';
import SelectableCard from '@/components/SelectableCard';
import { LANGUAGES } from '@/constants/languages';

interface LanguageStepProps {
  selected: string | null;
  onSelect: (id: string) => void;
}

/** Step 2: single-select list of profile languages. */
export default function LanguageStep({ selected, onSelect }: LanguageStepProps) {
  return (
    <>
      {LANGUAGES.map((language) => (
        <SelectableCard
          key={language.id}
          id={language.id}
          label={language.label}
          description={language.native}
          selected={selected === language.id}
          onToggle={onSelect}
        />
      ))}
    </>
  );
}
