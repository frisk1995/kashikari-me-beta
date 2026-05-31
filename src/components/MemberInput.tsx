import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from './Avatar';
import { ColorPalette, fonts, radius } from '@/theme';
import { useTheme } from '@/context/ThemeContext';

interface MemberInputProps {
  index: number;
  name: string;
  onChangeName: (text: string) => void;
  onRemove: () => void;
  autoFocus?: boolean;
}

/** メンバー1行（アバター + 名前入力 + 削除） */
export function MemberInput({ index, name, onChangeName, onRemove, autoFocus }: MemberInputProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.row}>
      <Avatar name={name || '?'} index={index} size={40} bordered={false} />
      <TextInput
        value={name}
        onChangeText={onChangeName}
        placeholder={`メンバー${index + 1}`}
        placeholderTextColor={colors.textSub}
        autoFocus={autoFocus}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[styles.input, { borderColor: focused ? colors.primary : colors.border }]}
        accessibilityLabel={`メンバー${index + 1}の名前`}
      />
      <Pressable
        onPress={onRemove}
        hitSlop={10}
        style={styles.removeBtn}
        accessibilityRole="button"
        accessibilityLabel={`メンバー${index + 1}を削除`}
      >
        <Ionicons name="close-circle" size={24} color={colors.textSub} />
      </Pressable>
    </View>
  );
}

/** 「+ メンバーを追加」リンクボタン */
export function AddMemberButton({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.addBtn, { opacity: pressed ? 0.6 : 1 }]}
      accessibilityRole="button"
      accessibilityLabel="メンバーを追加"
    >
      <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
      <Text style={styles.addLabel}>メンバーを追加</Text>
    </Pressable>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 12,
    },
    input: {
      flex: 1,
      backgroundColor: c.surface,
      borderWidth: 1.5,
      borderRadius: radius.input,
      height: 48,
      paddingHorizontal: 14,
      fontFamily: fonts.jp500,
      fontSize: 16,
      color: c.text,
    },
    removeBtn: {
      padding: 2,
    },
    addBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 10,
      marginTop: 4,
    },
    addLabel: {
      fontFamily: fonts.jp700,
      fontSize: 14,
      fontWeight: '700',
      color: c.primary,
    },
  });
}
