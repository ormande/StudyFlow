import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, Volume2, VolumeX, Database, FileSpreadsheet, FileText, AlertTriangle, Trash2, Play } from 'lucide-react';
import { Subject, StudyLog } from '../types';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { useAchievementsContext } from '../contexts/AchievementsContext';
import IOSSwitch from '../components/IOSSwitch';
import ConfirmModal from '../components/ConfirmModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { registerPoppinsFontSimple } from '../utils/pdfFonts';

interface SettingsPageProps {
  onNavigateBack?: () => void;
  showPerformance: boolean;
  onTogglePerformance: () => void;
  subjects: Subject[];
  logs: StudyLog[];
  userEmail?: string;
}

export default function SettingsPage({
  onNavigateBack,
  showPerformance,
  onTogglePerformance,
  subjects,
  logs,
  userEmail,
}: SettingsPageProps) {
  const { addToast } = useToast();
  const { resetAchievements } = useAchievementsContext();
  const [showFactoryResetConfirm, setShowFactoryResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [timerSoundEnabled, setTimerSoundEnabled] = useState(true);

  // Carregar preferência de som do timer do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('timer_sound_enabled');
    if (saved !== null) {
      setTimerSoundEnabled(saved === 'true');
    }
  }, []);

  // Salvar preferência de som do timer
  const handleToggleTimerSound = (enabled: boolean) => {
    setTimerSoundEnabled(enabled);
    localStorage.setItem('timer_sound_enabled', enabled.toString());
  };

  // Testar som do timer
  const handleTestSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800; // Frequência do beep
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  // Função para Exportar CSV (Compatível com Excel Brasil)
  const handleExportCSV = () => {
    // Cabeçalhos do CSV
    const headers = ['Data', 'Matéria', 'Tipo', 'Tempo (min)', 'Páginas', 'Acertos', 'Erros', 'Notas'];
    
    // Separador para Excel brasileiro (ponto e vírgula)
    const SEPARATOR = ';';
    
    // Função para sanitizar notas: remove quebras de linha e pontos e vírgula
    const sanitizeNotes = (notes: string | undefined | null): string => {
      if (!notes) return '';
      return notes
        .replace(/\n/g, ' ') // Substitui quebras de linha por espaço
        .replace(/;/g, ',')  // Substitui ponto e vírgula por vírgula
        .trim();
    };
    
    // Função para escapar campos CSV (agora trata ponto e vírgula)
    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      // Se contém ponto e vírgula, aspas ou quebra de linha, envolve em aspas e duplica aspas internas
      if (str.includes(';') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Função para formatar números no padrão brasileiro (vírgula como separador decimal)
    const formatNumberBR = (num: number): string => {
      return num.toFixed(2).replace('.', ',');
    };

    // Mapear logs para linhas CSV
    const rows = logs.map(log => {
      // Encontrar o nome da matéria
      const subject = subjects.find(s => s.id === log.subjectId);
      const subjectName = subject?.name || 'Desconhecida';
      
      // Calcular tempo total em minutos
      const totalMinutes = (log.hours || 0) * 60 + (log.minutes || 0) + ((log.seconds || 0) / 60);
      
      // Formatar data (assumindo que log.date está no formato ISO ou similar)
      const date = log.date ? new Date(log.date).toLocaleDateString('pt-BR') : '';
      
      // Sanitizar notas antes de processar
      const sanitizedNotes = sanitizeNotes(log.notes);
      
      return [
        escapeCSV(date),
        escapeCSV(subjectName),
        escapeCSV(log.type),
        escapeCSV(formatNumberBR(totalMinutes)), // Formato brasileiro com vírgula
        escapeCSV(log.pages || ''),
        escapeCSV(log.correct || ''),
        escapeCSV(log.wrong || ''),
        escapeCSV(sanitizedNotes)
      ].join(SEPARATOR);
    });

    // Combinar cabeçalhos e linhas com separador ponto e vírgula
    const csvContent = [headers.join(SEPARATOR), ...rows].join('\n');
    
    // Criar Blob com BOM para Excel reconhecer UTF-8 corretamente (acentos)
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Criar link temporário e disparar download
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = 'studyflow_backup.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    addToast('CSV exportado com sucesso!', 'success');
  };

  // ============================================
  // FUNÇÕES AUXILIARES PARA RELATÓRIO PDF
  // ============================================

  /**
   * Calcula estatísticas agregadas dos logs de estudo
   */
  const calculateStats = (logs: StudyLog[]): {
    totalMinutes: number;
    totalHours: number;
    totalQuestions: number;
    totalCorrect: number;
    totalWrong: number;
    accuracyRate: number;
    averageDailyMinutes: number;
    periodStart: Date | null;
    periodEnd: Date | null;
  } => {
    if (logs.length === 0) {
      return {
        totalMinutes: 0,
        totalHours: 0,
        totalQuestions: 0,
        totalCorrect: 0,
        totalWrong: 0,
        accuracyRate: 0,
        averageDailyMinutes: 0,
        periodStart: null,
        periodEnd: null
      };
    }

    let totalMinutes = 0;
    let totalQuestions = 0;
    let totalCorrect = 0;
    let totalWrong = 0;
    const dates: Date[] = [];

    logs.forEach(log => {
      // Calcular tempo total em minutos
      const logMinutes = (log.hours || 0) * 60 + (log.minutes || 0) + ((log.seconds || 0) / 60);
      totalMinutes += logMinutes;

      // Calcular questões
      if (log.correct !== undefined && log.correct !== null) {
        totalCorrect += log.correct;
      }
      if (log.wrong !== undefined && log.wrong !== null) {
        totalWrong += log.wrong;
      }
      totalQuestions = totalCorrect + totalWrong;

      // Coletar datas
      if (log.date) {
        dates.push(new Date(log.date));
      }
    });

    const totalHours = Math.floor(totalMinutes / 60);
    
    // Calcular taxa de acerto
    const accuracyRate = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

    // Calcular média diária
    const uniqueDays = new Set(dates.map(d => d.toDateString())).size;
    const averageDailyMinutes = uniqueDays > 0 ? totalMinutes / uniqueDays : 0;

    // Período do relatório
    const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());
    const periodStart = sortedDates.length > 0 ? sortedDates[0] : null;
    const periodEnd = sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : null;

    return {
      totalMinutes,
      totalHours,
      totalQuestions,
      totalCorrect,
      totalWrong,
      accuracyRate,
      averageDailyMinutes,
      periodStart,
      periodEnd
    };
  };

  /**
   * Carrega a logo do StudyFlow como base64
   */
  const loadLogoAsBase64 = async (): Promise<string | null> => {
    try {
      const response = await fetch('/icon-192.png');
      if (!response.ok) return null;
      
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64);
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn('Não foi possível carregar a logo:', error);
      return null;
    }
  };

  /**
   * Extrai a cor verde dominante da logo do StudyFlow
   */
  const extractLogoGreenColor = async (): Promise<[number, number, number] | null> => {
    try {
      const response = await fetch('/icon-192.png');
      if (!response.ok) return null;

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);

      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              URL.revokeObjectURL(imageUrl);
              resolve(null);
              return;
            }

            ctx.drawImage(img, 0, 0);
            
            // Analisar pixels para encontrar a cor verde dominante
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = imageData.data;
            
            const greenPixels: { r: number; g: number; b: number; count: number }[] = [];
            
            for (let i = 0; i < pixels.length; i += 4) {
              const r = pixels[i];
              const g = pixels[i + 1];
              const b = pixels[i + 2];
              
              if (g > r && g > b && g > 100) {
                const existing = greenPixels.find(
                  p => Math.abs(p.r - r) < 10 && Math.abs(p.g - g) < 10 && Math.abs(p.b - b) < 10
                );
                
                if (existing) {
                  existing.r = (existing.r * existing.count + r) / (existing.count + 1);
                  existing.g = (existing.g * existing.count + g) / (existing.count + 1);
                  existing.b = (existing.b * existing.count + b) / (existing.count + 1);
                  existing.count++;
                } else {
                  greenPixels.push({ r, g, b, count: 1 });
                }
              }
            }
            
            URL.revokeObjectURL(imageUrl);
            
            if (greenPixels.length === 0) {
              resolve(null);
              return;
            }
            
            const dominantGreen = greenPixels.reduce((prev, current) => 
              current.count > prev.count ? current : prev
            );
            
            resolve([
              Math.round(dominantGreen.r),
              Math.round(dominantGreen.g),
              Math.round(dominantGreen.b)
            ]);
          } catch (error) {
            console.warn('Erro ao extrair cor da logo:', error);
            URL.revokeObjectURL(imageUrl);
            resolve(null);
          }
        };
        
        img.onerror = () => {
          URL.revokeObjectURL(imageUrl);
          resolve(null);
        };
        
        img.src = imageUrl;
      });
    } catch (error) {
      console.warn('Erro ao carregar logo para extração de cor:', error);
      return null;
    }
  };

  /**
   * Helper para obter a fonte correta
   */
  const getFont = (doc: jsPDF): string => {
    try {
      const currentFont = doc.getFont();
      if (currentFont.fontName === 'Poppins') {
        return 'Poppins';
      }
    } catch (e) {
      // Ignorar erro
    }
    return 'helvetica';
  };

  /**
   * Helper para definir fonte com fallback
   */
  const setFontSafe = (doc: jsPDF, style: 'normal' | 'bold' = 'normal'): void => {
    const fontFamily = getFont(doc);
    doc.setFont(fontFamily, style);
  };

  /**
   * Desenha o cabeçalho profissional do relatório
   */
  const drawHeader = async (doc: jsPDF, userEmail: string | undefined, periodStart: Date | null, periodEnd: Date | null, logoBase64: string | null, greenColor: [number, number, number]): Promise<number> => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const headerHeight = 45;

    doc.setFillColor(greenColor[0], greenColor[1], greenColor[2]);
    doc.rect(0, 0, pageWidth, headerHeight, 'F');

    if (logoBase64) {
      try {
        const logoSize = 20;
        const logoX = 15;
        const logoY = (headerHeight - logoSize) / 2;
        doc.addImage(logoBase64, 'PNG', logoX, logoY, logoSize, logoSize);
      } catch (error) {
        console.warn('Erro ao adicionar logo ao PDF:', error);
      }
    }

    const textStartX = logoBase64 ? 40 : 15;
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    const fontFamily = doc.getFont().fontName === 'Poppins' ? 'Poppins' : 'helvetica';
    doc.setFont(fontFamily, 'bold');
    doc.text('StudyFlow', textStartX, 18);

    doc.setFontSize(12);
    setFontSafe(doc, 'normal');
    doc.text('Relatório Executivo de Estudos', textStartX, 28);

    doc.setFontSize(9);
    doc.text(`Aluno: ${userEmail || 'Não identificado'}`, textStartX, 36);

    let periodText = 'Período: ';
    if (periodStart && periodEnd) {
      const startStr = periodStart.toLocaleDateString('pt-BR');
      const endStr = periodEnd.toLocaleDateString('pt-BR');
      periodText += `${startStr} a ${endStr}`;
    } else {
      periodText += 'Todos os registros';
    }
    doc.text(periodText, textStartX, 41);

    const currentDate = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.setFontSize(8);
    doc.text(`Gerado em: ${currentDate}`, pageWidth - 15, 15, { align: 'right' });

    return headerHeight;
  };

  /**
   * Desenha cards de KPIs (Resumo Executivo)
   */
  const drawKPICards = (doc: jsPDF, stats: ReturnType<typeof calculateStats>, startY: number, greenColor: [number, number, number]): number => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const cardWidth = (pageWidth - margin * 3) / 2;
    const cardHeight = 35;
    const cardGap = 10;
    let currentY = startY + 10;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    setFontSafe(doc, 'bold');
    doc.text('Resumo Executivo', margin, currentY);
    currentY += 8;

    // Card 1: Tempo Total
    drawKPICard(doc, margin, currentY, cardWidth, cardHeight, 'Tempo Total', `${stats.totalHours}h ${Math.round(stats.totalMinutes % 60)}min`, 'Estudado', greenColor);

    // Card 2: Desempenho
    drawKPICard(doc, margin * 2 + cardWidth, currentY, cardWidth, cardHeight, 'Desempenho', `${stats.totalQuestions} questões`, `${stats.accuracyRate.toFixed(1)}% de acerto`, greenColor);

    currentY += cardHeight + cardGap;

    // Card 3: Média Diária
    drawKPICard(doc, margin, currentY, cardWidth, cardHeight, 'Média Diária', `${Math.round(stats.averageDailyMinutes)} min/dia`, 'Tempo médio de estudo', greenColor);

    // Card 4: Detalhes
    const acertosText = stats.totalCorrect > 0 ? `${stats.totalCorrect} acertos` : 'N/A';
    drawKPICard(doc, margin * 2 + cardWidth, currentY, cardWidth, cardHeight, 'Detalhes', acertosText, stats.totalWrong > 0 ? `${stats.totalWrong} erros` : 'Sem erros', greenColor);

    return currentY + cardHeight + 15;
  };

  /**
   * Desenha um card individual de KPI
   */
  const drawKPICard = (
    doc: jsPDF,
    x: number,
    y: number,
    width: number,
    height: number,
    title: string,
    value: string,
    subtitle: string,
    greenColor: [number, number, number]
  ): void => {
    doc.setFillColor(245, 247, 250);
    doc.setDrawColor(200, 200, 200);
    doc.roundedRect(x, y, width, height, 3, 3, 'FD');

    doc.setFillColor(greenColor[0], greenColor[1], greenColor[2]);
    doc.rect(x, y, width, 5, 'F');

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    setFontSafe(doc, 'normal');
    doc.text(title, x + 8, y + 12);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    setFontSafe(doc, 'bold');
    doc.text(value, x + 8, y + 22);

    doc.setTextColor(120, 120, 120);
    doc.setFontSize(8);
    setFontSafe(doc, 'normal');
    doc.text(subtitle, x + 8, y + 30);
  };

  /**
   * Desenha gráfico de barras semanal (últimos 7 dias)
   */
  const drawWeeklyChart = (doc: jsPDF, logs: StudyLog[], startY: number, greenColor: [number, number, number]): number => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const chartWidth = pageWidth - margin * 2;
    const chartHeight = 60;
    const chartX = margin;
    const chartY = startY + 10;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    setFontSafe(doc, 'bold');
    doc.text('Atividade Semanal (Últimos 7 Dias)', chartX, chartY);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const dailyData: { date: Date; minutes: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(sevenDaysAgo);
      date.setDate(date.getDate() + i);
      dailyData.push({ date, minutes: 0 });
    }

    logs.forEach(log => {
      if (log.date) {
        const logDate = new Date(log.date);
        logDate.setHours(0, 0, 0, 0);
        
        const dayIndex = dailyData.findIndex(d => 
          d.date.getTime() === logDate.getTime()
        );
        
        if (dayIndex !== -1) {
          const logMinutes = (log.hours || 0) * 60 + (log.minutes || 0) + ((log.seconds || 0) / 60);
          dailyData[dayIndex].minutes += logMinutes;
        }
      }
    });

    const maxMinutes = Math.max(...dailyData.map(d => d.minutes), 1);
    const barWidth = (chartWidth - 20) / 7;
    const maxBarHeight = chartHeight - 25;

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(chartX, chartY + maxBarHeight + 15, chartX + chartWidth, chartY + maxBarHeight + 15);
    doc.line(chartX, chartY + 5, chartX, chartY + maxBarHeight + 15);

    dailyData.forEach((day, index) => {
      const barX = chartX + 10 + index * barWidth;
      const barHeight = maxMinutes > 0 ? (day.minutes / maxMinutes) * maxBarHeight : 0;
      const barY = chartY + maxBarHeight + 15 - barHeight;

      const intensity = maxMinutes > 0 ? Math.min(day.minutes / maxMinutes, 1) : 0;
      const r = Math.round(greenColor[0] + (255 - greenColor[0]) * (1 - intensity) * 0.3);
      const g = Math.round(greenColor[1] + (255 - greenColor[1]) * (1 - intensity) * 0.3);
      const b = Math.round(greenColor[2] + (255 - greenColor[2]) * (1 - intensity) * 0.3);
      doc.setFillColor(r, g, b);

      doc.rect(barX, barY, barWidth - 2, barHeight, 'F');

      doc.setTextColor(100, 100, 100);
      doc.setFontSize(7);
      setFontSafe(doc, 'normal');
      const dayLabel = day.date.toLocaleDateString('pt-BR', { weekday: 'short' }).substring(0, 3);
      doc.text(dayLabel.toUpperCase(), barX + (barWidth - 2) / 2, chartY + maxBarHeight + 20, { align: 'center' });

      if (day.minutes > 0) {
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(7);
        setFontSafe(doc, 'bold');
        const minutesText = Math.round(day.minutes).toString();
        doc.text(minutesText, barX + (barWidth - 2) / 2, barY - 3, { align: 'center' });
      }
    });

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    setFontSafe(doc, 'normal');
    doc.text(`${Math.round(maxMinutes)} min`, chartX - 5, chartY + 5, { align: 'right' });

    return chartY + chartHeight + 10;
  };

  /**
   * Desenha rodapé com paginação
   */
  const drawFooter = (doc: jsPDF, pageNumber: number, totalPages: number): void => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const footerY = pageHeight - 15;

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(15, footerY - 5, pageWidth - 15, footerY - 5);

    doc.setTextColor(120, 120, 120);
    doc.setFontSize(8);
    setFontSafe(doc, 'normal');
    doc.text('Gerado via StudyFlow', 15, footerY);
    doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth - 15, footerY, { align: 'right' });
  };

  /**
   * Função principal para Exportar PDF Profissional
   */
  const handleExportPDF = async () => {
    if (!logs || logs.length === 0) {
      addToast('Não há registros para exportar. Adicione alguns estudos primeiro!', 'error');
      return;
    }

    setIsExportingPDF(true);

    setTimeout(async () => {
      try {
        const logoBase64 = await loadLogoAsBase64();
        const logoGreenColor = await extractLogoGreenColor();
        const greenColor: [number, number, number] = logoGreenColor || [16, 185, 129];

        const doc = new jsPDF();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;

        const poppinsRegistered = await registerPoppinsFontSimple(doc);
        
        if (poppinsRegistered) {
          doc.setFont('Poppins', 'normal');
        } else {
          setFontSafe(doc, 'normal');
        }
        doc.setTextColor(0, 0, 0);

        const stats = calculateStats(logs);
        const headerHeight = await drawHeader(doc, userEmail, stats.periodStart, stats.periodEnd, logoBase64, greenColor);
        let currentY = headerHeight + 5;

        const addFooter = () => {
          const totalPages = doc.getNumberOfPages();
          for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            drawFooter(doc, i, totalPages);
          }
        };

        currentY = drawKPICards(doc, stats, currentY, greenColor);

        if (currentY > pageHeight - 80) {
          doc.addPage();
          currentY = margin;
        }

        if (logs.length > 0) {
          currentY = drawWeeklyChart(doc, logs, currentY, greenColor);
        }

        if (currentY > pageHeight - 100) {
          doc.addPage();
          currentY = margin;
        }

        const tableData = logs
          .sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            return dateB - dateA;
          })
          .map(log => {
            const subject = subjects.find(s => s.id === log.subjectId);
            const subjectName = subject?.name || 'Desconhecida';
            const totalMinutes = (log.hours || 0) * 60 + (log.minutes || 0) + ((log.seconds || 0) / 60);
            const date = log.date ? new Date(log.date).toLocaleDateString('pt-BR') : '';
            
            const totalQ = (log.correct || 0) + (log.wrong || 0);
            const accuracy = totalQ > 0 ? ((log.correct || 0) / totalQ * 100).toFixed(1) : '-';
            
            return [
              date,
              subjectName,
              log.type.charAt(0).toUpperCase() + log.type.slice(1),
              totalMinutes.toFixed(1).replace('.', ','),
              log.pages?.toString() || '-',
              log.correct?.toString() || '-',
              log.wrong?.toString() || '-',
              accuracy !== '-' ? `${accuracy}%` : '-'
            ];
          });

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        setFontSafe(doc, 'bold');
        doc.text('Registros Detalhados', margin, currentY);
        currentY += 8;

        autoTable(doc, {
          startY: currentY,
          head: [['Data', 'Matéria', 'Tipo', 'Tempo (min)', 'Páginas', 'Acertos', 'Erros', 'Taxa Acerto']],
          body: tableData.length > 0 ? tableData : [['Nenhum registro encontrado', '', '', '', '', '', '', '']],
          headStyles: {
            fillColor: greenColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9,
            halign: 'center'
          },
          alternateRowStyles: {
            fillColor: [245, 247, 250]
          },
          styles: {
            fontSize: 8,
            cellPadding: 2.5,
            halign: 'center'
          },
          columnStyles: {
            0: { cellWidth: 25, halign: 'left' },
            1: { cellWidth: 45, halign: 'left' },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 20, halign: 'center' },
            4: { cellWidth: 18, halign: 'center' },
            5: { cellWidth: 18, halign: 'center' },
            6: { cellWidth: 18, halign: 'center' },
            7: { cellWidth: 20, halign: 'center' }
          },
          margin: { left: margin, right: margin },
          didDrawPage: () => {
            addFooter();
          }
        });

        addFooter();

        const fileName = `studyflow_relatorio_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);

        setIsExportingPDF(false);
        addToast('PDF gerado com sucesso!', 'success');
      } catch (error: any) {
        console.error('Erro ao gerar PDF:', error);
        setIsExportingPDF(false);
        addToast('Erro ao gerar PDF. Detalhe: ' + (error?.message || 'Erro desconhecido'), 'error');
      }
    }, 100);
  };

  // Função para Factory Reset (Zerar todos os dados)
  const handleFactoryReset = async () => {
    setIsResetting(true);
    try {
      // CRÍTICO: Limpar estado React de conquistas ANTES do factory_reset
      // Isso evita que o hook salve as conquistas de volta no Supabase após o reset
      await resetAchievements();
      
      // Pequeno delay para garantir que o estado foi limpo
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const { error } = await supabase.rpc('factory_reset');

      if (error) {
        throw error;
      }

      // Limpar dados do localStorage relacionados a gamificação
      const keysToClean = [
        'studyflow_total_xp',
        'studyflow_xp_history',
        'studyflow_user_achievements',
        'studyflow_achievements',
        'studyflow_logs',
        'studyflow_processed_logs',
        'timer_sound_enabled'
      ];
      
      keysToClean.forEach(key => {
        localStorage.removeItem(key);
        localStorage.removeItem(`_${key}`);
        localStorage.removeItem(`${key}_`);
      });
      
      // Limpar TODAS as flags de streak bonus e conquistas do localStorage
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('studyflow_streak_bonus_') || 
          key.includes('achievement') || 
          key.includes('conquista') ||
          key.startsWith('studyflow_xp') ||
          key.startsWith('studyflow_elo')
        )) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.warn(`Erro ao remover chave ${key}:`, e);
        }
      });

      // Limpar dados do sessionStorage
      const sessionKeysToClean = [
        'studyflow_processed_logs',
        'studyflow_xp_history',
        'studyflow_user_achievements'
      ];
      sessionKeysToClean.forEach(key => {
        try {
          sessionStorage.removeItem(key);
        } catch (e) {
          console.warn(`Erro ao remover chave do sessionStorage ${key}:`, e);
        }
      });
      
      setShowFactoryResetConfirm(false);
      addToast('Todos os dados foram apagados com sucesso! A página será recarregada.', 'success');
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('Erro ao resetar dados:', error);
      addToast('Erro ao apagar dados: ' + (error?.message || 'Erro desconhecido'), 'error');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-2xl mx-auto px-6 py-8 pb-24 md:pb-8"
      >
        {/* Header */}
        <div className="mb-8">
          {/* Botão Voltar - Apenas Mobile */}
          {onNavigateBack && (
            <button
              onClick={onNavigateBack}
              className="md:hidden flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors mb-4"
            >
              <ArrowLeft size={20} />
              <span className="font-semibold">Voltar</span>
            </button>
          )}
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1 flex items-center gap-2">
            <Database className="text-emerald-500" size={28} />
            Configurações
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Gerencie suas preferências e dados
          </p>
        </div>

        {/* Seção 1 - Privacidade */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Eye className="text-emerald-500" size={20} />
            Privacidade
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Mostrar desempenho ao compartilhar
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Exibe suas estatísticas quando compartilha o progresso
                </p>
              </div>
              <IOSSwitch
                checked={showPerformance}
                onChange={onTogglePerformance}
                aria-label="Mostrar desempenho"
              />
            </div>
          </div>
        </div>

        {/* Seção 2 - Notificações */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            {timerSoundEnabled ? (
              <Volume2 className="text-emerald-500" size={20} />
            ) : (
              <VolumeX className="text-gray-500" size={20} />
            )}
            Notificações
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Sons do Timer
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Reproduz um som quando o timer finaliza
                </p>
              </div>
              <IOSSwitch
                checked={timerSoundEnabled}
                onChange={handleToggleTimerSound}
                aria-label="Sons do Timer"
              />
            </div>
            <button
              onClick={handleTestSound}
              className="w-full px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Play size={18} />
              Testar Som
            </button>
          </div>
        </div>

        {/* Seção 3 - Dados */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Database className="text-blue-500" size={20} />
            Dados
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleExportCSV}
              className="bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl p-6 flex flex-col items-center gap-3 transition-all active:scale-95 border border-blue-200 dark:border-blue-800"
            >
              <div className="p-3 bg-blue-500 rounded-xl text-white">
                <FileSpreadsheet size={24} />
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white text-center">
                Exportar CSV
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Compatível Excel
              </p>
            </button>

            <button
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl p-6 flex flex-col items-center gap-3 transition-all active:scale-95 border border-red-200 dark:border-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="p-3 bg-red-500 rounded-xl text-white">
                {isExportingPDF ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <FileText size={24} />
                  </motion.div>
                ) : (
                  <FileText size={24} />
                )}
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white text-center">
                {isExportingPDF ? 'Gerando...' : 'Exportar PDF'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Relatório profissional
              </p>
            </button>
          </div>
        </div>

        {/* Seção 4 - Zona de Perigo */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
            <AlertTriangle className="text-red-600 dark:text-red-400" size={20} />
            Zona de Perigo
          </h2>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border-2 border-red-200 dark:border-red-800">
            <div className="mb-4">
              <h3 className="font-bold text-red-900 dark:text-red-200 mb-2">
                Zerar Conta Completamente
              </h3>
              <p className="text-sm text-red-800 dark:text-red-300">
                Esta ação é IRREVERSÍVEL. Todo o seu histórico, conquistas, elos e matérias serão apagados permanentemente.
              </p>
            </div>
            <button
              onClick={() => setShowFactoryResetConfirm(true)}
              disabled={isResetting}
              className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Trash2 size={18} />
              {isResetting ? 'Apagando...' : 'Zerar Conta'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Modal de Confirmação de Factory Reset */}
      <ConfirmModal
        isOpen={showFactoryResetConfirm}
        title="Zerar Conta Completamente?"
        message="Esta ação é IRREVERSÍVEL. Todo o seu histórico, conquistas, elos e matérias serão apagados permanentemente. Você voltará para a estaca zero."
        confirmText={isResetting ? "Apagando..." : "Sim, apagar tudo"}
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleFactoryReset}
        onCancel={() => setShowFactoryResetConfirm(false)}
      />
    </>
  );
}

