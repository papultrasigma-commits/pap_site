# Relatório Completo de Prova de Aptidão Profissional (PAP)

**Projeto:** Valorant Team Manager (Valorant Nexus)
**Autor:** Francisco Daniel Rebel
**Ano Letivo:** 2025/2026

---

## Índice Analítico e Estrutural

1. [Resumo Executivo do Projeto](#1-resumo-executivo-do-projeto)
2. [Introdução, Contextualização e Problemática](#2-introdução-contextualização-e-problemática)
3. [Metodologia de Desenvolvimento e Planeamento](#3-metodologia-de-desenvolvimento-e-planeamento)
4. [Justificação das Escolhas Tecnológicas (A Arquitetura)](#4-justificação-das-escolhas-tecnológicas-a-arquitetura)
   - [A perspetiva do Cliente (Frontend)](#a-perspetiva-do-cliente-frontend)
   - [A perspetiva do Servidor (Backend)](#a-perspetiva-do-servidor-backend)
5. [Análise Exhaustiva de Requisitos e Funcionalidades](#5-análise-exhaustiva-de-requisitos-e-funcionalidades)
   - [Perfil de Acesso: O Utilizador e o Líder](#perfil-de-acesso-o-utilizador-e-o-líder)
   - [Perfil de Acesso: A Entidade Administradora](#perfil-de-acesso-a-entidade-administradora)
6. [Mergulho Técnico I: O Quadro Tático e a Renderização Gráfica](#6-mergulho-técnico-i-o-quadro-tático-e-a-renderização-gráfica)
7. [Mergulho Técnico II: Inteligência Artificial e Moderação Neural](#7-mergulho-técnico-ii-inteligência-artificial-e-moderação-neural)
8. [Arquitetura de Ficheiros, Componentização e Clean Code](#8-arquitetura-de-ficheiros-componentização-e-clean-code)
9. [Modelo Relacional e Políticas de Segurança de Dados (RLS)](#9-modelo-relacional-e-políticas-de-segurança-de-dados-rls)
10. [Desafios de Implementação e Soluções Técnicas](#10-desafios-de-implementação-e-soluções-técnicas)
11. [Guia de Implementação e Compilação em Ambiente Local](#11-guia-de-implementação-e-compilação-em-ambiente-local)
12. [Perspetivas Futuras de Expansão (Roadmap)](#12-perspetivas-futuras-de-expansão-roadmap)
13. [Conclusão Final](#13-conclusão-final)

---

## 1. Resumo Executivo do Projeto

O **Valorant Team Manager** (identificado no domínio público pelo codinome *Valorant Nexus*) não é apenas um website. Trata-se de uma *Web Application* (Aplicação Web) construída com rigor técnico e focada num nicho em franca expansão: os **eSports** (Desportos Eletrónicos). Mais especificamente, este projeto pretende atuar como a principal plataforma de gestão de recursos humanos e logísticos para as equipas competitivas de *Valorant*, um jogo que conta com milhões de jogadores diários sob a alçada da Riot Games.

Durante a concepção desta **Prova de Aptidão Profissional (PAP)**, a preocupação primordial foi não criar um protótipo oco, mas sim uma ferramenta pronta a ser lançada num ambiente de produção real (deploy). O projeto encapsula um fórum em formato de rede social hiperdinâmica, mecanismos rígidos de verificação de identidade através da integração com APIs, e uma ferramenta de desenho computacional em tempo real (*Canvas*), elevando as exigências ao nível de plataformas corporativas modernas.

---

## 2. Introdução, Contextualização e Problemática

### O Paradigma Atual dos eSports Amadores
No cenário competitivo de Valorant, o acesso a ferramentas profissionais é restrito a organizações detentoras de elevado capital. Quando cinco amigos ou aspirantes a jogadores profissionais decidem formar uma equipa, o processo que enfrentam é caótico, fragmentado e altamente suscetível a fraudes. A problemática atual resume-se aos seguintes pontos:
- **Recrutamento cego:** A procura de jogadores (LFT - *Looking For Team*) faz-se em servidores comunitários do Discord. Não há qualquer prova de que as informações dadas por um jogador (Rank, KD Ratio, Win Rate) são verídicas.
- **Ferramentas Táticas limitadas:** Sites como o ValoPlant existem, mas exigem registos separados e exportações incómodas.
- **Isolamento de Redes Sociais:** Partilhar um vídeo de uma jogada (clip) é algo feito no Twitter/X, um meio disperso que não congrega os jogadores num núcleo focado apenas no jogo.

### A Missão do "Valorant Team Manager"
Este projeto nasce para suprimir todas estas lacunas. Através da implementação de uma arquitetura centralizada ("All-In-One"), a plataforma absorve:
1. **A Função de Autenticidade (Anti-Fraude):** Um utilizador é obrigado a emparelhar a sua conta oficial da Riot Games. Ninguém consegue falsificar um rank, pois os dados vêm de uma API restrita do servidor original do jogo.
2. **A Função Organizacional:** As equipas gerem as candidaturas, organizam o seu plantel (Roster), estipulam regras, trocam mensagens cifradas e marcam partidas treinos (Scrims) no mesmo local.
3. **A Função Criativa:** O já mencionado sistema de Quadro Tático incorporado garante a preparação estratégica antes dos jogos de forma nativa.

---

## 3. Metodologia de Desenvolvimento e Planeamento

A abordagem ao desenvolvimento deste projeto distanciou-se do amadorismo clássico, adotando uma postura enraizada nas metodologias ágeis (semelhante a **Scrum / Kanban**):
1. **Fase de Planeamento e Requisitos (Requirement Gathering):** Listagem de todas as tabelas necessárias e definição da identidade visual da aplicação (*Wireframing* mental). A paleta de cores (vermelho `#ff4655` e fundos muito escuros `#0f1112`) foi selecionada baseada na Psicologia das Cores da UI do próprio Valorant.
2. **Fase de Setup de Ambiente:** Configuração do Vite, inicialização do Tailwind e *Bootstrap* das chaves da Base de Dados na Cloud do Supabase.
3. **Desenvolvimento Iterativo (*Sprints*):**
   - A construção iniciou-se pela Camada de Autenticação.
   - Prosseguiu para o *Core* (Perfil Dinâmico e Fetch das APIs).
   - Culminou nos sistemas de elevado grau de complexidade (Moderação AI no Feed e Canvas API do Quadro Tático).
4. **Fase de Testes Unitários e Refatoração:** Correção de bugs de compatibilidade com *mobile*, compressão de imagens em *base64* e resolução de sobrecarga da rede durante o *fetch* recursivo das estatísticas de jogo.

---

## 4. Justificação das Escolhas Tecnológicas (A Arquitetura)

O alicerce tecnológico foi um dos maiores focos de deliberação deste projeto. Não se escolheu as linguagens mais fáceis, mas sim as mais adequadas ao mercado de trabalho atual de *Engenharia de Software*.

### A perspetiva do Cliente (Frontend)

- **React.js com Vite:** A necessidade de fluidez na transição de ecrãs dita o uso de uma SPA (*Single Page Application*). Porquê React em vez de puro HTML/JS? Porque o conceito de **Virtual DOM** que o React possui permite que, no Feed de publicações ou num chat em tempo real, os dados atualizem isoladamente, sem precisar que a página inteira faça *refresh*. O Vite age como empacotador (bundler), sendo exponencialmente mais rápido que ferramentas legadas como o *Create-React-App (Webpack)*.
- **Tailwind CSS vs CSS Tradicional:** O uso de estilos no ficheiro `.css` tornaria o projeto numa manta de retalhos impossível de manter em dezenas de componentes. O Tailwind introduz "Utility Classes". Escrever `<div className="flex flex-col items-center justify-between text-red-500">` previne bugs e acelera a criação da Interface de Utilizador (UI) brutalmente.
- **Modelos de IA Locais (TensorFlow.js):** Em vez de pagar centenas de euros num serviço como o *Amazon Rekognition* para avaliar as fotos no servidor, o modelo do Google *TensorFlow* foi executado do lado do cliente (no computador de quem usa o site), descentralizando o poder de processamento.
- **Lucide-React:** Uma biblioteca modular de ícones SVG. A grande vantagem é o facto do SVG ser carregado *inline* e com cores dinâmicas, reduzindo drasticamente o número de *Requests HTTP*.

### A perspetiva do Servidor (Backend)

- **Supabase (BaaS) sobre o Firebase:** O Firebase da Google usa um modelo de Base de Dados não relacional (*NoSQL*). Para um projeto de equipas, jogadores, amizades e táticas, é preciso **Relacionamento forte e rigoroso**. O Supabase usa debaixo do seu motor o famoso **PostgreSQL**, permitindo usar colunas com *Primary Keys*, *Foreign Keys* e restrições complexas (`ON DELETE CASCADE`), garantindo que a base de dados nunca ganha entropia ou erros de corrupção.
- **APIs RESTful (HenrikDev e Valorant API):** APIs cruciais para a ligação entre o projeto e a realidade do jogo. Para o Perfil de Jogador usa-se o protocolo JSON gerado pelo servidor da HenrikDev. O *frontend* consome esses objetos.

---

## 5. Análise Exhaustiva de Requisitos e Funcionalidades

O funcionamento da plataforma é segmentado mediante os perfis de utilizador, criando um sistema de privilégios e isolamento de rotas.

### Perfil de Acesso: O Utilizador e o Líder

- **O Motor de Busca Dinâmico (FindTeam):** Não é um mero bloco de texto. O LFT permite usar uma barra de pesquisa assíncrona, filtrando em tempo real através da clausula `ilike` do PostgreSQL todas as equipas. Em cada botão de equipa existe a lógica robusta de verificação: "Já existe um *Team Request* pendente de mim para esta equipa?". Isto mitiga ataques de *SPAM*.
- **Hub Estratégico e Chat Criptográfico:** Cada equipa possui a rota `/team`. Se o URL for falsificado por alguém externo (ex: `site.com/team/id_alheio`), a aplicação, aliada ao RLS da Base de Dados, barra a entrada devolvendo HTTP 403 (Forbidden). É dentro deste núcleo duro e restrito que o Chat em tempo real flui sem intermediários.
- **Estatísticas Caleidoscópicas:** No Perfil de Utilizador, o algoritmo analisa as últimas 10 partidas guardadas. O sistema calcula ativamente o KD (*Kill/Death Ratio*), a percentagem geométrica de *Headshots*, as vitórias/derrotas. Isto exige processamento matemático que distingue os adversários e os aliados consoante a equipa (`Red` ou `Blue`).

### Perfil de Acesso: A Entidade Administradora

A moderação é a chave para a sobrevivência de um produto online.
- A aplicação determina se o utilizador autenticado tem a coluna `is_admin = true`. Se sim, renderizam-se escudos e novos botões por cima da UI original.
- **Painel Judiciário (Reports Dashboard):** O administrador revê as denúncias num ecossistema fechado. Caso aprove uma denúncia, o infrator é automaticamente impedido de aceder à plataforma e o seu conteúdo pode ser expurgado do banco de dados relacional.
- Trata-se de uma verdadeira ferramenta de mitigação e gestão de crise, assegurando que, perante utilizadores ofensivos, a estabilidade orgânica do site não fica prejudicada.

---

## 6. Mergulho Técnico I: O Quadro Tático e a Renderização Gráfica

A secção que engloba as táticas (`Strategies.jsx`) é o apogeu técnico deste projeto, merecendo um exame minucioso e denso sobre o seu funcionamento e arquitetura técnica.

**1. Dinamismo Inicial (A Geração de Inventário):**
Ao abrir a página, a aplicação não tem agentes guardados localmente de forma estática, o que significaria atualizar o código cada vez que um novo agente fosse lançado pela Riot Games. Em vez disso, invoca os Servidores da API oficial:
```javascript
// Exemplo arquitetural do Request:
useEffect(() => {
  fetch("https://valorant-api.com/v1/agents?isPlayableCharacter=true")
    .then((res) => res.json())
    .then((data) => {
      // Loop sobre 24+ agentes e agregação das suas 4 habilidades específicas.
      // O mapeamento constrói um Dicionário { "NomeDoAgente" : { icon: "url", abilities: {...} } }
    });
}, []);
```

**2. A Engine Gráfica Baseada em DOM e State:**
A representação das habilidades baseia-se num Array de `markers`.
Quando a Habilidade (ex: Paranoia da *Reyna*) sofre um evento *Drag & Drop*, as coordenadas `X` e `Y` do rato são traduzidas percentualmente para o recipiente da imagem. Isso é imperativo num mundo onde há dezenas de resoluções de monitor: `(X / Width) * 100`.
Mesmo que um utilizador redimensione o seu browser, a habilidade vai estar precisamente na entrada do mapa "Ascent" ou "Bind".

**3. O Desenho a Lápis (O Elemento `<canvas>`):**
Enquanto o DOM trata os Ícones através do CSS `position: absolute`, o desenho das setas acontece internamente dentro da Tag de HTML5 `<canvas>`.
Existem três eventos fulcrais:
- `onMouseDown`: Indica o início do "trasso" e capta a origem `(X0, Y0)`.
- `onMouseMove`: O `CanvasRenderingContext2D` é chamado. O sistema dita `ctx.lineTo(x, y)` e depois `ctx.stroke()`, atualizando à velocidade do rácio de refrescamento do ecrã do utilizador (muitas vezes a 144Hz ou 60Hz).
- O contexto tem a cor ditada por qual é a "Equipa" atual (Aliados com cor Azul Cyan e Inimigos com Vermelho Carmesim).

**4. Conversão e Snapshot:**
Como transportar este ambiente tático em mutação constante num objeto partilhável nas redes sociais do projeto? Usando o **HTML2Canvas**. Este pequeno milagre da engenharia lê o CSS e a hierarquia do DOM por detrás da cortina, pinta tudo num `Blob` codificado em base64 e guarda a imagem comprimida.

---

## 7. Mergulho Técnico II: Inteligência Artificial e Moderação Neural

Na página `/feed`, foi incluído o `nsfwjs` e os modelos primordiais do `TensorFlow`.
Numa era digital complexa, depender exclusivamente de moderadores humanos não é viável. A aplicação impõe um bloqueio a nível da Máquina de Estados.

**O Algoritmo de Execução do Filtro AI:**

Quando o utilizador faz *upload* de uma fotografia, por exemplo, a interface parece estar apenas a aguardar e a mostrar a mensagem "A Analisar IA...". Mas nos bastidores:
```javascript
const isContentInappropriate = async (predictions) => {
  // A 'predictions' é um array devolvido pela IA com probabilidades probabilísticas entre 0 e 1.
  const inappropriate = predictions.find((p) => {
    // Classes de classificação neural do modelo padrão:
    if (p.className === "Porn" || p.className === "Hentai") {
      return p.probability > 0.01; // Restrição Severa, "Tolerância Zero"
    }
    if (p.className === "Sexy") {
      return p.probability > 0.75; // Permite uma pequena tolerância caso o modelo confunda um personagem do jogo com algo sugestivo
    }
    return false;
  });
  return inappropriate !== undefined;
};
```
Esta filtragem ocorre de forma **Assíncrona e Totalmente Local**. O Servidor da Base de Dados (Supabase) não incorre em gastos computacionais nem largura de banda porque a análise acontece unicamente com o processador gráfico do aparelho que está a carregar o Website. Se for um *vídeo (.mp4)*, o script invoca dinamicamente fotogramas aleatórios na calha do tempo (ex: a meio do vídeo) e executa o *TensorFlow* em cima desses fotogramas gerados secretamente num `<canvas>` com `display: none`. O bloqueio é absoluto e imutável.

Adicionalmente, existe um RegEx (Expressões Regulares) que atua como uma barreira de segurança gramatical contra insultos graves e links hostis (`/([a-z0-9-]+\.(com|net|org|xxx|porn))/g`).

---

## 8. Arquitetura de Ficheiros, Componentização e Clean Code

Um aspeto sublinhado durante todo o projeto foi a adesão aos princípios do **Clean Code** e a Arquitetura de Componentes Funcionais do React.

A arvore do repositório reflete as preocupações em garantir uma alta manutenabilidade do *software*:
```text
pap_site-main/
│
├── public/                 # Contém Assets imutáveis diretamente injetados (Favicons)
├── src/                    # Raiz do ambiente produtivo
│   ├── assets/             # Imagens vetoriais nativas
│   ├── components/         # Blocos independentes e exportáveis (PostCards, AuthGates)
│   ├── i18n/               # Arquitetura de Internacionalização e Traduções (Language Contexts)
│   ├── pages/              # Unidades Macro (As "Views" propriamente ditas)
│   │   ├── Login.jsx       # Interface modular de entrada.
│   │   ├── Profile.jsx     # Complexa compilação matemática das estatísticas
│   │   ├── Feed.jsx        # Lógica Social, IA, Tratamento de Media Player nativo
│   │   ├── Strategies.jsx  # Complexo gráfico e manipulativo do Canvas
│   │   └── Team.jsx        # Dashboard interna do Roster
│   ├── supabaseClient.js   # Wrapper da ligação via API Keys
│   ├── App.jsx             # Árvore de Decisão Rotacional (O React Router)
│   ├── index.css           # Repositório principal de injeção de classes do Tailwind
│   └── main.jsx            # Bootstrapper Global do Virtual DOM do React
│
├── .env                    # Variáveis Ambientais encriptadas e isoladas
├── package.json            # Gestor massivo de bibliotecas NPM e scripts vitais (dev, build)
└── tailwind.config.js      # Manipulação da estética global
```

A Componentização permite, por exemplo, que o ficheiro `PostCard`, responsável por criar a identidade visual e as funções interativas (Like, Apagar, Denunciar, Mostrar Media) de uma só publicação, seja um bloco atómico isolado que é reciclado (reutilizado) por todo o ecossistema (seja no `/feed` onde são listadas todas as publicações comunitárias, seja no `/profile` onde apenas se listam as publicações de um único indivíduo).

---

## 9. Modelo Relacional e Políticas de Segurança de Dados (RLS)

O motor que torna este ecossistema seguro reside no PostgreSQL encapsulado no *Supabase*.

**Relacionamentos Vitais do Sistema (Foreign Keys):**
A integridade da base de dados encontra-se protegida pelas amarras das Chaves Estrangeiras (*Foreign Keys*). Na base, tudo assenta na Tabela **`profiles`**. Qualquer outro objeto dentro do Universo da Aplicação, como uma Equipa (`teams`), uma Publicação (`feed_posts`) ou um Pedido (`team_requests`), está rigidamente colado ao `id` da tabela primária `profiles`.
A aplicação faz grande usufruto da norma `ON DELETE CASCADE`. Esta função relacional assegura que caso o Administrador apague de facto o perfil central de um indivíduo infrator, as tabelas subjacentes expurgam em cadeia tudo o que ele detinha: publicações, comentários, convites pendentes e os *likes* fantasmas. A aplicação previne "Orphan Data" (Dados Órfãos).

**Políticas Row Level Security (RLS):**
Não basta não mostrar um botão a um utilizador para o proteger de *Hackers*. Alguém no painel de ferramentas de desenvolvimento do *Browser* (F12) podia, teoricamente, intercetar a rota e mandar um pedido `DELETE` forçado usando as suas próprias ferramentas. O Supabase responde ativando as `RLS` (Políticas a Nível de Linha). O Servidor verifica em tempo real os *Tokens*: "A pessoa que está a fazer esta chamada de deleção é a pessoa cujo `id` pertence de facto a este Post?". Se o `auth.uid()` falhar a equivalência, a transação devolve um erro grave de servidor, assegurando uma intransponível muralha protetora na aplicação.

---

## 10. Desafios de Implementação e Soluções Técnicas

Durante os meses de concretização da prova de aptidão, múltiplos desafios testaram os limites tecnológicos, sendo os principais:

1. **A Assincronidade da Riot Games API e HenrikDev API:**
   * **Desafio:** Quando o sistema solicita as estatísticas das partidas recentes para determinar o Win Rate e o K/D de um jogador, a resposta da API pode vir num formato denso com dezenas de jogadores ou estruturado de modos estranhos (equipas nomeadas `Blue`, `Red`, ou `Attackers`).
   * **Solução:** Foi escrita uma função de normalização gigantesca (`fetchValorantData`) no ficheiro do perfil que executa o `parsing` inteligente das respostas numéricas do JSON, transformando *IDs* criptografados em *Strings* padronizadas, extraindo e cruzando quem é quem em cada partida com base no `PUUID`.

2. **O Pesadelo da Instalação do TensorFlow com NPM:**
   * **Desafio:** As versões mais recentes do React e de dezenas de bibliotecas utilitárias têm discrepâncias imensas com as pacotizações obsoletas da máquina de IA do Google (TensorFlow / nsfwjs). As tentativas normais de `npm install` esbarravam num bloqueio por conflito de versões nativas (*Peer Dependency Errors*).
   * **Solução:** Aprofundamento no ecossistema Node e imposição rígida do *flag* de compatibilidade `--legacy-peer-deps` aquando a importação das estruturas do `@tensorflow-models/toxicity`, garantindo estabilidade funcional sem a perca de atributos.

3. **Performance Limitada das Imagens Base64:**
   * **Desafio:** Guardar imagens inteiras geradas do HTML2Canvas convertidas em cadeias gigantescas de Base64 num banco de dados Relacional iria eventualmente quebrar o Postgres, sobrelotando o motor.
   * **Solução:** O snapshot é comprimido na perfeição na forma de um ficheiro `Blob` digital de formato JPG em máxima compactação (`image/jpeg, 1.0`). O Blob sofre *Upload* para a nuvem de *Storage* (Amazon S3 bucket do Supabase). Só então o URL hipercurto (texto) é devolvido e alocado de forma ínfima à linha de *Database* correspondente na rede social.

---

## 11. Guia de Implementação e Compilação em Ambiente Local

Para avaliação rigorosa por parte do Júri da Prova de Aptidão ou para integração e continuação por *Developers*, os passos de clonagem e compilação do ecossistema são rígidos e vitais.

**Pré-Condições Iniciais:**
A máquina de compilação deverá conter `Git` pré-configurado e, fundamentalmente, o ecossistema Javascript `Node.js` (Versão 18 LTS ou mais avançada), e um pacote `npm` saudável. Será necessária também a criação integral de uma Instância própria alojada nos serviços remotos da `Supabase.com`.

**Instruções no Terminal/Consola de Comandos:**

**Etapa I:** Apropriação do Repositório:
```bash
git clone <URL_DO_GITHUB>
cd pap_site-main
```

**Etapa II:** Compilação Estrutural das Dependências:
```bash
# Inicia a cópia integral das árvores do package.json para os Node Modules
npm install

# Instalação forçada e especializada da suíte de Inteligência Artificial Google
npm install @tensorflow/tfjs nsfwjs
npm install @tensorflow-models/toxicity --legacy-peer-deps
```

**Etapa III:** Vínculo de Segurança (Variáveis Protegidas):
A aplicação encontra-se inerte até a injeção do cordão umbilical da nuvem (As Chaves de Ligação). No interior primário da pasta, crie a âncora digital `.env`. Relembrando as normas rigorosas de Cibersegurança: o ficheiro não tem nome, apenas extensão:
```env
# Insira os elos obtidos na sua configuração Cloud Supabase
VITE_SUPABASE_URL=https://<referencia-alfanumerica-do-teu-projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=<chave-criptografica-json-web-token-muito-longa>
```

**Etapa IV:** Ignição do Motor de Desenvolvimento Vite:
```bash
npm run dev
```
O *CLI* (Command Line Interface) reportará o sucesso alocando o website ao endereço virtual padrão de compilação do Vite. Pressionar `http://localhost:5173/` mergulhará imediatamente o utilizador no Universo eSports do projeto.

---

## 12. Perspetivas Futuras de Expansão (Roadmap)

Embora as metas do âmbito educacional de formação profissional tenham sido alcançadas e plenamente excedidas, este sistema retém espaço de arquitetura evolutiva para ser explorado.
Como visão futura, a plataforma pode vir a abranger:
- **Ferramenta de Sorteio de Torneios Assíncronos:** Um painel onde vários Líderes de Equipa ativam o modo de Sorteio Automático e a aplicação preenche com recurso a lógicas de escalonamento árvores de disputa (Brackets) estilo Chaveamento Eliminatório.
- **Micro-Transações Estéticas (V-Shop):** Possibilidade de os utilizadores alterarem a interface do seu próprio Perfil usando uma moeda fictícia da plataforma adquirida à medida que atingem maior nível de fama e *followers* no feed.
- **Portabilidade para Múltiplos Títulos eSports:** Reutilização total da infraestrutura backend, alterando os componentes do frontend para incorporar outros jogos competitivos em larga escala como "Counter-Strike 2" ou "League of Legends".

---

## 13. Conclusão Final

A edificação do **Valorant Team Manager** encapsulou todos os conhecimentos das engenharias informáticas associadas ao desenvolvimento moderno no ecossistema Web. Passou-se pelas provações matemáticas necessárias em estruturas computacionais complexas como os motores de busca e desenho de Canvas; cruzou-se por disciplinas exaustivas e lógicas das estruturas de Bases de Dados e de Redes Cliente-Servidor na cloud; implementou-se arquiteturas robustas em Autenticação Segura JWT e superou-se as barreiras atuais associadas ao enquadramento das potências da Inteligência Artificial em moldes funcionais.

Demonstrou-se assim que com a utilização dos pilares apropriados da tecnologia — um frontend robusto e responsivo (React e Tailwind) aliado a um backend sólido e resiliente (Supabase) — é possível estruturar e desenhar a partir do absoluto zero uma aplicação à prova de produção e plenamente funcional, com o condão genuíno de resolver uma problemática sentida diariamente numa vasta comunidade global de Gamers, atingindo a sua derradeira consolidação sob os rigores desta referida **Prova de Aptidão Profissional**.