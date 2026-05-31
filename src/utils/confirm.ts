/**
 * 破壊的操作の確認ダイアログ共通ユーティリティ。
 *
 * react-native-web では `Alert.alert` の多ボタン版が no-op になり無反応となるため、
 * Web では `window.confirm`、native では `Alert.alert` を使い分ける。
 * （Sprint 1 のグループ削除バグと同根。Evaluator の改善提案に従い一元化した）
 */
import { Alert, Platform } from 'react-native';

interface ConfirmDestructiveOptions {
  title: string;
  message: string;
  /** 確定ボタンの文言（native のみ反映。Web は OK/キャンセルの2択） */
  confirmLabel?: string;
  cancelLabel?: string;
}

/**
 * 破壊的操作の確認。確定されたとき onConfirm を呼ぶ。
 * - Web: window.confirm（true で onConfirm）
 * - native: Alert.alert の destructive 2 ボタン
 */
export function confirmDestructive(
  options: ConfirmDestructiveOptions,
  onConfirm: () => void
): void {
  const { title, message, confirmLabel = '削除', cancelLabel = 'キャンセル' } = options;

  if (Platform.OS === 'web') {
    // Web: ブラウザ標準の confirm（タイトルは本文へ統合）
    const text = title ? `${title}\n\n${message}` : message;
    if (window.confirm(text)) {
      onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: cancelLabel, style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}
