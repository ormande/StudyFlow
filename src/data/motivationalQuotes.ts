export interface MotivationalQuote {
  text: string;
  author?: string;
}

export const motivationalQuotes: MotivationalQuote[] = [
  {
    text: "A consistência é o segredo do sucesso. Continue estudando todos os dias!",
  },
  {
    text: "Cada questão resolvida é um passo mais perto da aprovação.",
  },
  {
    text: "Não é sobre velocidade, é sobre não desistir.",
  },
  {
    text: "Sua dedicação hoje é a sua vitória amanhã.",
  },
  {
    text: "O esforço que você coloca hoje, ninguém pode tirar de você amanhã.",
  },
  {
    text: "Estude como se a prova fosse amanhã. Descanse como se já tivesse passado.",
  },
  {
    text: "A diferença entre o impossível e o possível está na sua determinação.",
  },
  {
    text: "Você não precisa ser perfeito, precisa ser consistente.",
  },
  {
    text: "Cada dia de estudo é um investimento no seu futuro.",
  },
  {
    text: "Não compare seu progresso com o dos outros. Foque na sua jornada.",
  },
  {
    text: "A aprovação virá quando você estiver pronto, não quando você achar que merece.",
  },
  {
    text: "Estude hoje o que você gostaria de ter estudado ontem.",
  },
  {
    text: "O cansaço é temporário, mas a aprovação é para sempre.",
  },
  {
    text: "Acredite no seu processo. Confie no seu esforço.",
  },
  {
    text: "Não desista nos dias difíceis. Eles são parte do caminho.",
  },
  {
    text: "A disciplina supera a inteligência quando a inteligência não é disciplinada.",
  },
  {
    text: "Cada erro é uma oportunidade de aprender. Continue tentando!",
  },
  {
    text: "O sucesso não é um destino, é uma jornada. Você já está nela.",
  },
  {
    text: "Estudar não é sobre ser o melhor, é sobre ser melhor do que você era ontem.",
  },
  {
    text: "A persistência é o caminho do êxito. Continue firme!",
  },
  {
    text: "Seu futuro não é determinado pelo que você fez ontem, mas pelo que você faz hoje.",
  },
  {
    text: "A única forma de falhar é desistir. Continue estudando!",
  },
  {
    text: "Cada página lida, cada questão resolvida te aproxima do seu objetivo.",
  },
  {
    text: "O tempo que você investe em estudos hoje, ninguém pode te roubar amanhã.",
  },
  {
    text: "Aprovação não é sorte, é resultado de dedicação e esforço constante.",
  },
  {
    text: "Você está mais forte do que imagina. Continue persistindo!",
  },
  {
    text: "O estudo é a ponte entre onde você está e onde quer chegar.",
  },
  {
    text: "Não espere pelo momento perfeito. Comece agora, continue sempre.",
  },
  {
    text: "Cada minuto de estudo conta. Use seu tempo com sabedoria.",
  },
  {
    text: "A reprovação não é fracasso, é feedback. Aprenda e siga em frente.",
  },
  {
    text: "Seu esforço de hoje é a sua confiança de amanhã na prova.",
  },
  {
    text: "A consistência diária supera a intensidade esporádica.",
  },
  {
    text: "Você não está competindo com ninguém, apenas com a sua versão de ontem.",
  },
  {
    text: "O estudo é o único investimento que sempre dá retorno.",
  },
  {
    text: "Mantenha o foco no processo. Os resultados virão naturalmente.",
  },
  {
    text: "Cada ciclo de estudos te torna mais preparado. Continue!",
  },
  {
    text: "A aprovação é construída dia após dia, questão após questão.",
  },
  {
    text: "Não desista quando estiver cansado. Desista quando tiver conseguido.",
  },
  {
    text: "Seu comprometimento hoje define seu sucesso amanhã.",
  },
  {
    text: "A jornada de mil quilômetros começa com um único passo. Você já começou!",
  },
];

/**
 * Retorna a frase motivacional do dia baseada na data atual.
 * A frase muda diariamente e é consistente para todos os usuários no mesmo dia.
 * 
 * @returns A frase motivacional do dia
 */
export function getQuoteOfTheDay(): MotivationalQuote {
  // Calcula o número de dias desde uma data de referência (epoch)
  // Isso garante que a frase mude todo dia mas seja consistente
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normaliza para meia-noite
  
  // Usa o timestamp do dia como seed
  const dayIndex = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
  
  // Retorna a frase baseada no índice do dia
  return motivationalQuotes[dayIndex % motivationalQuotes.length];
}
