import React, { useMemo } from 'react';
import { Alert, Linking, StyleProp, Text, TextStyle } from 'react-native';

/**
 * Matches http(s) links, bare www. links, and bare domains.
 *
 * Trailing punctuation is deliberately excluded from the match: people end
 * sentences with links, and "see filmyconnect24.com." should not open a URL
 * with a full stop on the end. The closing bracket is excluded for the same
 * reason — links get wrapped in parentheses.
 */
const URL_PATTERN =
  /((?:https?:\/\/|www\.)[^\s<]+|(?:[a-z0-9-]+\.)+(?:com|in|org|net|io|co|app|dev|me|tv|info|biz)(?:\/[^\s<]*)?)/gi;

const TRAILING_JUNK = /[.,;:!?)\]}'"]+$/;

interface LinkifiedTextProps {
  children: string;
  style?: StyleProp<TextStyle>;
  linkStyle?: StyleProp<TextStyle>;
}

/**
 * Renders message text with any links tappable.
 *
 * Kept as plain Text segments rather than a webview or markdown renderer: a
 * chat bubble needs selectable text that wraps naturally, and anything heavier
 * breaks that for a feature this small.
 */
export default function LinkifiedText({ children, style, linkStyle }: LinkifiedTextProps) {
  const segments = useMemo(() => {
    const text = children ?? '';
    const out: { text: string; url?: string }[] = [];
    let lastIndex = 0;

    // Fresh regex per run: a global regex carries lastIndex between calls and
    // would skip matches on the second message rendered.
    const pattern = new RegExp(URL_PATTERN.source, 'gi');
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      const raw = match[0];
      const trimmed = raw.replace(TRAILING_JUNK, '');
      if (!trimmed) continue;

      // Skip the domain half of an email address. Checked by looking at the
      // preceding character rather than with a lookbehind, because Hermes does
      // not reliably support those and this has to run on device.
      const prev = text[match.index - 1];
      if (prev && (prev === '@' || /[A-Za-z0-9]/.test(prev))) {
        lastIndex = match.index + raw.length;
        out.push({ text: raw });
        continue;
      }

      if (match.index > lastIndex) {
        out.push({ text: text.slice(lastIndex, match.index) });
      }

      out.push({
        text: trimmed,
        url: /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`,
      });

      // Anything trimmed off the end is still part of the sentence.
      const dropped = raw.slice(trimmed.length);
      if (dropped) out.push({ text: dropped });

      lastIndex = match.index + raw.length;
    }

    if (lastIndex < text.length) out.push({ text: text.slice(lastIndex) });
    return out;
  }, [children]);

  const open = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert('Cannot open link', 'No app on this device can open that link.');
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('Cannot open link', 'Something went wrong opening that link.');
    }
  };

  // No links: render a single Text so the common case costs nothing extra.
  if (segments.length === 1 && !segments[0].url) {
    return <Text style={style}>{children}</Text>;
  }

  return (
    <Text style={style}>
      {segments.map((seg, i) =>
        seg.url ? (
          <Text
            key={i}
            style={[{ textDecorationLine: 'underline' }, linkStyle]}
            onPress={() => open(seg.url as string)}
            suppressHighlighting
          >
            {seg.text}
          </Text>
        ) : (
          seg.text
        )
      )}
    </Text>
  );
}
