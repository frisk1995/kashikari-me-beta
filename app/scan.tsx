/**
 * QR スキャナー画面。
 * expo-camera の CameraView で `kashikarime://join/{groupId}` 形式の QR を読み取り、
 * joinGroup を実行してグループ詳細へ遷移する。
 */
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { SubHeader } from '@/components/Header';
import { PrimaryButton } from '@/components/PrimaryButton';
import { joinGroup } from '@/storage/firestore';
import { parseJoinUrl } from '@/utils/joinUrl';
import { ColorPalette, fonts, spacing } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';

export default function ScanScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { userId } = useUser();
  const [permission, requestPermission] = useCameraPermissions();
  const [processing, setProcessing] = useState(false);
  // 連続スキャンによる多重実行を防ぐ
  const handledRef = useRef(false);

  const handleScanned = async (data: string) => {
    if (handledRef.current || processing) return;
    const groupId = parseJoinUrl(data);
    if (!groupId) {
      // 招待 QR ではない場合は無視（スキャンを継続）
      return;
    }
    handledRef.current = true;
    setProcessing(true);

    if (!userId) {
      Alert.alert('エラー', 'ユーザー情報を取得できませんでした。少し待ってからもう一度お試しください。', [
        { text: 'OK', onPress: () => resetScan() },
      ]);
      return;
    }

    try {
      const ok = await joinGroup(groupId, userId);
      if (!ok) {
        Alert.alert('参加できませんでした', 'グループが見つかりませんでした。', [
          { text: 'OK', onPress: () => resetScan() },
        ]);
        return;
      }
      // 詳細画面へ遷移（スキャナーは置き換える）
      router.replace(`/group/${groupId}`);
    } catch (e) {
      console.warn('[scan] joinGroup failed', e);
      Alert.alert('参加できませんでした', 'ネットワークまたは Firebase 設定を確認してください。', [
        { text: 'OK', onPress: () => resetScan() },
      ]);
    }
  };

  const resetScan = () => {
    handledRef.current = false;
    setProcessing(false);
  };

  // 権限未確定
  if (!permission) {
    return (
      <View style={styles.screen}>
        <SubHeader title="QRコードを読み取る" onBack={() => router.back()} />
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </View>
    );
  }

  // 権限なし
  if (!permission.granted) {
    return (
      <View style={styles.screen}>
        <SubHeader title="QRコードを読み取る" onBack={() => router.back()} />
        <View style={styles.center}>
          <Ionicons name="camera-outline" size={48} color={colors.textSub} />
          <Text style={styles.permissionText}>
            QRコードを読み取るにはカメラへのアクセスを許可してください。
          </Text>
          <View style={styles.permissionButton}>
            <PrimaryButton label="カメラを許可する" onPress={requestPermission} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <SubHeader title="QRコードを読み取る" onBack={() => router.back()} />
      <View style={styles.cameraWrap}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={({ data }) => handleScanned(data)}
        />
        {/* スキャン枠オーバーレイ */}
        <View style={styles.overlay} pointerEvents="none">
          <View style={styles.frame} />
          <Text style={styles.overlayText}>
            招待QRコードを枠内に合わせてください
          </Text>
        </View>

        {processing ? (
          <View style={styles.processing} pointerEvents="none">
            <ActivityIndicator color={colors.white} />
            <Text style={styles.processingText}>参加しています...</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.cancelWrap}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.cancelBtn, { opacity: pressed ? 0.7 : 1 }]}
          accessibilityRole="button"
          accessibilityLabel="閉じる"
        >
          <Text style={styles.cancelLabel}>閉じる</Text>
        </Pressable>
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
    permissionText: {
      fontFamily: fonts.jp500,
      fontSize: 14,
      lineHeight: 22,
      color: c.textSub,
      textAlign: 'center',
    },
    permissionButton: {
      alignSelf: 'stretch',
      marginTop: spacing.md,
    },
    cameraWrap: {
      flex: 1,
      backgroundColor: '#000000',
      overflow: 'hidden',
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
    },
    frame: {
      width: 240,
      height: 240,
      borderRadius: 24,
      borderWidth: 3,
      borderColor: '#FFFFFF',
    },
    overlayText: {
      fontFamily: fonts.jp700,
      fontSize: 14,
      fontWeight: '700',
      color: '#FFFFFF',
      textAlign: 'center',
      marginTop: spacing.lg,
      paddingHorizontal: spacing.xl,
    },
    processing: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
      gap: spacing.sm,
    },
    processingText: {
      fontFamily: fonts.jp700,
      fontSize: 14,
      fontWeight: '700',
      color: c.white,
    },
    cancelWrap: {
      paddingHorizontal: spacing.screenH,
      paddingVertical: spacing.lg,
    },
    cancelBtn: {
      height: 52,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 18,
      backgroundColor: c.surface,
    },
    cancelLabel: {
      fontFamily: fonts.jp700,
      fontSize: 15,
      fontWeight: '700',
      color: c.text,
    },
  });
}
