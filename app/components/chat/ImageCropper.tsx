import React, { useMemo, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import {
  GestureHandlerRootView,
  PanGestureHandler,
  PinchGestureHandler,
  PanGestureHandlerGestureEvent,
  PinchGestureHandlerGestureEvent,
  State,
} from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImageManipulator from 'expo-image-manipulator';
import { X, Check } from 'lucide-react-native';

interface ImageCropperProps {
  uri: string | null;
  /** Natural pixel size of the source, needed to map the view back to pixels. */
  width?: number;
  height?: number;
  onCancel: () => void;
  onDone: (result: { uri: string; width: number; height: number }) => void;
}

const MAX_SCALE = 5;

/**
 * A crop tool in the style people already know from Instagram: the frame stays
 * put and the picture moves behind it. Whatever fills the frame is what gets
 * kept.
 *
 * The system cropper could not do this. It is a draggable rectangle over a
 * fixed picture, and on iOS that rectangle is locked to a square with no way
 * to widen it — so a portrait photo lost its top and bottom with no recourse.
 *
 * The whole picture is visible when the tool opens, so nothing is cropped
 * until the person actually zooms. Leaving without zooming returns the
 * original file untouched rather than a re-encoded copy of the same thing.
 */
export default function ImageCropper({
  uri,
  width,
  height,
  onCancel,
  onDone,
}: ImageCropperProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [busy, setBusy] = useState(false);

  // The frame is square, which is what the picker used to force anyway — the
  // difference is that the picture can now be positioned inside it.
  const frame = Math.min(screenWidth - 32, screenHeight - insets.top - insets.bottom - 220);

  const natural = useMemo(() => {
    const w = width || 1;
    const h = height || 1;
    // Scale so the whole picture sits inside the frame at rest.
    const fit = Math.min(frame / w, frame / h);
    return { w, h, displayW: w * fit, displayH: h * fit };
  }, [width, height, frame]);

  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  // Gesture handlers report deltas; these hold the committed value between them.
  const committed = useRef({ scale: 1, x: 0, y: 0 });
  const pinchRef = useRef(null);
  const panRef = useRef(null);

  if (!uri) return null;

  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

  /**
   * Keeps the picture covering the frame. Without this a pinch outwards leaves
   * blank strips inside the frame, and the crop then contains nothing.
   */
  const settle = () => {
    const s = clamp(committed.current.scale, 1, MAX_SCALE);
    const spanX = Math.max((natural.displayW * s - frame) / 2, 0);
    const spanY = Math.max((natural.displayH * s - frame) / 2, 0);

    committed.current.scale = s;
    committed.current.x = clamp(committed.current.x, -spanX, spanX);
    committed.current.y = clamp(committed.current.y, -spanY, spanY);

    Animated.parallel([
      Animated.spring(scale, { toValue: s, useNativeDriver: true, bounciness: 0 }),
      Animated.spring(translateX, { toValue: committed.current.x, useNativeDriver: true, bounciness: 0 }),
      Animated.spring(translateY, { toValue: committed.current.y, useNativeDriver: true, bounciness: 0 }),
    ]).start();
  };

  const onPinch = Animated.event<PinchGestureHandlerGestureEvent>(
    [{ nativeEvent: { scale } }],
    { useNativeDriver: true }
  );

  const onPinchStateChange = (e: PinchGestureHandlerGestureEvent) => {
    if (e.nativeEvent.state === State.END) {
      committed.current.scale *= e.nativeEvent.scale;
      scale.setValue(committed.current.scale);
      settle();
    }
  };

  const onPan = Animated.event<PanGestureHandlerGestureEvent>(
    [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
    { useNativeDriver: true }
  );

  const onPanStateChange = (e: PanGestureHandlerGestureEvent) => {
    if (e.nativeEvent.state === State.END) {
      committed.current.x += e.nativeEvent.translationX;
      committed.current.y += e.nativeEvent.translationY;
      translateX.setValue(committed.current.x);
      translateY.setValue(committed.current.y);
      settle();
    }
  };

  const confirm = async () => {
    const { scale: s, x, y } = committed.current;

    // Untouched: hand back the original rather than a re-encode of the same
    // pixels, which would cost quality and size for no change.
    if (s <= 1.001 && Math.abs(x) < 1 && Math.abs(y) < 1) {
      onDone({ uri, width: natural.w, height: natural.h });
      return;
    }

    setBusy(true);
    try {
      // Map the frame back onto the source. One display pixel covers
      // (natural width / displayed width) source pixels at rest, divided again
      // by the zoom.
      const perPixel = natural.w / (natural.displayW * s);
      const cropSize = frame * perPixel;

      const centreX = natural.w / 2 - x * perPixel;
      const centreY = natural.h / 2 - y * perPixel;

      const originX = clamp(centreX - cropSize / 2, 0, Math.max(natural.w - cropSize, 0));
      const originY = clamp(centreY - cropSize / 2, 0, Math.max(natural.h - cropSize, 0));

      const result = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            crop: {
              originX: Math.round(originX),
              originY: Math.round(originY),
              width: Math.round(Math.min(cropSize, natural.w)),
              height: Math.round(Math.min(cropSize, natural.h)),
            },
          },
        ],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );

      onDone({ uri: result.uri, width: result.width, height: result.height });
    } catch (err) {
      console.error('[cropper] Crop failed:', err);
      Alert.alert('Could not crop', 'Sending the original picture instead.');
      onDone({ uri, width: natural.w, height: natural.h });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible transparent={false} animationType="slide" onRequestClose={onCancel}>
      <GestureHandlerRootView style={styles.root}>
        <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={onCancel} hitSlop={12} style={styles.barButton} disabled={busy}>
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.barTitle}>Move and zoom</Text>
          <TouchableOpacity onPress={confirm} hitSlop={12} style={styles.barButton} disabled={busy}>
            {busy ? <ActivityIndicator color="#FFFFFF" /> : <Check size={24} color="#FFFFFF" />}
          </TouchableOpacity>
        </View>

        <View style={styles.stage}>
          <View style={[styles.frame, { width: frame, height: frame }]}>
            <PinchGestureHandler
              ref={pinchRef}
              simultaneousHandlers={panRef}
              onGestureEvent={onPinch}
              onHandlerStateChange={onPinchStateChange}
            >
              <Animated.View style={StyleSheet.absoluteFill}>
                <PanGestureHandler
                  ref={panRef}
                  simultaneousHandlers={pinchRef}
                  onGestureEvent={onPan}
                  onHandlerStateChange={onPanStateChange}
                >
                  <Animated.View style={styles.centre}>
                    <Animated.View
                      style={{
                        width: natural.displayW,
                        height: natural.displayH,
                        transform: [{ translateX }, { translateY }, { scale }],
                      }}
                    >
                      <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                    </Animated.View>
                  </Animated.View>
                </PanGestureHandler>
              </Animated.View>
            </PinchGestureHandler>
          </View>

          <Text style={styles.hint}>
            Drag to move, pinch to zoom. What fills the square is what is sent.
          </Text>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 10,
  },
  barButton: { padding: 10, minWidth: 44 },
  barTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 22 },
  frame: { overflow: 'hidden', backgroundColor: '#111111' },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hint: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
