import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * Current soft-keyboard height on Android, 0 when hidden (and always 0 on iOS,
 * where KeyboardAvoidingView is reliable). KeyboardAvoidingView's "padding"
 * behaviour computes its offset from the keyboard's screenY relative to the
 * view's measured frame, which is unreliable on Android edge-to-edge and can
 * leave a phantom gap — driving layout from the reported height directly is
 * what works.
 */
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const show = Keyboard.addListener('keyboardDidShow', (e) => {
      setHeight(e?.endCoordinates?.height ?? 0);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return height;
}
