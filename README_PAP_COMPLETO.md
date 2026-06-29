# Valorant Team Manager — Relatório Técnico de PAP

## Índice

1. [Resumo do projeto](#1-resumo-do-projeto)  
2. [Introdução e contextualização](#2-introdução-e-contextualização)  
3. [Objetivos do projeto](#3-objetivos-do-projeto)  
4. [Enquadramento tecnológico](#4-enquadramento-tecnológico)  
5. [Arquitetura geral da aplicação](#5-arquitetura-geral-da-aplicação)  
6. [Tecnologias utilizadas](#6-tecnologias-utilizadas)  
7. [Análise de requisitos](#7-análise-de-requisitos)  
8. [Funcionalidades principais](#8-funcionalidades-principais)  
9. [Perfil: Utilizador](#9-perfil-utilizador)  
10. [Perfil: Administrador](#10-perfil-administrador)  
11. [Funcionalidades que distinguem o projeto](#11-funcionalidades-que-distinguem-o-projeto)  
12. [Inovações tecnológicas](#12-inovações-tecnológicas)  
13. [Moderação automática e segurança da comunidade](#13-moderação-automática-e-segurança-da-comunidade)  
14. [Backend e responsabilidades de cada módulo](#14-backend-e-responsabilidades-de-cada-módulo)  
15. [Implementação e estrutura da base de dados](#15-implementação-e-estrutura-da-base-de-dados)  
16. [Arquitetura de ficheiros e padrões de implementação](#16-arquitetura-de-ficheiros-e-padrões-de-implementação)  
17. [Exemplos de código relevantes](#17-exemplos-de-código-relevantes)  
18. [Guia de configuração local](#18-guia-de-configuração-local)  
19. [Deploy e ambiente de produção](#19-deploy-e-ambiente-de-produção)  
20. [Testes, validação e manutenção](#20-testes-validação-e-manutenção)  
21. [Limitações e melhorias futuras](#21-limitações-e-melhorias-futuras)  
22. [Conclusão](#22-conclusão)

---

## 1. Resumo do projeto

O **Valorant Team Manager** é uma plataforma web desenvolvida no âmbito da Prova de Aptidão Profissional, com o objetivo de apoiar jogadores de **Valorant** na criação, organização e gestão de equipas competitivas.

A aplicação permite que utilizadores criem perfis, associem a sua conta Riot/Valorant, formem equipas, recrutem jogadores, procurem scrims, comuniquem através de chats internos, publiquem conteúdos no feed da comunidade, participem em torneios, consultem notificações e interajam com outros membros da plataforma.

Além das funcionalidades comuns de uma rede social ou sistema de equipas, o projeto inclui componentes mais avançados, como:

- Sistema de autenticação e recuperação de palavra-passe.
- Gestão de equipas com cargos e permissões.
- Sistema de convites e pedidos de entrada.
- Chat de equipa e chat associado a scrims.
- Feed da comunidade com gostos, comentários e denúncias.
- Moderação automática de linguagem inadequada.
- Painel de administração para gestão de denúncias e utilizadores.
- Integração com API externa relacionada com dados de Valorant.
- Organização de torneios e participantes.
- Sistema de honra/reputação para incentivar comportamento positivo.

O projeto foi desenvolvido com uma arquitetura moderna, usando **React**, **Vite**, **Tailwind CSS**, **Supabase** e **Vercel**, garantindo uma aplicação rápida, responsiva, escalável e de fácil manutenção.

---

## 2. Introdução e contextualização

O Valorant é um jogo competitivo em equipa, onde a comunicação, organização e coordenação entre jogadores são fundamentais. Apesar de existirem várias plataformas relacionadas com estatísticas ou matchmaking, muitas delas focam-se apenas em dados individuais ou rankings, deixando de lado a componente de **gestão de equipas amadoras, semi-competitivas e comunidades pequenas**.

Este projeto surge para responder a essa necessidade. A ideia principal é criar uma plataforma onde jogadores possam não só mostrar o seu perfil, mas também:

- Encontrar equipas.
- Criar equipas.
- Recrutar jogadores.
- Organizar treinos.
- Marcar scrims.
- Comunicar com a equipa.
- Publicar clips e atualizações.
- Gerir torneios.
- Denunciar comportamentos inadequados.
- Construir uma reputação dentro da comunidade.

Desta forma, o projeto aproxima-se de uma plataforma de gestão competitiva, combinando funcionalidades de rede social, painel administrativo, sistema de equipas e ferramentas de organização.

---

## 3. Objetivos do projeto

### 3.1 Objetivo geral

Desenvolver uma aplicação web funcional e moderna que permita a jogadores de Valorant gerir a sua presença competitiva, criar ou encontrar equipas, comunicar com outros utilizadores e participar numa comunidade organizada.

### 3.2 Objetivos específicos

Os principais objetivos definidos para o projeto foram:

- Criar uma interface intuitiva e responsiva.
- Implementar autenticação segura de utilizadores.
- Permitir recuperação de palavra-passe.
- Guardar dados de utilizadores numa base de dados online.
- Criar um sistema de perfis com informações relevantes.
- Permitir associação de conta Riot/Valorant.
- Desenvolver criação e gestão de equipas.
- Implementar permissões de capitão, vice-capitão e membro.
- Criar sistema de convites, pedidos de equipa e notificações.
- Criar sistema de chat interno.
- Criar sistema de scrims entre equipas.
- Criar feed social com publicações, comentários e gostos.
- Implementar denúncias de conteúdo.
- Criar área administrativa para moderação.
- Criar sistema de torneios.
- Garantir deploy online através da Vercel.
- Utilizar Supabase como backend principal.
- Demonstrar domínio técnico de frontend, backend, autenticação, base de dados e deploy.

---

## 4. Enquadramento tecnológico

A aplicação foi desenvolvida com base numa arquitetura moderna de aplicações web, conhecida como **SPA — Single Page Application**. Neste modelo, a aplicação carrega uma única página principal e a navegação interna é feita dinamicamente através do React Router, sem necessidade de recarregar completamente o site.

O backend foi implementado com recurso ao **Supabase**, uma plataforma Backend-as-a-Service que fornece autenticação, base de dados PostgreSQL, políticas de segurança e funcionalidades em tempo real.

A aplicação encontra-se preparada para produção através da **Vercel**, uma plataforma de alojamento focada em aplicações frontend modernas, especialmente projetos React e Vite.

---

## 5. Arquitetura geral da aplicação

A arquitetura do projeto está dividida em três camadas principais:

### 5.1 Frontend

O frontend é responsável por toda a interface visual e interação com o utilizador. Foi desenvolvido com React e Tailwind CSS.

Responsabilidades do frontend:

- Renderizar páginas e componentes.
- Gerir estados da interface.
- Controlar rotas da aplicação.
- Comunicar com o Supabase.
- Apresentar mensagens de erro e sucesso.
- Validar formulários.
- Controlar permissões visuais com base no tipo de utilizador.
- Mostrar dados em tempo real ou quase real.

### 5.2 Backend

O backend é fornecido principalmente pelo Supabase.

Responsabilidades do backend:

- Autenticação de utilizadores.
- Armazenamento de dados.
- Gestão de sessões.
- Recuperação de palavra-passe.
- Segurança por tabelas e permissões.
- Suporte a dados relacionais.
- Suporte a funcionalidades em tempo real para chats.

### 5.3 Serviços externos

A aplicação também pode comunicar com APIs externas, como a API HenrikDev, para obter informações relacionadas com contas Riot/Valorant, como nome, tag, rank ou estatísticas.

Responsabilidades dos serviços externos:

- Obter dados públicos da conta Valorant.
- Validar ou complementar informações do perfil.
- Enriquecer o perfil do utilizador com dados reais do jogo.

---

## 6. Tecnologias utilizadas

### 6.1 React

React foi utilizado para construir a interface da aplicação através de componentes reutilizáveis.

Vantagens:

- Código organizado por componentes.
- Fácil manutenção.
- Atualização dinâmica da interface.
- Boa integração com bibliotecas modernas.
- Grande comunidade e documentação.

### 6.2 Vite

Vite foi utilizado como ferramenta de build e desenvolvimento.

Vantagens:

- Arranque rápido do projeto.
- Hot reload eficiente.
- Build otimizada para produção.
- Configuração simples.

### 6.3 Tailwind CSS

Tailwind CSS foi utilizado para estilização da interface.

Vantagens:

- Desenvolvimento rápido de interfaces.
- Design consistente.
- Fácil adaptação a diferentes ecrãs.
- Redução de ficheiros CSS grandes.
- Maior controlo visual diretamente nos componentes.

### 6.4 Supabase

Supabase foi utilizado como backend principal.

Funcionalidades usadas:

- Autenticação.
- Gestão de sessões.
- Base de dados PostgreSQL.
- Tabelas relacionais.
- Políticas de segurança.
- Possibilidade de realtime em chats.
- Recuperação de palavra-passe.

### 6.5 React Router

React Router foi utilizado para controlar a navegação interna da aplicação.

Exemplos de rotas:

- `/dashboard`
- `/team`
- `/find-team`
- `/feed`
- `/scrims`
- `/trainings`
- `/strategies`
- `/tournaments`
- `/notifications`
- `/chat`
- `/profile`
- `/settings`
- `/admin/reports`
- `/update-password`

### 6.6 Lucide React

Lucide React foi utilizado para ícones da interface.

Vantagens:

- Ícones modernos.
- Boa integração com React.
- Visual consistente.
- Leve e personalizável.

### 6.7 Vercel

Vercel foi utilizada para alojar a aplicação em produção.

Vantagens:

- Deploy rápido.
- Integração com GitHub.
- Suporte a projetos Vite.
- SSL automático.
- Atualização automática após push no repositório.

### 6.8 GitHub

GitHub foi utilizado como sistema de controlo de versões.

Responsabilidades:

- Guardar o código-fonte.
- Controlar alterações.
- Permitir rollback.
- Integrar com a Vercel.
- Demonstrar evolução do projeto.

---

## 7. Análise de requisitos

### 7.1 Requisitos funcionais

Os requisitos funcionais representam aquilo que a aplicação deve fazer.

Principais requisitos:

- O utilizador deve poder criar conta.
- O utilizador deve poder iniciar sessão.
- O utilizador deve poder recuperar a palavra-passe.
- O utilizador deve poder editar o seu perfil.
- O utilizador deve poder associar uma conta Valorant.
- O utilizador deve poder criar uma equipa.
- O utilizador deve poder procurar equipas.
- O utilizador deve poder enviar pedidos para entrar numa equipa.
- Capitães devem poder aceitar ou rejeitar pedidos.
- Capitães devem poder convidar jogadores.
- Membros de equipa devem poder comunicar por chat.
- Equipas devem poder procurar scrims.
- Utilizadores devem poder publicar no feed.
- Utilizadores devem poder comentar publicações.
- Utilizadores devem poder gostar de publicações.
- Utilizadores devem poder denunciar conteúdos.
- Administradores devem poder consultar denúncias.
- Administradores devem poder moderar utilizadores.
- Administradores devem poder aceder a funcionalidades exclusivas.
- O sistema deve mostrar notificações relevantes.
- O sistema deve proteger rotas privadas.

### 7.2 Requisitos não funcionais

Os requisitos não funcionais representam características de qualidade da aplicação.

Principais requisitos:

- Interface responsiva.
- Boa organização visual.
- Segurança na autenticação.
- Proteção de dados sensíveis.
- Tempo de carregamento reduzido.
- Código organizado e modular.
- Facilidade de manutenção.
- Compatibilidade com browsers modernos.
- Deploy estável.
- Escalabilidade para adicionar novas funcionalidades.

---

## 8. Funcionalidades principais

### 8.1 Autenticação

A aplicação possui sistema de autenticação baseado no Supabase Auth.

Funcionalidades:

- Registo de utilizador.
- Login.
- Logout.
- Sessão persistente.
- Recuperação de palavra-passe.
- Atualização de palavra-passe.
- Proteção de rotas privadas.

O sistema de recuperação de palavra-passe é especialmente importante, pois permite que o utilizador recupere o acesso à conta através de um link enviado por email.

### 8.2 Dashboard

O dashboard funciona como página inicial após o login.

Responsabilidades:

- Apresentar visão geral da conta.
- Dar acesso rápido às principais áreas.
- Mostrar informação relevante do utilizador.
- Centralizar a navegação da aplicação.

### 8.3 Perfil do utilizador

A página de perfil permite ao utilizador gerir a sua identidade dentro da plataforma.

Possíveis informações:

- Nome de utilizador.
- Conta Riot/Valorant.
- Equipa atual.
- Estatísticas associadas.
- Dados de reputação.
- Histórico ou informações competitivas.

### 8.4 Associação da conta Riot/Valorant

Uma das funcionalidades centrais é a possibilidade de associar uma conta Valorant.

Esta funcionalidade permite:

- Mostrar o nome da conta Riot.
- Obter informações externas da conta.
- Dar mais credibilidade ao perfil.
- Facilitar recrutamento com base em dados reais.

### 8.5 Criação de equipas

O utilizador pode criar uma equipa própria.

Dados associados:

- Nome da equipa.
- Região.
- Cor da equipa.
- Logótipo.
- Dono da equipa.
- Data de criação.

Após criar a equipa, o utilizador passa a ter permissões de gestão.

### 8.6 Gestão de membros

A aplicação suporta diferentes cargos dentro da equipa.

Exemplos:

- Owner / Capitão.
- Vice-capitão.
- Membro.

Cada cargo pode ter permissões diferentes, como aceitar pedidos, gerir convites ou controlar informações da equipa.

### 8.7 Procura de equipa

Utilizadores sem equipa podem procurar equipas existentes e enviar pedidos para entrar.

Esta funcionalidade resolve um problema comum em comunidades competitivas: encontrar jogadores ou equipas compatíveis.

### 8.8 Recrutamento de jogadores

Equipas podem procurar jogadores disponíveis para recrutamento.

Esta funcionalidade distingue o projeto de uma plataforma simples de perfis, pois cria um ambiente focado em organização competitiva.

### 8.9 Sistema de convites

O sistema permite que equipas convidem jogadores.

Funcionalidades:

- Envio de convite.
- Estado do convite.
- Aceitar convite.
- Rejeitar convite.
- Notificações associadas.

### 8.10 Notificações

O sistema de notificações informa o utilizador sobre eventos importantes.

Exemplos:

- Convites para equipa.
- Pedidos pendentes.
- Respostas a pedidos.
- Scrims pendentes.
- Atualizações relevantes.

### 8.11 Chat da equipa

Cada equipa pode ter um chat interno.

Objetivo:

- Melhorar comunicação.
- Organizar treinos.
- Combinar estratégias.
- Centralizar conversas da equipa.

### 8.12 Sistema de scrims

Scrims são jogos de treino entre equipas.

A aplicação permite:

- Criar scrims.
- Procurar scrims.
- Enviar pedidos.
- Gerir pedidos pendentes.
- Comunicar com outra equipa através de chat de scrim.

### 8.13 Treinos

A área de treinos serve para organizar sessões de prática.

Objetivos:

- Planear horários.
- Registar treinos.
- Apoiar a organização da equipa.
- Criar disciplina competitiva.

### 8.14 Estratégias

A área de estratégias permite guardar ou organizar táticas.

Pode incluir:

- Estratégias por mapa.
- Composições de agentes.
- Notas táticas.
- Planos de ataque e defesa.
- Exportação ou captura visual de estratégias, caso sejam usadas bibliotecas como `html2canvas`.

### 8.15 Feed da comunidade

O feed funciona como uma área social.

Funcionalidades:

- Criar publicações.
- Ver publicações de outros utilizadores.
- Gostar de publicações.
- Comentar.
- Denunciar conteúdo.
- Interagir com a comunidade.

### 8.16 Sistema de gostos

O sistema de gostos aumenta a interação social.

A tabela `feed_likes` permite registar quem gostou de determinada publicação, evitando duplicações e permitindo contagem de likes.

### 8.17 Sistema de comentários

Os comentários permitem conversas dentro das publicações.

A tabela `feed_comments` guarda os comentários associados a cada post.

### 8.18 Sistema de denúncias

Os utilizadores podem denunciar publicações ou comportamentos inadequados.

A denúncia é registada para posterior análise por administradores.

### 8.19 Painel de administração

Administradores têm acesso a áreas exclusivas, como moderação de denúncias.

Responsabilidades:

- Ver denúncias.
- Analisar publicações reportadas.
- Tomar decisões de moderação.
- Controlar comportamento da comunidade.
- Banir utilizadores, se necessário.

### 8.20 Torneios

A aplicação inclui uma área de torneios.

Funcionalidades possíveis:

- Criar torneios.
- Listar torneios.
- Registar participantes.
- Gerir inscrições.
- Consultar participantes.

### 8.21 Sistema de honra

O sistema de honra incentiva bom comportamento.

Objetivos:

- Valorizar jogadores respeitadores.
- Criar reputação positiva.
- Reduzir toxicidade.
- Ajudar equipas a escolher jogadores confiáveis.

---

## 9. Perfil: Utilizador

O utilizador comum é o principal tipo de conta da aplicação.

### 9.1 Permissões do utilizador

Um utilizador pode:

- Criar conta.
- Iniciar sessão.
- Recuperar palavra-passe.
- Editar perfil.
- Associar conta Riot.
- Criar equipa.
- Entrar numa equipa.
- Procurar equipas.
- Enviar pedidos.
- Receber convites.
- Publicar no feed.
- Comentar.
- Gostar de publicações.
- Denunciar conteúdos.
- Participar em chats.
- Procurar scrims.
- Participar em torneios.

### 9.2 Experiência do utilizador

A experiência foi pensada para ser direta e intuitiva. O menu lateral organiza as funcionalidades principais, permitindo ao utilizador navegar rapidamente entre as áreas da aplicação.

A interface usa ícones e nomes claros para facilitar a compreensão, mesmo para utilizadores com pouca experiência técnica.

---

## 10. Perfil: Administrador

O administrador possui permissões adicionais para garantir o bom funcionamento da plataforma.

### 10.1 Responsabilidades do administrador

O administrador pode:

- Aceder à área de moderação.
- Ver denúncias.
- Gerir reports.
- Analisar comportamento de utilizadores.
- Controlar conteúdo inadequado.
- Gerir áreas sensíveis da plataforma.
- Ter acesso a opções de gestão de torneios.
- Consultar feed da comunidade com perspetiva de moderação.

### 10.2 Importância do administrador

A presença de um administrador é essencial numa plataforma comunitária, pois garante:

- Segurança.
- Qualidade das interações.
- Redução de abuso.
- Cumprimento de regras.
- Ambiente mais saudável para jogadores.

---

## 11. Funcionalidades que distinguem o projeto

Este projeto distingue-se de outros sites de Valorant do mesmo género porque não se limita a mostrar estatísticas ou perfis. A aplicação combina várias áreas importantes numa única plataforma.

### 11.1 Foco em equipas

Muitos sites de Valorant focam-se apenas no jogador individual. Este projeto coloca a equipa no centro da experiência.

Inclui:

- Criação de equipas.
- Gestão de membros.
- Cargos internos.
- Convites.
- Pedidos de entrada.
- Chat de equipa.
- Treinos.
- Scrims.

### 11.2 Comunidade integrada

O feed cria uma camada social que permite aos jogadores interagir, publicar clips, comentar e dar gostos.

### 11.3 Sistema competitivo

A presença de scrims, torneios, treinos e estratégias transforma a plataforma numa ferramenta útil para preparação competitiva.

### 11.4 Moderação

O sistema de denúncias e a moderação automática tornam a plataforma mais segura.

### 11.5 Integração externa

A ligação à conta Valorant permite enriquecer os perfis com dados reais do jogo.

### 11.6 Sistema de honra

O sistema de honra diferencia a plataforma porque valoriza comportamento positivo, não apenas estatísticas.

---

## 12. Inovações tecnológicas

### 12.1 Backend-as-a-Service

O uso do Supabase permite criar um backend completo sem necessidade de desenvolver um servidor tradicional do zero.

Isto demonstra conhecimento moderno de desenvolvimento web, onde serviços cloud aceleram a criação de aplicações robustas.

### 12.2 Autenticação segura

O sistema de autenticação utiliza sessões, tokens e recuperação de palavra-passe.

### 12.3 Dados em tempo real

Algumas tabelas, como chats, podem utilizar funcionalidades realtime do Supabase, permitindo comunicação mais dinâmica.

Nas tabelas observadas, aparecem com realtime ativo:

- `team_chat_messages`
- `scrim_chat_messages`

Isto é importante para funcionalidades de chat, porque permite que novas mensagens apareçam de forma mais imediata.

### 12.4 Interface modular

A aplicação é dividida por páginas e componentes, facilitando manutenção e expansão.

### 12.5 Deploy moderno

A utilização da Vercel permite que o projeto esteja disponível online com atualizações automáticas a partir do GitHub.

---

## 13. Moderação automática e segurança da comunidade

A moderação automática é uma parte importante do projeto, pois uma plataforma comunitária precisa de mecanismos para reduzir comportamentos inadequados.

### 13.1 Objetivos da moderação automática

- Impedir linguagem extremamente ofensiva.
- Reduzir spam.
- Evitar conteúdo sexual explícito.
- Proteger utilizadores.
- Facilitar trabalho dos administradores.
- Manter ambiente adequado ao contexto escolar e competitivo.

### 13.2 Funcionamento geral

O sistema pode analisar texto antes de o guardar, verificando se contém palavras ou padrões proibidos.

Exemplo de fluxo:

1. Utilizador escreve uma mensagem ou publicação.
2. O frontend valida o conteúdo.
3. Se o conteúdo for aceitável, é enviado para a base de dados.
4. Se o conteúdo for proibido, o sistema bloqueia ou avisa.
5. Caso seja suspeito, pode permitir denúncia posterior.

### 13.3 Denúncias manuais

Mesmo com moderação automática, os utilizadores continuam a poder denunciar conteúdo.

Isto é importante porque nenhum filtro automático é perfeito.

### 13.4 Painel administrativo

As denúncias são encaminhadas para tabelas como:

- `reports`
- `feed_reports`

O administrador pode analisar os casos e tomar decisões.

---

## 14. Backend e responsabilidades de cada módulo

O backend do projeto é composto principalmente por Supabase, base de dados PostgreSQL, autenticação, storage de dados e integração com serviços externos.

### 14.1 Supabase Auth

Responsável por:

- Criar contas.
- Gerir login.
- Gerir logout.
- Manter sessão ativa.
- Enviar emails de recuperação de palavra-passe.
- Atualizar palavra-passe.
- Identificar o utilizador autenticado.

### 14.2 Supabase Database

Responsável por guardar todos os dados persistentes da aplicação.

Exemplos:

- Perfis.
- Equipas.
- Membros.
- Convites.
- Publicações.
- Comentários.
- Gostos.
- Denúncias.
- Scrims.
- Torneios.
- Mensagens de chat.

### 14.3 Supabase Realtime

Responsável por funcionalidades que beneficiam de atualização em tempo real.

Exemplos:

- Chat de equipa.
- Chat de scrim.

### 14.4 API externa de Valorant

Responsável por obter dados relacionados com contas Valorant.

Possíveis dados:

- Nome da conta.
- Tag.
- Rank.
- Região.
- Estatísticas.
- Histórico competitivo.

### 14.5 Vercel

Responsável pelo alojamento da aplicação.

Funções:

- Publicar frontend.
- Servir ficheiros estáticos.
- Manter URL de produção.
- Integrar com GitHub.
- Executar build do projeto.

### 14.6 GitHub

Responsável pelo controlo de versões.

Funções:

- Guardar histórico do código.
- Facilitar atualizações.
- Permitir integração com Vercel.
- Demonstrar evolução técnica do projeto.

---

## 15. Implementação e estrutura da base de dados

A base de dados é uma das partes mais importantes do projeto. Ela permite que a aplicação deixe de ser apenas visual e passe a ter dados reais, persistentes e relacionais.

Através das tabelas observadas, o projeto possui uma estrutura abrangente e bem dividida.

### 15.1 Tabela `profiles`

Responsável por guardar dados principais dos utilizadores.

Possíveis campos:

- `id`
- `username`
- `is_admin`
- `riot_account`
- `is_banned`
- `created_at`
- Informações adicionais de perfil.

Responsabilidades:

- Identificar utilizadores.
- Definir se são administradores.
- Guardar conta Riot associada.
- Guardar estado de banimento.
- Servir como base para outras funcionalidades.

### 15.2 Tabela `teams`

Responsável por guardar equipas.

Possíveis campos:

- `id`
- `name`
- `region`
- `owner_id`
- `color_id`
- `color_hex`
- `logo_url`
- `created_at`

Responsabilidades:

- Representar equipas.
- Guardar identidade visual.
- Associar equipa ao dono.
- Permitir listagem e procura.

### 15.3 Tabela `team_members`

Responsável por relacionar utilizadores com equipas.

Possíveis campos:

- `id`
- `team_id`
- `user_id`
- `role`
- `joined_at`

Responsabilidades:

- Definir membros de cada equipa.
- Guardar cargos.
- Permitir permissões por cargo.
- Saber se o utilizador pertence a uma equipa.

### 15.4 Tabela `team_invites`

Responsável por guardar convites enviados por equipas.

Possíveis campos:

- `id`
- `team_id`
- `user_id`
- `status`
- `created_at`

Responsabilidades:

- Controlar convites pendentes.
- Permitir aceitar ou rejeitar convites.
- Alimentar sistema de notificações.

### 15.5 Tabela `team_requests`

Responsável por guardar pedidos de entrada em equipas.

Possíveis campos:

- `id`
- `team_id`
- `user_id`
- `status`
- `created_at`

Responsabilidades:

- Permitir que jogadores peçam para entrar numa equipa.
- Permitir que capitães aceitem ou rejeitem.
- Gerar notificações para capitães e vices.

### 15.6 Tabela `team_chat_messages`

Responsável por guardar mensagens do chat de equipa.

Possíveis campos:

- `id`
- `team_id`
- `user_id`
- `message`
- `created_at`

Responsabilidades:

- Guardar histórico de mensagens.
- Permitir comunicação interna.
- Suportar realtime para novas mensagens.

### 15.7 Tabela `scrims`

Responsável por guardar propostas ou eventos de scrim.

Possíveis campos:

- `id`
- `team_id`
- `date`
- `map`
- `status`
- `created_at`

Responsabilidades:

- Criar oportunidades de treino.
- Listar scrims disponíveis.
- Organizar jogos entre equipas.

### 15.8 Tabela `scrim_requests`

Responsável por guardar pedidos relacionados com scrims.

Possíveis campos:

- `id`
- `scrim_id`
- `team_id`
- `status`
- `created_at`

Responsabilidades:

- Permitir que uma equipa peça para participar numa scrim.
- Controlar estado do pedido.
- Informar equipas envolvidas.

### 15.9 Tabela `scrim_chat_messages`

Responsável por guardar mensagens entre equipas numa scrim.

Responsabilidades:

- Permitir coordenação entre equipas.
- Combinar horário, mapa e regras.
- Facilitar comunicação antes do jogo.

### 15.10 Tabela `feed_posts`

Responsável pelas publicações do feed.

Possíveis campos:

- `id`
- `user_id`
- `content`
- `media_url`
- `created_at`
- `updated_at`

Responsabilidades:

- Guardar publicações.
- Mostrar conteúdo da comunidade.
- Servir de base para likes, comentários e reports.

### 15.11 Tabela `feed_likes`

Responsável pelos gostos nas publicações.

Responsabilidades:

- Registar interação.
- Evitar likes duplicados.
- Permitir contagem de gostos por publicação.

### 15.12 Tabela `feed_comments`

Responsável pelos comentários das publicações.

Responsabilidades:

- Guardar comentários.
- Associar comentários a posts.
- Permitir interação social.

### 15.13 Tabela `feed_reports`

Responsável por denúncias de publicações.

Responsabilidades:

- Guardar denúncias.
- Informar administradores.
- Apoiar moderação da comunidade.

### 15.14 Tabela `reports`

Responsável por denúncias gerais.

Responsabilidades:

- Registar problemas reportados.
- Guardar motivo.
- Associar denúncia ao utilizador ou conteúdo.
- Suportar painel administrativo.

### 15.15 Tabela `followers`

Responsável por relações de seguidores.

Responsabilidades:

- Permitir seguir utilizadores.
- Criar rede social interna.
- Melhorar interação entre jogadores.

### 15.16 Tabela `user_follows`

Também relacionada com seguimentos entre utilizadores.

Responsabilidades:

- Guardar relações entre utilizadores.
- Permitir funcionalidades sociais.

### 15.17 Tabela `tournaments`

Responsável por guardar torneios.

Possíveis campos:

- `id`
- `name`
- `description`
- `date`
- `status`
- `created_at`

Responsabilidades:

- Criar torneios.
- Listar eventos.
- Permitir gestão competitiva.

### 15.18 Tabela `tournament_participants`

Responsável por relacionar equipas ou utilizadores com torneios.

Responsabilidades:

- Guardar participantes.
- Controlar inscrições.
- Permitir gestão de torneios.

### 15.19 Tabela `team_trainings`

Responsável por treinos de equipa.

Responsabilidades:

- Guardar treinos marcados.
- Organizar preparação.
- Melhorar disciplina competitiva.

### 15.20 Tabela `saved_strategies`

Responsável por estratégias guardadas.

Responsabilidades:

- Guardar táticas.
- Associar estratégias a equipas ou utilizadores.
- Facilitar preparação para jogos.

### 15.21 Tabela `overwolf_link_tokens`

Responsável por tokens de ligação com serviços externos ou integração complementar.

Responsabilidades possíveis:

- Guardar tokens temporários.
- Validar ligações externas.
- Facilitar integração com aplicações auxiliares.

---

## 16. Arquitetura de ficheiros e padrões de implementação

A estrutura do projeto segue uma divisão por páginas e ficheiros de configuração.

Estrutura provável:

```txt
pap_site/
├── public/
├── src/
│   ├── pages/
│   │   ├── AdminReports.jsx
│   │   ├── Chat.jsx
│   │   ├── CreateTeam.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Feed.jsx
│   │   ├── FindTeam.jsx
│   │   ├── Honor.jsx
│   │   ├── Negotiations.jsx
│   │   ├── Notifications.jsx
│   │   ├── Profile.jsx
│   │   ├── Recruit.jsx
│   │   ├── Scrims.jsx
│   │   ├── Settings.jsx
│   │   ├── Strategies.jsx
│   │   ├── Team.jsx
│   │   ├── Tournaments.jsx
│   │   ├── Trainings.jsx
│   │   └── UpdatePassword.jsx
│   ├── App.jsx
│   ├── Login.jsx
│   ├── AuthGate.jsx
│   ├── supabaseClient.js
│   ├── main.jsx
│   └── index.css
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── vercel.json
└── README.md
```

### 16.1 `App.jsx`

Responsável pela estrutura geral da aplicação.

Funções principais:

- Definir rotas.
- Controlar menu lateral.
- Verificar sessão do utilizador.
- Buscar dados do perfil.
- Verificar permissões de admin.
- Controlar badges de notificações.
- Mostrar páginas protegidas.

### 16.2 `Login.jsx`

Responsável pelo login, registo e recuperação de palavra-passe.

Funções principais:

- Login.
- Registo.
- Envio de email de recuperação.
- Guardar múltiplas contas localmente, se implementado.
- Validação de campos.

### 16.3 `UpdatePassword.jsx`

Responsável por atualizar a palavra-passe após o link de recuperação.

Funções principais:

- Ler sessão de recuperação.
- Validar nova palavra-passe.
- Confirmar palavra-passe.
- Atualizar password no Supabase.

### 16.4 `supabaseClient.js`

Responsável pela ligação ao Supabase.

Funções principais:

- Configurar URL do Supabase.
- Configurar chave pública anon.
- Exportar cliente para o resto da aplicação.

### 16.5 Páginas dentro de `src/pages`

Cada página representa uma área funcional da aplicação.

Vantagens deste padrão:

- Código mais organizado.
- Separação de responsabilidades.
- Mais fácil encontrar erros.
- Mais fácil expandir o projeto.

---

## 17. Exemplos de código relevantes

### 17.1 Ligação ao Supabase

```jsx
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

Este ficheiro centraliza a ligação ao backend. Assim, qualquer página pode importar `supabase` e comunicar com a base de dados.

---

### 17.2 Verificação do utilizador autenticado

```jsx
const { data, error } = await supabase.auth.getUser();

if (error || !data?.user) {
  navigate("/login");
  return;
}

const user = data.user;
```

Este exemplo mostra como a aplicação verifica se existe um utilizador autenticado antes de permitir acesso às páginas privadas.

---

### 17.3 Obtenção do perfil do utilizador

```jsx
const { data: profile, error } = await supabase
  .from("profiles")
  .select("username, is_admin, riot_account, is_banned")
  .eq("id", user.id)
  .single();

if (profile?.is_banned) {
  await supabase.auth.signOut();
  alert("A tua conta foi suspensa.");
}
```

Este código permite obter informações adicionais do utilizador, como o nome, permissões de administrador e estado de banimento.

---

### 17.4 Recuperação de palavra-passe

```jsx
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: "https://pap-site-five.vercel.app/update-password",
});

if (error) {
  setError(error.message);
} else {
  setSuccess("Foi enviado um email para redefinir a palavra-passe.");
}
```

Este exemplo mostra como o sistema envia um email para recuperação da palavra-passe, redirecionando o utilizador para a página correta em produção.

---

### 17.5 Atualização da palavra-passe

```jsx
const { error } = await supabase.auth.updateUser({
  password: password,
});

if (error) {
  setError(error.message);
} else {
  setSuccess(true);
}
```

Este código atualiza a palavra-passe do utilizador após validação da sessão de recuperação.

---

### 17.6 Proteção de rotas

```jsx
<Route
  path="/admin/reports"
  element={
    isAdmin ? <AdminReportsPage /> : <Navigate to="/dashboard" replace />
  }
/>
```

Este exemplo impede que utilizadores normais acedam ao painel administrativo.

---

### 17.7 Criação de equipa

```jsx
const { data, error } = await supabase
  .from("teams")
  .insert({
    name: teamName,
    region: region,
    owner_id: user.id,
    color_hex: selectedColor,
  })
  .select()
  .single();

if (!error && data) {
  await supabase.from("team_members").insert({
    team_id: data.id,
    user_id: user.id,
    role: "owner",
  });
}
```

Este código cria uma equipa e adiciona automaticamente o criador como dono/capitão.

---

### 17.8 Pedido de entrada numa equipa

```jsx
const { error } = await supabase.from("team_requests").insert({
  team_id: teamId,
  user_id: user.id,
  status: "pending",
});
```

Este exemplo permite a um jogador pedir entrada numa equipa.

---

### 17.9 Contagem de notificações

```jsx
const { count } = await supabase
  .from("team_invites")
  .select("*", { count: "exact", head: true })
  .eq("user_id", user.id)
  .eq("status", "pending");
```

Este código permite mostrar badges de notificações no menu.

---

### 17.10 Envio de mensagem no chat de equipa

```jsx
const { error } = await supabase.from("team_chat_messages").insert({
  team_id: teamId,
  user_id: user.id,
  message: message.trim(),
});
```

O chat utiliza a tabela `team_chat_messages` para guardar mensagens associadas a uma equipa.

---

### 17.11 Subscrição realtime do chat

```jsx
const channel = supabase
  .channel("team-chat")
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "team_chat_messages",
      filter: `team_id=eq.${teamId}`,
    },
    (payload) => {
      setMessages((current) => [...current, payload.new]);
    }
  )
  .subscribe();
```

Este exemplo mostra como o chat pode receber novas mensagens em tempo real.

---

### 17.12 Criação de publicação no feed

```jsx
const { error } = await supabase.from("feed_posts").insert({
  user_id: user.id,
  content: content.trim(),
});
```

Este código permite criar publicações no feed da comunidade.

---

### 17.13 Sistema de likes

```jsx
const { error } = await supabase.from("feed_likes").insert({
  post_id: postId,
  user_id: user.id,
});
```

Este exemplo regista um gosto numa publicação.

---

### 17.14 Sistema de comentários

```jsx
const { error } = await supabase.from("feed_comments").insert({
  post_id: postId,
  user_id: user.id,
  content: comment.trim(),
});
```

Este código permite comentar publicações.

---

### 17.15 Sistema de denúncias

```jsx
const { error } = await supabase.from("feed_reports").insert({
  post_id: postId,
  reported_by: user.id,
  reason: reason,
});
```

Este exemplo mostra como uma denúncia pode ser registada para análise posterior.

---

### 17.16 Moderação automática simples

```jsx
const blockedWords = ["palavra_proibida_1", "palavra_proibida_2"];

function validateContent(text) {
  const normalized = text.toLowerCase();

  return !blockedWords.some((word) => normalized.includes(word));
}
```

Este tipo de função pode ser usado para bloquear conteúdo ofensivo antes de ser publicado.

---

### 17.17 Integração com API externa

```jsx
async function fetchValorantAccount(name, tag) {
  const response = await fetch(
    `https://api.henrikdev.xyz/valorant/v1/account/${name}/${tag}`
  );

  if (!response.ok) {
    throw new Error("Não foi possível obter dados da conta Valorant.");
  }

  return await response.json();
}
```

Este exemplo representa a lógica de comunicação com uma API externa para obter dados da conta Valorant.

---

## 18. Guia de configuração local

### 18.1 Pré-requisitos

Antes de iniciar o projeto, é necessário ter instalado:

- Node.js
- npm
- Git
- Conta Supabase
- Conta GitHub

### 18.2 Clonar o repositório

```bash
git clone https://github.com/papultrasigma-commits/pap_site.git
cd pap_site
```

### 18.3 Instalar dependências

```bash
npm install
```

### 18.4 Criar ficheiro `.env`

Na raiz do projeto, criar um ficheiro `.env` com as variáveis:

```env
VITE_SUPABASE_URL=colocar_url_do_supabase
VITE_SUPABASE_ANON_KEY=colocar_chave_anon_do_supabase
VITE_HENRIK_API_KEY=colocar_api_key_se_necessario
```

### 18.5 Executar em modo desenvolvimento

```bash
npm run dev
```

Depois abrir o endereço indicado no terminal, normalmente:

```txt
http://localhost:5173
```

### 18.6 Criar build de produção

```bash
npm run build
```

### 18.7 Pré-visualizar build

```bash
npm run preview
```

---

## 19. Deploy e ambiente de produção

O projeto é publicado na Vercel.

### 19.1 Fluxo de deploy

1. O código é atualizado no GitHub.
2. A Vercel deteta alterações.
3. A Vercel executa o build.
4. A versão atualizada fica online.

### 19.2 Configuração de rotas

Como a aplicação usa React Router, é importante configurar rewrites para que rotas como `/update-password`, `/profile` ou `/team` funcionem diretamente ao recarregar a página.

Exemplo de `vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/"
    }
  ]
}
```

### 19.3 Configuração no Supabase

No Supabase, é importante configurar corretamente:

- Site URL.
- Redirect URLs.
- URL local.
- URL de produção.

Exemplos:

```txt
http://localhost:5173/update-password
https://pap-site-five.vercel.app/update-password
```

Isto garante que a recuperação de palavra-passe funciona tanto em desenvolvimento local como em produção.

---

## 20. Testes, validação e manutenção

### 20.1 Testes manuais realizados

Durante o desenvolvimento, devem ser testados os seguintes fluxos:

- Criar conta.
- Iniciar sessão.
- Terminar sessão.
- Recuperar palavra-passe.
- Criar equipa.
- Entrar numa equipa.
- Enviar convite.
- Aceitar convite.
- Enviar pedido de entrada.
- Criar publicação.
- Gostar de publicação.
- Comentar publicação.
- Denunciar publicação.
- Aceder como administrador.
- Verificar bloqueio de acesso a rotas administrativas.
- Enviar mensagem no chat.
- Criar scrim.
- Verificar notificações.

### 20.2 Validação de segurança

Devem ser verificados:

- Se utilizadores normais não acedem a páginas admin.
- Se utilizadores banidos são impedidos de usar a aplicação.
- Se dados sensíveis não aparecem no frontend.
- Se as chaves privadas não são expostas.
- Se apenas a chave pública anon do Supabase é usada no frontend.
- Se as permissões da base de dados estão configuradas corretamente.

### 20.3 Manutenção

O projeto foi desenvolvido de forma modular para facilitar manutenção futura.

Exemplos de melhorias fáceis de implementar:

- Novas páginas.
- Novos campos no perfil.
- Mais filtros de equipas.
- Sistema de ranking interno.
- Estatísticas mais avançadas.
- Melhorias no painel admin.

---

## 21. Limitações e melhorias futuras

Apesar de o projeto já possuir uma base bastante completa, existem melhorias possíveis.

### 21.1 Melhorias futuras

- Sistema de mensagens privadas.
- Calendário de treinos.
- Integração mais avançada com estatísticas Valorant.
- Sistema de ranking interno.
- Upload de clips.
- Sistema de badges.
- Histórico de partidas.
- Página pública de equipa.
- Sistema de recomendações de jogadores.
- Melhorias no algoritmo de moderação.
- Painel administrativo mais completo.
- Logs de ações administrativas.
- Testes automatizados.
- Melhorias de acessibilidade.
- Suporte multilingue, por exemplo português e inglês.

### 21.2 Limitações atuais

Algumas funcionalidades podem depender de APIs externas, que podem falhar ou alterar o seu funcionamento. Por exemplo, a integração com dados de Valorant depende da disponibilidade da API usada.

Também existem limitações naturais de um projeto em fase de desenvolvimento académico, como falta de testes automatizados completos ou ausência de backend próprio tradicional.

---

## 22. Conclusão

O **Valorant Team Manager** é um projeto completo, moderno e tecnicamente relevante, desenvolvido para responder a uma necessidade real dentro da comunidade competitiva de Valorant.

A aplicação não se limita a ser uma página informativa. Pelo contrário, apresenta funcionalidades complexas e interligadas, como autenticação, perfis, equipas, convites, pedidos, chats, scrims, feed social, moderação, denúncias, torneios e sistema de honra.

Do ponto de vista técnico, o projeto demonstra domínio de várias áreas essenciais do desenvolvimento web moderno:

- Frontend com React.
- Estilização com Tailwind CSS.
- Roteamento com React Router.
- Backend com Supabase.
- Base de dados relacional PostgreSQL.
- Autenticação segura.
- Integração com APIs externas.
- Deploy em produção com Vercel.
- Organização modular de código.
- Controlo de versões com GitHub.

Este projeto é particularmente relevante para uma PAP porque mostra não só capacidade de programar, mas também capacidade de planear uma solução completa, pensar em utilizadores reais, estruturar dados, lidar com segurança, criar interfaces funcionais e publicar uma aplicação online.

A nível de inovação, destaca-se por juntar numa única plataforma funcionalidades que normalmente aparecem separadas: gestão de equipas, rede social, organização competitiva, moderação e integração com dados do jogo.

Assim, o Valorant Team Manager representa uma solução prática, útil e bem enquadrada tecnologicamente, demonstrando competências sólidas de desenvolvimento frontend, backend, base de dados, autenticação, deploy e manutenção de software.

---

## Anexo A — Tabelas principais identificadas

| Tabela | Responsabilidade principal |
|---|---|
| `profiles` | Guarda dados dos utilizadores, permissões e conta Riot |
| `teams` | Guarda equipas criadas |
| `team_members` | Liga utilizadores a equipas e define cargos |
| `team_invites` | Guarda convites enviados por equipas |
| `team_requests` | Guarda pedidos de entrada em equipas |
| `team_chat_messages` | Guarda mensagens do chat de equipa |
| `scrims` | Guarda scrims criadas |
| `scrim_requests` | Guarda pedidos de scrim |
| `scrim_chat_messages` | Guarda mensagens associadas a scrims |
| `feed_posts` | Guarda publicações do feed |
| `feed_likes` | Guarda gostos nas publicações |
| `feed_comments` | Guarda comentários |
| `feed_reports` | Guarda denúncias do feed |
| `reports` | Guarda denúncias gerais |
| `followers` | Guarda relações sociais entre utilizadores |
| `user_follows` | Guarda seguimentos entre utilizadores |
| `saved_strategies` | Guarda estratégias |
| `team_trainings` | Guarda treinos |
| `tournaments` | Guarda torneios |
| `tournament_participants` | Guarda participantes de torneios |
| `overwolf_link_tokens` | Guarda tokens de integração externa |

---

## Anexo B — Comandos úteis

```bash
npm install
npm run dev
npm run build
npm run preview
```

```bash
git status
git add .
git commit -m "atualizar documentação do projeto"
git push
```

---

## Anexo C — Exemplo de descrição curta para apresentação ao júri

O projeto desenvolvido consiste numa plataforma web para gestão de equipas de Valorant. A aplicação permite criar conta, associar perfil Valorant, criar e gerir equipas, recrutar jogadores, organizar scrims, comunicar através de chats, publicar conteúdos no feed da comunidade, participar em torneios e utilizar ferramentas de moderação. O sistema foi desenvolvido com React, Vite, Tailwind CSS e Supabase, estando publicado online através da Vercel. A solução destaca-se por reunir funcionalidades de gestão competitiva, rede social, autenticação, base de dados relacional, moderação automática e administração numa única plataforma moderna e funcional.
