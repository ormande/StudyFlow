#!/usr/bin/env bash

# ============================================================================
# DEPLOYMENT & MONITORING SCRIPT - EFI Polling Safety
# ============================================================================
# Script bash para deployment, teste e monitoramento da função.
# 
# Uso:
#   ./deploy.sh deploy       # Deploy função
#   ./deploy.sh test         # Teste manual
#   ./deploy.sh logs         # Ver logs
#   ./deploy.sh status       # Status do cron job
#   ./deploy.sh monitor      # Monitorar em tempo real

# ============================================================================
# CONFIGURAÇÃO
# ============================================================================

PROJECT_REF="seu_project_ref"          # Mudar conforme seu projeto
FUNCTION_NAME="efi-polling-safety"
SUPABASE_URL="https://seu-projeto.supabase.co"
SERVICE_ROLE_KEY="sua_service_role_key"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# FUNÇÕES
# ============================================================================

print_header() {
  echo -e "\n${BLUE}════════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}\n"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

# ============================================================================
# DEPLOY
# ============================================================================

deploy() {
  print_header "Deploying EFI Polling Safety Function"

  # Validar dependências
  if ! command -v supabase &> /dev/null; then
    print_error "Supabase CLI não instalada. Instale com: npm install -g supabase"
    exit 1
  fi

  print_info "Validando projeto local..."
  
  if [ ! -f "supabase/functions/$FUNCTION_NAME/index.ts" ]; then
    print_error "Arquivo não encontrado: supabase/functions/$FUNCTION_NAME/index.ts"
    exit 1
  fi

  print_success "Arquivo encontrado"

  print_info "Fazendo login no Supabase..."
  supabase login

  print_info "Linkando projeto..."
  supabase link --project-ref "$PROJECT_REF"

  print_info "Deployando função..."
  supabase functions deploy "$FUNCTION_NAME" --project-ref "$PROJECT_REF"

  if [ $? -eq 0 ]; then
    print_success "Função deployada com sucesso!"
    print_info "Próximo passo: Criar schedule no dashboard Supabase"
    print_info "Vá para: Edge Functions → $FUNCTION_NAME → Schedules"
  else
    print_error "Erro ao fazer deploy"
    exit 1
  fi
}

# ============================================================================
# TESTE MANUAL
# ============================================================================

test_function() {
  print_header "Testing EFI Polling Safety Function"

  print_info "Configuração:"
  print_info "  URL: $SUPABASE_URL"
  print_info "  Função: $FUNCTION_NAME"

  print_info "\nChamando função..."

  response=$(curl -s -X POST "$SUPABASE_URL/functions/v1/$FUNCTION_NAME" \
    -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json")

  print_success "Resposta recebida:"
  echo "$response" | jq . 2>/dev/null || echo "$response"

  # Verificar se foi sucesso
  if echo "$response" | grep -q '"success":true'; then
    print_success "Função executada com sucesso!"
  else
    print_warning "Verifique a resposta acima para erros"
  fi
}

# ============================================================================
# VER LOGS
# ============================================================================

view_logs() {
  print_header "EFI Polling Safety - Recent Logs"

  print_info "Obtendo últimos logs..."
  print_info "Nota: Para logs em tempo real, use: ./deploy.sh monitor\n"

  # Usar Supabase CLI para ver logs (se disponível)
  if command -v supabase &> /dev/null; then
    supabase functions list --project-ref "$PROJECT_REF"
    print_info "\nVá para o dashboard para ver logs detalhados:"
    print_info "https://app.supabase.com/project/$PROJECT_REF/functions"
  else
    print_warning "Supabase CLI não encontrada"
    print_info "Vá para: $SUPABASE_URL → Edge Functions → $FUNCTION_NAME → Logs"
  fi
}

# ============================================================================
# STATUS DO CRON JOB
# ============================================================================

check_status() {
  print_header "EFI Polling Safety - Cron Status"

  print_info "Verificando execuções recentes..."

  # Realizar um teste para ver status
  response=$(curl -s -w "\n%{http_code}" -X POST "$SUPABASE_URL/functions/v1/$FUNCTION_NAME" \
    -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json")

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)

  if [ "$http_code" -eq 200 ]; then
    print_success "Função está respondendo (HTTP 200)"
    
    # Parse resposta
    processed=$(echo "$body" | jq '.processed // 0' 2>/dev/null)
    skipped=$(echo "$body" | jq '.skipped // 0' 2>/dev/null)
    errors=$(echo "$body" | jq '.errors // 0' 2>/dev/null)
    total=$(echo "$body" | jq '.total // 0' 2>/dev/null)

    echo ""
    echo "Última execução:"
    echo "  Processadas: $processed"
    echo "  Puladas: $skipped"
    echo "  Erros: $errors"
    echo "  Total: $total"
    echo ""

    if [ "$errors" -gt 0 ]; then
      print_warning "Existem erros! Verifique os logs."
    fi
  else
    print_error "Erro ao chamar função (HTTP $http_code)"
    echo "$body"
  fi

  print_info "\nPróxima execução agendada:"
  date -d "+1 hour" +"%H:00 de %A, %d de %B"
}

# ============================================================================
# MONITORAMENTO EM TEMPO REAL
# ============================================================================

monitor() {
  print_header "EFI Polling Safety - Real-time Monitor"

  print_info "Monitorando execuções... (Ctrl+C para sair)\n"

  last_run=""
  error_count=0

  while true; do
    # Timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    # Chamar função
    response=$(curl -s -X POST "$SUPABASE_URL/functions/v1/$FUNCTION_NAME" \
      -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
      -H "Content-Type: application/json")

    # Parse resposta
    success=$(echo "$response" | jq '.success // false' 2>/dev/null)
    processed=$(echo "$response" | jq '.processed // 0' 2>/dev/null)
    errors=$(echo "$response" | jq '.errors // 0' 2>/dev/null)

    # Output
    if [ "$success" == "true" ]; then
      if [ "$errors" -gt 0 ]; then
        echo -e "${YELLOW}[$timestamp] ⚠️  Executada com $errors erro(s) - Processadas: $processed${NC}"
        error_count=$((error_count + 1))
      else
        echo -e "${GREEN}[$timestamp] ✅ Executada com sucesso - Processadas: $processed${NC}"
        error_count=0
      fi
    else
      echo -e "${RED}[$timestamp] ❌ Falha na execução${NC}"
      error_count=$((error_count + 1))
    fi

    # Alerta se muitos erros consecutivos
    if [ "$error_count" -ge 3 ]; then
      echo -e "${RED}⚠️⚠️⚠️ 3 ERROS CONSECUTIVOS! Verifique a configuração! ⚠️⚠️⚠️${NC}"
      error_count=0
    fi

    # Aguardar antes de próximo check
    echo "Próximo check em 5 minutos..."
    sleep 300
  done
}

# ============================================================================
# DIAGNOSTICS
# ============================================================================

diagnostics() {
  print_header "Diagnostics - EFI Polling Safety"

  print_info "1. Verificando dependências..."
  
  if command -v supabase &> /dev/null; then
    print_success "Supabase CLI instalada"
  else
    print_error "Supabase CLI não instalada"
  fi

  if command -v curl &> /dev/null; then
    print_success "curl instalado"
  else
    print_error "curl não instalado"
  fi

  if command -v jq &> /dev/null; then
    print_success "jq instalado"
  else
    print_warning "jq não instalado (recomendado para parsing JSON)"
  fi

  print_info "\n2. Verificando variáveis de ambiente..."
  
  if [ -z "$SUPABASE_URL" ]; then
    print_error "SUPABASE_URL não configurada"
  else
    print_success "SUPABASE_URL: $SUPABASE_URL"
  fi

  if [ -z "$SERVICE_ROLE_KEY" ]; then
    print_error "SERVICE_ROLE_KEY não configurada"
  else
    print_success "SERVICE_ROLE_KEY: ****** (configurada)"
  fi

  print_info "\n3. Testando conectividade..."
  
  if curl -s "$SUPABASE_URL" > /dev/null 2>&1; then
    print_success "Supabase acessível"
  else
    print_error "Não conseguiu acessar Supabase"
  fi

  print_info "\n4. Verificando arquivo da função..."
  
  if [ -f "supabase/functions/$FUNCTION_NAME/index.ts" ]; then
    print_success "Arquivo index.ts encontrado"
    lines=$(wc -l < "supabase/functions/$FUNCTION_NAME/index.ts")
    print_info "   Linhas: $lines"
  else
    print_error "Arquivo index.ts não encontrado"
  fi

  if [ -f "supabase/functions/$FUNCTION_NAME/deno.json" ]; then
    print_success "Arquivo deno.json encontrado"
  else
    print_error "Arquivo deno.json não encontrado"
  fi

  print_info "\n✅ Diagnóstico completo"
}

# ============================================================================
# MAIN
# ============================================================================

if [ $# -eq 0 ]; then
  echo "Uso: $0 <comando>"
  echo ""
  echo "Comandos disponíveis:"
  echo "  deploy       - Fazer deploy da função"
  echo "  test         - Testar função manualmente"
  echo "  logs         - Ver logs"
  echo "  status       - Verificar status do cron job"
  echo "  monitor      - Monitorar em tempo real"
  echo "  diagnostics  - Rodar diagnósticos"
  echo ""
  echo "Exemplos:"
  echo "  $0 deploy"
  echo "  $0 test"
  echo "  $0 status"
  exit 0
fi

case "$1" in
  deploy)
    deploy
    ;;
  test)
    test_function
    ;;
  logs)
    view_logs
    ;;
  status)
    check_status
    ;;
  monitor)
    monitor
    ;;
  diagnostics)
    diagnostics
    ;;
  *)
    print_error "Comando desconhecido: $1"
    exit 1
    ;;
esac

# ============================================================================
# NOTAS DE CONFIGURAÇÃO
# ============================================================================

# Editar as variáveis no início deste script:
#   PROJECT_REF          - seu project ref do Supabase
#   SUPABASE_URL         - URL do seu projeto
#   SERVICE_ROLE_KEY     - sua service role key
#
# Depois tornar executável:
#   chmod +x deploy.sh
#
# E executar:
#   ./deploy.sh deploy
