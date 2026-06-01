# 📋 Planejamento Ágil de Implementação — NailFlow

> **Documento de Execução** — versão 1.0
> Data: Maio/2026
> Baseado em: NailFlow — Documento Mestre v1.0 (Fase A)
> Metodologia: Scrum adaptado (sprints de 2 semanas)
> Autor do plano: Ariel + Claude Opus 4.7

---

## 🎯 Visão Geral do Planejamento

### Premissas Adotadas

| Item | Valor |
|---|---|
| **Duração total** | 20 semanas (~5 meses) |
| **Duração da sprint** | 2 semanas (10 dias úteis) |
| **Total de sprints** | **10 sprints** + 1 sprint zero (setup) |
| **Capacidade por sprint** | 40 story points (referência de equipe pequena 1–2 devs) |
| **Buffer de risco** | 15% por sprint (≈6 SP reservados) |
| **Estimativa total** | ~380 SP / ~600–700 horas de desenvolvimento |
| **Cerimônias** | Planning (2h), Daily (15min), Review (1h), Retro (1h) |

### Escala de Story Points (Fibonacci)

| SP | Esforço aproximado | Complexidade |
|---|---|---|
| 1 | 1–2h | Trivial |
| 2 | 2–4h | Simples |
| 3 | 4–8h | Média-baixa |
| 5 | 1–2 dias | Média |
| 8 | 2–4 dias | Alta |
| 13 | 4–7 dias | Muito alta (considerar quebrar) |

### Status atual do projeto (atualizado em 01/06/2026)
- ✅ Sprint 0 concluída (pendências absorvidas e finalizadas na Sprint 2)
- ✅ Sprint 1 concluída (2FA administrativo finalizado na Sprint 2)
- ✅ Sprint 2 concluída
- ✅ Sprint 3 concluída
- ✅ Sprint 4 concluída
- ⚠️ Sprint 5 parcialmente concluída (dashboard/admin timeout entregues; governança completa de super_admin ainda pendente)
- ✅ Sprint 6 concluída
- ✅ Sprint 7 concluída
- ✅ Sprint 8 concluída
- 🚧 Sprint 9 em andamento

---

## 🏁 Sprint 0 — Setup e Fundação Técnica

| Atributo | Detalhe |
|---|---|
| **Duração** | 1 semana (5 dias) |
| **Objetivo** | Preparar todo o ambiente técnico. |
| **Esforço estimado** | 20 SP |
| **Dependências** | Nenhuma |

### Tarefas
- 0.1 Criar projeto Expo (SDK 52+) com TypeScript strict — 2 SP
- 0.2 Configurar NativeWind v4 + tailwind.config — 3 SP
- 0.3 Configurar Expo Router v4 — 2 SP
- 0.4 Setup Firebase (Auth, Firestore, Functions, FCM, Storage) — 3 SP
- 0.5 Configurar ESLint, Prettier, Husky, lint-staged — 2 SP
- 0.6 Estrutura de pastas src/ — 1 SP
- 0.7 Configurar Zustand + TanStack Query + RHF + Zod — 3 SP
- 0.8 Repositório Git + branches + CI básico — 2 SP
- 0.9 Setup Cloud Functions (Node 20+, TS) — 2 SP

### Entregáveis
- Repositório versionado com estrutura definitiva
- App roda em iOS e Android
- Firebase conectado e testado
- Pipeline de lint/format funcionando

### Critérios de Sucesso
- App inicia sem erros em iOS e Android
- Commit bloqueado em caso de erro de lint
- Cloud Function "hello world" deployada

### Status de execução (atualizado em 01/06/2026)
- ✅ 0.1 Criar projeto Expo com TypeScript strict — concluído (Expo SDK 56 + TypeScript)
- ✅ 0.2 Configurar NativeWind v4 + tailwind.config — concluído
- ✅ 0.3 Configurar Expo Router — concluído
- ✅ 0.4 Setup Firebase (Auth, Firestore, Functions, FCM, Storage) — concluído (fluxo funcional básico finalizado na Sprint 2)
- ✅ 0.5 Configurar ESLint, Prettier, Husky, lint-staged — concluído (finalizado na Sprint 2)
- ✅ 0.6 Estrutura de pastas src/ — concluído
- ✅ 0.7 Configurar Zustand + TanStack Query + RHF + Zod — concluído
- ✅ 0.8 Repositório Git + branches + CI básico — concluído (finalizado na Sprint 2)
- ✅ 0.9 Setup Cloud Functions (Node 20+, TS) — concluído

---

## 🔐 Sprint 1 — Autenticação e RBAC

**Duração:** 2 semanas | **SP:** 38 | **Dependências:** Sprint 0

### Tarefas
- 1.1 Telas Login, Cadastro, Recuperar senha — 5 SP
- 1.2 Firebase Auth (e-mail/senha + Google) — 5 SP
- 1.3 Modelagem coleção users — 3 SP
- 1.4 Cloud Function pós-cadastro — 5 SP
- 1.5 Allowlist super_admin — 3 SP
- 1.6 2FA (TOTP) para admin — 8 SP
- 1.7 Regras Firestore RBAC base — 5 SP
- 1.8 Zustand store de sessão — 2 SP
- 1.9 Middleware rotas protegidas — 2 SP

### Entregáveis
- Fluxo completo de cadastro/login
- 2FA obrigatório para papéis administrativos
- Regras Firestore versionadas

### Critérios de Sucesso
- Não-autenticado redirecionado para /login
- Super admin fora da allowlist bloqueado
- 2FA bloqueia sem TOTP válido

### Status de execução (atualizado em 01/06/2026)
- ✅ 1.1 Telas Login, Cadastro, Recuperar senha — concluído
- ✅ 1.2 Firebase Auth (e-mail/senha + Google) — concluído
- ✅ 1.3 Modelagem coleção users — concluído
- ✅ 1.4 Cloud Function pós-cadastro — concluído
- ✅ 1.5 Allowlist super_admin — concluído (via variável de ambiente)
- ✅ 1.6 2FA (TOTP) para admin — concluído (entregue na Sprint 2 para super_admin e salon_owner)
- ✅ 1.7 Regras Firestore RBAC base — concluído
- ✅ 1.8 Zustand store de sessão — concluído
- ✅ 1.9 Middleware rotas protegidas — concluído

---

## 🗄️ Sprint 2 — Modelagem de Dados e CRUD de Clientes

**Duração:** 2 semanas | **SP:** 56 | **Dependências:** Sprint 1 (inclui pendências de Sprint 0 e Sprint 1)

### Tarefas
- 2.0 Implementar 2FA (TOTP) para super_admin e salon_owner — 8 SP
- 2.1 Criar coleções Firestore (schemas Zod) — 5 SP
- 2.2 Índices compostos — 2 SP
- 2.3 clientsService (CRUD + queries) — 5 SP
- 2.4 Hooks useClients, useClient — 3 SP
- 2.5 Tela Lista de Clientes — 5 SP
- 2.6 Tela Detalhe do Cliente — 3 SP
- 2.7 Tela Criar/Editar Cliente — 5 SP
- 2.8 Regras Firestore para clients — 3 SP
- 2.9 Cloud Function criar salão — 5 SP
- 2.10 Componentes UI: Button, Input, Card, Avatar, Tag — 4 SP
- 2.11 Concluir setup Firebase para FCM e Storage com fluxo funcional básico — 3 SP
- 2.12 Configurar Husky + lint-staged no fluxo de commit local — 2 SP
- 2.13 Configurar CI básico (lint + typecheck + test) — 3 SP

### Critérios de Sucesso
- CRUD funciona offline
- Isolamento por salão validado
- Listas com >100 itens em <1s
- 2FA bloqueia acesso administrativo sem TOTP válido
- Pipeline CI executa lint, typecheck e testes automaticamente

### Status de execução (atualizado em 29/05/2026)
- ✅ 2.0 Implementar 2FA (TOTP) para super_admin e salon_owner — concluído
- ✅ 2.1 Criar coleções Firestore (schemas Zod) — concluído
- ✅ 2.2 Índices compostos — concluído
- ✅ 2.3 clientsService (CRUD + queries) — concluído
- ✅ 2.4 Hooks useClients, useClient — concluído
- ✅ 2.5 Tela Lista de Clientes — concluído
- ✅ 2.6 Tela Detalhe do Cliente — concluído
- ✅ 2.7 Tela Criar/Editar Cliente — concluído
- ✅ 2.8 Regras Firestore para clients — concluído
- ✅ 2.9 Cloud Function criar salão — concluído
- ✅ 2.10 Componentes UI: Button, Input, Card, Avatar, Tag — concluído
- ✅ 2.11 Concluir setup Firebase para FCM e Storage com fluxo funcional básico — concluído
- ✅ 2.12 Configurar Husky + lint-staged no fluxo de commit local — concluído
- ✅ 2.13 Configurar CI básico (lint + typecheck + test) — concluído

### Evidências de fechamento da Sprint 2
- ✅ Validações locais executadas com sucesso:
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test`
  - `npm run lint` (em `functions/`)
  - `npm run build` (em `functions/`)
- ✅ Fluxo de autenticação com 2FA TOTP ativo para perfis administrativos.
- ✅ CRUD de clientes implementado com service + hooks + telas.
- ✅ Setup inicial de push token (FCM via Expo) e Storage implementado.
- ✅ Pipeline de qualidade ativo no GitHub Actions e pre-commit local.

---

## 📅 Sprint 3 — Agenda e Atendimentos

**Duração:** 2 semanas | **SP:** 42 | **Dependências:** Sprint 2

### Tarefas
- 3.1 appointmentsService — 5 SP
- 3.2 Hooks useAppointments — 3 SP
- 3.3 react-native-calendars (mês/semana/dia) — 8 SP
- 3.4 Home da Manicure — 5 SP
- 3.5 Criar/Editar Atendimento — 8 SP
- 3.6 Detalhe do Atendimento — 3 SP
- 3.7 Validação de conflitos — 5 SP
- 3.8 Estados de atendimento — 3 SP
- 3.9 Regras Firestore appointments — 2 SP

### Critérios de Sucesso
- Atendimento criado aparece em <1s
- Conflito de horário bloqueado
- Agenda carrega em <2s

### Status de execução (atualizado em 01/06/2026)
- ✅ 3.1 appointmentsService — concluído
- ✅ 3.2 Hooks useAppointments — concluído
- ✅ 3.3 react-native-calendars (mês/semana/dia) — concluído
- ✅ 3.4 Home da Manicure — concluído
- ✅ 3.5 Criar/Editar Atendimento — concluído
- ✅ 3.6 Detalhe do Atendimento — concluído
- ✅ 3.7 Validação de conflitos — concluído
- ✅ 3.8 Estados de atendimento — concluído
- ✅ 3.9 Regras Firestore appointments — concluído

---

## 💼 Sprint 4 — Comandas e Painel Salon Owner

**Duração:** 2 semanas | **SP:** 40 | **Dependências:** Sprint 3

### Tarefas
- 4.1 commandsService + hooks — 5 SP
- 4.2 Listar Comandas — 3 SP
- 4.3 Abrir/Editar Comanda — 5 SP
- 4.4 Fechar Comanda — 5 SP
- 4.5 Dashboard Salon Owner — 8 SP
- 4.6 Gerenciar Manicures — 5 SP
- 4.7 Visão consolidada de agendas — 5 SP
- 4.8 Relatório financeiro básico — 4 SP

### Critérios de Sucesso
- Comanda fechada não reabre sem admin
- Dono visualiza agendas das 2 manicures
- Cálculos financeiros corretos

### Status de execução (atualizado em 01/06/2026)
- ✅ 4.1 commandsService + hooks — concluído
- ✅ 4.2 Listar Comandas — concluído
- ✅ 4.3 Abrir/Editar Comanda — concluído
- ✅ 4.4 Fechar Comanda — concluído
- ✅ 4.5 Dashboard Salon Owner — concluído
- ✅ 4.6 Gerenciar Manicures — concluído
- ✅ 4.7 Visão consolidada de agendas — concluído
- ✅ 4.8 Relatório financeiro básico — concluído

---

## 👑 Sprint 5 — Super Admin e Auditoria

**Duração:** 2 semanas | **SP:** 38 | **Dependências:** Sprint 4

### Tarefas
- 5.1 Dashboard global — 5 SP
- 5.2 Gerenciar Salões — 5 SP
- 5.3 Gerenciar Usuários — 5 SP
- 5.4 Helper auditLogs — 5 SP
- 5.5 Instrumentar ações sensíveis — 5 SP
- 5.6 Tela de logs — 5 SP
- 5.7 Sessão admin 1h — 3 SP
- 5.8 Configurações globais — 3 SP
- 5.9 Exportação LGPD — 2 SP

### Critérios de Sucesso
- Logs com quem/o quê/quando/IP
- Apenas super admin lê auditLogs
- Sessão expira em 1h de inatividade

### Status de execução (atualizado em 01/06/2026)
- ✅ 5.1 Dashboard global — concluído (versão inicial)
- ❌ 5.2 Gerenciar Salões — pendente
- ❌ 5.3 Gerenciar Usuários — pendente
- ⚠️ 5.4 Helper auditLogs — parcialmente concluído (estrutura inicial entregue)
- ⚠️ 5.5 Instrumentar ações sensíveis — parcialmente concluído (instrumentação inicial entregue)
- ⚠️ 5.6 Tela de logs — parcialmente concluído (versão inicial entregue)
- ✅ 5.7 Sessão admin 1h — concluído
- ❌ 5.8 Configurações globais — pendente
- ❌ 5.9 Exportação LGPD — pendente

---

## 📅 Sprint 6 — Google Calendar: OAuth + Sync App→Google

**Duração:** 2 semanas | **SP:** 42 | **Risco:** 🔴 Alto | **Dependências:** Sprint 3

### Tarefas
- 6.1 Projeto Google Cloud + OAuth (Testing) — 3 SP
- 6.2 Tela Conectar Google — 3 SP
- 6.3 OAuth com expo-auth-session — 8 SP
- 6.4 Cloud Function tokens + criptografia — 5 SP
- 6.5 Criar calendário dedicado — 5 SP
- 6.6 Trigger onCreate → Google — 5 SP
- 6.7 Trigger onUpdate → Google — 5 SP
- 6.8 Trigger onDelete → Google — 3 SP
- 6.9 googleEventId + syncStatus — 3 SP
- 6.10 Indicador de status — 2 SP

### Critérios de Sucesso
- Conexão em <2 minutos
- Atendimento no Google em <10s
- refresh_token criptografado

### Status de execução (atualizado em 01/06/2026)
- ✅ 6.1 Projeto Google Cloud + OAuth (Testing) — concluído
- ✅ 6.2 Tela Conectar Google — concluído
- ✅ 6.3 OAuth com expo-auth-session — concluído
- ✅ 6.4 Cloud Function tokens + criptografia — concluído
- ✅ 6.5 Criar calendário dedicado — concluído
- ✅ 6.6 Trigger onCreate → Google — concluído
- ✅ 6.7 Trigger onUpdate → Google — concluído
- ✅ 6.8 Trigger onDelete → Google — concluído
- ✅ 6.9 googleEventId + syncStatus — concluído
- ✅ 6.10 Indicador de status — concluído

---

## 🔄 Sprint 7 — Sync Google→App + Reconciliação

**Duração:** 2 semanas | **SP:** 44 | **Risco:** 🔴 Muito alto | **Dependências:** Sprint 6

### Tarefas
- 7.1 Watch channel (webhook) — 5 SP
- 7.2 HTTP function recebe webhooks — 5 SP
- 7.3 Sync incremental via syncToken — 8 SP
- 7.4 Mapeamento Google → Firestore — 5 SP
- 7.5 Last-write-wins — 5 SP
- 7.6 Renovação diária webhooks — 5 SP
- 7.7 Reconciliação 3h da manhã — 5 SP
- 7.8 syncQueue (Pub/Sub) — 3 SP
- 7.9 Token revogado/expirado — 3 SP

### Critérios de Sucesso
- Alteração no Google → app em <10s
- Conflitos logados
- Webhook auto-renovado
- Zero perda em 7 dias contínuos

### Status de execução (atualizado em 01/06/2026)
- ✅ 7.1 Watch channel (webhook) — concluído
- ✅ 7.2 HTTP function recebe webhooks — concluído
- ✅ 7.3 Sync incremental via syncToken — concluído
- ✅ 7.4 Mapeamento Google → Firestore — concluído
- ✅ 7.5 Last-write-wins — concluído
- ✅ 7.6 Renovação diária webhooks — concluído
- ✅ 7.7 Reconciliação 3h da manhã — concluído
- ✅ 7.8 syncQueue (Pub/Sub) — concluído
- ✅ 7.9 Token revogado/expirado — concluído

---

## 🔔 Sprint 8 — Sistema de Notificações

**Duração:** 2 semanas | **SP:** 40 | **Dependências:** Sprint 7

### Tarefas
- 8.1 expo-notifications + FCM — 5 SP
- 8.2 fcmTokens no usuário — 3 SP
- 8.3 Helper de envio — 5 SP
- 8.4 6 tipos da Fase A — 8 SP
- 8.5 Central com sino + badge — 5 SP
- 8.6 Agrupamento + swipe + marcar lida — 5 SP
- 8.7 Configurações por usuário — 5 SP
- 8.8 Não-perturbe + lembrete configurável — 3 SP
- 8.9 Lembretes pré-atendimento — 3 SP

### Critérios de Sucesso
- Push em <5s
- Não-perturbe silencia push
- Badge em tempo real

---

## 🧪 Sprint 9 — Testes, Performance e Refinamentos

**Duração:** 2 semanas | **SP:** 38 | **Dependências:** Sprint 8

### Tarefas
- 9.1 Setup Maestro — 3 SP
- 9.2 E2E fluxos críticos — 8 SP
- 9.3 Unitários Cloud Functions — 5 SP
- 9.4 Auditoria de performance — 5 SP
- 9.5 Otimização queries — 3 SP
- 9.6 Acessibilidade básica — 3 SP
- 9.7 Dark mode validado — 2 SP
- 9.8 Estados erro/loading/vazio — 3 SP
- 9.9 Privacy + LGPD telas — 3 SP
- 9.10 Documentação de uso — 3 SP

### Critérios de Sucesso
- 10 critérios de aceite validados
- Crash-free >99.5%
- iOS 15+ e Android 10+

---

## 🚀 Sprint 10 — Piloto e Estabilização

**Duração:** 2 semanas | **SP:** 30 | **Dependências:** Sprint 9

### Tarefas
- 10.1 Build EAS iOS + Android — 3 SP
- 10.2 Distribuição interna — 2 SP
- 10.3 Onboarding presencial — 3 SP
- 10.4 Monitoramento ativo — 3 SP
- 10.5 Coleta de feedback (7 dias) — 3 SP
- 10.6 Hotfix bucket — 13 SP
- 10.7 Relatório + handoff Fase B — 3 SP

### Critérios de Sucesso
- Zero perda em 30 dias
- NPS >50
- Retenção >90% em 30 dias

---

## 📊 Resumo Consolidado

| Sprint | Tema | Duração | SP | Risco |
|---|---|---|---|---|
| 0 | Setup | 1 sem | 20 | 🟢 Baixo |
| 1 | Auth + RBAC | 2 sem | 38 | 🟡 Médio |
| 2 | Modelagem + Clientes + Pendências S0/S1 | 2 sem | 56 | 🟡 Médio |
| 3 | Agenda + Atendimentos | 2 sem | 42 | 🟡 Médio |
| 4 | Comandas + Owner | 2 sem | 40 | 🟢 Baixo |
| 5 | Super Admin + Auditoria | 2 sem | 38 | 🟡 Médio |
| 6 | Google OAuth + Sync A→G | 2 sem | 42 | 🔴 Alto |
| 7 | Sync G→A + Webhooks | 2 sem | 44 | 🔴 Muito alto |
| 8 | Notificações | 2 sem | 40 | 🟡 Médio |
| 9 | Testes + Performance | 2 sem | 38 | 🟢 Baixo |
| 10 | Piloto | 2 sem | 30 | 🟡 Médio |
| **Total** | — | **21 sem** | **428 SP** | — |

---

## ⚠️ Gestão de Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Google Calendar complexa | Alta | Alto | Buffer + spike técnico |
| Token revogado em produção | Média | Médio | Tratamento + notificação |
| Verificação OAuth | Média | Baixo | Modo Testing |
| Performance Firestore | Baixa | Médio | Índices + paginação |
| NativeWind v4 | Baixa | Baixo | UI primitivos centralizados |
| Imprevistos no piloto | Alta | Médio | 13 SP reservados em S10 |

---

## 🎯 Próximos Passos

1. Consolidar Sprint 9 (testes, performance e refinamentos)
2. Expandir cobertura de testes unitários e E2E dos fluxos críticos
3. Executar auditoria de performance para consultas e telas principais
4. Fechar pendências funcionais remanescentes da Sprint 5 (gestão de salões/usuários, governança e LGPD)
5. Concluir Sprint 10 (piloto, estabilização e handoff da Fase B)

---

*Plano gerado por Claude Opus 4.7 (Anthropic) com base no documento mestre NailFlow v1.0.*
