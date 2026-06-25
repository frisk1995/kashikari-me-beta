import { Platform } from 'react-native';
import { useWindowDimensions } from 'react-native';

export const IPAD_MAX_WIDTH = 720;
export const IPAD_BREAKPOINT = 768;

export function useIPad() {
  const { width } = useWindowDimensions();
  const isIPad = Platform.OS === 'ios' && Platform.isPad;
  const isWide = isIPad || width >= IPAD_BREAKPOINT;
  return { isIPad, isWide };
}
