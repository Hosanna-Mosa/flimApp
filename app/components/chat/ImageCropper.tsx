import React, { useEffect, useMemo, useRef, useState } from 'react';
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

const MAX_ZOOM = 5;

/**
 * Ratios offered under the frame. `null` is the picture's own, and it is the
 * default so opening the tool crops nothing — the frame matches the photo and
 * the whole thing is visible.
 */
const RATIOS: { label: string; value: number | null }[] = [
  { label: 'Original', value: null },
  { label: '1:1', value: 1 },
  { label: '4:5', value: 4 / 5 },
  { label: '16:9', value: 16 / 9 },
];

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
  const [ratio, setRatio] = useState<number | null>(null);
  /**
   * The space actually left for the frame, measured rather than guessed.
   * A fixed allowance for the bar and the ratio row was wrong on Android,
   * where the status and navigation bars differ from iOS, and the frame ended
   * up smaller than it needed to be with the slack showing as a gap above it.
   */
  const [stage, setStage] = useState({ w: 0, h: 0 });

  const source = useMemo(() => ({ w: width || 1, h: height || 1 }), [width, height]);

  /** The frame, sized to the chosen ratio within the space available. */
  const frame = useMemo(() => {
    // Fall back to the window only for the first render, before onLayout has
    // reported; it is replaced as soon as the real figure arrives.
    const maxW = (stage.w || screenWidth) - 24;
    const maxH = (stage.h || screenHeight * 0.6) - 24;
    const target = ratio ?? source.w / source.h;

    let w = maxW;
    let h = w / target;
    if (h > maxH) {
      h = maxH;
      w = h * target;
    }
    return { w, h };
  }, [ratio, source, stage, screenWidth, screenHeight]);

  /**
   * The size at which the picture exactly covers the frame — the floor for
   * zooming out. Fitting inside instead would leave blank bars whenever the two
   * ratios differ, and those bars would end up in the exported file.
   */
  const base = useMemo(() => {
    const cover = Math.max(frame.w / source.w, frame.h / source.h);
    return { w: source.w * cover, h: source.h * cover };
  }, [frame, source]);

  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  // Gesture handlers report deltas; these hold the committed value between them.
  const committed = useRef({ scale: 1, x: 0, y: 0 });
  const pinchRef = useRef(null);
  const panRef = useRef(null);

  // Changing the ratio re-frames the picture, so the old position no longer
  // means anything and is reset rather than carried into a frame it was never
  // chosen for.
  useEffect(() => {
    committed.current = { scale: 1, x: 0, y: 0 };
    scale.setValue(1);
    translateX.setValue(0);
    translateY.setValue(0);
  }, [ratio, scale, translateX, translateY]);

  if (!uri) return null;

  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

  /**
   * Keeps the picture covering the frame. Without this a pinch outwards leaves
   * blank strips inside the frame, and the crop then contains nothing.
   */
  const settle = () => {
    const s = clamp(committed.current.scale, 1, MAX_ZOOM);
    const spanX = Math.max((base.w * s - frame.w) / 2, 0);
    const spanY = Math.max((base.h * s - frame.h) / 2, 0);

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
    if (ratio === null && s <= 1.001 && Math.abs(x) < 1 && Math.abs(y) < 1) {
      onDone({ uri, width: source.w, height: source.h });
      return;
    }

    setBusy(true);
    try {
      // One display pixel covers this many source pixels at the current zoom.
      const perPixel = source.w / (base.w * s);

      const cropW = Math.min(frame.w * perPixel, source.w);
      const cropH = Math.min(frame.h * perPixel, source.h);

      const centreX = source.w / 2 - x * perPixel;
      const centreY = source.h / 2 - y * perPixel;

      const originX = clamp(centreX - cropW / 2, 0, Math.max(source.w - cropW, 0));
      const originY = clamp(centreY - cropH / 2, 0, Math.max(source.h - cropH, 0));

      const result = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            crop: {
              originX: Math.round(originX),
              originY: Math.round(originY),
              width: Math.round(cropW),
              height: Math.round(cropH),
            },
          },
        ],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );

      onDone({ uri: result.uri, width: result.width, height: result.height });
    } catch (err) {
      console.error('[cropper] Crop failed:', err);
      Alert.alert('Could not crop', 'Sending the original picture instead.');
      onDone({ uri, width: source.w, height: source.h });
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

        <View
          style={styles.stage}
          onLayout={(e) =>
            setStage({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })
          }
        >
          <View style={[styles.frame, { width: frame.w, height: frame.h }]}>
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
                        width: base.w,
                        height: base.h,
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

        </View>

        <View style={[styles.ratios, { paddingBottom: insets.bottom + 18 }]}>
          {RATIOS.map((r) => {
            const active = r.value === ratio;
            return (
              <TouchableOpacity
                key={r.label}
                onPress={() => setRatio(r.value)}
                style={[styles.ratio, active && styles.ratioActive]}
                activeOpacity={0.7}
              >
                <Text style={[styles.ratioText, active && styles.ratioTextActive]}>{r.label}</Text>
              </TouchableOpacity>
            );
          })}
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
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  frame: { overflow: 'hidden', backgroundColor: '#111111' },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ratios: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  ratio: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  ratioActive: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  ratioText: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '500' },
  ratioTextActive: { color: '#000000', fontWeight: '700' },
});
