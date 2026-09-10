# ReUse! — Plataforma Web

> **Este repositório é a entrega da Atividade 02 — "ReUse com voz: Criando um assistente virtual com IBM Watson".**
> Ele contém o código completo da plataforma ReUse! em Next.js, incluindo o assistente virtual integrado ao IBM Watson Assistant — veja a **seção 4** deste README para os detalhes dessa atividade específica.

**Autora:** Bruna Pereira Cordeiro — RM 563153

Versão web da plataforma **ReUse!**, desenvolvida com **Next.js** e integrada a um banco de dados **PostgreSQL** através do **Prisma ORM**. O objetivo desta fase não foi recriar todo o aplicativo mobile na web, e sim disponibilizar as áreas mais importantes da plataforma (catálogo de produtos, cadastro de itens e perfil do usuário) como uma via de acesso adicional para o usuário final.

**Site publicado:** https://reuse-web-bay.vercel.app
> ⚠️ Essa versão publicada é a da entrega anterior (Fase 6) e **não inclui o assistente virtual** desta atividade — o chatbot com o Watson Assistant não foi publicado, existe apenas no código deste repositório e ao rodar o projeto localmente. Esta atividade não exige link de hospedagem, apenas o link do repositório.

## Tecnologias utilizadas

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Prisma ORM 6**
- **PostgreSQL** (hospedado no [Neon](https://neon.com))
- **bcryptjs** para criptografia de senha
- **Vercel Blob** para armazenamento das imagens dos produtos
- Hospedado na **Vercel**

## Como rodar o projeto localmente

1. Instalar as dependências:
   ```bash
   npm install
   ```
2. Criar um arquivo `.env` na raiz do projeto (use o `.env.example` como modelo) com as variáveis:
   ```
   DATABASE_URL="postgresql://usuario:senha@host/banco?sslmode=require"
   AUTH_SECRET="uma-chave-secreta-qualquer"
   BLOB_READ_WRITE_TOKEN="token-do-vercel-blob"
   WATSON_ASSISTANT_API_KEY="sua-api-key-do-watson"
   WATSON_ASSISTANT_URL="https://api.<regiao>.assistant.watson.cloud.ibm.com/instances/<id-da-instancia>"
   WATSON_ASSISTANT_ID="live-environment-id"
   ```
   Esse arquivo não é enviado ao GitHub (está no `.gitignore`), pois contém a senha do banco de dados. Cada pessoa que for rodar o projeto cria o seu próprio. O `BLOB_READ_WRITE_TOKEN` é usado para salvar as imagens dos produtos (upload) e é gerado automaticamente ao conectar um projeto na Vercel a um Blob Store. As variáveis `WATSON_*` são usadas pelo assistente virtual — veja a seção 4 para como configurá-las.
3. Criar as tabelas no banco de dados:
   ```bash
   npx prisma migrate dev
   ```
4. Rodar o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
5. Acessar [http://localhost:3000](http://localhost:3000)

---

## 1. Desenvolvimento Next.js — Telas e objetivos

Todas as rotas foram construídas com o **App Router** do Next.js, combinando Server Components (para leitura de dados) e Server Actions (para escrita de dados), sem necessidade de uma API separada.

| Tela | Rota | Objetivo |
|---|---|---|
| **Entrar** | `/login` | Autenticar um usuário já cadastrado (e-mail + senha) e iniciar a sessão. |
| **Criar conta** | `/cadastro` | Cadastrar um novo usuário na plataforma. |
| **Início** | `/` | Página inicial com a proposta da plataforma (doar/trocar) e o total de produtos cadastrados. |
| **Produtos disponíveis** | `/produtos` | Lista todos os produtos cadastrados por qualquer usuário, disponíveis para doação ou troca. |
| **Detalhe do produto** | `/produtos/[id]` | Exibe as informações completas de um produto específico e quem o publicou. |
| **Cadastrar produto** | `/produtos/novo` | Formulário para o usuário logado publicar um novo item, incluindo upload de imagem. |
| **Perfil do usuário** | `/perfil/[id]` | Exibe os dados de um usuário e a lista de produtos publicados por ele. |

Toda a plataforma é protegida por autenticação: apenas as telas de **Entrar** e **Criar conta** são públicas — as demais só podem ser acessadas por um usuário logado (verificação feita em `src/proxy.ts`, o arquivo de middleware do Next.js).

## 2. Prisma ORM — Aplicação nas telas

O Prisma Client é utilizado diretamente dentro dos Server Components e Server Actions, sem passar por uma API REST intermediária. Ele aparece em praticamente todas as telas:

| Tela | Uso do Prisma |
|---|---|
| **Início** | `prisma.produto.count()` — conta o total de produtos cadastrados para exibir o número real na plataforma. |
| **Produtos disponíveis** | `prisma.produto.findMany()` — busca todos os produtos, ordenados pelos mais recentes. |
| **Detalhe do produto** | `prisma.produto.findUnique()` com `include` — busca um produto pelo id, já trazendo os dados do usuário dono junto (relação). |
| **Cadastrar produto** | `prisma.produto.create()` — grava o novo produto no banco, associado ao usuário logado. |
| **Perfil do usuário** | `prisma.usuario.findUnique()` com `include` — busca o usuário e, na mesma consulta, todos os produtos publicados por ele. |
| **Criar conta** | `prisma.usuario.findUnique()` (verifica se o e-mail já existe) e `prisma.usuario.create()` (cria o usuário com a senha já criptografada). |
| **Entrar** | `prisma.usuario.findUnique()` — busca o usuário pelo e-mail para conferir a senha. |

## 3. Banco de dados — Tabelas e objetivos

O banco de dados é PostgreSQL, com as tabelas geradas automaticamente pelas migrations do Prisma (`prisma/migrations`), a partir do modelo definido em `prisma/schema.prisma`.

### Tabela `Usuario`

Armazena as pessoas cadastradas na plataforma.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | String (chave primária) | Identificador único do usuário. |
| `nome` | String | Nome do usuário. |
| `email` | String (único) | E-mail usado para login. |
| `senha` | String | Senha criptografada (bcrypt). |
| `criadoEm` | DateTime | Data de criação da conta. |

### Tabela `Produto`

Armazena os itens disponibilizados para doação ou troca.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | String (chave primária) | Identificador único do produto. |
| `nome` | String | Nome do produto. |
| `categoria` | String | Categoria do produto (ex: Móveis, Roupas). |
| `descricao` | String | Descrição do produto. |
| `imagemUrl` | String (opcional) | Caminho da imagem enviada pelo usuário. |
| `ativo` | Boolean | Indica se o produto está visível no catálogo público (`true`) ou pausado pelo dono (`false`). |
| `criadoEm` | DateTime | Data de publicação do produto. |
| `usuarioId` | String (chave estrangeira) | Referência ao usuário que publicou o produto. |

A relação entre as duas tabelas é **1:N** — um usuário pode publicar vários produtos, e cada produto pertence a exatamente um usuário.

## 4. Assistente virtual (IBM Watson Assistant)

A plataforma tem um assistente virtual (ícone de chat no canto inferior direito, visível para usuários logados) que conversa com o **IBM Watson Assistant** e é capaz de executar ações reais na plataforma, além de orientar o usuário sobre como usá-la.

### Tarefas automatizadas pelo chatbot

| Tarefa | Exemplo de comando | O que acontece |
|---|---|---|
| Pausar produto | "quero pausar minha bicicleta" | O produto correspondente do usuário logado é marcado como inativo no banco (`ativo = false`) e some do catálogo público. |
| Reativar produto | "reativar meu produto" | O produto volta a ficar ativo (`ativo = true`) e reaparece no catálogo. |
| Listar produtos publicados | "quais produtos eu publiquei" | O assistente consulta o banco de dados e retorna a lista real dos produtos do usuário, com o status de cada um. |

### Orientações implementadas no chatbot

| Dúvida | Exemplo de pergunta |
|---|---|
| Como cadastrar um produto (com foto) | "como cadastro um produto" |
| Como criar conta e fazer login | "como crio uma conta" |

### Como funciona (arquitetura)

O IBM Watson Assistant foi criado com a ferramenta de **Actions** (ações), com 5 ações treinadas com frases de exemplo em português: `pausar_produto`, `reativar_produto`, `listar_produtos`, `ajuda_cadastro` e `ajuda_conta`.

A conversa acontece assim:
1. O usuário digita uma mensagem no widget de chat (`src/components/ChatWidget.tsx`), que é logado no ReUse.
2. A mensagem vai para a rota `src/app/api/chat/route.ts`, que já sabe quem é o usuário (pela sessão de login).
3. Se a mensagem contém palavras-chave de uma tarefa (pausar/reativar/listar), o próprio backend do ReUse identifica o produto pelo nome e executa a ação direto no banco via Prisma — sem precisar do Watson para isso, o que torna a automação mais confiável.
4. Para qualquer outra mensagem (as duas orientações e conversas gerais), a pergunta é enviada para o **Watson Assistant** (`src/lib/watson.ts`), que responde com o passo a passo configurado na ação correspondente.

### Como configurar o Watson Assistant (para rodar o projeto)

1. Criar um serviço **watsonx Assistant** (plano Lite, gratuito) no [IBM Cloud](https://cloud.ibm.com).
2. Dentro do serviço, criar um assistente e as 5 ações listadas acima (nome da ação + frases de exemplo + resposta).
3. Publicar o assistente no ambiente **Live**.
4. Em **Assistant settings → API details**, copiar:
   - `Service instance URL` → variável `WATSON_ASSISTANT_URL`
   - `API key` (em Manage → Show credentials, na página do serviço no IBM Cloud) → variável `WATSON_ASSISTANT_API_KEY`
   - **`Live Environment ID`** (não o "Assistant ID") → variável `WATSON_ASSISTANT_ID`
