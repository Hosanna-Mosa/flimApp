import React from 'react';
import SelectableCard from '@/components/SelectableCard';
import { INDUSTRIES } from '@/constants/industries';

interface IndustriesStepProps {
  selected: string[];
  onToggle: (id: string) => void;
}

/** Step 4: multi-select list of film industries. */
export default function IndustriesStep({ selected, onToggle }: IndustriesStepProps) {
  return (
    <>
      {INDUSTRIES.map((industry) => (
        <SelectableCard
          key={industry.id}
          id={industry.id}
          label={industry.label}
          description={industry.description}
          selected={selected.includes(industry.id)}
          onToggle={onToggle}
          color={industry.color}
        />
      ))}
    </>
  );
}
