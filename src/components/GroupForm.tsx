import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SubHeader } from './Header';
import { TextField } from './TextField';
import { AddMemberButton, MemberInput } from './MemberInput';
import { DangerButton, PrimaryButton } from './PrimaryButton';
import { generateId } from '@/storage';
import type { GroupInput } from '@/storage';
import { ColorPalette, fonts, spacing } from '@/theme';
import { useTheme } from '@/context/ThemeContext';

export interface MemberDraft {
  key: string;
  id?: string;
  name: string;
}

export interface GroupFormInitial {
  name: string;
  members: { id?: string; name: string }[];
}

interface GroupFormProps {
  mode: 'create' | 'edit';
  initial?: GroupFormInitial;
  onSave: (input: GroupInput) => void;
  onCancel: () => void;
  /** 編集時のみ表示する削除アクション */
  onDelete?: () => void;
}

const MIN_MEMBERS = 2;

function buildInitialMembers(initial?: GroupFormInitial): MemberDraft[] {
  if (initial && initial.members.length > 0) {
    return initial.members.map((m) => ({ key: generateId(), id: m.id, name: m.name }));
  }
  // 新規作成時は空メンバー行を2つ用意（最低2名を促す）
  return [
    { key: generateId(), name: '' },
    { key: generateId(), name: '' },
  ];
}

export function GroupForm({ mode, initial, onSave, onCancel, onDelete }: GroupFormProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [name, setName] = useState(initial?.name ?? '');
  const [members, setMembers] = useState<MemberDraft[]>(() => buildInitialMembers(initial));
  const [nameError, setNameError] = useState<string | null>(null);
  const [memberError, setMemberError] = useState<string | null>(null);

  const title = mode === 'create' ? '新規グループ' : 'グループを編集';

  const updateMemberName = (key: string, text: string) => {
    setMembers((prev) => prev.map((m) => (m.key === key ? { ...m, name: text } : m)));
    if (memberError) setMemberError(null);
  };

  const removeMember = (key: string) => {
    setMembers((prev) => prev.filter((m) => m.key !== key));
  };

  const addMember = () => {
    setMembers((prev) => [...prev, { key: generateId(), name: '' }]);
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    const namedMembers = members
      .map((m) => ({ id: m.id, name: m.name.trim() }))
      .filter((m) => m.name.length > 0);

    let valid = true;

    if (trimmedName.length === 0) {
      setNameError('グループ名を入力してください');
      valid = false;
    } else {
      setNameError(null);
    }

    if (namedMembers.length < MIN_MEMBERS) {
      setMemberError('メンバーを2人以上追加してください');
      valid = false;
    } else {
      setMemberError(null);
    }

    if (!valid) return;

    onSave({ name: trimmedName, members: namedMembers });
  };

  const memberRows = useMemo(
    () =>
      members.map((m, i) => (
        <MemberInput
          key={m.key}
          index={i}
          name={m.name}
          onChangeName={(text) => updateMemberName(m.key, text)}
          onRemove={() => removeMember(m.key)}
        />
      )),
    [members, memberError]
  );

  return (
    <View style={styles.screen}>
      <SubHeader title={title} onBack={onCancel} actionLabel="保存" onAction={handleSave} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
        >
          <TextField
            label="グループ名"
            value={name}
            onChangeText={(t) => {
              setName(t);
              if (nameError) setNameError(null);
            }}
            placeholder="例: 北海道旅行 2026"
            error={nameError}
          />

          <View style={styles.field}>
            <Text style={styles.inputLabel}>メンバー</Text>
            {memberRows}
            {memberError ? <Text style={styles.memberError}>{memberError}</Text> : null}
            <AddMemberButton onPress={addMember} />
          </View>

          <View style={styles.saveBlock}>
            <PrimaryButton label="保存" onPress={handleSave} />
            {mode === 'edit' && onDelete ? (
              <DangerButton label="グループを削除" onPress={onDelete} style={styles.deleteBtn} />
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    field: {
      marginTop: spacing.fieldGap,
    },
    inputLabel: {
      fontFamily: fonts.jp700,
      fontSize: 12,
      fontWeight: '700',
      lineHeight: 16,
      color: c.textSub,
      marginBottom: 12,
    },
    memberError: {
      fontFamily: fonts.jp500,
      fontSize: 12,
      fontWeight: '600',
      color: c.error,
      marginBottom: 4,
    },
    saveBlock: {
      marginTop: spacing['3xl'],
      gap: 12,
    },
    deleteBtn: {
      marginTop: 4,
    },
  });
}
