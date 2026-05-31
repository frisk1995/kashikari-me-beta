import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ColorPalette, fonts, radius } from '@/theme';
import { useTheme } from '@/context/ThemeContext';

/** ティール系ピル（1人あたり平均など） */
export function Pill({ label }: { label: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    pill: {
      backgroundColor: c.pillBg,
      borderRadius: radius.pill,
      paddingVertical: 6,
      paddingHorizontal: 11,
      alignSelf: 'flex-start',
    },
    pillText: {
      fontFamily: fonts.jp700,
      fontSize: 11,
      fontWeight: '700',
      lineHeight: 14,
      color: c.success,
    },
  });
}
