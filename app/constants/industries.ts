import { Industry } from '@/types';

export interface IndustryData {
  id: Industry;
  label: string;
  description: string;
  color: string;
}

export const INDUSTRIES: IndustryData[] = [
  {
    id: 'tollywood',
    label: 'Tollywood',
    description: 'Telugu Cinema',
    color: '#FF6B6B',
  },
  {
    id: 'bollywood',
    label: 'Bollywood',
    description: 'Hindi Cinema',
    color: '#FFD700',
  },
  {
    id: 'kollywood',
    label: 'Kollywood',
    description: 'Tamil Cinema',
    color: '#4ECDC4',
  },
  {
    id: 'mollywood',
    label: 'Mollywood',
    description: 'Malayalam Cinema',
    color: '#95E1D3',
  },
  {
    id: 'sandalwood',
    label: 'Sandalwood',
    description: 'Kannada Cinema',
    color: '#F38181',
  },
  {
    id: 'punjabi',
    label: 'Punjabi',
    description: 'Punjabi Cinema',
    color: '#AA96DA',
  },
  {
    id: 'bengali',
    label: 'Bengali',
    description: 'Bengali Cinema',
    color: '#FCBAD3',
  },
  {
    id: 'bhojpuri',
    label: 'Bhojpuri',
    description: 'Bhojpuri Cinema',
    color: '#FFFFD2',
  },
  {
    id: 'marathi',
    label: 'Marathi',
    description: 'Marathi Cinema',
    color: '#A8D8EA',
  },
];
