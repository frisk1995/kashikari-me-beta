import { Alert } from 'react-native';
import { router } from 'expo-router';
import { GroupForm } from '@/components/GroupForm';
import { createGroup } from '@/storage/firestore';
import type { GroupInput } from '@/storage/firestore';
import { useUser } from '@/context/UserContext';

export default function NewGroupScreen() {
  const { userId } = useUser();

  const handleSave = async (input: GroupInput) => {
    if (!userId) {
      Alert.alert('エラー', 'ユーザー情報を取得できませんでした。少し待ってからもう一度お試しください。');
      return;
    }
    try {
      await createGroup(input, userId);
      router.back();
    } catch (e) {
      console.warn('[new group] createGroup failed', e);
      Alert.alert(
        'グループを作成できませんでした',
        'ネットワークまたは Firebase 設定を確認してください。'
      );
    }
  };

  return <GroupForm mode="create" onSave={handleSave} onCancel={() => router.back()} />;
}
