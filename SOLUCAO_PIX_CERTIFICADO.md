# Solução: Certificado PIX no Railway

## Problema
O servidor PIX está tentando ler o certificado de um arquivo local (`./certs/producao.p12`), mas no Railway os arquivos não existem. O certificado está na variável de ambiente `EFI_CERT_BASE64` em formato base64.

**Erro:**
```
Falha ao ler o certificado, verifique o caminho informado: ./certs/producao.p12
```

## Solução

### 1. Localizar o arquivo de inicialização
No servidor PIX separado (Railway), procure por:
- `index.js`
- `server.js`
- Ou qualquer arquivo que inicialize a SDK da Efí

### 2. Modificar a leitura do certificado

#### ❌ Código ERRADO (leitura de arquivo):
```javascript
const fs = require('fs');
const certificate = fs.readFileSync('./certs/producao.p12');

// Ou
const options = {
  sandbox: false,
  client_id: process.env.EFI_CLIENT_ID,
  client_secret: process.env.EFI_CLIENT_SECRET,
  certificate: './certs/producao.p12'
};
```

#### ✅ Código CORRETO (leitura de variável de ambiente):
```javascript
// Ler certificado da variável de ambiente
const certBase64 = process.env.EFI_CERT_BASE64;

if (!certBase64) {
  throw new Error('EFI_CERT_BASE64 não está definido nas variáveis de ambiente');
}

// Converter de base64 para Buffer
const certificate = Buffer.from(certBase64, 'base64');

// Configurar SDK da Efí
const options = {
  sandbox: process.env.EFI_SANDBOX === 'true',
  client_id: process.env.EFI_CLIENT_ID,
  client_secret: process.env.EFI_CLIENT_SECRET,
  certificate: certificate, // Buffer ao invés de path
  // Algumas SDKs podem precisar de flags adicionais:
  // cert_base64: true,
  // validateMtls: false
};

// Inicializar SDK
const EfiPay = require('sdk-node-apis-efi'); // ou o nome correto do package
const efipay = new EfiPay(options);
```

### 3. Verificar variáveis de ambiente no Railway

Certifique-se de que as seguintes variáveis estão configuradas no Railway:

```bash
EFI_CLIENT_ID=seu_client_id
EFI_CLIENT_SECRET=seu_client_secret
EFI_CERT_BASE64=MIIKXgIBAzCCCh...  # Certificado em base64
EFI_SANDBOX=false  # true para sandbox, false para produção
```

### 4. Converter certificado .p12 para base64

Se você ainda não tem o certificado em base64, converta assim:

**No Linux/Mac:**
```bash
base64 -i producao.p12 -o certificado.txt
```

**No Windows (PowerShell):**
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("producao.p12")) | Out-File -Encoding ascii certificado.txt
```

**Com Node.js:**
```javascript
const fs = require('fs');
const cert = fs.readFileSync('producao.p12');
const base64 = cert.toString('base64');
console.log(base64);
```

### 5. Testar localmente

Antes de fazer deploy, teste localmente com um arquivo `.env`:

```bash
# .env
EFI_CLIENT_ID=seu_client_id
EFI_CLIENT_SECRET=seu_client_secret
EFI_CERT_BASE64=MIIKXgIBAzCCCh...
EFI_SANDBOX=false
```

### 6. Exemplo completo de implementação

```javascript
const express = require('express');
const EfiPay = require('sdk-node-apis-efi');
require('dotenv').config();

// Validar variáveis de ambiente
const requiredEnvVars = ['EFI_CLIENT_ID', 'EFI_CLIENT_SECRET', 'EFI_CERT_BASE64'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Variável de ambiente ${envVar} não está definida`);
  }
}

// Configurar certificado
const certificate = Buffer.from(process.env.EFI_CERT_BASE64, 'base64');

// Inicializar SDK
const efipay = new EfiPay({
  sandbox: process.env.EFI_SANDBOX === 'true',
  client_id: process.env.EFI_CLIENT_ID,
  client_secret: process.env.EFI_CLIENT_SECRET,
  certificate: certificate
});

// Criar servidor
const app = express();
app.use(express.json());

app.post('/pix/create', async (req, res) => {
  try {
    const { user_id, valor, plano, descricao } = req.body;
    
    // Criar cobrança PIX usando SDK
    const result = await efipay.pixCreateImmediateCharge({
      // ... parâmetros da cobrança
    });
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Erro ao criar PIX:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor PIX rodando na porta ${PORT}`);
});
```

## Notas Importantes

1. **Segurança**: Nunca commite o certificado ou as chaves no repositório. Use sempre variáveis de ambiente.

2. **Documentação da SDK**: Verifique a documentação oficial da SDK efipay-node-apis para confirmar como passar o certificado em formato Buffer.

3. **Logs**: Adicione logs para debug:
```javascript
console.log('Certificado carregado com sucesso. Tamanho:', certificate.length);
```

4. **Tratamento de erros**: Sempre valide se as variáveis de ambiente estão presentes antes de iniciar o servidor.

## Referências

- [Documentação SDK Efí Node.js](https://dev.efipay.com.br/docs)
- [Railway Environment Variables](https://docs.railway.app/develop/variables)

