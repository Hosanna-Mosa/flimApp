/** Human labels for the fields the backend can report as already taken. */
export const AUTH_FIELD_LABELS: Record<string, string> = {
  email: 'Email',
  phone: 'Phone number',
  password: 'Password',
  username: 'Username',
};

export const labelAuthField = (field: string): string => AUTH_FIELD_LABELS[field] || field;

/**
 * "The following field is already registered: Email" /
 * "The following fields are already registered: Email, Phone number"
 * (availability-check wording used on the Sign Up form).
 */
export function formatAlreadyRegisteredMessage(fields: string[]): string {
  const labels = fields.map(labelAuthField);
  return `The following ${labels.length === 1 ? 'field is' : 'fields are'} already registered: ${labels.join(', ')}`;
}

/**
 * Registration-conflict wording shared by Sign Up and Onboarding:
 * "Registration failed. The following field(s) …already registered: …"
 */
export function formatConflictMessage(fields: string[]): string {
  return `Registration failed. ${formatAlreadyRegisteredMessage(fields)}`;
}

/** Legacy single-field availability response: "This Email is already registered." */
export function formatSingleFieldMessage(field: string): string {
  return `This ${labelAuthField(field)} is already registered.`;
}
