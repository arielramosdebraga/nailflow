# AGENTS.md - Guia para Agentes de IA no NailFlow

> Projeto: NailFlow  
> Fase atual: Fase A / piloto e estabilizacao pos-Sprint 10  
> Stack: Expo SDK 56 + React Native + TypeScript + Firebase  
> Ultima atualizacao: 05/06/2026

Este documento orienta agentes de IA a contribuir com o repositorio de forma consistente, segura e alinhada ao estado real do projeto.

---

## 1. Contexto do projeto

O NailFlow e um app mobile multiplataforma para gestao de saloes de manicure. A Fase A usa Expo/React Native e Firebase para validar o piloto com velocidade e baixo atrito.

Recursos principais:

- autenticacao Firebase;
- RBAC por perfil;
- agenda e atendimentos;
- clientes;
- comandas;
- notificacoes in-app/push;
- auditoria e LGPD;
- sincronizacao Google Calendar via Cloud Functions;
- builds internas via EAS.

O Expo Go nao e alvo de testes do piloto. Use APK/development build.

---

## 2. Stack oficial

Fonte vencedora: `package.json`, `functions/package.json`, `app.config.ts`, `eas.json`.

### App

- Expo SDK `~56.0.8`
- React Native `0.85.3`
- React `19.2.3`
- Expo Router `^56.2.8`
- TypeScript `~6.0.3`
- NativeWind `^4.2.4`
- Zustand `^5.0.13`
- TanStack Query `^5.100.14`
- React Hook Form + Zod
- Firebase JS SDK `^12.13.0`
- React Native Firebase `^24.0.0`
- `expo-notifications`, `expo-auth-session`, `expo-secure-store`

### Backend

- Firebase Authentication
- Cloud Firestore
- Cloud Functions for Firebase
- Firebase Cloud Messaging / Expo Push
- Firebase Storage como dependencia do app
- Node `22` em Functions
- `firebase-admin ^13.6.0`
- `firebase-functions ^7.0.0`
- `googleapis ^173.0.0`

### Build e release

- EAS Build com perfis `development`, `preview`, `pilot`, `production`
- `autoIncrement: true` nos perfis de build
- Android SDK/API 36 conforme Expo SDK 56
- JDK 21 LTS recomendado localmente

Antes de alteracoes estruturais em Expo, consultar a documentacao versionada:

- https://docs.expo.dev/versions/v56.0.0/

---

## 3. Perfis e RBAC

Roles canonicas:

- `super_admin` - governanca global, auditoria, saloes, usuarios e configuracoes.
- `salon_owner` - gestao do salao, equipe, agenda consolidada e comandas.
- `nail_technician` - profissional, agenda propria, clientes e atendimentos.

Legado:

- `manicure` ainda pode aparecer como role/termo legado e deve ser normalizado para `nail_technician`.
- Campos tecnicos como `manicureId` continuam em `appointments`, `commands` e sync Google ate uma migracao dedicada.

Regras de rota:

- Admin: apenas `super_admin`.
- Owner: `salon_owner` e `super_admin`.
- Nail technician: `nail_technician`, `salon_owner` e `super_admin`.
- Sessao `pending_2fa` redireciona para `/2fa`.

2FA:

- Produto espera 2FA para perfis administrativos.
- Implementacao atual so bloqueia quando `twoFactor.totp.enabled === true` no perfil.
- Enrollment/validacao TOTP real dependem de Functions publicadas.

---

## 4. Estrutura de pastas

```text
app/
  (auth)/
  (nail-technician)/
  (owner)/
  (admin)/
  google-calendar/

src/
  components/
  hooks/
  providers/
  schemas/
  services/
  stores/
  utils/

functions/
  src/
    admin/
    audit/
    auth/
    google/
    notifications/
    salons/
    shared/

docs/
  adr/
  sdd-harness/
```

Regras:

- UI em `app/**`.
- Reuso visual em `src/components/**`.
- Logica de tela em `src/hooks/**`.
- Acesso a Firebase e APIs em `src/services/**`.
- Contratos em `src/schemas/**`.
- Cloud Functions em `functions/src/**`.

Evite acesso direto ao Firestore dentro de telas. Use service + hook.

---

## 5. Modelagem de dados

Collections operacionais:

- `salons`
- `users`
- `clients`
- `appointments`
- `commands`
- `notifications`
- `auditLogs`
- `syncQueue`
- `syncQueueDeadLetter`

`syncQueueDeadLetter` e uma collection operacional oficializada para falhas recorrentes de sincronizacao Google Calendar.

Regras importantes:

- `salonId` isola dados multi-salao.
- `auditLogs` nao deve ser escrito pelo cliente.
- filas de sync nao devem ser manipuladas diretamente pelo app.
- notificacoes so podem ser lidas pelo proprio usuario ou `super_admin`.
- novas collections ou campos sensiveis exigem update de schema, rules, indexes e docs.

Indices compostos ficam em `firestore.indexes.json`. Consulte esse arquivo como fonte da verdade antes de mudar queries.

---

## 6. Cloud Functions

Regiao padrao:

- `southamerica-east1`

Exports principais:

- `health`
- `onUserCreated`
- `createSalon`
- `exportLgpdData`
- `getGlobalDashboard`
- TOTP callables
- Google Calendar callables
- appointment triggers para sync Google
- Google webhook
- sync queue worker
- schedulers de watch/reconciliacao
- notification triggers/scheduler

Deploy:

```bash
npx firebase-tools deploy --only functions --project nailflow-8776c
```

Pendencia real:

- Deploy de Functions exige Firebase Blaze.
- Sem Blaze, 2FA real, Google Calendar real, LGPD callable, triggers e schedulers nao ficam publicados.

---

## 7. Google Calendar

Implementacao:

- OAuth/callables em `functions/src/google/callables.ts`.
- App -> Google em `functions/src/google/appointment-triggers.ts`.
- Google -> App via `functions/src/google/watch-webhook.ts`.
- Sync incremental em `functions/src/google/inbound-sync.ts`.
- Fila em `functions/src/google/sync-queue.ts`.
- Dead-letter em `syncQueueDeadLetter`.
- Renovacao/reconciliacao em `functions/src/google/watch-scheduler.ts`.

Configuracao:

- `GOOGLE_CALENDAR_WATCH_RENEW_AHEAD_SECONDS` controla janela de renovacao.
- Valor padrao documentado no `.env.template`: `21600` segundos (6 horas).

Sem Functions publicadas, a tela deve informar indisponibilidade do backend sem quebrar navegacao.

---

## 8. Notificacoes

O app usa notificacoes in-app via Firestore e push via Expo/FCM conforme ambiente e token disponivel.

Regras:

- Respeitar preferencias do usuario.
- Respeitar horario de nao perturbe.
- Registrar in-app mesmo quando push nao for enviado por preferencia/ambiente.
- Usar `expiresAt`/filtros para retencao logica.
- TTL gerenciado do Firestore nao esta versionado em `fieldOverrides`.

Push remoto nao deve ser validado no Expo Go.

---

## 9. Qualidade e testes

Comandos obrigatorios apos mudancas:

```bash
pnpm typecheck
pnpm lint
pnpm test
```

Comandos complementares:

```bash
pnpm test:coverage
pnpm test:integration
pnpm test:e2e
pnpm --dir functions lint
pnpm --dir functions build
npx expo-doctor
```

Quando usar:

- `npx expo-doctor`: mudancas em Expo, dependencias, config, EAS ou build.
- `pnpm test:integration`: rules/callables/emulador Firebase.
- `pnpm test:e2e`: smoke manual automatizado com Maestro instalado.

CI atual:

- lint;
- typecheck;
- unit tests;
- coverage;
- functions lint;
- functions build.

`test:integration` existe, mas ainda nao roda no CI.

---

## 10. Git e PR

Idioma:

- codigo e nomes tecnicos em ingles;
- textos visiveis no app em portugues;
- commits, PRs, reviews e comentarios em portugues.

Commits:

```text
<tipo>(<escopo>): <resumo curto>

O que foi feito:
- ...

Por que foi feito:
- ...
```

Branches:

- sprint: `Sprint-X-descricao-curta`;
- estabilizacao excepcional: branch curta e clara, como `fix-tests`;
- PR sempre para `develop`.

Todo commit em PR aberto deve vir acompanhado de atualizacao da descricao do PR.

---

## 11. Segurança

- Nunca expor `.env`, service account, tokens, refresh tokens ou secrets.
- Nao logar PII desnecessaria.
- Usar menor privilegio em Firestore rules.
- Validar input com Zod no cliente e no backend quando aplicavel.
- Revisar rules/indexes ao alterar dados sensiveis.
- Decisao de billing/Blaze deve ser feita pelo owner, nunca automaticamente por agente.

---

## 12. Ordem recomendada para tarefas

1. Ler `AGENTS.md` da raiz.
2. Ler este arquivo.
3. Ler `docs/handoff-desenvolvimento.md`.
4. Conferir `docs/sdd-harness/00-contexto-repo.md`.
5. Identificar arquivos reais no codigo.
6. Implementar ponta a ponta quando aplicavel.
7. Atualizar docs se mudar contexto, ambiente, dados ou fluxo.
8. Rodar validacoes.
9. Commitar em portugues com corpo obrigatorio.
10. Atualizar PR se houver PR aberto.

---

## 13. O que nao fazer

- Nao usar Expo Go como alvo de validacao do piloto.
- Nao criar rotas relativas `./` ou `../` em fluxos Expo Router; prefira rotas absolutas tipadas.
- Nao trocar stack sem ADR.
- Nao criar collection nova sem schema/rules/indexes/docs.
- Nao ativar Blaze/billing por conta propria.
- Nao versionar segredos.
- Nao fazer push direto em `main`.
