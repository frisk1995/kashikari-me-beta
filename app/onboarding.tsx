/**
 * 初回起動時のオンボーディング画面。
 * ユーザー名を入力して「はじめる」を押すとホームへ遷移する。
 */
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ColorPalette, fonts, radius, spacing } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { setUsername } = useUser();

  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleStart = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('ユーザー名を入力してください');
      return;
    }
    if (trimmed.length > 20) {
      setError('ユーザー名は20文字以内で入力してください');
      return;
    }
    setSaving(true);
    try {
      await setUsername(trimmed);
      router.replace('/');
    } catch {
      setError('保存できませんでした。もう一度お試しください。');
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.inner, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}>

        {/* ロゴ・タイトル */}
        <View style={styles.header}>
          <Text style={styles.appName}>Kashikari.me</Text>
          <Text style={styles.tagline}>みんなの立て替え、スッキリ精算！</Text>
        </View>

        {/* 入力フォーム */}
        <View style={styles.form}>
          <Text style={styles.label}>あなたのユーザー名</Text>
          <Text style={styles.hint}>グループメンバーに表示される名前です（後から変更可能）</Text>
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            value={name}
            onChangeText={(t) => { setName(t); setError(null); }}
            placeholder="例: 田中 太郎"
            placeholderTextColor={colors.textSub}
            maxLength={20}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleStart}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        {/* ボタン */}
        <View style={styles.btnWrap}>
          <PrimaryButton
            label={saving ? '保存中...' : 'はじめる'}
            onPress={handleStart}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.bg,
    },
    inner: {
      flex: 1,
      paddingHorizontal: spacing.screenH,
      justifyContent: 'space-between',
    },
    header: {
      alignItems: 'center',
      gap: 8,
    },
    appName: {
      fontFamily: fonts.baloo800,
      fontSize: 36,
      fontWeight: '800',
      color: c.primary,
      letterSpacing: -0.5,
    },
    tagline: {
      fontFamily: fonts.jp500,
      fontSize: 14,
      fontWeight: '500',
      color: c.textSub,
    },
    form: {
      gap: 8,
    },
    label: {
      fontFamily: fonts.jp800,
      fontSize: 15,
      fontWeight: '800',
      color: c.text,
    },
    hint: {
      fontFamily: fonts.jp500,
      fontSize: 12,
      fontWeight: '500',
      color: c.textSub,
      lineHeight: 18,
    },
    input: {
      height: 52,
      borderRadius: radius.input,
      borderWidth: 1.5,
      borderColor: c.border,
      backgroundColor: c.surface,
      paddingHorizontal: 16,
      fontFamily: fonts.jp500,
      fontSize: 16,
      color: c.text,
      marginTop: 4,
    },
    inputError: {
      borderColor: c.error,
    },
    error: {
      fontFamily: fonts.jp500,
      fontSize: 12,
      color: c.error,
    },
    btnWrap: {
      gap: spacing.md,
    },
  });
}
