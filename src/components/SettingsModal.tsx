import { useState } from 'react';
import { X, Instagram, AlertTriangle, Settings, Eye, EyeOff, Lock, Database, FileSpreadsheet, FileText, Bell, BellOff, LogOut, Trash2, Zap, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Subject, StudyLog } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useNotification } from '../hooks/useNotification';
import { useToast } from '../contexts/ToastContext';
import { useAchievementsContext } from '../contexts/AchievementsContext';
import ConfirmModal from './ConfirmModal';
import ChangePasswordModal from './ChangePasswordModal';
import FeedbackModal from './FeedbackModal';
import { registerPoppinsFontSimple } from '../utils/pdfFonts';
// i18n guardado para uso futuro:
// Para reativar: descomente a linha abaixo e adicione o seletor de idioma na seção "Preferências & Foco"
// import { useTranslation } from 'react-i18next';
// import { Globe } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onHardReset: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  dailyGoal: number;
  onSetDailyGoal: (minutes: number) => void;
  showPerformance: boolean;
  onTogglePerformance: () => void;
  subjects: Subject[];
  logs: StudyLog[];
  userEmail: string | undefined;
  userId?: string;
  onNavigateToGoals?: () => void;
}

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  onHardReset, 
  isDarkMode: _isDarkMode, 
  onToggleTheme: _onToggleTheme,
  dailyGoal: _dailyGoal,
  onSetDailyGoal: _onSetDailyGoal,
  showPerformance,
  onTogglePerformance,
  subjects,
  logs,
  userEmail,
  userId,
  onNavigateToGoals: _onNavigateToGoals
}: SettingsModalProps) {
  // Estados para confirmações
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showFactoryResetConfirm, setShowFactoryResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  
  // Hook de notificações
  const { permission, requestPermission, sendNotification } = useNotification();
  const { addToast } = useToast();
  
  // Tentar obter contexto de conquistas (pode não estar disponível)
  let resetAchievements: (() => Promise<void>) | null = null;
  try {
    const achievementsContext = useAchievementsContext();
    resetAchievements = achievementsContext.resetAchievements;
  } catch (e) {
    // Contexto não disponível, continuar sem reset de conquistas
    console.warn('Contexto de conquistas não disponível no SettingsModal');
  }
  
  // i18n guardado para uso futuro:
  // const { t, i18n } = useTranslation();

  if (!isOpen) return null;

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
   * Tenta usar icon-192.png do public, se não conseguir, retorna null
   */
  const loadLogoAsBase64 = async (): Promise<string | null> => {
    try {
      // Tentar carregar o ícone do public
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
   * Retorna RGB [r, g, b] ou null se não conseguir extrair
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
            
            // Contar cores verdes (onde G > R e G > B, e G > 100 para ser verde visível)
            const greenPixels: { r: number; g: number; b: number; count: number }[] = [];
            
            for (let i = 0; i < pixels.length; i += 4) {
              const r = pixels[i];
              const g = pixels[i + 1];
              const b = pixels[i + 2];
              
              // Verificar se é uma cor verde (G dominante e G > 100)
              if (g > r && g > b && g > 100) {
                // Agrupar cores similares (tolerância de ±10)
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
            
            // Encontrar a cor verde mais comum
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
   * Desenha o cabeçalho profissional do relatório
   */
  const drawHeader = async (doc: jsPDF, userEmail: string | undefined, periodStart: Date | null, periodEnd: Date | null, logoBase64: string | null, greenColor: [number, number, number]): Promise<number> => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const headerHeight = 45;

    // Retângulo de fundo (cor verde da logo)
    doc.setFillColor(greenColor[0], greenColor[1], greenColor[2]);
    doc.rect(0, 0, pageWidth, headerHeight, 'F');

    // Tentar adicionar logo real se disponível
    if (logoBase64) {
      try {
        // Adicionar logo (ajustar tamanho conforme necessário)
        const logoSize = 20;
        const logoX = 15;
        const logoY = (headerHeight - logoSize) / 2;
        doc.addImage(logoBase64, 'PNG', logoX, logoY, logoSize, logoSize);
      } catch (error) {
        console.warn('Erro ao adicionar logo ao PDF:', error);
      }
    }

    // Nome da marca (posicionado após a logo ou no início se não houver logo)
    const textStartX = logoBase64 ? 40 : 15;
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    // Usar Poppins bold se disponível, senão helvetica bold
    const fontFamily = doc.getFont().fontName === 'Poppins' ? 'Poppins' : 'helvetica';
    doc.setFont(fontFamily, 'bold');
    doc.text('StudyFlow', textStartX, 18);

    // Subtítulo
    doc.setFontSize(12);
    setFontSafe(doc, 'normal');
    doc.text('Relatório Executivo de Estudos', textStartX, 28);

    // Nome do aluno e período
    doc.setFontSize(9);
    doc.text(`Aluno: ${userEmail || 'Não identificado'}`, textStartX, 36);

    // Período do relatório
    let periodText = 'Período: ';
    if (periodStart && periodEnd) {
      const startStr = periodStart.toLocaleDateString('pt-BR');
      const endStr = periodEnd.toLocaleDateString('pt-BR');
      periodText += `${startStr} a ${endStr}`;
    } else {
      periodText += 'Todos os registros';
    }
    doc.text(periodText, textStartX, 41);

    // Data de geração (canto superior direito)
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
   * Helper para obter a fonte correta (Poppins se disponível, senão helvetica)
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
   * Desenha cards de KPIs (Resumo Executivo)
   */
  const drawKPICards = (doc: jsPDF, stats: ReturnType<typeof calculateStats>, startY: number, greenColor: [number, number, number]): number => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const cardWidth = (pageWidth - margin * 3) / 2; // 2 colunas
    const cardHeight = 35;
    const cardGap = 10;
    let currentY = startY + 10;

    // Título da seção
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    setFontSafe(doc, 'bold');
    doc.text('Resumo Executivo', margin, currentY);
    currentY += 8;

    // Card 1: Tempo Total Estudado
    drawKPICard(
      doc,
      margin,
      currentY,
      cardWidth,
      cardHeight,
      'Tempo Total',
      `${stats.totalHours}h ${Math.round(stats.totalMinutes % 60)}min`,
      'Estudado',
      greenColor
    );

    // Card 2: Questões e Taxa de Acerto
    drawKPICard(
      doc,
      margin * 2 + cardWidth,
      currentY,
      cardWidth,
      cardHeight,
      'Desempenho',
      `${stats.totalQuestions} questões`,
      `${stats.accuracyRate.toFixed(1)}% de acerto`,
      greenColor
    );

    currentY += cardHeight + cardGap;

    // Card 3: Média Diária
    drawKPICard(
      doc,
      margin,
      currentY,
      cardWidth,
      cardHeight,
      'Média Diária',
      `${Math.round(stats.averageDailyMinutes)} min/dia`,
      'Tempo médio de estudo',
      greenColor
    );

    // Card 4: Estatísticas Adicionais
    const acertosText = stats.totalCorrect > 0 ? `${stats.totalCorrect} acertos` : 'N/A';
    drawKPICard(
      doc,
      margin * 2 + cardWidth,
      currentY,
      cardWidth,
      cardHeight,
      'Detalhes',
      acertosText,
      stats.totalWrong > 0 ? `${stats.totalWrong} erros` : 'Sem erros',
      greenColor
    );

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
    // Fundo do card (cinza claro)
    doc.setFillColor(245, 247, 250);
    doc.setDrawColor(200, 200, 200);
    doc.roundedRect(x, y, width, height, 3, 3, 'FD');

    // Borda superior colorida (cor verde da logo)
    doc.setFillColor(greenColor[0], greenColor[1], greenColor[2]);
    doc.rect(x, y, width, 5, 'F');

    // Título
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    setFontSafe(doc, 'normal');
    doc.text(title, x + 8, y + 12);

    // Valor principal
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    setFontSafe(doc, 'bold');
    doc.text(value, x + 8, y + 22);

    // Subtítulo
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

    // Título do gráfico
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    setFontSafe(doc, 'bold');
    doc.text('Atividade Semanal (Últimos 7 Dias)', chartX, chartY);

    // Calcular dados dos últimos 7 dias
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // Inclui hoje + 6 dias anteriores = 7 dias

    const dailyData: { date: Date; minutes: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(sevenDaysAgo);
      date.setDate(date.getDate() + i);
      dailyData.push({ date, minutes: 0 });
    }

    // Agrupar logs por dia
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

    // Encontrar valor máximo para escala
    const maxMinutes = Math.max(...dailyData.map(d => d.minutes), 1);
    const barWidth = (chartWidth - 20) / 7; // 7 barras com espaçamento
    const maxBarHeight = chartHeight - 25; // Altura máxima da barra (deixar espaço para labels)

    // Desenhar eixos
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    // Eixo X (linha horizontal)
    doc.line(chartX, chartY + maxBarHeight + 15, chartX + chartWidth, chartY + maxBarHeight + 15);
    // Eixo Y (linha vertical)
    doc.line(chartX, chartY + 5, chartX, chartY + maxBarHeight + 15);

    // Desenhar barras
    dailyData.forEach((day, index) => {
      const barX = chartX + 10 + index * barWidth;
      const barHeight = maxMinutes > 0 ? (day.minutes / maxMinutes) * maxBarHeight : 0;
      const barY = chartY + maxBarHeight + 15 - barHeight;

      // Cor da barra (gradiente visual - mais escuro = mais tempo)
      const intensity = maxMinutes > 0 ? Math.min(day.minutes / maxMinutes, 1) : 0;
      // Usar cor da logo como base, variando a intensidade
      const r = Math.round(greenColor[0] + (255 - greenColor[0]) * (1 - intensity) * 0.3);
      const g = Math.round(greenColor[1] + (255 - greenColor[1]) * (1 - intensity) * 0.3);
      const b = Math.round(greenColor[2] + (255 - greenColor[2]) * (1 - intensity) * 0.3);
      doc.setFillColor(r, g, b);

      // Desenhar barra
      doc.rect(barX, barY, barWidth - 2, barHeight, 'F');

      // Label do dia (abreviação)
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(7);
      setFontSafe(doc, 'normal');
      const dayLabel = day.date.toLocaleDateString('pt-BR', { weekday: 'short' }).substring(0, 3);
      doc.text(dayLabel.toUpperCase(), barX + (barWidth - 2) / 2, chartY + maxBarHeight + 20, { align: 'center' });

      // Valor em minutos (se > 0)
      if (day.minutes > 0) {
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(7);
        setFontSafe(doc, 'bold');
        const minutesText = Math.round(day.minutes).toString();
        doc.text(minutesText, barX + (barWidth - 2) / 2, barY - 3, { align: 'center' });
      }
    });

    // Label do eixo Y (valor máximo)
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    setFontSafe(doc, 'normal');
    doc.text(`${Math.round(maxMinutes)} min`, chartX - 5, chartY + 5, { align: 'right' });

    return chartY + chartHeight + 10;
  };

  /**
   * Desenha rodapé com paginação em todas as páginas
   */
  const drawFooter = (doc: jsPDF, pageNumber: number, totalPages: number): void => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const footerY = pageHeight - 15;

    // Linha separadora
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(15, footerY - 5, pageWidth - 15, footerY - 5);

    // Texto do rodapé
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(8);
    setFontSafe(doc, 'normal');
    doc.text('Gerado via StudyFlow', 15, footerY);
    
    // Paginação
    doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth - 15, footerY, { align: 'right' });
  };

  /**
   * Função principal para Exportar PDF Profissional
   */
  const handleExportPDF = async () => {
    // Carregar logo e extrair cor verde antes de criar o PDF
    const logoBase64 = await loadLogoAsBase64();
    const logoGreenColor = await extractLogoGreenColor();
    
    // Usar cor da logo se disponível, senão usar Emerald-500 padrão
    const greenColor: [number, number, number] = logoGreenColor || [16, 185, 129];

    // Criar instância do jsPDF
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    // Registrar fonte Poppins (carrega de CDN se disponível)
    const poppinsRegistered = await registerPoppinsFontSimple(doc);
    
    // Definir fonte padrão (Poppins se disponível, senão helvetica como fallback)
    if (poppinsRegistered) {
      doc.setFont('Poppins', 'normal');
    } else {
      setFontSafe(doc, 'normal');
    }
    doc.setTextColor(0, 0, 0);

    // Calcular estatísticas
    const stats = calculateStats(logs);

    // Desenhar cabeçalho (agora é async)
    const headerHeight = await drawHeader(doc, userEmail, stats.periodStart, stats.periodEnd, logoBase64, greenColor);
    let currentY = headerHeight + 5;

    // Callback para adicionar rodapé em todas as páginas
    const addFooter = () => {
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        drawFooter(doc, i, totalPages);
      }
    };

    // Desenhar Resumo Executivo (KPIs)
    currentY = drawKPICards(doc, stats, currentY, greenColor);

    // Verificar se precisa de nova página
    if (currentY > pageHeight - 80) {
      doc.addPage();
      currentY = margin;
    }

    // Desenhar Gráfico Semanal
    if (logs.length > 0) {
      currentY = drawWeeklyChart(doc, logs, currentY, greenColor);
    }

    // Verificar se precisa de nova página para a tabela
    if (currentY > pageHeight - 100) {
      doc.addPage();
      currentY = margin;
    }

    // Preparar dados da tabela detalhada
    const tableData = logs
      .sort((a, b) => {
        // Ordenar por data (mais recente primeiro)
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      })
      .map(log => {
        const subject = subjects.find(s => s.id === log.subjectId);
        const subjectName = subject?.name || 'Desconhecida';
        const totalMinutes = (log.hours || 0) * 60 + (log.minutes || 0) + ((log.seconds || 0) / 60);
        const date = log.date ? new Date(log.date).toLocaleDateString('pt-BR') : '';
        
        // Calcular taxa de acerto individual
        const totalQ = (log.correct || 0) + (log.wrong || 0);
        const accuracy = totalQ > 0 ? ((log.correct || 0) / totalQ * 100).toFixed(1) : '-';
        
        return [
          date,
          subjectName,
          log.type.charAt(0).toUpperCase() + log.type.slice(1), // Capitalizar primeira letra
          totalMinutes.toFixed(1).replace('.', ','),
          log.pages?.toString() || '-',
          log.correct?.toString() || '-',
          log.wrong?.toString() || '-',
          accuracy !== '-' ? `${accuracy}%` : '-'
        ];
      });

    // Título da tabela
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    setFontSafe(doc, 'bold');
    doc.text('Registros Detalhados', margin, currentY);
    currentY += 8;

    // Adicionar tabela usando autoTable
    autoTable(doc, {
      startY: currentY,
      head: [['Data', 'Matéria', 'Tipo', 'Tempo (min)', 'Páginas', 'Acertos', 'Erros', 'Taxa Acerto']],
      body: tableData.length > 0 ? tableData : [['Nenhum registro encontrado', '', '', '', '', '', '', '']],
      headStyles: {
        fillColor: greenColor, // Cor verde da logo
        textColor: [255, 255, 255], // Branco
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250] // Cinza claro para zebra striping
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 25, halign: 'left' }, // Data
        1: { cellWidth: 45, halign: 'left' }, // Matéria
        2: { cellWidth: 20, halign: 'center' }, // Tipo
        3: { cellWidth: 20, halign: 'center' }, // Tempo
        4: { cellWidth: 18, halign: 'center' }, // Páginas
        5: { cellWidth: 18, halign: 'center' }, // Acertos
        6: { cellWidth: 18, halign: 'center' }, // Erros
        7: { cellWidth: 20, halign: 'center' }  // Taxa Acerto
      },
      margin: { left: margin, right: margin },
      didDrawPage: () => {
        // Adicionar rodapé após cada página da tabela
        addFooter();
      }
    });

    // Adicionar rodapé na última página
    addFooter();

    // Salvar o PDF
    const fileName = `studyflow_relatorio_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  // Função para Factory Reset (Zerar todos os dados)
  const handleFactoryReset = async () => {
    setIsResetting(true);
    try {
      // Obter sessão atual
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        throw new Error('Usuário não autenticado');
      }

      const userId = session.user.id;

      // IMPORTANTE: Deletar conquistas e XP PRIMEIRO para evitar recálculo automático
      
      // 1. Resetar conquistas usando a função do contexto (limpa estado React + localStorage + Supabase)
      if (resetAchievements) {
        try {
          await resetAchievements();
        } catch (error) {
          console.error('Erro ao resetar conquistas via contexto:', error);
          // Continuar mesmo se falhar, vamos tentar limpar manualmente
        }
      }
      
      // 2. Deletar conquistas do Supabase manualmente (garantia extra)
      const { data: existingAchievements } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', userId);
      
      if (existingAchievements && existingAchievements.length > 0) {
        const { error: achievementsError } = await supabase
          .from('user_achievements')
          .delete()
          .eq('user_id', userId);

        if (achievementsError && achievementsError.code !== 'PGRST116') {
          // PGRST116 = não encontrado, não é erro crítico
          console.warn('Aviso ao deletar conquistas manualmente:', achievementsError);
        }
      }

      // 3. Deletar XP do usuário
      const { error: xpError } = await supabase
        .from('user_xp')
        .delete()
        .eq('user_id', userId);

      if (xpError && xpError.code !== 'PGRST116') {
        // PGRST116 = não encontrado, não é erro crítico
        console.warn('Aviso ao deletar XP:', xpError);
      }

      // 4. Deletar todos os logs de estudo
      const { error: logsError } = await supabase
        .from('study_logs')
        .delete()
        .eq('user_id', userId);

      if (logsError) throw logsError;

      // 5. Deletar todas as matérias (e subtópicos via cascade se configurado)
      const { error: subjectsError } = await supabase
        .from('subjects')
        .delete()
        .eq('user_id', userId);

      if (subjectsError) throw subjectsError;

      // Limpar dados do localStorage relacionados a gamificação
      // IMPORTANTE: Fazer isso ANTES do reload para garantir limpeza
      // Limpar múltiplas vezes para garantir (alguns browsers podem ter cache)
      const keysToClean = [
        'studyflow_total_xp',
        'studyflow_xp_history',
        'studyflow_user_achievements',
        'studyflow_achievements',
        'studyflow_logs', // Se existir
        'studyflow_processed_logs' // Se existir no localStorage
      ];
      
      // Limpar 3 vezes para garantir (problemas de cache do browser)
      for (let i = 0; i < 3; i++) {
        keysToClean.forEach(key => {
          localStorage.removeItem(key);
          // Tentar também com variações (caso haja algum prefixo/sufixo)
          localStorage.removeItem(`_${key}`);
          localStorage.removeItem(`${key}_`);
        });
      }
      
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

      // Limpar dados do sessionStorage relacionados a gamificação
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
      
      // Verificar se realmente foi limpo
      const remainingAchievements = localStorage.getItem('studyflow_user_achievements');
      if (remainingAchievements) {
        console.error('ERRO: Conquistas ainda presentes no localStorage após limpeza');
        // Tentar deletar novamente
        try {
          localStorage.removeItem('studyflow_user_achievements');
        } catch (e) {
          console.error('Erro ao tentar limpar conquistas novamente:', e);
        }
      }
      
      // Verificar novamente no Supabase se as conquistas foram deletadas
      const { data: verifyAchievements } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', userId);
      
      if (verifyAchievements && verifyAchievements.length > 0) {
        console.error('ERRO: Ainda existem conquistas no Supabase após delete:', verifyAchievements.length);
        // Tentar deletar novamente
        await supabase
          .from('user_achievements')
          .delete()
          .eq('user_id', userId);
      }
      
      // Fechar modal de confirmação
      setShowFactoryResetConfirm(false);
      
      // Mostrar sucesso
      addToast('Todos os dados foram apagados com sucesso! A página será recarregada.', 'success');
      
      // Recarregar página IMEDIATAMENTE para evitar que o sistema recrie conquistas
      // Usar setTimeout mínimo para garantir que o toast apareça
      setTimeout(() => {
        // Limpar novamente antes do reload (garantia extra)
        localStorage.removeItem('studyflow_user_achievements');
        localStorage.removeItem('studyflow_total_xp');
        localStorage.removeItem('studyflow_xp_history');
        sessionStorage.removeItem('studyflow_processed_logs');
        
        // Forçar reload completo
        window.location.href = window.location.href;
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
      {/* Modal de Alteração de Senha */}
      <ChangePasswordModal 
        isOpen={showChangePasswordModal} 
        onClose={() => setShowChangePasswordModal(false)} 
      />
      <FeedbackModal 
        isOpen={showFeedbackModal} 
        onClose={() => setShowFeedbackModal(false)}
        userEmail={userEmail}
        userId={userId}
      />

      {/* Modal de Confirmação de Logout */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Sair do App?"
        message="Você será desconectado da sua conta."
        confirmText="Sair"
        cancelText="Voltar"
        variant="danger"
        onConfirm={() => {
          setShowLogoutConfirm(false);
          onHardReset();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      {/* Modal de Confirmação de Factory Reset */}
      <ConfirmModal
        isOpen={showFactoryResetConfirm}
        title="Zerar Todos os Dados?"
        message="Esta ação é IRREVERSÍVEL!\n\nTodos os seus registros de estudo, matérias e configurações serão apagados permanentemente.\n\nTem certeza absoluta?"
        confirmText={isResetting ? "Apagando..." : "Sim, apagar tudo"}
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleFactoryReset}
        onCancel={() => setShowFactoryResetConfirm(false)}
      />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-xs md:max-w-2xl max-h-[90vh] flex flex-col shadow-2xl transition-colors"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900 transition-colors flex-shrink-0 rounded-t-2xl">
                <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <Settings size={20} className="text-emerald-500"/> Configurações
                </h3>
                <button 
                  onClick={onClose} 
                  className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  aria-label="Fechar Modal"
                  title="Fechar Modal"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Conteúdo com Scroll */}
              <div className="p-5 overflow-y-auto flex-1 space-y-6">
                {/* SEÇÃO 1: PREFERÊNCIAS & FOCO */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 mb-3">
                    <Zap size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">Preferências & Foco</span>
                  </div>

                  {/* Ajustes Rápidos - Grid de 2 cartões */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Privacidade */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 flex flex-col items-center gap-2">
                      <button
                        onClick={onTogglePerformance}
                        className={`p-3 rounded-xl transition-all active:scale-95 ${
                          showPerformance 
                            ? 'bg-teal-500 hover:bg-teal-600 text-white' 
                            : 'bg-gray-400 hover:bg-gray-500 text-white'
                        }`}
                      >
                        {showPerformance ? <Eye size={20} /> : <EyeOff size={20} />}
                      </button>
                      <p className="text-xs font-semibold text-gray-800 dark:text-white text-center">Privacidade</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center">
                        {showPerformance ? 'Visível' : 'Oculto'}
                      </p>
                    </div>

                    {/* Notificações */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 flex flex-col items-center gap-2">
                      {permission === 'granted' ? (
                        <>
                          <button
                            onClick={() => sendNotification('StudyFlow', { body: 'O sistema está funcionando! 🔔' })}
                            className="p-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-all active:scale-95"
                          >
                            <Bell size={20} />
                          </button>
                          <p className="text-xs font-semibold text-gray-800 dark:text-white text-center">Notificações</p>
                          <p className="text-[10px] text-emerald-500 text-center">Ativas</p>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={requestPermission}
                            className="p-3 rounded-xl bg-gray-400 hover:bg-gray-500 text-white transition-all active:scale-95"
                          >
                            <BellOff size={20} />
                          </button>
                          <p className="text-xs font-semibold text-gray-800 dark:text-white text-center">Notificações</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center">Desativadas</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botão Reiniciar Tutorial */}
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-5 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap size={18} className="text-purple-500" />
                    <p className="font-bold text-gray-800 dark:text-white text-base">Tutorial</p>
                  </div>
                  <button
                    onClick={() => {
                      localStorage.removeItem('studyflow_onboarding_completed');
                      if ((window as any).restartOnboardingTour) {
                        (window as any).restartOnboardingTour();
                      }
                      addToast('Tutorial reiniciado! O tour começará em breve.', 'success');
                      // Fechar o modal de configurações
                      onClose();
                    }}
                    className="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-semibold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
                  >
                    <Zap size={18} />
                    Reiniciar Tutorial
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
                    Revise o tour guiado do app
                  </p>
                </div>

                {/* SEÇÃO 2: DADOS & RELATÓRIOS */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 mb-3">
                    <Database size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">Dados & Relatórios</span>
                  </div>

                  {/* Grid de 2 botões lado a lado */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Exportar CSV */}
                    <button
                      onClick={handleExportCSV}
                      className="bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl p-4 flex flex-col items-center gap-2 transition-all active:scale-95 border border-blue-200 dark:border-blue-800"
                    >
                      <div className="p-3 bg-blue-500 rounded-xl text-white">
                        <FileSpreadsheet size={24} />
                      </div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white text-center">Exportar CSV</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center">Compatível Excel</p>
                    </button>

                    {/* Exportar PDF */}
                    <button
                      onClick={handleExportPDF}
                      className="bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl p-4 flex flex-col items-center gap-2 transition-all active:scale-95 border border-red-200 dark:border-red-800"
                    >
                      <div className="p-3 bg-red-500 rounded-xl text-white">
                        <FileText size={24} />
                      </div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white text-center">Exportar PDF</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center">Relatório profissional</p>
                    </button>
                  </div>
                </div>

                {/* SEÇÃO 3: CONTA */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 mb-3">
                    <Lock size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">Conta</span>
                  </div>

                  {/* Alterar Senha */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Lock size={16} className="text-emerald-500" />
                      <p className="font-semibold text-gray-800 dark:text-white text-sm">Segurança</p>
                    </div>
                    <button
                      onClick={() => setShowChangePasswordModal(true)}
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                    >
                      <Lock size={18} />
                      Alterar Senha
                    </button>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 text-center">
                      Defina uma nova senha para sua conta
                    </p>
                  </div>
                </div>

                {/* SEÇÃO 3.5: AJUDA & FEEDBACK */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 mb-3">
                    <MessageSquare size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">Ajuda & Feedback</span>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare size={16} className="text-emerald-600 dark:text-emerald-400" />
                      <p className="font-semibold text-gray-800 dark:text-white text-sm">Dar Feedback</p>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                      Reporte bugs, envie sugestões ou deixe um elogio. Sua opinião é muito importante!
                    </p>
                    <button
                      onClick={() => setShowFeedbackModal(true)}
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                    >
                      <MessageSquare size={18} />
                      💬 Dar Feedback
                    </button>
                  </div>
                </div>

                {/* SEÇÃO 4: ZONA DE PERIGO */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-red-400 dark:text-red-500 mb-3">
                    <AlertTriangle size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">Zona de Perigo</span>
                  </div>

                  <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border-2 border-red-200 dark:border-red-800">
                    {/* Botão Sair (Logout) - Estilo ghost */}
                    <button 
                      onClick={() => setShowLogoutConfirm(true)}
                      className="w-full py-3 mb-3 border-2 border-red-500 hover:bg-red-500 text-red-500 hover:text-white rounded-xl font-semibold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <LogOut size={18} />
                      Sair (Logout)
                    </button>

                    {/* Botão Zerar Tudo (Factory Reset) - Estilo sólido vermelho */}
                    <button 
                      onClick={() => setShowFactoryResetConfirm(true)}
                      disabled={isResetting}
                      className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Trash2 size={18} />
                      {isResetting ? 'Apagando...' : 'Zerar Tudo'}
                    </button>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-3 text-center font-medium">
                      ⚠️ Apagar todos os dados e começar do zero
                    </p>
                    <p className="text-[10px] text-red-500 dark:text-red-600 mt-1 text-center">
                      Esta ação é IRREVERSÍVEL e apagará todos os seus registros permanentemente.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 transition-colors flex-shrink-0 rounded-b-2xl">
                <div className="text-center">
                  <p className="font-bold text-gray-800 dark:text-white text-sm">Desenvolvido por Kayke Paião</p>
                  <a 
                    href="https://instagram.com/paiao.kayke" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-xs mt-1 hover:underline"
                  >
                    <Instagram size={14} /> @paiao.kayke
                  </a>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Versão 1.5.0 • StudyFlow</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}