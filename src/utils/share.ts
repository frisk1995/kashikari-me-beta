/**
 * テキスト共有・コピーの共通ユーティリティ。
 *
 * - Web: `navigator.share`（対応端末）→ 失敗・非対応時は `navigator.clipboard.writeText`
 *   → さらに非対応時は execCommand('copy') の textarea フォールバックでコピーする。
 * - Native: React Native の `Share.share()` を使用。
 *
 * 戻り値はユーザーへ返すフィードバックの種別（'shared' | 'copied' | 'cancelled' | 'failed'）。
 * 呼び出し側はこれを使って「コピーしました」等のトーストを出し分けられる。
 */
import { Platform, Share } from 'react-native';

export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed';

/** Web で textarea を使ったレガシーなコピー（clipboard API 非対応時のフォールバック） */
function legacyCopy(text: string): boolean {
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

/**
 * テキストを共有またはクリップボードにコピーする。
 * @param text 共有・コピー対象のテキスト
 * @param title 共有シートのタイトル（native の Share / Web の navigator.share で使用）
 */
export async function shareText(text: string, title = '精算結果'): Promise<ShareOutcome> {
  if (Platform.OS === 'web') {
    // 1. navigator.share（モバイル Web 等で利用可能）
    const nav = typeof navigator !== 'undefined' ? (navigator as Navigator & { share?: (data: ShareData) => Promise<void> }) : undefined;
    if (nav?.share) {
      try {
        await nav.share({ title, text });
        return 'shared';
      } catch (e) {
        // ユーザーキャンセルは AbortError。その場合はコピーにフォールバックせず終了。
        if (e && typeof e === 'object' && (e as { name?: string }).name === 'AbortError') {
          return 'cancelled';
        }
        // それ以外は clipboard コピーへフォールバック
      }
    }
    // 2. clipboard API
    try {
      if (nav?.clipboard?.writeText) {
        await nav.clipboard.writeText(text);
        return 'copied';
      }
    } catch {
      // 3. レガシー execCommand フォールバックへ
    }
    return legacyCopy(text) ? 'copied' : 'failed';
  }

  // Native: Share.share
  try {
    const result = await Share.share({ message: text, title });
    if (result.action === Share.dismissedAction) {
      return 'cancelled';
    }
    return 'shared';
  } catch {
    return 'failed';
  }
}
