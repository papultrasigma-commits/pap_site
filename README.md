# Relatório de Prova de Aptidão Profissional (PAP)

**Projeto:** Valorant Team Manager (Valorant Nexus)
**Autor:** Francisco Daniel Rebel
**Ano Letivo:** 2025/2026

---

## Índice

1. [Resumo do Projeto](#1-resumo-do-projeto)
2. [Introdução e Contextualização](#2-introdução-e-contextualização)
3. [Enquadramento Tecnológico e Arquitetura](#3-enquadramento-tecnológico-e-arquitetura)
4. [Análise de Requisitos e Funcionalidades](#4-análise-de-requisitos-e-funcionalidades)
   - [Perfil: Utilizador](#perfil-utilizador)
   - [Perfil: Administrador](#perfil-administrador)
5. [Inovações Tecnológicas e Funcionalidades de Destaque](#5-inovações-tecnológicas)
6. [Moderação Automática (TensorFlow / IA)](#6-moderação-automática)
7. [Arquitetura de Ficheiros e Padrões de Implementação](#7-arquitetura-de-ficheiros-e-padrões-de-implementação)
8. [Implementação e Estruturas da Base de Dados (Supabase)](#8-implementação-e-estruturas-da-base-de-dados)
9. [Guia de Configuração Local](#9-guia-de-configuração-local)
10. [Conclusão](#10-conclusão)

---

## 1. Resumo do Projeto

O **Valorant Team Manager** (internamente chamado de *Valorant Nexus*) é uma plataforma e aplicação *web* complexa desenvolvida com o intuito de resolver as necessidades de equipas de *esports* de nível amador e semi-profissional focadas no jogo *Valorant*, desenvolvido pela Riot Games. A premissa do projeto é centralizar funcionalidades que até agora se encontravam dispersas em múltiplos serviços diferentes (Discord, Twitter, Tracker.gg e ValoPlant) numa única "All-in-One" Application.

Este documento serve como prova física e explicação técnica de todo o trabalho desenvolvido no âmbito da **Prova de Aptidão Profissional (PAP)**, focando-se não apenas no que o utilizador vê (*Frontend*), mas na intricada lógica por detrás das cortinas: a *Base de Dados*, a *Inteligência Artificial de Moderação*, o sistema de *Drag & Drop* tático e a integração com *APIs de Terceiros*. O site conta com dezenas de funcionalidades críticas e uma interface moderna e altamente interativa baseada em React e Tailwind CSS, espelhando os *standards* atuais de *UI/UX Design* na área do *Gaming*.

---

## 2. Introdução e Contextualização

A comunidade de jogadores de Valorant, especialmente a fatia focada num ambiente competitivo, sofre com a falta de um ecossistema nativo para gerir equipas. Quando um jogador quer entrar numa equipa, ele publica um *Tweet* com a sigla **LFT** (*Looking For Team*) e anexa imagens do seu *rank*. Quando uma equipa precisa de combinar táticas, usa sites externos limitados. Quando as equipas querem treinar, marcam jogos (*Scrims*) através de servidores caóticos de Discord.

A **Valorant Team Manager** foi desenhada para resolver exatamente isto. O site impõe um sistema de autenticação segura e exige que as contas sejam verificadas através da integração oficial com a API da Riot Games, mitigando problemas graves na comunidade como perfis falsos, *smurfs* e "catfishes" de *rank* (jogadores que dizem ter um nível de habilidade superior ao que realmente têm). Ao vincular a conta, a plataforma passa a apresentar o Rank Real e as estatísticas matemáticas de cada utilizador de forma automática e imparcial.

Isto transforma a plataforma não apenas num mero fórum, mas numa **Ferramenta de Gestão Desportiva (eSports)** capaz de agilizar recrutamentos, formações táticas, e o crescimento de equipas através de uma rede social gamificada.

---

## 3. Enquadramento Tecnológico e Arquitetura

Para materializar a visão da plataforma, foi adotada a stack tecnológica baseada em **React e Supabase**, garantindo simultaneamente o alto desempenho necessário para desenhar no *Canvas* e a robustez e segurança de uma base de dados *PostgreSQL* autogerida.

### O lado do Cliente (*Frontend*)
- **React.js (v19) & Vite:** Em vez de usar motores de renderização antigos, utilizou-se o Vite que acelera o ambiente de desenvolvimento (*Hot Module Replacement* instântaneo) e constrói a *Single Page Application* (SPA) minimizando ficheiros desnecessários. Como é uma SPA, a navegação entre páginas acontece sem *reloads*, passando a sensação de se estar a usar um software instalado nativamente no computador.
- **Tailwind CSS:** Toda a interface, que conta com *Dark Mode* forçado de tons cinzentos e vermelhos (cores características do Valorant), foi feita usando as classes utilitárias do Tailwind, permitindo a construção rápida de *layouts* com *Flexbox* e *CSS Grid*, sendo também 100% reativo (*mobile friendly*).
- **TensorFlow.js & NSFW.js:** Bibliotecas de *Machine Learning* executadas totalmente no lado do *browser*. São o pilar da Moderação Automática do Feed.
- **HTML2Canvas:** Ferramenta gráfica essencial que captura o estado do DOM no Quadro Tático e converte-o numa imagem que pode ser partilhada entre os membros da equipa.

### O lado do Servidor (*Backend*) e Integrações
- **Supabase (PostgreSQL & Auth):** O Supabase gere quatro componentes críticos:
  - **Database:** Uma infraestrutura PostgreSQL que guarda todos os perfis, mensagens, *posts*, equipas e relacionamentos complexos.
  - **Authentication:** Sistema que trata o Registo, *Login*, Encriptação de Passwords e gera Tokens seguros (JWT - *JSON Web Tokens*).
  - **Storage:** Servidor de ficheiros onde os *uploads* de vídeos e imagens do Feed e os Avatares são alojados.
  - **Realtime / RLS:** Políticas de segurança *Row Level Security* que protegem as tabelas de ataques diretos por utilizadores mal intencionados.
- **HenrikDev API & Valorant API:** Duas APIs assíncronas (*RESTful*). A HenrikDev atua como uma ponte legal para a infraestrutura da *Riot Games* para obter o `PUUID` das contas e dados confidenciais (Estatísticas e *Rank*), enquanto a Valorant API fornece imagens (*assets*) dos personagens e dos mapas usados no projeto.

---

## 4. Análise de Requisitos e Funcionalidades

O sistema foi concebido pensando em dois espetros distintos de acesso e usabilidade: o **Utilizador Comum** (que pode assumir o papel de Membro ou Líder de Equipa) e o **Administrador** (que tem como única função policiar e garantir a saúde da comunidade).

### Perfil: Utilizador
1. **Registo e Vinculação (Onboarding):** Depois de criar conta com email e password, o utilizador pode ligar a sua conta Valorant (ex: *Jogador#EUW*). O sistema valida a conta, puxa a *Player Card*, e o ícone do Rank Atual.
2. **Sistema LFT (Looking for Team):** Um jogador pode marcar no seu perfil que está ativamente à procura de equipa. O seu perfil fica visível num radar de recrutamento, permitindo aos líderes enviar-lhe convites. Da mesma forma, um jogador pode pesquisar por equipas existentes e enviar um **"Pedido de Entrada"**.
3. **Gestão de Equipas (Líderes):** Quem cria uma equipa torna-se Líder (dono). Ele ganha acesso à página de **Negociações**, onde pode ver a lista de jogadores que pediram para entrar na equipa, podendo aprovar ou rejeitar as candidaturas. Além disso, pode editar o logótipo da equipa e nomear outros Capitães.
4. **Chat de Equipa Privado:** A equipa ganha uma rota com um chat privado (semelhante a um grupo de WhatsApp) que serve para conversarem, comemorarem vitórias e agendarem jogos.
5. **Feed Público (Rede Social):** Uma página inicial onde qualquer pessoa pode fazer partilhas. Permite o upload de vídeos de jogadas épicas e imagens, além do botão de *"Like"*, sistema de comentários em cascata e opções de denúncia e partilha. É totalmente censurado e policidado (ver ponto 6).
6. **O Quadro Tático (Strategies):** (Aprofundado na Secção 5).

### Perfil: Administrador
O foco do Administrador não é jogar, mas sim gerir.
1. **Dashboard Oculto:** O administrador tem acesso a páginas específicas que não aparecem no menu de um utilizador comum.
2. **Sistema de Denúncias (Reports):** Se um utilizador publicar algo inapropriado no Feed, ou comentar uma ofensa que o filtro automático deixou passar, qualquer pessoa pode clicar no botão "Denunciar". O Administrador recebe um *ticket* indicando qual é o alvo da denúncia, o motivo (Assédio, Spam, Falso), e um botão direto para **Banir** ou **Remover o Post**.
3. **Direitos de Sobreposição:** O administrador, quando navega pelo Feed, consegue ver o botão de "Apagar" (Caixote do lixo) em **todos** os *posts* e comentários de toda a gente, um poder concedido no Frontend através da validação da variável booleana `is_admin`.

---

## 5. Inovações Tecnológicas e Funcionalidades de Destaque

A "Joia da Coroa" tecnológica desta PAP é a secção do **Quadro Tático (Strategies Page)**. Para além do funcionamento clássico de *CRUDs* (Create, Read, Update, Delete) do resto da aplicação, o Quadro Tático é uma manifestação complexa de desenho assistido por computador embutido na Web.

**Fluxo Lógico e de Execução do Quadro Tático:**
- A página começa por fazer um pedido HTTP à *Valorant API* para pedir todos os agentes (ex: *Jett*, *Sage*, *Cypher*) e as 4 habilidades de cada um.
- Depois de carregar as imagens na base do ecrã, a aplicação entra no modo *Drag & Drop API nativa do HTML5*.
- Quando o utilizador agarra no ícone da *Smoke do Omen*, por exemplo, e larga o ícone na imagem do Mapa (ex: *Ascent*), o código guarda um Objeto `Marker` num Array em memória `useState`.
- Os cálculos matemáticos:
```javascript
// A posição é calculada em percentagem para não quebrar a tática em ecrãs diferentes
const x = ((e.clientX - rect.left) / rect.width) * 100;
const y = ((e.clientY - rect.top) / rect.height) * 100;

setMarkers((prev) => [
  ...prev,
  { id: Date.now(), agent: "Omen", ability: "Smoke", team: "ally", x, y, angle: 0 },
]);
```
- **Desenho Misto:** Paralelamente às imagens (`div` absolutas com `<img>` posicionadas via CSS `left: x%; top: y%;`), o utilizador pode ligar a "Ferramenta Lápis". Isso ativa os *Event Listeners* (`onMouseDown`, `onMouseMove`, `onMouseUp`) sobre um elemento `<canvas>`, onde o `CanvasRenderingContext2D` começa a desenhar setas em tempo real com `ctx.lineTo()`.
- **Exportação do Canvas (HTML2Canvas):** Uma vez que a tática está pronta, a aplicação une as camadas (imagem de fundo do mapa, desenhos do canvas e os ícones em cima) usando o **HTML2Canvas**. Foi aplicado um `scale: 4` para gerar uma imagem em alta resolução e enviá-la silenciosamente para a Cloud do Supabase, permitindo que a tática seja partilhada diretamente no Chat da equipa.

---

## 6. Moderação Automática (TensorFlow / IA)

Sendo esta uma aplicação desenhada para *gamers*, a probabilidade de toxicidade e partilha de conteúdo adulto no Feed (Nudes, Gore, Pornografia) é considerável. Para impressionar e criar uma linha de defesa robusta antes mesmo do conteúdo chegar ao Servidor (o que poupa custos ao servidor), foi implementado o **NSFW.js assente em TensorFlow**.

**Como Funciona o Fluxo do Analisador de Imagem/Vídeo:**
1. Quando o utilizador clica em "Publicar", a imagem selecionada é convertida para um Elemento HTML Image em background.
2. A IA (Modelo Neural Convolutional) analisa a matriz de pixeis.
3. Se detetar (Porn, Hentai ou imagens extremamente Sexy) acima de um determinado limiar de probabilidade estatística, a aplicação simplesmente interrompe todo o processo de *Upload* e lança um alerta.

**Código e Execução Real no projeto (`Feed.jsx`):**
```javascript
const analyzeImage = (fileUrl) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = async () => {
      // O TensorFlow processa a imagem
      const predictions = await aiModel.classify(img);

      // Avalia o resultado em busca de conteúdo explícito
      const inappropriate = predictions.find((p) => {
        if (p.className === "Porn" || p.className === "Hentai") {
          return p.probability > 0.01; // Tolerância Zero
        }
        if (p.className === "Sexy") {
          return p.probability > 0.75; // Permite alguma margem (ex: cosplay do Valorant)
        }
        return false;
      });

      resolve(inappropriate !== undefined);
    };
    img.src = fileUrl;
  });
};
```
No caso dos vídeos, a lógica implementada é ainda mais avançada: a aplicação usa um `<canvas>` invisível para extrair *Frames* específicos (aos 0.5s, 1.5s e 2.5s) e corre a IA em cima de cada um desses frames antes de permitir o upload.

Adicionalmente, existe um **Filtro Estrito de Palavras** (Lista Negra), que substitui palavrões e insultos raciais por asteriscos (*), e um **Radar Inteligente de Links**, que com Expressões Regulares (`RegEx`) corta imediatamente tentativas de partilhar *URLs* para sites conhecidos para adultos (ex: PornHub, OnlyFans).

---

## 7. Arquitetura de Ficheiros e Padrões de Implementação

O projeto está organizado segundo o princípio de modularidade, separando a lógica da apresentação e mantendo tudo dentro de uma arquitetura limpa:

```text
pap_site-main/
│
├── public/                 # Favicons e manifestos para publicação
├── src/                    # Todo o código fonte
│   ├── assets/             # Imagens base, logótipos locais
│   ├── components/         # Blocos visuais reutilizáveis
│   ├── i18n/               # Ficheiros de tradução do site
│   ├── pages/              # A essência de cada View da app
│   │   ├── Login.jsx       # Registo / Login
│   │   ├── Profile.jsx     # Perfil dinâmico (Henrik API + Ranks + Posts)
│   │   ├── Feed.jsx        # Lógica de IA + Posts Sociais
│   │   ├── Strategies.jsx  # Canvas / Drag and Drop
│   │   ├── FindTeam.jsx    # LFT e motor de pesquisa de equipas
│   │   └── Team.jsx        # Dashboard interna do plantel
│   ├── supabaseClient.js   # Wrapper responsável pelas transações Cloud
│   ├── App.jsx             # Roteador (React Router DOM)
│   ├── index.css           # Variáveis do Tailwind e CSS Base
│   └── main.jsx            # Bootstrapper Global do React
│
├── .env                    # Ficheiro de proteção de credenciais críticas
├── package.json            # Gestão e versão de dependências npm
└── tailwind.config.js      # Configurações de cores e transições customizadas
```
Nenhum ficheiro excede as suas responsabilidades (Single Responsibility Principle na medida do possível), e todos os componentes usam os `Hooks` mais recentes do React: `useState` para estado local, `useEffect` para ciclos de vida e chamadas à base de dados, e `useRef` para aceder diretamente a elementos do DOM como vídeos e o próprio Canvas de desenho.

---

## 8. Implementação e Estruturas da Base de Dados (Supabase)

A base de dados obedece às normas de **Relacionamento Relacional**. Evitando a duplicação de dados e forçando as lógicas do projeto. Foi utilizado PostgreSQL.

As tabelas e as suas relações:

1. **`profiles` (A Tabela Central):**
   - A espinha dorsal. Recebe os dados de Autenticação (`id` como *Primary Key* que é obrigatoriamente um UID do Auth do Supabase).
   - Tem os campos `username`, `avatar_url`, `main_role`.
   - **Detalhe crucial:** A coluna `riot_puuid` tem a *Constraint* (Restrição) **`UNIQUE`**. O sistema vai à API pedir o PUUID numérico escondido de um jogador do Valorant. Ao ser guardado aqui com atributo `UNIQUE`, torna-se impossível no Sistema duas pessoas partilharem a conta do jogo.
   - Coluna `is_admin` (Booleano).

2. **`teams`:**
   - Possui o `id` (Serial/UUID), `name`, `logo_url`, `color_id`, e a coluna `owner_id`.
   - A coluna `owner_id` é uma *Foreign Key* (Chave Estrangeira) que aponta para o `id` da tabela de `profiles`. Assim o sistema sabe sempre quem é o capitão e o único membro com permissões para apagar a equipa.

3. **`team_members` (Associação N:M):**
   - No SQL, uma relação *Muito para Muitos* é resolvida com uma tabela intermediária. Um jogador pode (na teoria) estar em várias equipas se quisermos, mas a relação obriga a que haja a coluna `user_id` e `team_id`. Permite também gravar a *role* e se o jogador tem *status* de "Manager".

4. **`team_requests`:**
   - Um motor de filas e pedidos. Tem o `team_id`, o `user_id`, e o `status` (que pode ser `pending`, `accepted`, `rejected`). Esta tabela alimenta a página de **Negociações**.

5. **`feed_posts` & `feed_comments` & `feed_likes`:**
   - Estrutura clássica de Redes Sociais. Os `comments` e os `likes` apontam via Chave Estrangeira para o ID do `post`. Se um utilizador ou administrador apagar um *Post*, a base de dados ativa o gatilho **`ON DELETE CASCADE`** apagando silenciosa e automaticamente todos os *likes* e comentários associados aquele post, evitando "lixo" e erros no servidor (*Orphan Rows*).

6. **`saved_strategies`:**
   - Em vez de guardar as táticas inteiras como imagens enormes, esta tabela grava um campo longo do tipo `JSONB`. Ela armazena as coordenadas *X* e *Y* de todos os elementos. Assim, uma tática guardada pode ser carregada, lida pela aplicação em React, e o utilizador pode continuar a mover as peças como se nada fosse.

---

## 9. Guia de Configuração Local

Para que o júri ou futuros programadores possam instalar, explorar ou modificar o código no seu próprio computador, abaixo encontra-se o guia técnico de execução.

**Requisitos e Dependências Iniciais:**
1. Instalar o [Node.js](https://nodejs.org/en) (É recomendado a versão 18 LTS ou mais recente).
2. Ter o [Git](https://git-scm.com/) instalado.
3. Obter ou criar as credenciais e o Projeto no painel *Dashboard* do Supabase.

**Passo a passo no Terminal:**

**Passo 1:** Clonar e entrar na pasta do projeto:
```bash
git clone https://github.com/SeuUsername/pap_site-main.git
cd pap_site-main
```

**Passo 2:** Instalação Completa do Repositório (Npm Modules):
A instalação do repositório exige atenção por causa do motor de IA. Foi provado ser estritamente necessário usar parâmetros corretos:
```bash
# Instala React, Vite e Tailwind Base
npm install

# Instala a arquitetura pesada da Google para IA
# Usa-se --legacy-peer-deps para forçar a integração com bibliotecas React recentes que possam reclamar das versões do tfjs.
npm install @tensorflow/tfjs nsfwjs
npm install @tensorflow-models/toxicity --legacy-peer-deps
```

**Passo 3:** Configuração Segura (Ambiente):
Crie um ficheiro vazio chamado `.env` no diretório principal. Este ficheiro **não deve nunca ser publicado no Github** (já garantido pelo `.gitignore`). Adicione:
```env
VITE_SUPABASE_URL=https://<seu-link-gerado-no-supabase>.supabase.co
VITE_SUPABASE_ANON_KEY=<sua-anon-key-longa>
```

**Passo 4:** Compilação e Execução:
```bash
npm run dev
```
O servidor Vite arrancará quase instantaneamente e indicará um porto local (ex: `http://localhost:5173/`). Prima `CTRL + Click` no link e a aplicação abrirá.

---

## 10. Conclusão

A execução e culminação desta Prova de Aptidão Profissional demonstra na prática como os conhecimentos teóricos adquiridos podem ser materializados numa aplicação *Full-Stack* de grande dimensão e complexidade.

O **Valorant Team Manager** ultrapassou o escopo de um mero "trabalho escolar". Envolve sistemas distribuídos e de segurança sofisticados:
1. Comunicação contínua entre **Três Servidores em simultâneo**: O Servidor do Cliente (React), o Servidor de Base de Dados (Supabase) e o Servidor Oficial de Estatísticas (Henrik/Riot Games).
2. Manuseio dinâmico do **DOM** (Quadro Tático) usando matemática básica aliada à engenharia gráfica nativa do browser para criar experiências fluidas parecidas às de um jogo.
3. Prevenção ativa de abusos através do uso inovador de modelos **Neurais da Google / TensorFlow** adaptados à Web, elevando o estado da arte e garantindo a proteção da comunidade.

Com este nível de rigor na separação do *Frontend*, segurança no *Backend*, usabilidade na interface e funcionalidades únicas no cenário dos desportos eletrónicos (eSports), atinge-se assim o objetivo principal: providenciar um ecossistema fiável, seguro e definitivo para que qualquer jogador e treinador consiga criar e gerir a sua equipa e elevar o seu desempenho na arena do *Valorant*.