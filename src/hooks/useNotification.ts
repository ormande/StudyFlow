import { useState, useCallback, useEffect } from 'react';

export function useNotification() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const STORAGE_KEY = 'settings_notifications_enabled';

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Verificar se notificações estão habilitadas no app
  const isEnabled = (): boolean => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'true';
  };

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      console.error("Este navegador não suporta notificações.");
      return 'denied';
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      // Se o usuário negar, desabilitar no app também
      if (result === 'denied') {
        localStorage.setItem(STORAGE_KEY, 'false');
      }
      
      return result;
    } catch (error) {
      console.error("Erro ao solicitar permissão:", error);
      return 'denied';
    }
  }, []);

  const playNotificationSound = useCallback(() => {
    // Cria um oscilador simples (BEEP) sem depender de arquivos externos
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine'; // Tipo de onda (senoidal é suave)
      osc.frequency.setValueAtTime(880, ctx.currentTime); // Frequência (A5)
      osc.frequency.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5); // Fade out

      gain.gain.setValueAtTime(0.1, ctx.currentTime); // Volume baixo
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.error("Erro ao tocar som:", e);
    }
  }, []);

  const sendNotification = useCallback(async (title: string, options?: NotificationOptions) => {
    // Verificar se a permissão foi concedida
    if (permission !== 'granted') {
      console.warn("Permissão de notificação não concedida.");
      return;
    }

    // Verificar se o usuário habilitou notificações no app
    if (!isEnabled()) {
      console.warn("Notificações desabilitadas pelo usuário no app.");
      return;
    }

    playNotificationSound();

    try {
      // Tentar usar Service Worker para melhor suporte no mobile (Android)
      // Só usar se houver service worker registrado
      if ('serviceWorker' in navigator) {
        try {
          // Verificar se há service worker registrado (não apenas se a API existe)
          const registrations = await navigator.serviceWorker.getRegistrations();
          
          if (registrations.length > 0) {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification(title, {
              icon: '/icon-192.png',
              badge: '/icon-192.png',
              ...options
            });
            return;
          }
        } catch (swError) {
          console.warn("Erro ao usar Service Worker, tentando Notification API:", swError);
          // Fallback para Notification API
        }
      }

      // Fallback: usar Notification API diretamente
      new Notification(title, {
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        ...options
      });
    } catch (e) {
      console.error("Erro ao enviar notificação:", e);
    }
  }, [permission, playNotificationSound]);

  return { permission, requestPermission, sendNotification, isEnabled };
}
