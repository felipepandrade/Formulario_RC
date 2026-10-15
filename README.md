# Formulário de Requisição de Compra (RC) – ESOM

Aplicação web para elaborar Requisições de Compra (RC) da gerência ESOM. O solicitante preenche o formulário com um ou mais itens e a requisição é enviada por e-mail para o responsável da base selecionada.

A aplicação roda inteiramente no navegador (React + Vite + TypeScript + Tailwind). Não há servidor nem banco de dados.

## Como funciona

1. O solicitante informa seu nome e o local para entrega (`ESOM_F_CATU_OI`, `ESOM_R_CATU_OI`, `ESOM_F_CAMACARI_OI`, `ESOM_F_ITABUNA_OI`, `ESOM_F_PILAR_OI` ou `ESOM_F_ATALAIA_OI`).
2. Adiciona um ou mais itens, cada um com código, descrição, quantidade, preço, local de utilização, tipo de origem, tipo de destino, uso pretendido, objetivo da RC, justificativa e observações. O valor total estimado é calculado automaticamente.
3. O formulário valida os campos obrigatórios antes de qualquer envio e leva o cursor até o primeiro campo com erro.
4. Ao enviar, o app abre o cliente de e-mail (Outlook) com um link `mailto:` já preenchido para o e-mail da base escolhida.

Se a requisição for longa demais para o link (mais de 2000 caracteres, limite comum do Outlook), o app copia o texto completo para a área de transferência e abre o e-mail mesmo assim, com destinatário e assunto preenchidos e uma instrução no corpo. Basta apagar essa instrução e colar o texto com Ctrl+V (Cmd+V no Mac). Se a cópia automática falhar, o app avisa e o e-mail não é aberto.

Os botões **Copiar Solicitação** e **Baixar (.txt)** podem ser usados a qualquer momento.

O preenchimento é salvo automaticamente neste navegador, então recarregar a página ou fechar a aba não perde os dados. O botão **Limpar formulário** apaga o rascunho e começa uma nova requisição.

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

Pré-requisito: Node.js 20.19 ou mais recente (exigência do Vite 7). No Node 22, use a 22.12 ou mais recente.

```bash
npm install     # instala as dependências
npm run dev     # inicia o servidor de desenvolvimento (Vite)
```

O Vite mostra no terminal o endereço local (por padrão, `http://localhost:5173`).

## Testes

```bash
npm test        # roda os testes com Vitest
```

## Build e publicação

```bash
npm run build   # checa os tipos (tsc), valida os e-mails e gera a pasta dist/
npm run preview # serve o build localmente para conferência
```

A pasta `dist/` é estática e pode ser publicada em qualquer hospedagem de arquivos estáticos.

O projeto é publicado na Vercel, que gera uma prévia para cada pull request. As variáveis `VITE_EMAIL_*` precisam estar cadastradas em **Settings > Environment Variables**, nos ambientes Production e Preview, senão o build falha. Os cabeçalhos de segurança do site ficam em `vercel.json`.

## Estrutura

| Caminho | Conteúdo |
| --- | --- |
| `App.tsx` | Formulário principal e envio (Outlook, cópia e .txt) |
| `components/` | Campos de entrada, cartão de item e logo |
| `constants.ts` | Listas de opções (bases, tipos, objetivos) e mapeamento de e-mails |
| `utils/emailTemplates.ts` | Montagem do texto do e-mail |
| `utils/validation.ts` | Validação dos campos obrigatórios |
| `utils/draft.ts` | Rascunho salvo no navegador |
| `utils/items.ts`, `utils/format.ts` | Criação de itens, total e formatação de valores |
| `types.ts` | Tipos da requisição e dos itens |
| `vite.config.ts` | Configuração do Vite, dos testes e checagem dos e-mails no build |
