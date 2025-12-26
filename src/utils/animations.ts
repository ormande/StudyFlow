// Design System de Animações - Framer Motion
// Centraliza todas as animações do app para consistência

// Transições Padrão
export const TRANSITION_SPRING = { type: "spring" as const, stiffness: 300, damping: 30 };
export const TRANSITION_EASE = { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const };

// 1. Fade Up (Padrão para entrada de Páginas e Cards)
export const FADE_UP_ANIMATION = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
  transition: TRANSITION_EASE
};

// 2. Fade In Simples (Para modais ou elementos fixos)
export const FADE_IN_ANIMATION = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 }
};

// 3. Scale (Para botões e ícones importantes)
export const SCALE_ANIMATION = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: TRANSITION_SPRING
};

// 4. Stagger (Para listas - Histórico, Conquistas)
export const STAGGER_CONTAINER = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

export const STAGGER_ITEM = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
};

// 5. Accordion (Expandir/Colapsar)
export const ACCORDION_ANIMATION = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto", opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: 0.2, ease: [0.42, 0, 0.58, 1] as const } // easeInOut - Mais rápido para UX
};

