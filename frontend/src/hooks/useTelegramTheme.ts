import { useEffect } from 'react';
import WebApp from '@twa-dev/sdk';

export const useTelegramTheme = () => {
  useEffect(() => {
    // Инициализация Telegram WebApp
    WebApp.ready();
    WebApp.expand();

    // Применяем тему Telegram
    const applyTheme = () => {
      const root = document.documentElement;
      const params = WebApp.themeParams;

      // Маппинг параметров темы Telegram на CSS переменные
      if (params.bg_color) {
        root.style.setProperty('--tg-theme-bg-color', params.bg_color);
      }
      if (params.text_color) {
        root.style.setProperty('--tg-theme-text-color', params.text_color);
      }
      if (params.hint_color) {
        root.style.setProperty('--tg-theme-hint-color', params.hint_color);
      }
      if (params.link_color) {
        root.style.setProperty('--tg-theme-link-color', params.link_color);
      }
      if (params.button_color) {
        root.style.setProperty('--tg-theme-button-color', params.button_color);
      }
      if (params.button_text_color) {
        root.style.setProperty('--tg-theme-button-text-color', params.button_text_color);
      }
      if (params.secondary_bg_color) {
        root.style.setProperty('--tg-theme-secondary-bg-color', params.secondary_bg_color);
      }
    };

    applyTheme();

    // Подписка на изменения темы
    WebApp.onEvent('themeChanged', applyTheme);

    return () => {
      WebApp.offEvent('themeChanged', applyTheme);
    };
  }, []);

  return {
    isDark: WebApp.colorScheme === 'dark',
    themeParams: WebApp.themeParams,
  };
};
