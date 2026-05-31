import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fonts, radius, tileColorForIndex, tileGlyphColor } from '@/theme';
import { useTheme } from '@/context/ThemeContext';

interface IconTileProps {
  /** 表示する先頭1文字 */
  label: string;
  /** グラデーション色ローテーション用 index */
  index: number;
  size?: number;
}

function firstChar(label: string): string {
  const trimmed = (label ?? '').trim();
  return trimmed.length > 0 ? Array.from(trimmed)[0] : '?';
}

/** グループ／カテゴリ用のグラデーション角丸スクエアアイコン（テーマの iconTile 色を使用） */
export function IconTile({ label, index, size = 48 }: IconTileProps) {
  const { colors } = useTheme();
  const tileColor = tileColorForIndex(colors, index);
  const glyphColor = tileGlyphColor(colors, index);
  const tileRadius = size >= 48 ? radius.iconTile : 14;
  const glyphSize = size >= 48 ? 20 : 18;
  return (
    <View
      style={[styles.tile, { width: size, height: size, borderRadius: tileRadius, backgroundColor: tileColor }]}
    >
      <Text style={[styles.glyph, { color: glyphColor, fontSize: glyphSize }]}>
        {firstChar(label)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    fontFamily: fonts.baloo800,
    fontWeight: '800',
    textAlign: 'center',
  },
});
