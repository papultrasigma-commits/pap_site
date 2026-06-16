# Valorant Team Manager

**Projeto desenvolvido por Francisco Daniel Rebelo Filipe no âmbito da PAP (Prova de Aptidão Profissional) 2025/2026.**

O **Valorant Team Manager** é uma plataforma inovadora projetada especificamente para jogadores de Valorant que procuram criar, gerir e evoluir equipas de forma profissional. Numa comunidade altamente competitiva, faltam ferramentas que agreguem tudo num só lugar. Este projeto resolve esse problema.

---

## 🚀 Visão Geral e Diferenciação

O que distingue o **Valorant Team Manager** de outros sites ou Discord bots é a sua **abordagem All-In-One** com foco na imersão e gestão tática.

A maioria dos sites de equipas (LFT - *Looking For Team*) foca-se apenas na vertente de anúncios e recrutamento. Este projeto eleva esse conceito, integrando:

1. **Gestão LFT Avançada e Negociações:** Um sistema onde jogadores procuram equipas e equipas recrutam jogadores, com pedidos e aprovações (Negociações).
2. **Integração Real com a Riot Games:** Em vez de os jogadores inserirem os ranks manualmente, a plataforma busca dados em **tempo real** usando a API HenrikDev. O perfil do utilizador exibe o Riot ID, tag, rank atualizado, e estatísticas precisas, prevenindo perfis falsos.
3. **Quadro Tático Interativo (A Joia da Coroa):** O grande destaque do projeto! As equipas não precisam de recorrer a ferramentas externas como o ValoPlant. O site possui um quadro interativo com os mapas reais onde é possível, usando *Drag & Drop*, arrastar ícones das habilidades dos agentes em cima dos mapas. Permite desenhar estratégias em tempo real, guardá-las e partilhá-las no chat da equipa ou no feed público.
4. **Rede Social e Comunidade (Feed):** Um feed público onde os utilizadores podem partilhar jogadas (vídeos/imagens), anúncios de recrutamento, ou debater estratégias, com sistemas de likes e comentários.
5. **Sistema de Moderação Completo:** Os administradores recebem notificações sobre denúncias e têm o poder de avaliar e banir utilizadores que não respeitem as regras, mantendo a comunidade saudável e focada no jogo.

---

## 🛠️ Arquitetura e Backend: Como tudo funciona

O bom funcionamento do **Valorant Team Manager** apoia-se em tecnologias modernas e robustas, garantindo segurança e desempenho.

### Frontend: React + Vite + Tailwind CSS
- **React & Vite:** Proporcionam uma experiência de navegação super rápida (*Single Page Application*), sem reloads, fundamental para a interatividade do Quadro Tático.
- **Tailwind CSS:** Garante uma interface moderna, responsiva, escura e com estética gaming (inspirada no próprio Valorant), proporcionando um UI/UX de alta qualidade.

### Backend & Base de Dados: Supabase
O [Supabase](https://supabase.com/) atua como o coração do backend:
- **Autenticação:** Gere o registo e login dos utilizadores de forma extremamente segura (passwords encriptadas), gerindo sessões via Tokens (sem a necessidade de o programador gerir os tokens manualmente no LocalStorage de forma insegura).
- **PostgreSQL Database:** Uma base de dados relacional e escalável onde se encontram tabelas como `profiles`, `teams`, `team_members`, `feed_posts`, `reports`, e `saved_strategies`.
- **Storage:** Usado para guardar imagens partilhadas no Feed, logotipos das equipas, e os "prints" automáticos gerados pelo Quadro Tático.
- **Row Level Security (RLS):** Garante que apenas os líderes da equipa podem aceitar pedidos, e que os chats das equipas são estritamente privados para os membros.

### API de Dados (Third-Party): HenrikDev API e Valorant API
- **HenrikDev API:** Essencial para validar o *Riot_puuid*, impedindo que duas contas partilhem a mesma conta do Valorant, e para buscar o rank oficial (*Iron*, *Radiant*, etc.) em tempo real, sempre que o perfil é aberto.
- **Valorant API Oficial (Comunitária):** Usada na página `/strategies` para fazer fetch dinâmico dos ícones dos Agentes e das suas habilidades diretamente dos servidores da Riot, garantindo que se um agente novo sair hoje, ele aparece automaticamente no Quadro Tático.

---

## 💻 Exemplos de Código

Um projeto técnico complexo requer lógica bem estruturada. Abaixo estão alguns exemplos que demonstram o trabalho desenvolvido.

### 1. Sistema de "Drag & Drop" e Fetch de Agentes (Quadro Tático)

Este trecho demonstra como a aplicação vai buscar os agentes atualizados à API e os prepara para o Drag & Drop no Quadro Tático.

```javascript
// src/pages/Strategies.jsx
useEffect(() => {
  // Fetch dinâmico dos agentes diretamente da Valorant API
  fetch("https://valorant-api.com/v1/agents?isPlayableCharacter=true")
    .then((res) => res.json())
    .then((data) => {
      const fetchedAgents = {};
      data.data.forEach((agent) => {
        const name = agent.displayName.replace("/", "");
        const abs = {};
        const hudKeys = ["C", "Q", "E", "X"];
        let keyIdx = 0;

        // Mapeia os ícones das habilidades para as teclas corretas
        agent.abilities.forEach((ab) => {
          if (ab.slot === "Passive" || !ab.displayIcon) return;
          if (keyIdx < 4) { abs[hudKeys[keyIdx]] = ab.displayIcon; keyIdx++; }
        });
        fetchedAgents[name] = { icon: agent.displayIcon, abilities: abs };
      });
      setApiAgents(fetchedAgents);
      setLoadingApi(false);
    });
}, []);
```

### 2. Pedidos para Entrar na Equipa (LFT e Negociações)

O sistema previne que um jogador entre diretamente na equipa. Ele cria um `team_request` com estado pendente, que o líder terá de aprovar.

```javascript
// src/pages/FindTeam.jsx
const joinTeam = async (teamId) => {
  const uid = userRes?.user?.id;

  // 1. Verifica se já existe um pedido pendente para não haver spam
  const { data: existingReq } = await supabase
    .from("team_requests")
    .select("id")
    .eq("team_id", teamId)
    .eq("user_id", uid)
    .maybeSingle();

  if (existingReq) {
    setErrorMsg("Já enviaste um pedido para esta equipa. Aguarda aprovação.");
    return;
  }

  // 2. Insere o pedido na base de dados
  const { error } = await supabase
    .from("team_requests")
    .insert({ team_id: teamId, user_id: uid, status: "pending" });

  if (error) {
    setErrorMsg(`Erro ao enviar pedido: ${error.message}`);
    return;
  }
  alert("Pedido enviado com sucesso! O líder da equipa foi notificado.");
};
```

---

## 🏃 Como Executar o Projeto Localmente

Para testar e avaliar a aplicação localmente no teu computador, segue estes passos:

1. **Clonar o Repositório ou Abrir a Pasta**
   Abre a pasta raiz do projeto no teu terminal (ex: Visual Studio Code).

2. **Instalar Dependências**
   Este comando vai ler o `package.json` e instalar tudo o que é necessário (React, Tailwind, Supabase, TensorFlow, etc).
   ```bash
   npm install
   ```
   *(Nota: Caso existam conflitos devido a dependências legacy do TensorFlow, foi utilizado o comando `npm install @tensorflow-models/toxicity --legacy-peer-deps` durante o desenvolvimento.)*

3. **Configurar as Variáveis de Ambiente**
   Certifica-te de que o ficheiro `.env` na raiz do projeto contém as chaves de ligação ao Supabase:
   ```env
   VITE_SUPABASE_URL=https://[teu-url-do-supabase].supabase.co
   VITE_SUPABASE_ANON_KEY=[tua-anon-key]
   ```

4. **Correr o Servidor de Desenvolvimento**
   Inicia a aplicação localmente.
   ```bash
   npm run dev
   ```
   Depois de correr, clica no link gerado no terminal (ex: `http://localhost:5173/`) para abrir a plataforma no teu navegador.

---

### Notas Finais para o Júri

Este projeto foi desenvolvido com atenção ao detalhe, resolvendo problemas complexos como a gestão de estados da interface gráfica de Canvas, chamadas a múltiplas APIs assíncronas, e a criação de uma arquitetura relacional segura na Base de Dados. O objetivo foi criar uma aplicação que poderia facilmente ser utilizada por centenas de jogadores reais de Valorant no seu dia a dia.
