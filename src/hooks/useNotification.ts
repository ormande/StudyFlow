import { useState, useCallback, useEffect } from 'react';

export function useNotification() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.error("Este navegador não suporta notificações.");
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
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

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission === 'granted') {
      playNotificationSound();
      
      // Tenta enviar notificação nativa
      try {
        new Notification(title, {
          icon: '/vite.svg', // Tenta usar o logo do Vite/App se existir
          ...options
        });
      } catch (e) {
        console.error("Erro ao enviar notificação:", e);
      }
    } else {
      console.warn("Permissão de notificação não concedida.");
    }
  }, [permission, playNotificationSound]);

  return { permission, requestPermission, sendNotification };
}
