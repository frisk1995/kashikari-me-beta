import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from './Avatar';
import type { Group, Payment } from '@/types';
import { ColorPalette, fonts, formatYen, radius } from '@/theme';
import { useTheme } from '@/context/ThemeContext';

interface PaymentCardProps {
  payment: Payment;
  group: Group;
  /** （未使用・互換のため残置）一覧での並び順 index */
  index?: number;
  onPress: () => void;
}

function memberName(group: Group, memberId: string): string {
  return group.members.find((m) => m.id === memberId)?.name ?? '不明';
}

/** 貸した人のアバター表示用に group 内の index を返す（色の一貫性のため） */
function memberIndex(group: Group, memberId: string): number {
  const idx = group.members.findIndex((m) => m.id === memberId);
  return idx >= 0 ? idx : 0;
}

/** `YYYY-MM-DD` を「5/31」のような月/日表記へ整形する。不正なら空文字を返す */
function formatShortDate(date: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date ?? '');
  if (!m) return '';
  return `${parseInt(m[2], 10)}/${parseInt(m[3], 10)}`;
}

/** 支払い一覧の1行（カード型）。「貸した人 → 借りた人」を表示する */
export function PaymentCard({ payment, group, onPress }: PaymentCardProps) {
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const lender = memberName(group, payment.lenderId);
  const borrowers = payment.borrowerIds.map((id) => memberName(group, id));
  const borrowerText = borrowers.length > 0 ? borrowers.join(', ') : '不明';
  const memo = payment.memo.trim().length > 0 ? payment.memo.trim() : '（メモなし）';
  const dateLabel = formatShortDate(payment.date);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, shadows.card, { opacity: pressed ? 0.85 : 1 }]}
      accessibilityRole="button"
      accessibilityLabel={`支払い ${memo} ${formatYen(payment.amount)} ${lender}から${borrowerText}へ`}
    >
      <Avatar name={lender} index={memberIndex(group, payment.lenderId)} size={40} bordered={false} />
      <View style={styles.body}>
        <Text style={styles.memo} numberOfLines={1}>
          {memo}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {lender} → {borrowerText}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.amount}>{formatYen(payment.amount)}</Text>
        {dateLabel ? <Text style={styles.date}>{dateLabel}</Text> : null}
      </View>
    </Pressable>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: c.surface,
      borderRadius: radius.input,
      padding: 14,
      marginBottom: 12,
    },
    body: {
      flex: 1,
    },
    memo: {
      fontFamily: fonts.jp700,
      fontSize: 14,
      fontWeight: '700',
      lineHeight: 20,
      color: c.text,
    },
    sub: {
      fontFamily: fonts.jp500,
      fontSize: 11,
      fontWeight: '500',
      lineHeight: 16,
      color: c.textSub,
      marginTop: 2,
    },
    right: {
      alignItems: 'flex-end',
      gap: 4,
    },
    amount: {
      fontFamily: fonts.baloo800,
      fontSize: 18,
      fontWeight: '800',
      letterSpacing: -0.5,
      color: c.text,
    },
    date: {
      fontFamily: fonts.jp500,
      fontSize: 11,
      fontWeight: '500',
      lineHeight: 14,
      color: c.textSub,
    },
  });
}
