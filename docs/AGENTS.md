# AGENTS.md — Guia para Agentes de IA no NailFlow

> Este arquivo orienta agentes de IA (Claude Code, Cursor, Copilot, Codex, Aider etc.)
> sobre como contribuir com o código deste repositório de forma consistente, segura
> e alinhada à especificação do produto.
>
> **Projeto:** NailFlow — SaaS de gestão para salões de manicure
> **Fase atual:** A (Piloto — 5 meses, 1 salão, 2 manicures)
> **Owner:** Ariel
> **Versão deste guia:** 1.0 (Maio/2026)

---

## 1. 🎯 Contexto do Projeto

O NailFlow é um **app mobile multiplataforma (iOS + Android)** em React Native + Expo,
com backend serverless no Firebase e **sincronização bidirecional com Google Calendar**
em ~5 segundos.

Existem **3 papéis (RBAC)**:

- `super_admin` — Ariel (acesso global, auditoria, allowlist)
- `salon_owner` — dono do salão (gerencia manicures e finanças)
- `manicure` — profissional (própria agenda, clientes, comandas)

Sempre que gerar código, **considere o papel envolvido** e respeite as regras de acesso.

---

## 2. 🛠️ Stack Oficial (NÃO trocar sem ADR)

### Frontend
- **React Native** 0.76+ via **Expo SDK 52+**
- **TypeScript 5+** (strict mode obrigatório)
- **Expo Router v4** (file-based routing)
- **NativeWind v4** (Tailwind) — sempre `className`, nunca `style` (salvo exceção)
- **Zustand** (estado global)
- **TanStack Query v5** (data fetching + cache offline)
- **React Hook Form + Zod** (formulários e validação)
- **date-fns v3+** (datas)
- **Lucide React Native** (ícones)
- **react-native-calendars** (calendário visual)
- **expo-notifications** (push)

### Backend
- **Firebase Authentication**
- **Cloud Firestore**
- **Cloud Functions for Firebase** (Node.js 20+, TypeScript)
- **Firebase Cloud Messaging (FCM)**
- **Firebase Storage**
- **Cloud Pub/Sub** (fila de sync)
- **Cloud Scheduler** (renovação de webhooks, reconciliação)
- **Cloud Logging**

### Integrações
- **Google Calendar API** (Nível 1 + 2 + 3 desde a Fase A)
- **Google OAuth 2.0** (modo Testing na Fase A)
- **Google Push Notifications** (webhooks)

> ⚠️ Não introduza dependências fora desta lista sem justificar via ADR
> em `docs/adr/NNNN-titulo.md`.

---

## 3. 📂 Estrutura de Pastas (obrigatória)

```
app/                     # Rotas Expo Router (file-based)
  (auth)/                # login, signup, recover, 2fa
  (manicure)/            # agenda, clients, commands
  (owner)/               # dashboard, manicures, reports
  (admin)/               # super admin
  _layout.tsx

src/
  components/
    ui/                  # primitivos: Button, Input, Card, Avatar, Tag
    features/            # componentes por feature
  hooks/                 # useClients, useAppointments, useAuth...
  services/              # firebase.ts, googleCalendar.ts, etc.
  stores/                # Zustand (sessionStore, uiStore...)
  schemas/               # Zod schemas (fonte da verdade dos tipos)
  types/                 # tipos globais derivados de Zod
  utils/
  constants/

functions/               # Cloud Functions
  src/
    auth/                # pós-cadastro, allowlist, 2FA
    calendar/            # OAuth, sync, webhooks, reconciliação
    notifications/       # FCM, helpers de envio
    audit/               # auditLogs helpers
    shared/              # utilitários compartilhados

docs/
  adr/                   # Architecture Decision Records
```

**Regras:**
- Componentes em `PascalCase.tsx`
- Hooks em `useCamelCase.ts`
- Schemas Zod em `kebab-case.schema.ts`
- Cloud Functions agrupadas por domínio

---

## 4. 🧱 Padrões de Código

### TypeScript
- `strict: true` sempre.
- **Proibido** `any` sem comentário `// eslint-disable-next-line` justificando.
- **Tipos derivados de Zod** sempre que possível:
  ```ts
  export const ClientSchema = z.object({ /* ... */ });
  export type Client = z.infer<typeof ClientSchema>;
  ```
- Use `interface` para contratos externos e `type` para uniões/utilitários.

### React / React Native
- Componentes **funcionais** com hooks (sem classes).
- **Custom hooks** para qualquer lógica reutilizável.
- Listas grandes: `FlatList` com `keyExtractor`, `getItemLayout` quando possível.
- Imagens: `expo-image` (não `Image` padrão).

### NativeWind
- Sempre `className`. Use cores **semânticas** do tema:
  `primary`, `secondary`, `accent`, `success`, `error`, `muted`.
- **Dark mode** funcional desde o início (`dark:` variants).

### Cloud Functions
- TypeScript estrito.
- Cada função em arquivo próprio + `index.ts` agregador.
- Sempre **validar input com Zod** antes de qualquer operação.
- Idempotência em triggers (use `eventId` ou flags).

### Commits (Conventional Commits)
```
feat(agenda): adicionar validação de conflito de horário
fix(calendar): renovar watch channel expirando em <2 dias
chore(deps): atualizar expo-router
docs(adr): adicionar ADR-0003 sobre criptografia de tokens
```

### Branches
- `main` (produção), `develop` (integração)
- `feature/<sprint>-<slug>`, `fix/<slug>`, `chore/<slug>`

---

## 5. 🔐 Segurança (regras inegociáveis)

1. **Nunca** logar tokens, senhas, refresh_tokens, e-mails completos ou PII.
2. **Refresh tokens do Google** sempre criptografados antes de gravar no Firestore.
3. **Regras Firestore** devem ser revistas a cada nova coleção/campo sensível.
4. **`auditLogs`** só pode ser escrito por Cloud Functions (`allow write: if false`
   nas regras client-side).
5. **Validação dupla**: cliente (Zod no RHF) **e** servidor (Zod na Function).
6. **Rate limiting** em endpoints sensíveis (login, 2FA, OAuth callback).
7. **Allowlist** para `super_admin` via variável de ambiente — nunca hardcoded.
8. **2FA obrigatório** para `super_admin` e `salon_owner`.
9. **LGPD**: ações sobre dados pessoais geram entrada em `auditLogs`.

---

## 6. 🗄️ Modelagem de Dados

Coleções oficiais (ver detalhes em `prompt.md` §5):

`salons`, `users`, `clients`, `appointments`, `commands`, `notifications`,
`auditLogs`, `syncQueue`.

**Índices compostos obrigatórios:**
- `appointments`: `salonId + startTime`, `manicureId + startTime`, `clientId + startTime`
- `notifications`: `userId + createdAt desc`, `userId + read + createdAt`
- `clients`: `salonId + name`, `salonId + lastVisit`
- `auditLogs`: `userId + timestamp`, `targetId + timestamp`

> Antes de adicionar campo a uma coleção, atualize o schema Zod correspondente
> em `src/schemas/` e as regras Firestore.

---

## 7. 📅 Integração Google Calendar — Cuidados Especiais

- **Nível 3** (calendário dedicado "NailFlow - [Nome]") criado na conexão.
- **syncToken** persistido em `users.googleCalendar.syncToken`.
- **Watch channels** expiram em 7 dias → Cloud Scheduler renova diariamente
  os que vencem em <2 dias.
- **Last-write-wins** com base em `updated`; conflitos vão para `auditLogs`.
- **Reconciliação** diária às 3h compara Firestore × Google.
- Toda alteração local dispara entrada em `syncQueue` antes de chamar a API.
- Trate `invalid_grant` / `token_revoked` notificando o usuário (tipo 6 de notificação).

---

## 8. 🔔 Notificações

6 tipos da Fase A (não adicionar novos sem aprovação):

1. Novo atendimento agendado
2. Atendimento cancelado
3. Atendimento remarcado
4. Lembrete pré-atendimento (30min configurável)
5. Erro de sincronização Google
6. Conexão Google expirou

**Regras:**
- Respeitar `notificationPreferences` do usuário.
- Respeitar horário "Não perturbe".
- Histórico de 90 dias na central in-app.
- Push via FCM + entrada em `notifications` (Firestore) sempre em par.

---

## 9. 🧪 Testes

- **Unit** (Vitest) — lógica crítica (validações, cálculos de comanda, sync).
- **E2E** (Maestro) — fluxos: login, criar atendimento, conectar Google,
  fechar comanda, receber push.
- **Functions** — testes unitários obrigatórios para cada trigger de sync.
- Cobertura mínima desejada: **70% em `src/services` e `functions/src`**.

Antes de abrir PR, o agente deve rodar:
```bash
pnpm lint
pnpm typecheck
pnpm test
```

---

## 10. ⚙️ Comandos Padrão

```bash
# Instalar dependências
pnpm install

# Rodar app
pnpm start              # Expo Dev Server
pnpm ios                # iOS Simulator
pnpm android            # Android Emulator

# Qualidade
pnpm lint               # ESLint
pnpm format             # Prettier
pnpm typecheck          # tsc --noEmit
pnpm test               # Vitest
pnpm test:e2e           # Maestro

# Cloud Functions
cd functions
pnpm build
pnpm serve              # emulador
pnpm deploy             # firebase deploy --only functions

# Firestore
pnpm firestore:rules    # deploy de regras
pnpm firestore:indexes  # deploy de índices
```

> Se um comando não existir ainda, **crie-o no `package.json`** seguindo este padrão.

---

## 11. 🚦 Workflow para o Agente

Ao receber uma tarefa, **siga esta ordem**:

1. **Identifique a Sprint** (0 a 10) e a tarefa no `planejamento.md`.
2. **Leia o trecho relevante** de `prompt.md` (documento mestre).
3. **Atualize/crie o schema Zod** antes do código de UI/serviço.
4. **Implemente serviço** (`src/services/*`) antes do hook.
5. **Implemente o hook** (`src/hooks/*`) antes da tela.
6. **Implemente a tela** consumindo o hook.
7. **Atualize regras Firestore e índices** se necessário.
8. **Escreva/atualize testes**.
9. **Rode `lint + typecheck + test`** — só então abra PR.
10. **Descreva no PR**: sprint, tarefa, SP, riscos, screenshots se UI.

---

## 12. 🚫 O Que NÃO Fazer

- ❌ Trocar a stack (React Native → Flutter, Firestore → Postgres etc.) sem ADR.
- ❌ Usar `style={{}}` quando `className` resolve.
- ❌ Criar coleções fora das 8 oficiais sem atualizar este documento.
- ❌ Acessar Firestore direto da UI; sempre via service + hook.
- ❌ Logar dados sensíveis (PII, tokens).
- ❌ Hardcode de e-mails da allowlist, chaves de API ou IDs do Firebase.
- ❌ Pular validação Zod (cliente OU servidor).
- ❌ Ignorar dark mode em telas novas.
- ❌ Commits sem Conventional Commits.
- ❌ Push direto em `main`.

---

## 13. 📋 Checklist Antes de Abrir PR

- [ ] Código respeita estrutura de pastas
- [ ] Schemas Zod atualizados
- [ ] Regras Firestore e índices revisados
- [ ] Validação dupla (cliente + servidor)
- [ ] Sem `any` injustificado
- [ ] Sem logs de dados sensíveis
- [ ] Dark mode ok
- [ ] Estados de loading / erro / vazio cobertos
- [ ] Testes adicionados/atualizados
- [ ] `lint + typecheck + test` passando
- [ ] PR descreve sprint, tarefa e impacto
- [ ] Screenshots/GIFs anexados (se UI)

---

## 14. 📚 Referências Internas

- `prompt.md` — Documento mestre do produto (fonte da verdade)
- `planejamento.md` — Plano ágil com 10 sprints
- `nailflow-infraestrutura.md` — Discussão de stack/infra alternativa
- `docs/adr/` — Decisões arquiteturais versionadas

---

## 15. 🤖 Identidade dos Agentes

- O agente principal de planejamento é **Claude Opus 4.7 (Anthropic)**.
- Outros agentes podem participar, mas devem **seguir estritamente este `AGENTS.md`**.
- Em caso de dúvida ou ambiguidade: **pergunte ao Ariel antes de assumir**.

---

*Última atualização: Maio/2026 — mantenha este arquivo vivo. Toda mudança estrutural
no projeto deve refletir aqui no mesmo PR.*
