import React from 'react';
import { Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

const TERMS_URL = 'https://filmyconnect24.com/terms-and-conditions';

type Block = { kind: 'p' | 'bullet'; text: string };

interface TermsSection {
  title: string;
  blocks: Block[];
}

const p = (text: string): Block => ({ kind: 'p', text });
const bullet = (text: string): Block => ({ kind: 'bullet', text });

const SECTIONS: TermsSection[] = [
  {
    title: '1. Acceptance of Terms',
    blocks: [p('By accessing the platform, you agree to comply with these Terms and all applicable laws.')],
  },
  {
    title: '2. Account Registration',
    blocks: [
      p('Users must provide accurate information. You are responsible for keeping your login credentials secure.'),
      p('OTP authentication is used to verify identity. Misuse of OTP systems is strictly prohibited.'),
    ],
  },
  {
    title: '3. Permitted Use',
    blocks: [
      p('You agree not to:'),
      bullet('- Use the platform for illegal purposes'),
      bullet('- Attempt unauthorized access'),
      bullet('- Send spam or fraudulent content'),
      bullet('- Interfere with system security'),
    ],
  },
  {
    title: '4. User-Generated Content (UGC) Policy',
    blocks: [
      p(
        'FILMY CONNECT is a professional community. We enforce a zero-tolerance policy for objectionable content or abusive behavior.'
      ),
      p('By using our platform, you agree to the following strict rules:'),
      bullet(
        '- No objectionable content (including hate speech, pornography, sexual content, harassment, intellectual property violation, defamation, or graphic violence).'
      ),
      bullet('- No abusive behavior, bullying, or threat of violence toward other users.'),
      p('If you encounter offensive content or abusive users, please use our built-in safety tools:'),
      bullet(
        '- **Report Content:** Tap the three dots option menu on any post or comment to report it for review. All reports are investigated within 24 hours.'
      ),
      bullet(
        "- **Block Abusive Users:** Tap the three dots option menu on any user's profile to block them. Once blocked, you will no longer see any of their posts or be able to chat with them."
      ),
    ],
  },
  {
    title: '5. Service Availability',
    blocks: [p('We aim to provide uninterrupted service but do not guarantee availability at all times.')],
  },
  {
    title: '6. Data and Privacy',
    blocks: [
      p(
        'Your use of the platform is governed by our Privacy Policy. By using the service, you consent to data handling described there.'
      ),
    ],
  },
  {
    title: '7. Limitation of Liability',
    blocks: [
      p('FILMY CONNECT PRIVATE LIMITED is not liable for:'),
      bullet('- Service interruptions'),
      bullet('- Data loss outside our control'),
      bullet('- User misuse of the platform'),
    ],
  },
  {
    title: '8. Termination & Zero-Tolerance Enforcement',
    blocks: [
      p(
        'We have a zero-tolerance policy for policy violations. We reserves the right to immediately suspend or permanently terminate accounts, and remove any content, that violates these Terms or our UGC Policy without prior notice or refund.'
      ),
    ],
  },
  {
    title: '9. Changes to Terms',
    blocks: [p('We may update these Terms at any time. Continued use means acceptance of changes.')],
  },
  {
    title: '10. Governing Law',
    blocks: [p('These Terms are governed by the laws of India.')],
  },
  {
    title: '11. Contact',
    blocks: [p('FILMY CONNECT PRIVATE LIMITED'), p('Email: Filmyconnectpvt2@gmail.com')],
  },
];

/** The static Terms and Conditions text plus the "open on website" link. */
export default function TermsContent() {
  const { colors } = useTheme();
  const bodyStyle = { color: colors.textSecondary };

  return (
    <>
      <Text style={[styles.title, { color: colors.text }]}>Terms and Conditions</Text>
      <Text style={[styles.meta, bodyStyle]}>Last updated: 10-02-2026</Text>
      <Text style={[styles.paragraph, bodyStyle]}>
        By using our website or application, you agree to the following terms.
      </Text>

      {SECTIONS.map((section) => (
        <React.Fragment key={section.title}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
          {section.blocks.map((block, idx) => (
            <Text key={idx} style={[block.kind === 'bullet' ? styles.bullet : styles.paragraph, bodyStyle]}>
              {block.text}
            </Text>
          ))}
        </React.Fragment>
      ))}

      <TouchableOpacity
        style={[styles.websiteButton, { borderColor: colors.primary }]}
        onPress={() => Linking.openURL(TERMS_URL)}
      >
        <Text style={[styles.websiteButtonText, { color: colors.primary }]}>Open full Terms on website</Text>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  meta: {
    fontSize: 12,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 4,
  },
  websiteButton: {
    marginTop: 18,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  websiteButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
