import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { GroupForm, GroupFormInitial } from '@/components/GroupForm';
import { SubHeader } from '@/components/Header';
import { deleteGroup, getGroup, updateGroup } from '@/storage/firestore';
import type { GroupInput } from '@/storage/firestore';
import { confirmDestructive } from '@/utils/confirm';
import { ColorPalette } from '@/theme';
import { useTheme } from '@/context/ThemeContext';

export default function EditGroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [initial, setInitial] = useState<GroupFormInitial | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    if (!id) {
      setNotFound(true);
      return;
    }
    getGroup(id)
      .then((group) => {
        if (!active) return;
        if (!group) {
          setNotFound(true);
          return;
        }
        setInitial({
          name: group.name,
          members: group.members.map((m) => ({ id: m.id, name: m.name })),
          color: group.color,
          icon: group.icon,
        });
      })
      .catch((e) => {
        console.warn('[edit group] getGroup failed', e);
        if (active) setNotFound(true);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const handleSave = async (input: GroupInput) => {
    if (!id) return;
    try {
      await updateGroup(id, input);
      router.back();
    } catch (e) {
      console.warn('[edit group] updateGroup failed', e);
      Alert.alert('保存できませんでした', 'ネットワークまたは Firebase 設定を確認してください。');
    }
  };

  const handleDelete = () => {
    if (!id) return;
    confirmDestructive(
      {
        title: 'グループを削除',
        message: 'このグループを削除しますか？この操作は元に戻せません。',
      },
      async () => {
        try {
          await deleteGroup(id);
        } catch (e) {
          console.warn('[edit group] deleteGroup failed', e);
          Alert.alert('削除できませんでした', 'ネットワークまたは Firebase 設定を確認してください。');
          return;
        }
        // 削除後は詳細画面（削除済み）へ戻らずホームへ遷移する。
        if (router.canDismiss?.()) {
          router.dismissAll();
        }
        router.replace('/');
      }
    );
  };

  const handleInvite = () => {
    if (!id) return;
    router.push(`/group/${id}/invite`);
  };

  if (notFound) {
    return (
      <View style={styles.screen}>
        <SubHeader title="グループを編集" onBack={() => router.back()} />
        <View style={styles.center} />
      </View>
    );
  }

  if (!initial) {
    return (
      <View style={styles.screen}>
        <SubHeader title="グループを編集" onBack={() => router.back()} />
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <GroupForm
      mode="edit"
      initial={initial}
      onSave={handleSave}
      onCancel={() => router.back()}
      onDelete={handleDelete}
      onInvite={handleInvite}
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
  });
}
