import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { ColorPalette, fonts, radius } from '@/theme';
import { useTheme } from '@/context/ThemeContext';

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string | null;
}

/** ラベル + 入力欄 + エラー表示をまとめたフォーム入力 */
export function TextField({ label, error, style, onFocus, onBlur, ...rest }: TextFieldProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.error : focused ? colors.primary : colors.border;

  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        {...rest}
        style={[styles.input, { borderColor }, style]}
        placeholderTextColor={colors.textSub}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    label: {
      fontFamily: fonts.jp700,
      fontSize: 12,
      fontWeight: '700',
      lineHeight: 16,
      color: c.textSub,
      marginBottom: 8,
    },
    input: {
      backgroundColor: c.surface,
      borderWidth: 1.5,
      borderRadius: radius.input,
      height: 52,
      paddingHorizontal: 16,
      fontFamily: fonts.jp500,
      fontSize: 16,
      color: c.text,
    },
    error: {
      fontFamily: fonts.jp500,
      fontSize: 12,
      fontWeight: '600',
      lineHeight: 16,
      color: c.error,
      marginTop: 6,
    },
  });
}
