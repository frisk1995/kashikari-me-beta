import { router } from 'expo-router';
import { GroupForm } from '@/components/GroupForm';
import { createGroup } from '@/storage';
import type { GroupInput } from '@/storage';

export default function NewGroupScreen() {
  const handleSave = async (input: GroupInput) => {
    await createGroup(input);
    router.back();
  };

  return <GroupForm mode="create" onSave={handleSave} onCancel={() => router.back()} />;
}
