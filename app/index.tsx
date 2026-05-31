import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeHeader } from '@/components/Header';
import { GroupCard } from '@/components/GroupCard';
import { EmptyState } from '@/components/EmptyState';
import { PrimaryButton } from '@/components/PrimaryButton';
import { getGroups } from '@/storage';
import type { Group } from '@/types';
import { ColorPalette, fonts, spacing } from '@/theme';
import { useTheme } from '@/context/ThemeContext';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loaded, setLoaded] = useState(false);

  // 画面にフォーカスが戻るたびに最新データを再読込（作成・編集・削除を反映）
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getGroups().then((g) => {
        if (active) {
          setGroups(g);
          setLoaded(true);
        }
      });
      return () => {
        active = false;
      };
    }, [])
  );

  const isEmpty = loaded && groups.length === 0;

  return (
    <View style={styles.screen}>
      <HomeHeader
        title="Kashikari.me"
        subtitle="みんなの立て替え、スッキリ精算！"
        rightIcon="settings-outline"
        onRightPress={() => router.push('/settings')}
        rightAccessibilityLabel="設定"
      />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: spacing.scrollBottom }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>グループ</Text>

        {isEmpty ? (
          <EmptyState
            heading="まだグループがないよ！"
            description="旅行やイベントごとにグループを作って、立て替えをサクッと記録しよう"
          />
        ) : (
          groups.map((group, index) => (
            <GroupCard
              key={group.id}
              group={group}
              index={index}
              onPress={() => router.push(`/group/${group.id}`)}
            />
          ))
        )}
      </ScrollView>

      <View style={[styles.fabWrap, { paddingBottom: insets.bottom + 12 }]} pointerEvents="box-none">
        <PrimaryButton
          label="新規グループ"
          withPlus
          onPress={() => router.push('/group/new')}
        />
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
    flex: {
      flex: 1,
    },
    content: {
      paddingHorizontal: spacing.screenH,
      paddingTop: spacing.xl,
    },
    sectionLabel: {
      fontFamily: fonts.jp800,
      fontSize: 13,
      fontWeight: '800',
      lineHeight: 18,
      color: c.text,
      marginBottom: spacing.sectionGap,
    },
    fabWrap: {
      position: 'absolute',
      left: spacing.screenH,
      right: spacing.screenH,
      bottom: 0,
    },
  });
}
