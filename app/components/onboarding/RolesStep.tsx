import React from 'react';
import SelectableCard from '@/components/SelectableCard';
import { ROLES } from '@/constants/roles';

interface RolesStepProps {
  selected: string[];
  onToggle: (id: string) => void;
}

/** Step 3: multi-select list of crafts. */
export default function RolesStep({ selected, onToggle }: RolesStepProps) {
  return (
    <>
      {ROLES.map((role) => (
        <SelectableCard
          key={role.id}
          id={role.id}
          label={role.label}
          icon={role.icon}
          selected={selected.includes(role.id)}
          onToggle={onToggle}
        />
      ))}
    </>
  );
}
