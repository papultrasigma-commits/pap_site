# Relatório de Prova de Aptidão Profissional (PAP)

**Projeto:** Valorant Team Manager
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
5. [Inovações Tecnológicas](#5-inovações-tecnológicas)
6. [Moderação Automática (TensorFlow / AI)](#6-moderação-automática)
7. [Arquitetura de Ficheiros e Padrões de Implementação](#7-arquitetura-de-ficheiros-e-padrões-de-implementação)
8. [Implementação e Estruturas da Base de Dados](#8-implementação-e-estruturas-da-base-de-dados)
9. [Guia de Configuração Local](#9-guia-de-configuração-local)
10. [Conclusão](#10-conclusão)

---

## 1. Resumo do Projeto

O **Valorant Team Manager** é uma aplicação *web* complexa e focada na gestão de equipas de e-sports, especificamente para o título *Valorant* da Riot Games. Desenvolvida como Prova de Aptidão Profissional (PAP), a plataforma atua como um sistema *All-in-One* que permite aos jogadores encontrar equipas (LFT), gerir a sua *roster*, partilhar táticas e jogadas numa rede social interna, e desenhar estratégias através de um Quadro Tático Interativo em tempo real.

O sistema destaca-se por consumir APIs oficiais e *third-party* para validar perfis dos jogadores (via ID da Riot Games) e trazer estatísticas fidedignas (como o *rank*), mitigando a falsificação de perfis dentro da comunidade.

---

## 2. Introdução e Contextualização

A comunidade competitiva de Valorant sofre de um problema de fragmentação: os jogadores usam o *Discord* para comunicação, o *Tracker.gg* para estatísticas, o *ValoPlant* para táticas, e o *Twitter* ou fóruns para recrutar novos jogadores.

Este projeto surge com o objetivo de centralizar todas estas necessidades numa única aplicação, providenciando uma ferramenta de nível profissional para equipas amadoras e semi-profissionais. O foco principal foi garantir a integridade dos dados (forçando a vinculação de contas Riot), segurança dos utilizadores (autenticação forte), e inovação através da manipulação do DOM em Canvas (Quadro Tático).

---

## 3. Enquadramento Tecnológico e Arquitetura

Para garantir uma plataforma rápida, reativa e segura, optou-se por uma arquitetura assente em **React** (Frontend) e **Supabase** (Backend as a Service).

**Frontend:**
- **React 19 & Vite:** A escolha do Vite permitiu um tempo de compilação reduzido, enquanto o React foi utilizado para criar uma interface do utilizador (*Single Page Application*) assente em componentes dinâmicos.
- **Tailwind CSS:** *Framework* utilitária de CSS responsável pela estilização consistente, reativa e rápida da plataforma.
- **Lucide React:** Biblioteca de ícones vetoriais.
- **HTML2Canvas:** Utilizado para capturar instantâneos (*screenshots*) do Quadro Tático e partilhá-los na plataforma.
- **TensorFlow.js & NSFW.js:** Integração de modelos de Inteligência Artificial para moderação de conteúdo multimédia no lado do cliente.

**Backend & Integração de Dados:**
- **Supabase:** Plataforma baseada em *PostgreSQL*, responsável por gerir a base de dados relacional, autenticação segura de utilizadores, *storage* para as imagens e regras de segurança *Row Level Security (RLS)*.
- **HenrikDev API:** API fundamental que interage diretamente com os serviços da Riot Games. É usada para validar contas (Riot ID e Tagline), obter o *PUUID* único do jogador, e consultar o *rank* atual.
- **Valorant API:** API comunitária usada para extrair todos os recursos do jogo (Mapas, Ícones dos Agentes, Habilidades) dinamicamente.

---

## 4. Análise de Requisitos e Funcionalidades

O sistema foi estruturado para suportar diferentes tipos de utilizadores, adaptando as funcionalidades visíveis mediante o papel (*role*) do utilizador na plataforma.

### Perfil: Utilizador (Jogador/Líder de Equipa)
- **Autenticação:** Registo seguro e sistema de login.
- **Vinculação de Conta Riot:** Obrigatoriedade de introduzir o Riot ID válido para importar o *rank* e criar um perfil legítimo na plataforma.
- **Procura de Equipa (LFT):** Capacidade de listar equipas à procura de jogadores e enviar "pedidos para entrar" (*requests*).
- **Gestão de Equipa (Líder):** Aceitar ou recusar candidaturas através de uma interface de *Negociações*, alterar o logo da equipa, e gerir os *Team Members*.
- **Feed Social:** Possibilidade de publicar textos e imagens (clips/prints), comentar em publicações de outros e dar "Gosto".
- **Chat de Equipa:** Um sistema de mensagens em tempo real restrito aos membros de uma equipa.
- **Quadro Tático (Strategies):** Ferramenta avançada para desenhar estratégias usando *Drag & Drop* das habilidades e guardar/partilhar o resultado final.
- **Sistema de Torneios/Scrims:** Procurar adversários para jogos de treino.

### Perfil: Administrador
- **Dashboard Dedicada:** Acesso a rotas restritas apenas a administradores.
- **Sistema de Moderação de Denúncias (Reports):** Quando um utilizador faz uma denúncia de um *post* ou comentário inadequado, o administrador recebe e avalia a denúncia.
- **Gestão de Utilizadores:** Capacidade de aplicar sanções (*bans* temporários ou permanentes) a utilizadores e de apagar publicações ofensivas.

---

## 5. Inovações Tecnológicas

A funcionalidade que mais destaca este projeto é o **Quadro Tático Interativo**, que se assemelha a uma ferramenta nativa de um jogo.

**Como funciona tecnicamente:**
1. A plataforma executa um *fetch* à *Valorant API* para obter a lista de todos os mapas e os ícones das habilidades de todos os Agentes.
2. É utilizado o conceito de **Canvas e DOM Manipulation**. O utilizador seleciona um agente, arrasta a sua habilidade e larga num `mapContainer`.
3. A posição é calculada de forma relativa `(x%, y%)` para que o ícone se mantenha exatamente no mesmo local quer num ecrã Ultra-Wide quer num telemóvel.
4. O utilizador pode desenhar rotas (*Lines*) no mapa usando o `context2d` do `<canvas>`.
5. Através da biblioteca `html2canvas`, a *interface* tira uma fotografia da estrutura do DOM atual, converte num `Blob` em memória, faz o *upload* dessa imagem para o `Storage` do Supabase e publica automaticamente a URL gerada no Feed ou no Chat da Equipa.

*Exemplo de código do cálculo de posições e conversão para imagem:*
```javascript
// Capta as coordenadas onde o utilizador largou a habilidade
const x = ((e.clientX - rect.left) / rect.width) * 100;
const y = ((e.clientY - rect.top) / rect.height) * 100;

// Utilização do html2canvas para converter o quadro numa imagem exportável
const canvasSnapshot = await html2canvas(mapElement, {
  useCORS: true,
  backgroundColor: "#05070b",
  scale: 4 // Escala para alta resolução
});

canvasSnapshot.toBlob(async (blob) => {
  const filePath = `${currentUser.id}/strat-${Date.now()}.jpg`;
  // Envia a imagem final para a base de dados
  await supabase.storage.from('feed_media').upload(filePath, blob);
});
```

---

## 6. Moderação Automática

Para garantir que a plataforma está livre de conteúdos sensíveis e impróprios (*Not Safe For Work*), o projeto conta com uma verificação local baseada em Inteligência Artificial utilizando o modelo **TensorFlow**.

Antes de um ficheiro ser enviado para o *Storage* do Supabase, o modelo analisa a imagem no lado do cliente:

```javascript
import * as nsfwjs from 'nsfwjs';

// Função para verificar a imagem com IA
const checkImageWithAI = async (imageElement) => {
  const model = await nsfwjs.load(); // Carrega o modelo de IA
  const predictions = await model.classify(imageElement);

  // Se a previsão de conteúdo adulto for alta, bloqueia o upload
  const isAdult = predictions.some(p => (p.className === 'Porn' || p.className === 'Hentai') && p.probability > 0.6);

  return isAdult;
};
```
Isto reduz drasticamente a carga do Administrador, automatizando a primeira barreira de segurança da plataforma.

---

## 7. Arquitetura de Ficheiros e Padrões de Implementação

O projeto está organizado numa arquitetura de pastas limpa e escalável baseada em funcionalidades (*Feature-Based Structure*):

```text
src/
├── assets/         # Imagens estáticas e recursos globais
├── components/     # Componentes reutilizáveis (Botões, Modais, Navbar)
├── i18n/           # Configurações de tradução (se aplicável)
├── pages/          # Páginas completas e rotas (Login, Dashboard, Strategies)
│   ├── AdminReports.jsx
│   ├── FindTeam.jsx
│   ├── Strategies.jsx
│   └── Profile.jsx
├── services/       # Ficheiros de comunicação com APIs externas
├── App.jsx         # Definição das rotas com React Router
├── supabaseClient.js # Instância única de conexão à base de dados
└── main.jsx        # Ponto de entrada da aplicação
```

Foi adotada a filosofia de *Componentes Funcionais* e *React Hooks* (`useState`, `useEffect`, `useRef`), abandonando componentes de classe.

---

## 8. Implementação e Estruturas da Base de Dados

A base de dados (PostgreSQL via Supabase) obedece à Terceira Forma Normal (3FN), com tabelas estritamente tipadas e uso intenso de Chaves Estrangeiras (*Foreign Keys*). As regras de **Row Level Security (RLS)** impedem acessos diretos indesejados.

**Principais Tabelas:**
- `profiles`: Guarda informações vitais. (Colunas: `id` (FK Auth), `username`, `riot_account`, `riot_puuid`, `is_admin`). O `riot_puuid` garante que dois utilizadores não conseguem associar a mesma conta Riot Games.
- `teams`: Regista as equipas criadas. (Colunas: `id`, `name`, `owner_id`, `logo_url`).
- `team_members`: Faz a associação *N:M* (Muito para Muitos) entre `profiles` e `teams`.
- `team_requests`: Gere o sistema LFT (pedidos pendentes, aceites ou rejeitados).
- `feed_posts` e `feed_comments`: Estrutura hierárquica do fórum/feed social.
- `saved_strategies`: Guarda as táticas em formato `JSON` (lista de marcações/ícones) para que possam ser reabertas e editadas no Quadro Tático.

*Exemplo de fluxo de integração de Dados (Riot Games -> Supabase):*
Quando um utilizador regista a conta:
1. Pede-se os dados à HenrikDev API (`/v1/account/${name}/${tag}`).
2. Se sucesso, recebemos o `puuid` e o `rank` atual.
3. Faz-se o `UPDATE` na tabela `profiles` com os dados JSON.
4. Se outro utilizador tentar registar aquele `puuid`, o Supabase bloqueia (Constraint de campo `UNIQUE`).

---

## 9. Guia de Configuração Local

Para executar o projeto no ambiente de desenvolvimento, siga as instruções abaixo:

### Pré-requisitos:
- **Node.js** (v18 ou superior) instalado no sistema.
- Uma conta configurada no [Supabase](https://supabase.com/).

### Passo a Passo:

1. **Clonar e Aceder ao Repositório:**
   ```bash
   git clone <URL_DO_REPOSITORIO>
   cd pap_site-main
   ```

2. **Instalar as Dependências:**
   O projeto requer a instalação das bibliotecas principais, incluindo extensões para o TensorFlow.
   ```bash
   npm install
   # Para evitar problemas com dependências legadas do TensorFlow, execute também:
   npm install @tensorflow-models/toxicity --legacy-peer-deps
   npm install @tensorflow/tfjs nsfwjs
   ```

3. **Configuração de Variáveis de Ambiente:**
   Na raiz do projeto, crie um ficheiro `.env` e adicione as chaves obtidas no painel do Supabase:
   ```env
   VITE_SUPABASE_URL=https://<seu-projeto-url>.supabase.co
   VITE_SUPABASE_ANON_KEY=<sua-anon-key>
   ```

4. **Executar o Servidor:**
   ```bash
   npm run dev
   ```
   Após este comando, a aplicação estará disponível em `http://localhost:5173/`.

---

## 10. Conclusão

O projeto **Valorant Team Manager** demonstrou ser uma Prova de Aptidão Profissional robusta, lidando com desafios de programação do mundo real: assincronismo e gestão de estado global, comunicação segura entre Cliente e Servidor (*APIs REST e Supabase*), desenho computacional avançado em interfaces *Web* (DOM e Canvas), e preocupações de segurança e moderação usando Inteligência Artificial.

Através destas implementações tecnológicas, a plataforma providenciou uma solução completa que não só substitui, como melhora várias ferramentas fragmentadas utilizadas atualmente pelos jogadores de e-sports.
