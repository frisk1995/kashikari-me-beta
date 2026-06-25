import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import Purchases, { LOG_LEVEL, type CustomerInfo } from 'react-native-purchases';
import { Platform } from 'react-native';

const REVENUECAT_API_KEY_IOS = 'appl_WaktqXwqTRnSIoLmhfZVSFElmVR';

// App Store Connect で登録した Product ID（未登録の場合は後で差し替え）
const PRODUCT_ID = 'com.kashikarime.ios.premium.monthly';

/** 無料プランの上限 */
export const FREE_GROUP_LIMIT = 1;
export const FREE_MEMBER_LIMIT = 3;

interface PurchaseContextValue {
  isPremium: boolean;
  loading: boolean;
  purchasePremium: () => Promise<void>;
  restorePurchases: () => Promise<void>;
  /** 開発用: プレミアム状態をトグルする（__DEV__ のみ使用） */
  _devTogglePremium: () => Promise<void>;
}

const PurchaseContext = createContext<PurchaseContextValue>({
  isPremium: false,
  loading: true,
  purchasePremium: async () => {},
  restorePurchases: async () => {},
  _devTogglePremium: async () => {},
});

function isPremiumActive(info: CustomerInfo): boolean {
  return Object.keys(info.entitlements.active).length > 0;
}

export function PurchaseProvider({ children }: { children: ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (Platform.OS === 'web') {
      setLoading(false);
      return;
    }

    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    Purchases.configure({ apiKey: REVENUECAT_API_KEY_IOS });

    Purchases.getCustomerInfo()
      .then((info) => setIsPremium(isPremiumActive(info)))
      .catch(() => {})
      .finally(() => setLoading(false));

    Purchases.addCustomerInfoUpdateListener((info) => {
      setIsPremium(isPremiumActive(info));
    });
  }, []);

  const purchasePremium = useCallback(async () => {
    const offerings = await Purchases.getOfferings();
    const pkg =
      offerings.current?.availablePackages.find(
        (p) => p.product.identifier === PRODUCT_ID
      ) ?? offerings.current?.availablePackages[0];

    if (!pkg) throw new Error('購入可能なプランが見つかりません');

    const { customerInfo } = await Purchases.purchasePackage(pkg);
    setIsPremium(isPremiumActive(customerInfo));
  }, []);

  const restorePurchases = useCallback(async () => {
    const info = await Purchases.restorePurchases();
    setIsPremium(isPremiumActive(info));
  }, []);

  const _devTogglePremium = useCallback(async () => {
    setIsPremium((prev) => !prev);
  }, []);

  const value = useMemo(
    () => ({ isPremium, loading, purchasePremium, restorePurchases, _devTogglePremium }),
    [isPremium, loading, purchasePremium, restorePurchases, _devTogglePremium]
  );

  return <PurchaseContext.Provider value={value}>{children}</PurchaseContext.Provider>;
}

export function usePurchase(): PurchaseContextValue {
  return useContext(PurchaseContext);
}
