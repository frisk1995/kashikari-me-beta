import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { PaymentForm, PaymentFormInitial } from '@/components/PaymentForm';
import { SubHeader } from '@/components/Header';
import { deletePayment, getGroup, getPayment, updatePayment } from '@/storage';
import type { PaymentInput } from '@/storage';
import type { Group } from '@/types';
import { confirmDestructive } from '@/utils/confirm';
import { ColorPalette, fonts } from '@/theme';
import { useTheme } from '@/context/ThemeContext';

export default function EditPaymentScreen() {
  const { id, paymentId } = useLocalSearchParams<{ id: string; paymentId: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [group, setGroup] = useState<Group | null>(null);
  const [initial, setInitial] = useState<PaymentFormInitial | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!id || !paymentId) {
        setNotFound(true);
        setLoaded(true);
        return;
      }
      (async () => {
        const g = await getGroup(id);
        const p = await getPayment(id, paymentId);
        if (!active) return;
        if (!g || !p) {
          setNotFound(true);
          setLoaded(true);
          return;
        }
        setGroup(g);
        setInitial({
          amount: p.amount,
          lenderId: p.lenderId,
          borrowerIds: p.borrowerIds,
          memo: p.memo,
          date: p.date,
        });
        setLoaded(true);
      })();
      return () => {
        active = false;
      };
    }, [id, paymentId])
  );

  const handleSave = async (input: PaymentInput) => {
    if (!id || !paymentId) return;
    await updatePayment(id, paymentId, input);
    router.back();
  };

  const handleDelete = () => {
    if (!id || !paymentId) return;
    confirmDestructive(
      {
        title: '支払いを削除',
        message: 'この支払いを削除しますか？この操作は元に戻せません。',
      },
      async () => {
        await deletePayment(id, paymentId);
        router.back();
      }
    );
  };

  if (!loaded) {
    return (
      <View style={styles.screen}>
        <SubHeader title="支払いを編集" onBack={() => router.back()} />
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </View>
    );
  }

  if (notFound || !group || !initial) {
    return (
      <View style={styles.screen}>
        <SubHeader title="支払いを編集" onBack={() => router.back()} />
        <View style={styles.center}>
          <Text style={styles.notFound}>支払いが見つかりませんでした</Text>
        </View>
      </View>
    );
  }

  return (
    <PaymentForm
      mode="edit"
      group={group}
      initial={initial}
      onSave={handleSave}
      onCancel={() => router.back()}
      onDelete={handleDelete}
    />
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
    },
    notFound: {
      fontFamily: fonts.jp500,
      fontSize: 14,
      color: c.textSub,
    },
  });
}
