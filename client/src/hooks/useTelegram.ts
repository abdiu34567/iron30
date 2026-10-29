import { useEffect, useState, useCallback } from 'react';
import { TelegramUser } from '../types';

declare global {
  interface Window {
    Telegram?: {
      WebApp: any;
    };
  }
}

// Generate or retrieve a persistent guest user for testing outside Telegram
function getOrCreateGuestUser(): TelegramUser {
  try {
    const cached = localStorage.getItem('iron30_guest_user');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed?.id) return parsed;
    }
  } catch (e) {}

  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const guest: TelegramUser = {
    id: 9000000 + randomNum,
    first_name: `Runner #${randomNum}`,
    photo_url: `https://api.dicebear.com/7.x/bottts/svg?seed=runner_${randomNum}`,
  };

  try {
    localStorage.setItem('iron30_guest_user', JSON.stringify(guest));
  } catch (e) {}

  return guest;
}

// Robust extractor for Telegram user from all possible sources
function extractTelegramUser(): { user: TelegramUser | null; isTelegram: boolean } {
  if (typeof window === 'undefined') {
    return { user: null, isTelegram: false };
  }

  const tg = window.Telegram?.WebApp;

  // 1. Direct user object from Telegram WebApp
  if (tg?.initDataUnsafe?.user?.id) {
    return { user: tg.initDataUnsafe.user, isTelegram: true };
  }

  // 2. Query string in tg.initData
  if (tg?.initData) {
    try {
      const params = new URLSearchParams(tg.initData);
      const userParam = params.get('user');
      if (userParam) {
        const parsed = JSON.parse(userParam);
        if (parsed?.id) {
          return { user: parsed, isTelegram: true };
        }
      }
    } catch (e) {
      console.warn('Failed to parse user from tg.initData:', e);
    }
  }

  // 3. tgWebAppData in URL hash (#tgWebAppData=...) or query string (?tgWebAppData=...)
  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;
  const search = window.location.search.startsWith('?')
    ? window.location.search.slice(1)
    : window.location.search;

  for (const q of [hash, search]) {
    if (q && q.includes('tgWebAppData=')) {
      try {
        const outer = new URLSearchParams(q);
        const rawData = outer.get('tgWebAppData');
        if (rawData) {
          const inner = new URLSearchParams(rawData);
          const userStr = inner.get('user');
          if (userStr) {
            const parsed = JSON.parse(userStr);
            if (parsed?.id) {
              return { user: parsed, isTelegram: true };
            }
          }
        }
      } catch (e) {
        console.warn('Failed to parse user from URL tgWebAppData:', e);
      }
    }
  }

  // 4. Session cache from earlier in the same Telegram session
  try {
    const cached = sessionStorage.getItem('iron30_tg_user');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed?.id) {
        return { user: parsed, isTelegram: true };
      }
    }
  } catch (e) {}

  return { user: null, isTelegram: false };
}

export function useTelegram() {
  const [user, setUser] = useState<TelegramUser>(() => {
    const initial = extractTelegramUser();
    if (initial.user) return initial.user;
    return getOrCreateGuestUser();
  });

  const [isTelegram, setIsTelegram] = useState<boolean>(() => {
    return extractTelegramUser().isTelegram;
  });

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      try {
        tg.ready();
        tg.expand();
      } catch (e) {}
    }

    // Polling check to handle asynchronous SDK injection on mobile Telegram
    let attempts = 0;
    const maxAttempts = 15; // 15 * 100ms = 1.5 seconds

    const checkUser = () => {
      const extracted = extractTelegramUser();
      if (extracted.user) {
        setUser(extracted.user);
        setIsTelegram(true);
        try {
          sessionStorage.setItem('iron30_tg_user', JSON.stringify(extracted.user));
        } catch (e) {}
        return true;
      }
      return false;
    };

    if (checkUser()) {
      return;
    }

    const interval = setInterval(() => {
      attempts++;
      if (checkUser() || attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' | 'success' = 'light') => {
    try {
      const tg = window.Telegram?.WebApp;
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
  }, []);

  return {
    tg: typeof window !== 'undefined' ? window.Telegram?.WebApp : null,
    user,
    isTelegram,
    triggerHaptic,
    closeApp: () => window.Telegram?.WebApp?.close(),
  };
}
