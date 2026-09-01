import { useEffect, useState } from 'react';
import { Dimensions, Keyboard, Platform } from 'react-native';

/**
 * How many pixels the on-screen keyboard actually covers of the app window.
 *
 * Why not just `keyboard.height`: Android is configured with adjustResize, but
 * whether the window really shrinks depends on the device and OS version
 * (edge-to-edge on Android 15 often does not resize). Adding the raw keyboard
 * height on a device that DID resize pushes the composer up twice, so it ends
 * up half off-screen; not adding it on a device that did NOT resize leaves the
 * composer hidden behind the keyboard. Both were reported on real phones.
 *
 * Measuring the overlap fixes both cases with one number:
 *   overlap = windowHeight - keyboardTop
 * If the OS already resized the window, the keyboard starts at the window's
 * bottom edge and the overlap is ~0. If it did not, the overlap is the
 * keyboard's height. Either way the caller pads by exactly what is covered.
 *
 * Always 0 on iOS, where KeyboardAvoidingView handles this correctly.
 */
export function useKeyboardOverlap(): number {
  const [overlap, setOverlap] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    let keyboardTop: number | null = null;

    const recompute = () => {
      if (keyboardTop == null) {
        setOverlap(0);
        return;
      }
      const windowHeight = Dimensions.get('window').height;
      // Sub-pixel rounding can leave a 1px sliver; treat tiny values as zero.
      const covered = Math.round(windowHeight - keyboardTop);
      setOverlap(covered > 1 ? covered : 0);
    };

    const show = Keyboard.addListener('keyboardDidShow', (e) => {
      keyboardTop = e?.endCoordinates?.screenY ?? null;
      recompute();
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      keyboardTop = null;
      setOverlap(0);
    });
    // The window resize can land after keyboardDidShow on some devices.
    const dimensions = Dimensions.addEventListener('change', recompute);

    return () => {
      show.remove();
      hide.remove();
      dimensions.remove();
    };
  }, []);

  return overlap;
}
