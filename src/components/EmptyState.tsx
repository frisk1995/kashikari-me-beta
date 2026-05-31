import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ColorPalette, fonts, radius } from '@/theme';
import { useTheme } from '@/context/ThemeContext';

interface EmptyStateProps {
  heading: string;
  description: string;
}

/** グループ0件などの空状態ブロック（¥アイコン付き） */
export function EmptyState({ heading, description }: EmptyStateProps) {
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.wrap}>
      <View style={[styles.icon, shadows.emptyIcon]}>
        <View style={styles.innerCircle}>
          <Text style={styles.yen}>¥</Text>
        </View>
      </View>
      <Text style={styles.heading}>{heading}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    wrap: {
      marginTop: 30,
      alignItems: 'center',
      paddingHorizontal: 14,
    },
    icon: {
      width: 108,
      height: 108,
      borderRadius: radius.emptyIcon,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
      backgroundColor: c.surfaceAlt,
    },
    innerCircle: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    yen: {
      fontFamily: fonts.baloo800,
      fontSize: 26,
      fontWeight: '800',
      color: c.primary,
    },
    heading: {
      fontFamily: fonts.jp800,
      fontSize: 19,
      fontWeight: '800',
      color: c.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    description: {
      fontFamily: fonts.jp500,
      fontSize: 13,
      fontWeight: '500',
      lineHeight: 22,
      color: c.textSub,
      textAlign: 'center',
    },
  });
}
