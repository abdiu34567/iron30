import { useEffect, useState } from 'react';
import { TelegramUser } from '../types';

declare global {
  interface Window {
    Telegram?: {
      WebApp: any;
    };
  }
}

export function useTelegram() {
  const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;

  const [user, setUser] = useState<TelegramUser>({
    id: 1001,
    first_name: 'Abdi',
    username: 'abdi_codes',
    photo_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
  });

  const [isTelegram, setIsTelegram] = useState(false);

  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();

      if (tg.initDataUnsafe?.user) {
        setUser(tg.initDataUnsafe.user);
        setIsTelegram(true);
      }
    }
  }, [tg]);

  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' = 'light') => {
    try {
      if (tg?.HapticFeedback) {
        if (type === 'success') {
          tg.HapticFeedback.notificationOccurred('success');
        } else {
          tg.HapticFeedback.impactOccurred(type);
        }
      }
    } catch (e) {
      // Haptics not supported in browser
    }
  };

  return {
    tg,
    user,
    isTelegram,
    triggerHaptic,
    closeApp: () => tg?.close(),
  };
}
