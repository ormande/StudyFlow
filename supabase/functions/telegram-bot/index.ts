// ✅ JEITO NOVO (Via NPM - Mais estável para Supabase)
import { Bot, webhookCallback, InlineKeyboard } from "npm:grammy@1.34.0";

// Variáveis de ambiente configuradas no Supabase
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") || "";
const ADMIN_CHAT_ID = Deno.env.get("ADMIN_CHAT_ID") || "";

if (!TELEGRAM_BOT_TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN não configurado!");
}

const bot = new Bot(TELEGRAM_BOT_TOKEN);

// --- LÓGICA DE AUTO-ATENDIMENTO (FAQ) ---

const welcomeMessage = `
👋 *Bem-vindo ao Suporte StudyFlow!*

Eu sou o seu assistente virtual. Como posso te ajudar hoje?
Selecione uma das opções abaixo para um atendimento rápido:
`;

const faqKeyboard = new InlineKeyboard()
  .text("🔐 Esqueci minha senha", "faq_password").row()
  .text("💳 Planos & Assinatura", "faq_plans").row()
  .text("📱 Como Baixar o App", "faq_install").row()
  .text("📈 Como funciona o XP?", "faq_xp").row()
  .text("👤 Falar com Humano", "faq_human");

// Comando /start
bot.command("start", async (ctx) => {
  await ctx.reply(welcomeMessage, {
    parse_mode: "Markdown",
    reply_markup: faqKeyboard,
  });
});

// Handlers dos botões do FAQ
bot.callbackQuery("faq_password", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply(
    "🔑 *Recuperação de Senha*\n\n" +
    "Para recuperar sua senha, acesse a tela de login do app e clique em 'Esqueci minha senha'. " +
    "Você receberá um link de redefinição no seu e-mail cadastrado.\n\n" +
    "🔗 [Abrir StudyFlow](https://studyflow.app)",
    { parse_mode: "Markdown" }
  );
});

bot.callbackQuery("faq_xp", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply(
    "📈 *Sistema de XP & Elos*\n\n" +
    "No StudyFlow, cada minuto de foco conta! Veja como pontuar:\n" +
    "• *1 minuto estudado* = 1 XP\n" +
    "• *Questão correta* = 5 XP\n\n" +
    "🏆 *Progressão de Elos:*\n" +
    "1. Ferro (Iniciante)\n" +
    "2. Bronze\n" +
    "3. Prata\n" +
    "4. Ouro\n" +
    "5. Platina\n" +
    "6. Diamante (Elite)\n\n" +
    "Acumule XP para subir de nível, desbloquear conquistas e manter sua constância!",
    { parse_mode: "Markdown" }
  );
});

bot.callbackQuery("faq_plans", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply(
    "💳 *Planos & Assinatura*\n\n" +
    "O StudyFlow oferece flexibilidade para seus estudos:\n\n" +
    "• *Teste Grátis:* Experimente por 7 dias com acesso total, sem precisar de cartão.\n" +
    "• *Plano Mensal:* R$ 9,90/mês para manter sua produtividade sempre em alta.\n" +
    "• *Acesso Vitalício:* Pagamento único de R$ 97,00 (acesso para sempre!).\n\n" +
    "💰 *Pagamento:* Processado com segurança via Efí Bank (Boleto ou Cartão de Crédito).\n\n" +
    "🔗 [Ver Planos no App](https://studyflow.app)",
    { parse_mode: "Markdown" }
  );
});

bot.callbackQuery("faq_install", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply(
    "📱 *Como Baixar o App (PWA)*\n\n" +
    "O StudyFlow é um PWA, o que significa que você pode instalá-lo sem ocupar espaço de um app comum e ele funciona offline!\n\n" +
    "🍏 *No iPhone (Safari):*\n" +
    "1. Acesse [studyflow.app](https://studyflow.app)\n" +
    "2. Toque no botão de *Compartilhar* (ícone de seta pra cima)\n" +
    "3. Escolha *'Adicionar à Tela de Início'*\n\n" +
    "🤖 *No Android (Chrome):*\n" +
    "1. Acesse [studyflow.app](https://studyflow.app)\n" +
    "2. Toque nos *3 pontinhos* no canto superior\n" +
    "3. Escolha *'Instalar Aplicativo'*",
    { parse_mode: "Markdown" }
  );
});

bot.callbackQuery("faq_human", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply(
    "👨‍💻 *Atendimento Humano*\n\n" +
    "Entendi! Por favor, *digite sua dúvida ou problema* logo abaixo em uma única mensagem.\n\n" +
    "Assim que um de nossos administradores estiver disponível, ele entrará em contato diretamente por aqui.",
    { parse_mode: "Markdown" }
  );
});

// --- ENCAMINHAMENTO PARA ADMIN ---

bot.on("message:text", async (ctx) => {
  // Ignorar se for comando (já tratado acima)
  if (ctx.message.text.startsWith("/")) return;

  const userId = ctx.from.id;
  const userName = ctx.from.first_name || "Usuário";
  const userUsername = ctx.from.username ? `@${ctx.from.username}` : "sem username";
  const messageText = ctx.message.text;

  // Notificar o usuário que a mensagem foi recebida
  await ctx.reply("✅ Sua mensagem foi encaminhada para nossa equipe. Responderemos o mais breve possível!");

  // Encaminhar para o Administrador
  if (ADMIN_CHAT_ID) {
    try {
      await bot.api.sendMessage(
        ADMIN_CHAT_ID,
        `🔔 *Nova Solicitação de Suporte*\n\n` +
        `👤 *Usuário:* ${userName} (${userUsername})\n` +
        `🆔 *ID:* \`${userId}\`\n\n` +
        `📝 *Mensagem:* \n${messageText}`,
        { parse_mode: "Markdown" }
      );
    } catch (error) {
      console.error("Erro ao encaminhar mensagem para o admin:", error);
    }
  } else {
    console.warn("ADMIN_CHAT_ID não configurado. Mensagem não encaminhada.");
  }
});

// --- SERVIDOR WEBHOOK ---

// Configura o handler para processar requisições web padrão
const handleUpdate = webhookCallback(bot, "std/http");

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    
    // Verifica a chave de segurança (FUNCTION_SECRET) que definimos
    if (url.searchParams.get("secret") !== Deno.env.get("FUNCTION_SECRET")) {
      return new Response("Não autorizado", { status: 403 });
    }

    // Processa a mensagem do Telegram
    return await handleUpdate(req);
  } catch (err) {
    console.error(err);
    return new Response("Erro interno", { status: 500 });
  }
});