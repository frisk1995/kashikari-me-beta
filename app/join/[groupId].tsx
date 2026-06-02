/**
 * ディープリンク `kashikarime://join/{groupId}` のハンドラ画面。
 *
 * expo-router の URL ルーティングにより、QR や外部リンクからこの画面が開かれる。
 * userId 取得後に joinGroup を実行し、グループ詳細へリダイレクトする。
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SubHeader } from '@/components/Header';
import { PrimaryButton } from '@/components/PrimaryButton';
import { joinGroup } from '@/storage/firestore';
import { ColorPalette, fonts, spacing } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';

type Status = 'joining' | 'error' | 'notfound';

export default function JoinHandlerScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { userId, loading: userLoading } = useUser();
  const [status, setStatus] = useState<Status>('joining');
  const handledRef = useRef(false);

  useEffect(() => {
    if (userLoading) return;
    if (handledRef.current) return;
    if (!groupId) {
      setStatus('notfound');
      return;
    }
    if (!userId) {
      setStatus('error');
      return;
    }
    handledRef.current = true;

    (async () => {
      try {
        const ok = await joinGroup(groupId, userId);
        if (!ok) {
          setStatus('notfound');
          return;
        }
        router.replace(`/group/${groupId}`);
      } catch (e) {
        console.warn('[join] joinGroup failed', e);
        setStatus('error');
      }
    })();
  }, [groupId, userId, userLoading]);

  if (status === 'joining') {
    return (
      <View style={styles.screen}>
        <SubHeader title="グループに参加" onBack={() => router.replace('/')} />
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.text}>グループに参加しています...</Text>
        </View>
      </View>
    );
  }

  const message =
    status === 'notfound'
      ? 'グループが見つかりませんでした。リンクが無効か、削除された可能性があります。'
      : '参加に失敗しました。ネットワークまたは Firebase 設定を確認してください。';

  return (
    <View style={styles.screen}>
      <SubHeader title="グループに参加" onBack={() => router.replace('/')} />
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.textSub} />
        <Text style={styles.text}>{message}</Text>
        <View style={styles.button}>
          <PrimaryButton label="ホームに戻る" onPress={() => router.replace('/')} />
        </View>
      </View>
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.bg,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
      gap: spacing.md,
    },
    text: {
      fontFamily: fonts.jp500,
      fontSize: 14,
      lineHeight: 22,
      color: c.textSub,
      textAlign: 'center',
    },
    button: {
      alignSelf: 'stretch',
      marginTop: spacing.md,
    },
  });
}
