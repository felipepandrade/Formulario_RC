# Formulário de Requisição de Compra (RC) – ESOM

Aplicação web para elaborar Requisições de Compra (RC) da gerência ESOM. O solicitante preenche o formulário com um ou mais itens e a requisição é enviada por e-mail para o responsável da base selecionada.

A aplicação roda inteiramente no navegador (React 19 + Vite 8 + TypeScript + Tailwind 4). Não há servidor nem banco de dados.

## Como funciona

1. O solicitante informa seu nome e o local para entrega (`ESOM_F_CATU_OI`, `ESOM_R_CATU_OI`, `ESOM_F_CAMACARI_OI`, `ESOM_F_ITABUNA_OI`, `ESOM_F_PILAR_OI` ou `ESOM_F_ATALAIA_OI`).
2. Adiciona um ou mais itens, cada um com código, descrição, quantidade, preço, local de utilização, tipo de origem, tipo de destino, uso pretendido, objetivo da RC, justificativa e observações. O valor total estimado é calculado automaticamente.
3. O formulário valida os campos obrigatórios antes de qualquer envio, informa quantos campos precisam ser corrigidos e leva o cursor até o primeiro. O Subinventário passa a ser obrigatório quando o Tipo de Destino é "Estoque".
4. Ao enviar, o app abre o cliente de e-mail (Outlook) com um link `mailto:` já preenchido para o e-mail da base escolhida.

Se a requisição for longa demais para o link (mais de 2000 caracteres, limite comum do Outlook), o app copia o texto completo para a área de transferência e abre o e-mail mesmo assim, com destinatário e assunto preenchidos e uma instrução no corpo. Basta apagar essa instrução e colar o texto com Ctrl+V (Cmd+V no Mac). Se a cópia automática falhar, o app avisa e o e-mail não é aberto.

Depois de abrir o e-mail, o app avisa que a requisição já foi aberta no Outlook (inclusive se a página for recarregada) e oferece **Nova requisição**, para evitar o envio do mesmo pedido duas vezes.

Os botões **Copiar Solicitação** e **Baixar (.txt)** podem ser usados a qualquer momento.

Cada item pode ser **duplicado** (útil para itens parecidos) ou removido. Ao remover, o app mostra **Desfazer** por 10 segundos.

O preenchimento é salvo automaticamente neste navegador, então recarregar a página ou fechar a aba não perde os dados; ao voltar, o app mostra a data do rascunho recuperado. O botão **Limpar formulário** apaga o rascunho e começa uma nova requisição.

Se ocorrer um erro inesperado, o app mostra uma tela com as opções de recarregar ou apagar o rascunho, em vez de uma página em branco.

## Configuração dos e-mails

Os e-mails de destino de cada base vêm de variáveis de ambiente, codificadas em Base64 para não ficarem em texto puro no código publicado. Copie o arquivo de exemplo e preencha:

```bash
cp .env.example .env
```

| Variável | Base |
| --- | --- |
| `VITE_EMAIL_CATU_OI` | ESOM_F_CATU_OI (Base de Catu) |
| `VITE_EMAIL_R_CATU_OI` | ESOM_R_CATU_OI (ECOMP de Catu) |
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

- Todas as variáveis são obrigatórias no build: `npm run build` falha e lista as que estão ausentes ou não são um e-mail válido em Base64.
- No `npm run dev` essa checagem não é feita. Se faltar a variável de uma base, o erro só aparece ao enviar ("E-mail não encontrado para a base selecionada.").
- O Base64 é só uma ofuscação contra coleta automática. Como o envio é feito pelo navegador, os e-mails continuam acessíveis a quem inspecionar o código publicado.
- O arquivo `.env` está no `.gitignore` e não deve ser versionado.
- As variáveis são lidas no momento do build. Depois de alterar o `.env`, reinicie o `npm run dev` ou gere o build novamente.

## Rodando localmente

Pré-requisito: Node.js 20.19 ou mais recente (exigência do Vite 8). O arquivo `.nvmrc` indica a versão usada no CI (22).

```bash
npm install     # instala as dependências
npm run dev     # inicia o servidor de desenvolvimento (Vite)
```

O Vite mostra no terminal o endereço local (por padrão, `http://localhost:5173`).

## Testes

```bash
npm test          # testes de unidade e de componentes (Vitest + jsdom)
npm run lint      # ESLint, incluindo as regras de React Hooks
npm run build     # necessário antes dos testes de ponta a ponta
npm run test:e2e  # testes de ponta a ponta (Playwright) no Chromium, em desktop e celular
```

Os testes de ponta a ponta abrem o build de produção no navegador real, preenchem e enviam uma requisição, testam duplicar e desfazer a remoção de itens e rodam a checagem automática de acessibilidade (axe, WCAG 2.1 AA). O `vite preview` usa os mesmos cabeçalhos do `vercel.json`, então uma violação da política de segurança (CSP) também faz o teste falhar. Na primeira vez, instale o navegador com `npx playwright install chromium` (ou aponte para um Chromium já instalado com a variável `CHROMIUM_PATH`).

O CI (GitHub Actions) roda lint, testes, build e os testes de ponta a ponta em cada pull request. O Dependabot abre pull requests mensais de atualização de dependências.

## Build e publicação

```bash
npm run build   # checa os tipos (tsc), valida os e-mails e gera a pasta dist/
npm run preview # serve o build localmente para conferência
```

A pasta `dist/` é estática e pode ser publicada em qualquer hospedagem de arquivos estáticos.

O projeto é publicado na Vercel, que gera uma prévia para cada pull request. As variáveis `VITE_EMAIL_*` precisam estar cadastradas em **Settings > Environment Variables**, nos ambientes Production e Preview, senão o build falha.

O `vercel.json` define os cabeçalhos do site: política de segurança de conteúdo (CSP, só recursos do próprio site), bloqueio de indexação por buscadores (junto com `public/robots.txt` e a meta tag em `index.html`) e cache de um ano para os arquivos de `/assets/`, cujos nomes mudam a cada build.

Nos builds feitos na Vercel, o app carrega o Vercel Web Analytics (contagem de visitas sem cookies). Os dados só são coletados depois que o Web Analytics é ativado em **Analytics** no painel do projeto.

## Estrutura

| Caminho | Conteúdo |
| --- | --- |
| `src/App.tsx` | Formulário principal e envio (Outlook, cópia e .txt) |
| `src/components/` | Campos de entrada, cartão de item, logo e tela de erro |
| `src/constants.ts` | Listas de opções (bases, tipos, objetivos) e mapeamento de e-mails |
| `src/utils/emailTemplates.ts` | Montagem do texto do e-mail |
| `src/utils/validation.ts` | Validação dos campos obrigatórios |
| `src/utils/draft.ts` | Rascunho salvo no navegador |
| `src/utils/items.ts`, `src/utils/format.ts` | Criação de itens, total e formatação de valores |
| `src/types.ts` | Tipos da requisição e dos itens |
| `e2e/` | Testes de ponta a ponta (Playwright) |
| `vite.config.ts` | Configuração do Vite, dos testes e checagem dos e-mails no build |
| `vercel.json` | Cabeçalhos de segurança, indexação e cache na Vercel |
