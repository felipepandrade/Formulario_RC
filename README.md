# Formulário de Requisição de Compra (RC) – ESOM

Aplicação web para elaborar Requisições de Compra (RC) da gerência ESOM. O solicitante preenche o formulário com um ou mais itens e a requisição é enviada por e-mail para o responsável da base selecionada.

A aplicação roda inteiramente no navegador (React + Vite + TypeScript + Tailwind). Não há servidor nem banco de dados.

## Como funciona

1. O solicitante informa seu nome e a base (`ESOM_F_CATU_OI`, `ESOM_F_CAMACARI_OI`, `ESOM_F_ITABUNA_OI`, `ESOM_F_PILAR_OI` ou `ESOM_F_ATALAIA_OI`).
2. Adiciona um ou mais itens, cada um com código, descrição, quantidade, preço, local de utilização, tipo de origem, tipo de destino, uso pretendido, objetivo da RC, justificativa e observações. O valor total estimado é calculado automaticamente.
3. O formulário valida os campos obrigatórios antes de qualquer envio.
4. Ao enviar, o app abre o cliente de e-mail (Outlook) com um link `mailto:` já preenchido para o e-mail da base escolhida.

Se o link passar de 2000 caracteres (limite comum do Outlook), o app não abre o e-mail: ele avisa o usuário e copia o texto da requisição para a área de transferência. Também é possível usar os botões **Copiar Solicitação** e **Baixar (.txt)** a qualquer momento.

## Configuração dos e-mails

Os e-mails de destino de cada base vêm de variáveis de ambiente, codificadas em Base64 para não ficarem em texto puro no código publicado. Copie o arquivo de exemplo e preencha:

```bash
cp .env.example .env
```

| Variável | Base |
| --- | --- |
| `VITE_EMAIL_CATU_OI` | ESOM_F_CATU_OI |
| `VITE_EMAIL_CAMACARI_OI` | ESOM_F_CAMACARI_OI |
| `VITE_EMAIL_ITABUNA_OI` | ESOM_F_ITABUNA_OI |
| `VITE_EMAIL_PILAR_OI` | ESOM_F_PILAR_OI |
| `VITE_EMAIL_ATALAIA_OI` | ESOM_F_ATALAIA_OI |

Para gerar o valor em Base64 de um e-mail:

```bash
echo -n "usuario@exemplo.com" | base64
# dXN1YXJpb0BleGVtcGxvLmNvbQ==
```

Observações:

- O Base64 é só uma ofuscação contra coleta automática. Como o envio é feito pelo navegador, os e-mails continuam acessíveis a quem inspecionar o código publicado.
- Se a variável de uma base estiver vazia, o envio para essa base mostra o erro "E-mail não encontrado para a base selecionada."
- O arquivo `.env` está no `.gitignore` e não deve ser versionado.
- As variáveis são lidas no momento do build. Depois de alterar o `.env`, reinicie o `npm run dev` ou gere o build novamente.

## Rodando localmente

Pré-requisito: Node.js 18 ou mais recente.

```bash
npm install     # instala as dependências
npm run dev     # inicia o servidor de desenvolvimento (Vite)
```

O Vite mostra no terminal o endereço local (por padrão, `http://localhost:5173`).

## Testes

```bash
npm test        # roda os testes com Vitest
```

## Build de produção

```bash
npm run build   # checa os tipos (tsc) e gera a pasta dist/
npm run preview # serve o build localmente para conferência
```

A pasta `dist/` é estática e pode ser publicada em qualquer hospedagem de arquivos estáticos.

## Estrutura

| Caminho | Conteúdo |
| --- | --- |
| `App.tsx` | Formulário principal, validação e envio |
| `components/` | Campos de entrada, cartão de item e logo |
| `constants.ts` | Listas de opções (bases, tipos, objetivos) e mapeamento de e-mails |
| `utils/emailTemplates.ts` | Montagem do texto do e-mail |
| `types.ts` | Tipos da requisição e dos itens |
