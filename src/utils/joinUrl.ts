/**
 * 招待 URL のパース。
 *
 * 想定形式:
 *   kashikarime://join/{groupId}
 *   https://.../join/{groupId}  （Web フォールバック）
 *
 * groupId を取り出して返す。形式が一致しなければ null。
 */
export function parseJoinUrl(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  // kashikarime://join/{groupId}
  const schemeMatch = trimmed.match(/^kashikarime:\/\/join\/([^/?#]+)/i);
  if (schemeMatch && schemeMatch[1]) {
    return decodeURIComponent(schemeMatch[1]);
  }

  // 任意の URL の /join/{groupId} を許容（Web リンク等）
  const pathMatch = trimmed.match(/\/join\/([^/?#]+)/i);
  if (pathMatch && pathMatch[1]) {
    return decodeURIComponent(pathMatch[1]);
  }

  return null;
}
