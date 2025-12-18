/**
 * Utilitário para carregar e registrar fontes customizadas no jsPDF
 * 
 * Para adicionar Poppins:
 * 1. Baixe os arquivos TTF de Poppins (Regular, Medium, SemiBold, Bold, etc.)
 * 2. Converta para Base64 usando: https://base64.guru/converter/encode/file
 * 3. Adicione os base64 strings abaixo
 * 4. Ou use a função loadPoppinsFromCDN() para carregar de uma URL
 */

import jsPDF from 'jspdf';

// Base64 das fontes Poppins (será preenchido quando você converter os arquivos)
// Por enquanto, vamos usar uma abordagem que carrega de URL/CDN
const POPPINS_FONTS: Record<string, string> = {
  // Regular (400)
  // 'Poppins-Regular.ttf': 'BASE64_AQUI',
  // Medium (500)
  // 'Poppins-Medium.ttf': 'BASE64_AQUI',
  // SemiBold (600)
  // 'Poppins-SemiBold.ttf': 'BASE64_AQUI',
  // Bold (700)
  // 'Poppins-Bold.ttf': 'BASE64_AQUI',
};

/**
 * Carrega a fonte Poppins de uma URL e converte para base64
 * Alternativa: você pode baixar os TTF e converter manualmente
 */
export const loadPoppinsFromURL = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Remove o prefixo data:application/octet-stream;base64,
        const base64Data = base64.split(',')[1] || base64;
        resolve(base64Data);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Erro ao carregar fonte Poppins:', error);
    return null;
  }
};

/**
 * Registra a fonte Poppins no jsPDF
 * Usa fontes do Google Fonts via CDN como fallback
 */
export const registerPoppinsFont = async (doc: jsPDF): Promise<boolean> => {
  try {
    // Tentar carregar Poppins Regular do Google Fonts CDN
    // Nota: Google Fonts não fornece TTF diretamente, então vamos usar uma alternativa
    // Você pode usar: https://fonts.google.com/download?family=Poppins
    // Ou usar um CDN como: https://cdn.jsdelivr.net/npm/@fontsource/poppins/files/
    
    // URLs alternativas para Poppins TTF:
    const poppinsURLs = [
      // CDN alternativo (exemplo - você pode precisar ajustar)
      'https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Regular.ttf',
      'https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Medium.ttf',
      'https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-SemiBold.ttf',
      'https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Bold.ttf',
    ];

    const fontWeights = [
      { name: 'Poppins-Regular.ttf', weight: 'normal', style: 'normal' },
      { name: 'Poppins-Medium.ttf', weight: 'normal', style: 'normal' },
      { name: 'Poppins-SemiBold.ttf', weight: '600', style: 'normal' },
      { name: 'Poppins-Bold.ttf', weight: 'bold', style: 'normal' },
    ];

    let registeredCount = 0;

    for (let i = 0; i < fontWeights.length; i++) {
      const font = fontWeights[i];
      
      // Tentar carregar da URL
      const base64 = await loadPoppinsFromURL(poppinsURLs[i]);
      
      if (base64) {
        try {
          // Adicionar ao Virtual File System
          doc.addFileToVFS(font.name, base64);
          
          // Registrar a fonte
          doc.addFont(font.name, 'Poppins', font.weight, font.style);
          
          registeredCount++;
        } catch (error) {
          console.warn(`Erro ao registrar ${font.name}:`, error);
        }
      } else {
        // Tentar usar base64 local se disponível
        const localBase64 = POPPINS_FONTS[font.name];
        if (localBase64) {
          try {
            doc.addFileToVFS(font.name, localBase64);
            doc.addFont(font.name, 'Poppins', font.weight, font.style);
            registeredCount++;
          } catch (error) {
            console.warn(`Erro ao registrar ${font.name} local:`, error);
          }
        }
      }
    }

    return registeredCount > 0;
  } catch (error) {
    console.warn('Erro ao registrar fonte Poppins:', error);
    return false;
  }
};

/**
 * Versão simplificada: registra apenas Poppins Regular e Bold
 * Mais leve e geralmente suficiente para a maioria dos casos
 */
export const registerPoppinsFontSimple = async (doc: jsPDF): Promise<boolean> => {
  try {
    // Carregar apenas Regular e Bold (mais comum)
    const regularURL = 'https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Regular.ttf';
    const boldURL = 'https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Bold.ttf';

    const regularBase64 = await loadPoppinsFromURL(regularURL);
    const boldBase64 = await loadPoppinsFromURL(boldURL);

    if (regularBase64) {
      doc.addFileToVFS('Poppins-Regular.ttf', regularBase64);
      doc.addFont('Poppins-Regular.ttf', 'Poppins', 'normal', 'normal');
    }

    if (boldBase64) {
      doc.addFileToVFS('Poppins-Bold.ttf', boldBase64);
      doc.addFont('Poppins-Bold.ttf', 'Poppins', 'bold', 'normal');
    }

    return !!(regularBase64 || boldBase64);
  } catch (error) {
    console.warn('Erro ao registrar Poppins (simples):', error);
    return false;
  }
};

