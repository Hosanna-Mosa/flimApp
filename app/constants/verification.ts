import { Shield, Briefcase, Link2, FilePlus, LucideIcon } from 'lucide-react-native';

/** Subscription plan sent to Razorpay when activating the badge. */
export const VERIFICATION_PLAN = '1_MONTH';

export interface VerificationTypeOption {
  label: string;
  value: string;
}

/** Professional categories a user can apply under. */
export const VERIFICATION_TYPES: VerificationTypeOption[] = [
  { label: 'Content Creator', value: 'CREATOR' },
  { label: 'Celebrity', value: 'CELEBRITY' },
  { label: 'Brand', value: 'BRAND' },
  { label: 'Public Figure', value: 'PUBLIC_FIGURE' },
  { label: 'Journalist', value: 'JOURNALIST' },
];

export interface DocTypeOption {
  label: string;
  value: string;
  icon: LucideIcon;
  desc: string;
}

/** Kinds of supporting document accepted with an application. */
export const DOCUMENT_TYPES: DocTypeOption[] = [
  { label: 'Govt ID', value: 'ID_DOCUMENT', icon: Shield, desc: 'Passport, Pan, Aadhar' },
  { label: 'Portfolio', value: 'PROOF_OF_WORK', icon: Briefcase, desc: 'Credits, Proof of Work' },
  { label: 'Social Link', value: 'SOCIAL_LINK', icon: Link2, desc: 'Public Presence' },
  { label: 'Other', value: 'OTHER', icon: FilePlus, desc: 'Additional docs' },
];

/** A document picked locally, not yet uploaded. */
export interface DocumentItem {
  type: string;
  name: string;
  uri: string;
}
