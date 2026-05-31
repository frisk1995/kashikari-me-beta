import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from './Avatar';
import type { SettlementTransfer } from '@/utils/settlement';
import { ColorPalette, fonts, formatYen, radius } from '@/theme';
import { useTheme } from '@/context/ThemeContext';

interface SettlementRowProps {
  transfer: SettlementTransfer;
  /** 送金元・送金先の group.members 内 index（アバター色ローテーション用） */
  fromIndex: number;
  toIndex: number;
}

/**
 * 精算案の1行（カード型）。
 * 「{A} → {B}」をアバター + 矢印で視覚化し、文言と金額を表示する。
 */
export function SettlementRow({ transfer, fromIndex, toIndex }: SettlementRowProps) {
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[styles.card, shadows.card]}>
      <View style={styles.avatars}>
        <Avatar name={transfer.fromName} index={fromIndex} size={40} />
        <Ionicons name="arrow-forward" size={16} color={colors.textSub} style={styles.arrow} />
        <Avatar name={transfer.toName} index={toIndex} size={40} />
      </View>

      <View style={styles.body}>
        <Text style={styles.text} numberOfLines={2}>
          <Text style={styles.bold}>{transfer.fromName}</Text>さんが{'\n'}
          <Text style={styles.bold}>{transfer.toName}</Text>さんに
        </Text>
      </View>

      <Text style={styles.amount}>{formatYen(transfer.amount)}</Text>
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: c.surface,
      borderRadius: radius.input,
      padding: 14,
      marginBottom: 12,
    },
    avatars: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    arrow: {
      marginHorizontal: 4,
    },
    body: {
      flex: 1,
    },
    text: {
      fontFamily: fonts.jp500,
      fontSize: 13,
      fontWeight: '500',
      lineHeight: 18,
      color: c.text,
    },
    bold: {
      fontFamily: fonts.jp700,
      fontWeight: '700',
      color: c.text,
    },
    amount: {
      fontFamily: fonts.baloo800,
      fontSize: 18,
      fontWeight: '800',
      letterSpacing: -0.5,
      color: c.text,
    },
  });
}
