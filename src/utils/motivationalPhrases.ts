export const motivationalPhrases = [
  "Consistência é a chave do sucesso!",
  "Cada minuto conta na sua jornada.",
  "Você está mais perto do seu objetivo!",
  "O esforço de hoje é a conquista de amanhã.",
  "Continue firme, você está evoluindo!",
  "Pequenos passos, grandes conquistas.",
  "Sua dedicação vai fazer a diferença.",
  "O sucesso é a soma de pequenos esforços.",
  "Acredite no processo e siga em frente!",
  "Você é capaz de alcançar seus sonhos!",
  "Disciplina é liberdade.",
  "Foco, força e fé no seu potencial!",
];

export function getRandomPhrase(): string {
  return motivationalPhrases[Math.floor(Math.random() * motivationalPhrases.length)];
}
