import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from './Avatar';
import type { Member } from '@/types';
import { ColorPalette, fonts, radius } from '@/theme';
import { useTheme } from '@/context/ThemeContext';

/* ============== 支払者の単一選択（横スクロールチップ） ============== */

interface PayerSelectorProps {
  members: Member[];
  selectedId: string | null;
  onSelect: (memberId: string) => void;
}

export function PayerSelector({ members, selectedId, onSelect }: PayerSelectorProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipRow}
      keyboardShouldPersistTaps="handled"
    >
      {members.map((m, i) => {
        const selected = m.id === selectedId;
        return (
          <Pressable
            key={m.id}
            onPress={() => onSelect(m.id)}
            style={({ pressed }) => [
              styles.chip,
              selected ? styles.chipSelected : styles.chipUnselected,
              { opacity: pressed ? 0.85 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`貸した人 ${m.name}`}
          >
            <Avatar name={m.name} index={i} size={26} bordered={false} />
            <Text
              style={[styles.chipLabel, selected ? styles.chipLabelSelected : styles.chipLabelUnselected]}
              numberOfLines={1}
            >
              {m.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/* ============== 割り勘対象の複数選択（全員トグル + チェックリスト） ============== */

interface SplitSelectorProps {
  members: Member[];
  selectedIds: string[];
  onToggle: (memberId: string) => void;
  onToggleAll: () => void;
  disabledIds?: string[];
}

export function SplitSelector({ members, selectedIds, onToggle, onToggleAll: _onToggleAll, disabledIds = [] }: SplitSelectorProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View>
      <View style={styles.list}>
        {members.map((m, i) => {
          const disabled = disabledIds.includes(m.id);
          const checked = selectedIds.includes(m.id);
          return (
            <Pressable
              key={m.id}
              onPress={() => !disabled && onToggle(m.id)}
              style={({ pressed }) => [
                styles.memberRow,
                disabled ? styles.memberRowDisabled : null,
                { opacity: disabled ? 0.38 : pressed ? 0.7 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityState={{ checked, disabled }}
              accessibilityLabel={disabled ? `${m.name}（貸した人のため選択不可）` : `${m.name}を借りた人にする`}
            >
              <Avatar name={m.name} index={i} size={40} bordered={false} />
              <Text style={styles.memberName} numberOfLines={1}>
                {m.name}
              </Text>
              <CheckBox checked={checked && !disabled} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function CheckBox({ checked }: { checked: boolean }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[styles.checkbox, checked ? styles.checkboxOn : styles.checkboxOff]}>
      {checked ? <Ionicons name="checkmark" size={16} color={colors.white} /> : null}
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    chipRow: {
      gap: 10,
      paddingVertical: 2,
      paddingRight: 4,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      height: 44,
      paddingHorizontal: 12,
      borderRadius: radius.pill,
      borderWidth: 1.5,
    },
    chipSelected: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    chipUnselected: {
      backgroundColor: c.surface,
      borderColor: c.border,
    },
    chipLabel: {
      fontFamily: fonts.jp700,
      fontSize: 14,
      fontWeight: '700',
      maxWidth: 120,
    },
    chipLabelSelected: {
      color: c.white,
    },
    chipLabelUnselected: {
      color: c.text,
    },
    allRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: c.surface,
      borderWidth: 1.5,
      borderColor: c.border,
      borderRadius: radius.input,
      height: 48,
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    allLabel: {
      fontFamily: fonts.jp700,
      fontSize: 14,
      fontWeight: '700',
      color: c.text,
    },
    list: {
      gap: 10,
    },
    memberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: c.surface,
      borderWidth: 1.5,
      borderColor: c.border,
      borderRadius: radius.input,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    memberName: {
      flex: 1,
      fontFamily: fonts.jp500,
      fontSize: 16,
      fontWeight: '500',
      color: c.text,
    },
    checkbox: {
      width: 26,
      height: 26,
      borderRadius: radius.avatar,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxOn: {
      backgroundColor: c.primary,
    },
    checkboxOff: {
      borderWidth: 1.5,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    memberRowDisabled: {
      backgroundColor: c.bg,
    },
  });
}
