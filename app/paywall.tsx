import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton, SecondaryButton } from '@/components/PrimaryButton';
import { usePurchase, FREE_GROUP_LIMIT, FREE_MEMBER_LIMIT, type PlanType } from '@/context/PurchaseContext';
import { ColorPalette, fonts, radius, spacing } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { useIPad } from '@/hooks/useIPad';

const PLANS: { type: PlanType; label: string; price: string; sub: string; badge?: string }[] = [
  {
    type: 'yearly',
    label: '年額プラン',
    price: '¥2,800 / 年',
    sub: '月換算 ¥233 — 2ヶ月以上お得',
    badge: 'おすすめ',
  },
  {
    type: 'monthly',
    label: '月額プラン',
    price: '¥300 / 月',
    sub: 'いつでもキャンセル可能',
  },
];

const FEATURES: { icon: string; free: string; premium: string }[] = [
  { icon: 'albums-outline', free: `グループ ${FREE_GROUP_LIMIT}個まで`, premium: 'グループ無制限' },
  { icon: 'people-outline', free: `メンバー ${FREE_MEMBER_LIMIT}人まで`, premium: 'メンバー無制限' },
  { icon: 'color-palette-outline', free: 'コーラルのみ', premium: 'テーマカラー全10色' },
  { icon: 'download-outline', free: '—', premium: 'CSVエクスポート' },
];

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { isWide } = useIPad();
  const { purchasePremium, restorePurchases, _devTogglePremium, isPremium, loading } = usePurchase();
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('yearly');

  const currentPlan = PLANS.find((p) => p.type === selectedPlan)!;

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      await purchasePremium(selectedPlan);
      router.back();
    } catch (e: any) {
      const msg: string = e?.userInfo?.readableDescription ?? e?.message ?? '購入を完了できませんでした。しばらく経ってから再度お試しください。';
      Alert.alert('購入エラー', msg, [{ text: 'OK' }]);
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      await restorePurchases();
      Alert.alert('復元完了', '購入済みのプランを復元しました。', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) {
      Alert.alert('復元エラー', '購入履歴が見つかりませんでした。', [{ text: 'OK' }]);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom + 16 }]}>
      {/* 閉じるボタン */}
      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => [styles.closeBtn, { opacity: pressed ? 0.6 : 1 }]}
        accessibilityLabel="閉じる"
      >
        <Ionicons name="close" size={24} color={colors.textSub} />
      </Pressable>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ヘッダー */}
        <View style={styles.heroWrap}>
          <View style={[styles.crownBg, { backgroundColor: colors.primary + '22' }]}>
            <Ionicons name="star" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>プレミアムプラン</Text>
          <Text style={[styles.subtitle, { color: colors.textSub }]}>
            制限なしで立て替えをもっと快適に
          </Text>
        </View>

        {/* 機能リスト */}
        <View style={[styles.featureList, isWide && styles.featureListGrid]}>
          {FEATURES.map((f, i) => (
            <View
              key={i}
              style={[
                styles.featureCard,
                { backgroundColor: colors.surface },
                isWide && styles.featureCardGrid,
              ]}
            >
              <View style={[styles.featureIcon, { backgroundColor: colors.primary + '18' }]}>
                <Ionicons name={f.icon as any} size={22} color={colors.primary} />
              </View>
              <View style={styles.featureBody}>
                <Text style={[styles.featurePremium, { color: colors.text }]}>{f.premium}</Text>
                <Text style={[styles.featureFree, { color: colors.textSub }]}>
                  無料版: {f.free}
                </Text>
              </View>
              <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
            </View>
          ))}
        </View>

        {/* プラン選択 */}
        <View style={styles.planList}>
          {PLANS.map((plan) => {
            const selected = selectedPlan === plan.type;
            return (
              <Pressable
                key={plan.type}
                onPress={() => setSelectedPlan(plan.type)}
                style={[
                  styles.planCard,
                  { borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected ? colors.primary + '0D' : colors.surface },
                ]}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
              >
                <View style={styles.planCardLeft}>
                  <View style={styles.planLabelRow}>
                    <Text style={[styles.planLabel, { color: colors.text }]}>{plan.label}</Text>
                    {plan.badge && (
                      <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                        <Text style={styles.badgeText}>{plan.badge}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.planPrice, { color: selected ? colors.primary : colors.text }]}>
                    {plan.price}
                  </Text>
                  <Text style={[styles.planSub, { color: colors.textSub }]}>{plan.sub}</Text>
                </View>
                <View style={[
                  styles.radio,
                  { borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected ? colors.primary : 'transparent' },
                ]}>
                  {selected && <View style={styles.radioDot} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={[styles.cta, isWide && styles.ctaWide]}>
        {isPremium ? (
          <View style={[styles.alreadyPremium, { backgroundColor: colors.surface }]}>
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            <Text style={[styles.alreadyPremiumText, { color: colors.primary }]}>
              プレミアムプランご利用中
            </Text>
          </View>
        ) : loading ? (
          <View style={[styles.alreadyPremium, { backgroundColor: colors.surface }]}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <PrimaryButton
            label={purchasing ? '処理中...' : `${currentPlan.price}で始める`}
            onPress={purchasing ? () => {} : handlePurchase}
          />
        )}

        <Pressable
          onPress={handleRestore}
          disabled={restoring}
          style={({ pressed }) => [styles.restoreBtn, { opacity: pressed || restoring ? 0.6 : 1 }]}
        >
          {restoring ? (
            <ActivityIndicator size="small" color={colors.textSub} />
          ) : (
            <Text style={[styles.restoreText, { color: colors.textSub }]}>購入を復元する</Text>
          )}
        </Pressable>

        {/* 開発用トグル */}
        {__DEV__ && (
          <Pressable
            onPress={async () => { await _devTogglePremium(); router.back(); }}
            style={({ pressed }) => [styles.devBtn, { opacity: pressed ? 0.7 : 1, borderColor: colors.border }]}
          >
            <Text style={[styles.devBtnText, { color: colors.textSub }]}>
              （開発）プレミアムを {isPremium ? 'OFF' : 'ON'} にする
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    flex: { flex: 1 },
    closeBtn: {
      position: 'absolute',
      top: 16,
      right: spacing.screenH,
      zIndex: 10,
      padding: 4,
    },
    content: {
      paddingHorizontal: spacing.screenH,
      paddingTop: 56,
      paddingBottom: 24,
      alignItems: 'center',
    },
    heroWrap: { alignItems: 'center', marginBottom: spacing['2xl'] },
    crownBg: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    title: {
      fontFamily: fonts.jp800,
      fontSize: 24,
      fontWeight: '800',
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    subtitle: {
      fontFamily: fonts.jp500,
      fontSize: 14,
      lineHeight: 22,
      textAlign: 'center',
    },
    featureList: { width: '100%', gap: spacing.sm, marginBottom: spacing['2xl'] },
    featureListGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
    featureCardGrid: { width: '47%' },
    featureCard: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: radius.card,
      padding: spacing.lg,
      gap: spacing.md,
    },
    featureIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    featureBody: { flex: 1 },
    featurePremium: { fontFamily: fonts.jp700, fontSize: 15, fontWeight: '700' },
    featureFree: { fontFamily: fonts.jp500, fontSize: 12, marginTop: 2 },
    planList: {
      width: '100%',
      gap: spacing.sm,
      marginBottom: spacing['2xl'],
    },
    planCard: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 2,
      borderRadius: radius.card,
      padding: spacing.lg,
      gap: spacing.md,
    },
    planCardLeft: { flex: 1 },
    planLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: 2,
    },
    planLabel: {
      fontFamily: fonts.jp700,
      fontSize: 14,
      fontWeight: '700',
    },
    badge: {
      borderRadius: 99,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    badgeText: {
      fontFamily: fonts.jp700,
      fontSize: 10,
      fontWeight: '700',
      color: '#fff',
    },
    planPrice: {
      fontFamily: fonts.jp800,
      fontSize: 20,
      fontWeight: '800',
      marginBottom: 2,
    },
    planSub: {
      fontFamily: fonts.jp500,
      fontSize: 11,
    },
    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#fff',
    },
    cta: {
      paddingHorizontal: spacing.screenH,
      gap: spacing.sm,
    },
    ctaWide: {
      maxWidth: 480,
      width: '100%',
      alignSelf: 'center',
    },
    alreadyPremium: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      height: 56,
      borderRadius: radius.button,
    },
    alreadyPremiumText: {
      fontFamily: fonts.jp700,
      fontSize: 15,
      fontWeight: '700',
    },
    restoreBtn: {
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    restoreText: {
      fontFamily: fonts.jp500,
      fontSize: 13,
      textDecorationLine: 'underline',
    },
    devBtn: {
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderRadius: 12,
      borderStyle: 'dashed',
    },
    devBtnText: { fontFamily: fonts.jp500, fontSize: 13 },
  });
}
