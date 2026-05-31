import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { avatarColorForIndex, ColorPalette, fonts, radius } from '@/theme';
import { useTheme } from '@/context/ThemeContext';

interface AvatarProps {
  name: string;
  index: number;
  /** カード内=26 / 詳細・選択=40 */
  size?: number;
  /** スタック表示時に重ねるための左マージン */
  overlap?: boolean;
  bordered?: boolean;
}

function initial(name: string): string {
  const trimmed = (name ?? '').trim();
  return trimmed.length > 0 ? Array.from(trimmed)[0] : '?';
}

export function Avatar({ name, index, size = 26, overlap = false, bordered = true }: AvatarProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { bg, fg } = avatarColorForIndex(colors, index);
  const fontSize = size <= 28 ? 11 : 16;
  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: radius.avatar,
          backgroundColor: bg,
          borderWidth: bordered ? 2 : 0,
        },
        overlap && styles.overlap,
      ]}
    >
      <Text style={[styles.text, { color: fg, fontSize }]} numberOfLines={1}>
        {initial(name)}
      </Text>
    </View>
  );
}

/** 「+N」超過アバター */
export function MoreAvatar({ count, size = 26 }: { count: number; size?: number }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View
      style={[
        styles.base,
        styles.overlap,
        {
          width: size,
          height: size,
          borderRadius: radius.avatar,
          backgroundColor: colors.textSub,
          borderWidth: 2,
        },
      ]}
    >
      <Text style={[styles.text, { color: colors.white, fontSize: 10 }]}>+{count}</Text>
    </View>
  );
}

interface AvatarStackProps {
  members: { name: string }[];
  max?: number;
  size?: number;
}

/** 最大 max 名を重ねて表示し、超過は「+N」アバターで示す */
export function AvatarStack({ members, max = 4, size = 26 }: AvatarStackProps) {
  if (members.length <= max) {
    return (
      <View style={styles.stack}>
        {members.map((m, i) => (
          <Avatar key={i} name={m.name} index={i} size={size} overlap={i > 0} />
        ))}
      </View>
    );
  }
  const visible = members.slice(0, max - 1);
  const remaining = members.length - visible.length;
  return (
    <View style={styles.stack}>
      {visible.map((m, i) => (
        <Avatar key={i} name={m.name} index={i} size={size} overlap={i > 0} />
      ))}
      <MoreAvatar count={remaining} size={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    base: {
      alignItems: 'center',
      justifyContent: 'center',
      borderColor: c.surface,
    },
    overlap: {
      marginLeft: -8,
    },
    text: {
      fontFamily: fonts.jp700,
      fontWeight: '700',
      textAlign: 'center',
    },
  });
}
