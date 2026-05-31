import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ColorPalette, fonts, radius } from '@/theme';
import { useTheme } from '@/context/ThemeContext';

/** ホーム用ヘッダー（アプリ名 + サブコピー + 任意の右アクション） */
export function HomeHeader({
  title,
  subtitle,
  rightIcon,
  onRightPress,
  rightAccessibilityLabel,
}: {
  title: string;
  subtitle: string;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  rightAccessibilityLabel?: string;
}) {
  const insets = useSafeAreaInsets();
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const topPad = insets.top + 6;
  return (
    <View style={[styles.header, shadows.header, { paddingTop: topPad }]}>
      <View style={styles.headerRow}>
        <View style={styles.headerTextArea}>
          <Text style={styles.appTitle}>{title}</Text>
          <Text style={styles.headerSub}>{subtitle}</Text>
        </View>
        {rightIcon && onRightPress ? (
          <Pressable
            onPress={onRightPress}
            hitSlop={12}
            style={({ pressed }) => [styles.rightBtn, { opacity: pressed ? 0.7 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel={rightAccessibilityLabel ?? '設定'}
          >
            <Ionicons name={rightIcon} size={24} color={colors.headerText} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

interface SubHeaderProps {
  title: string;
  onBack: () => void;
  /** 右側のアクション（例: 保存） */
  actionLabel?: string;
  onAction?: () => void;
}

/** サブ画面ヘッダー（戻る + タイトル + 任意のアクション） */
export function SubHeader({ title, onBack, actionLabel, onAction }: SubHeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const topPad = insets.top + 6;
  return (
    <View style={[styles.subHeader, shadows.header, { paddingTop: topPad }]}>
      <Pressable
        onPress={onBack}
        hitSlop={12}
        style={styles.backBtn}
        accessibilityRole="button"
        accessibilityLabel="戻る"
      >
        <Ionicons name="chevron-back" size={24} color={colors.headerText} />
      </Pressable>
      <Text style={styles.screenTitle} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.actionSlot}>
        {actionLabel && onAction ? (
          <Pressable onPress={onAction} hitSlop={12} accessibilityRole="button">
            <Text style={styles.actionText}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    header: {
      paddingHorizontal: 22,
      paddingBottom: 26,
      borderBottomLeftRadius: radius.header,
      borderBottomRightRadius: radius.header,
      backgroundColor: c.headerBg,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    headerTextArea: {
      flex: 1,
    },
    rightBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: -6,
    },
    appTitle: {
      fontFamily: fonts.baloo800,
      fontSize: 26,
      fontWeight: '800',
      lineHeight: 38,
      letterSpacing: -0.5,
      color: c.headerText,
    },
    headerSub: {
      fontFamily: fonts.jp500,
      fontSize: 12,
      fontWeight: '500',
      lineHeight: 18,
      color: c.headerText,
      opacity: 0.92,
      marginTop: 2,
    },
    subHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 18,
      borderBottomLeftRadius: radius.header,
      borderBottomRightRadius: radius.header,
      backgroundColor: c.headerBg,
    },
    backBtn: {
      width: 44,
      height: 44,
      marginLeft: -10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    screenTitle: {
      flex: 1,
      fontFamily: fonts.baloo800,
      fontSize: 22,
      fontWeight: '800',
      lineHeight: 28,
      letterSpacing: -0.5,
      color: c.headerText,
    },
    actionSlot: {
      minWidth: 44,
      alignItems: 'flex-end',
    },
    actionText: {
      fontFamily: fonts.jp700,
      fontSize: 14,
      fontWeight: '700',
      color: c.headerText,
    },
  });
}
