import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeHeader } from '@/components/Header';
import { GroupCard } from '@/components/GroupCard';
import { EmptyState } from '@/components/EmptyState';
import { PrimaryButton } from '@/components/PrimaryButton';
import { subscribeGroups, subscribePayments } from '@/storage/firestore';
import type { Group } from '@/types';
import { ColorPalette, fonts, spacing } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { userId, loading: userLoading } = useUser();

  const [groups, setGroups] = useState<Group[]>([]);
  const [loaded, setLoaded] = useState(false);
  // groupId -> 未精算合計（各グループの payments を購読して算出）
  const [unsettledMap, setUnsettledMap] = useState<Record<string, number>>({});
  // groupId -> payments のアンサブスクライブ関数
  const paymentUnsubs = useRef<Record<string, () => void>>({});

  // グループのリアルタイム購読
  useEffect(() => {
    if (!userId) return;
    const unsub = subscribeGroups(userId, (g) => {
      setGroups(g);
      setLoaded(true);
    });
    return () => unsub();
  }, [userId]);

  // 各グループの payments を購読して未精算合計を算出
  useEffect(() => {
    const currentIds = new Set(groups.map((g) => g.id));

    // 不要になったグループの購読を解除
    Object.keys(paymentUnsubs.current).forEach((gid) => {
      if (!currentIds.has(gid)) {
        paymentUnsubs.current[gid]?.();
        delete paymentUnsubs.current[gid];
        setUnsettledMap((prev) => {
          const next = { ...prev };
          delete next[gid];
          return next;
        });
      }
    });

    // 新規グループの購読を開始
    groups.forEach((g) => {
      if (paymentUnsubs.current[g.id]) return;
      paymentUnsubs.current[g.id] = subscribePayments(g.id, (payments) => {
        const unsettled = payments
          .filter((p) => !p.settled)
          .reduce((sum, p) => sum + (p.amount || 0), 0);
        setUnsettledMap((prev) => ({ ...prev, [g.id]: unsettled }));
      });
    });
  }, [groups]);

  // アンマウント時に全 payments 購読を解除
  useEffect(() => {
    return () => {
      Object.values(paymentUnsubs.current).forEach((unsub) => unsub());
      paymentUnsubs.current = {};
    };
  }, []);

  const showLoading = userLoading || (!loaded && !!userId);
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

        {showLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : isEmpty ? (
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
              unsettledAmount={unsettledMap[group.id] ?? 0}
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
    center: {
      paddingTop: spacing['3xl'],
      alignItems: 'center',
    },
    fabWrap: {
      position: 'absolute',
      left: spacing.screenH,
      right: spacing.screenH,
      bottom: 0,
    },
  });
}
