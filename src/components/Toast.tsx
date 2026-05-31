import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ColorPalette, fonts, radius } from '@/theme';
import { useTheme } from '@/context/ThemeContext';

interface ToastProps {
  /** 表示する文言。null/空のとき非表示。 */
  message: string | null;
  /** アイコン名（Ionicons）。省略時はチェックマーク。 */
  icon?: keyof typeof Ionicons.glyphMap;
}

/**
 * 画面下部に一時表示する軽量トースト。
 * message が変わるたびにフェードイン → 1.8 秒後にフェードアウトする。
 * 共有・コピーの成否フィードバックに使用する。
 */
export function Toast({ message, icon = 'checkmark-circle' }: ToastProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!message) return;
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }, 1800);
    return () => clearTimeout(timer);
  }, [message, opacity]);

  if (!message) return null;

  return (
    <Animated.View style={[styles.toast, { opacity }]} pointerEvents="none">
      <Ionicons name={icon} size={18} color={colors.bg} />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    toast: {
      position: 'absolute',
      left: 40,
      right: 40,
      bottom: 110,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: c.text,
      borderRadius: radius.input,
      paddingVertical: 12,
      paddingHorizontal: 16,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.18,
      shadowRadius: 9,
      elevation: 4,
    },
    text: {
      fontFamily: fonts.jp700,
      fontSize: 13,
      fontWeight: '700',
      color: c.bg,
      textAlign: 'center',
    },
  });
}
