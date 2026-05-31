import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { PaymentForm } from '@/components/PaymentForm';
import { SubHeader } from '@/components/Header';
import { addPayment, getGroup } from '@/storage';
import type { PaymentInput } from '@/storage';
import type { Group } from '@/types';
import { ColorPalette, fonts } from '@/theme';
import { useTheme } from '@/context/ThemeContext';

export default function NewPaymentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [group, setGroup] = useState<Group | null>(null);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!id) {
        setLoaded(true);
        return;
      }
      getGroup(id).then((g) => {
        if (!active) return;
        setGroup(g ?? null);
        setLoaded(true);
      });
      return () => {
        active = false;
      };
    }, [id])
  );

  const handleSave = async (input: PaymentInput) => {
    if (!id) return;
    await addPayment(id, input);
    router.back();
  };

  if (!loaded) {
    return (
      <View style={styles.screen}>
        <SubHeader title="支払いを追加" onBack={() => router.back()} />
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.screen}>
        <SubHeader title="支払いを追加" onBack={() => router.back()} />
        <View style={styles.center}>
          <Text style={styles.notFound}>グループが見つかりませんでした</Text>
        </View>
      </View>
    );
  }

  return <PaymentForm mode="create" group={group} onSave={handleSave} onCancel={() => router.back()} />;
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
