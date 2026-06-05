# Handoff de Desenvolvimento - NailFlow

> Ultima atualizacao: 05/06/2026  
> Branch base atual: `develop`  
> Branch documental desta revisao: `docs-atualizar-contexto-projeto`  
> PR de testes mais recente: `#13`, mergeado em `develop` em 05/06/2026  
> Objetivo: permitir que outra pessoa continue desenvolvimento, testes e operacao do piloto sem depender do historico da conversa.

---

## 1. Resumo executivo

O NailFlow e um app mobile em `Expo + React Native + TypeScript + Firebase` para operacao de salao, com:

- autenticacao por e-mail/senha e Google;
- RBAC por perfil (`super_admin`, `salon_owner`, `nail_technician`);
- 2FA TOTP para perfis administrativos quando habilitado no perfil;
- agenda, atendimentos, clientes e comandas;
- sincronizacao Google Calendar via Cloud Functions;
- central de notificacoes in-app e push;
- auditoria administrativa e exportacao LGPD;
- builds internas via EAS.

O desenvolvimento principal da Sprint 10 foi incorporado. A branch `fix-tests` foi mergeada em `develop` e concentrou estabilizacao de testes manuais do APK, correcao de navegacao, indices Firestore, seed de dados e ajustes de ambiente.

---

## 2. Situacao atual

### Git

- Branch integrada mais recente: `fix-tests`
- Base: `develop`
- PR mergeado: `#13` - `fix-tests: estabilizar APK e ambiente de testes`
- Merge em `develop`: `7a1a2eb`
- Ultimo commit da branch antes do merge: `7da07de fix(testes): estabilizar navegacao e dados de teste`

### Build Android de teste

- Perfil EAS: `preview`
- Distribuicao: `internal`
- Ultima build Android conhecida: `95bf855a-29e4-447c-9caf-4d4865358d2a`
- Status confirmado em 05/06/2026: `FINISHED`
- Versao do app: `1.0.0`
- `appBuildVersion`: `3`
- Commit da build: `7da07ded678c0ef4b795c23387ff82f1741da5e2`
- Pagina da build: `https://expo.dev/accounts/guhzynhuh/projects/nailflow/builds/95bf855a-29e4-447c-9caf-4d4865358d2a`

Nao usar Expo Go para os testes principais. O projeto usa recursos nativos e push que exigem development build ou APK gerado.

### Firebase

- Projeto usado no ambiente de testes: `nailflow-8776c`
- Firestore rules/indexes estao versionados.
- Indices Firestore foram publicados com sucesso para o ambiente de testes.
- Seed de dados de teste foi executado com sucesso via `pnpm seed:test-accounts`.
- Deploy de Cloud Functions esta bloqueado enquanto o projeto Firebase nao estiver no plano Blaze.

---

## 3. Pendencias reais

### Bloqueio por Blaze

O deploy de Functions falhou porque o Firebase precisa habilitar APIs como Cloud Build e Artifact Registry. Isso exige projeto no plano Blaze/pay-as-you-go.

Enquanto Blaze nao for ativado:

- `getGlobalDashboard` nao fica publicado, mas o app tem fallback client-side via Firestore para o dashboard admin.
- 2FA TOTP real via callable nao fica publicado.
- Google Calendar OAuth/sync/webhook/reconciliacao nao ficam publicados.
- Triggers e schedulers de notificacoes/backend nao ficam publicados.
- Exportacao LGPD via callable depende de Functions publicadas.

Fluxos que ainda podem ser testados sem Blaze:

- login Firebase Auth;
- roteamento por perfil;
- CRUD e consultas Firestore client-side permitidas por regras;
- clientes, atendimentos, comandas e notificacoes in-app com dados seedados;
- navegacao principal do APK.

### Testes manuais do APK

Prioridade do momento:

1. Instalar APK interno da ultima build EAS.
2. Testar perfis `manicure.teste@nailflow.app`, `owner.teste@nailflow.app` e `admin.teste@nailflow.app`.
3. Registrar bugs em `fix-tests`.
4. Para cada nova build, manter incremento automatico de versao pelo EAS (`autoIncrement: true`).

---

## 4. Stack e versoes

Fonte vencedora: `package.json`, `functions/package.json`, `app.config.ts`, `eas.json` e documentacao Expo SDK 56.

| Item | Versao/configuracao |
|---|---|
| Expo SDK | `~56.0.8` |
| React Native | `0.85.3` |
| React | `19.2.3` |
| Expo Router | `^56.2.8` com `typedRoutes: true` |
| TypeScript | `~6.0.3` |
| Firebase JS SDK | `^12.13.0` |
| Cloud Functions runtime | `node: 22` |
| JDK local recomendado | JDK 21 LTS |
| Node minimo pelo Expo SDK 56 | `22.13.x` |
| Android SDK alvo pelo Expo SDK 56 | `compileSdkVersion/targetSdkVersion 36` |

Antes de alteracoes estruturais em Expo, consultar:

- https://docs.expo.dev/versions/v56.0.0/

---

## 5. Estrutura do repositorio

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
scripts/
```

Regra de camadas:

- telas em `app/**`;
- hooks em `src/hooks/**`;
- acesso a Firebase em `src/services/**`;
- contratos em `src/schemas/**`;
- backend server-side em `functions/src/**`.

---

## 6. Perfis e dados de teste

Script:

```bash
pnpm seed:test-accounts
```

Contas criadas/atualizadas:

| Perfil | E-mail | Role |
|---|---|---|
| Profissional | `manicure.teste@nailflow.app` | `nail_technician` |
| Dono do salao | `owner.teste@nailflow.app` | `salon_owner` |
| Admin global | `admin.teste@nailflow.app` | `super_admin` |

Senha padrao:

```text
Nailflow@123
```

ou o valor de `TEST_ACCOUNT_PASSWORD`.

Entidades criadas pelo seed:

- `salons/salon-teste-001`
- `clients/client-teste-001`
- `appointments/appointment-teste-001`
- `commands/command-teste-aberta-001`
- `commands/command-teste-fechada-001`
- notificacoes por perfil
- `auditLogs/audit-log-teste-001`
- `syncQueueDeadLetter/sync-dead-letter-teste-001`

---

## 7. Comandos canonicos

### Instalar dependencias

```bash
pnpm install
```

### Desenvolvimento

```bash
pnpm start
pnpm android
pnpm ios
pnpm web
```

### Qualidade obrigatoria

```bash
pnpm typecheck
pnpm lint
pnpm test
```

### Validacoes complementares

```bash
pnpm test:coverage
pnpm test:integration
pnpm --dir functions lint
pnpm --dir functions build
npx expo-doctor
```

### Firebase

```bash
npx firebase-tools deploy --only firestore:indexes --project nailflow-8776c
npx firebase-tools deploy --only functions --project nailflow-8776c
```

Observacao: o deploy de Functions exige Blaze no projeto Firebase.

### EAS

```bash
pnpm release:preflight
pnpm build:preview:android
pnpm build:preview:ios
pnpm build:pilot:all
pnpm build:production:all
```

---

## 8. Variaveis de ambiente

Usar `.env.template` como baseline. Nao versionar `.env` nem credenciais.

Variaveis publicas do app:

- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID`
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_CALENDAR_BEGIN_CALLABLE`
- `EXPO_PUBLIC_GOOGLE_CALENDAR_CONFIRM_CALLABLE`
- `EXPO_PUBLIC_EAS_PROJECT_ID`
- `EXPO_PUBLIC_FUNCTIONS_HEALTH_URL`

Variaveis de release:

- `EXPO_OWNER`
- `NAILFLOW_IOS_BUNDLE_IDENTIFIER`
- `NAILFLOW_ANDROID_PACKAGE`
- `NAILFLOW_IOS_BUILD_NUMBER`
- `NAILFLOW_ANDROID_VERSION_CODE`

Variaveis de Functions:

- `GOOGLE_CALENDAR_CLIENT_ID`
- `GOOGLE_CALENDAR_CLIENT_SECRET`
- `GOOGLE_CALENDAR_REDIRECT_URI`
- `GOOGLE_TOKEN_ENCRYPTION_SECRET`
- `GOOGLE_CALENDAR_STATE_TTL_SECONDS`
- `GOOGLE_CALENDAR_WEBHOOK_URL`
- `GOOGLE_CALENDAR_WATCH_TOKEN_SECRET`
- `GOOGLE_CALENDAR_WATCH_RENEW_AHEAD_SECONDS`
- `GOOGLE_CALENDAR_RECONCILE_LOOKBACK_DAYS`
- `SUPER_ADMIN_ALLOWLIST`
- `TOTP_ISSUER`
- `SCHEDULER_TIMEZONE`
- `TEST_ACCOUNT_PASSWORD`

---

## 9. Cloud Functions exportadas

Arquivo agregador: `functions/src/index.ts`.

Functions principais:

- `health`
- `onUserCreated`
- `createSalon`
- `exportLgpdData`
- `getGlobalDashboard`
- `getTotpStatus`
- `beginTotpEnrollment`
- `confirmTotpEnrollment`
- `verifyTotpCode`
- `getGoogleCalendarStatus`
- `beginGoogleCalendarConnection`
- `completeGoogleCalendarConnection`
- `refreshGoogleCalendarWatch`
- `onAppointmentCreatedSyncGoogleCalendar`
- `onAppointmentUpdatedSyncGoogleCalendar`
- `onAppointmentDeletedSyncGoogleCalendar`
- `receiveGoogleCalendarWatchWebhook`
- `onGoogleCalendarSyncQueueCreated`
- `renewGoogleCalendarWatchChannels`
- `reconcileGoogleCalendarAtNight`
- `onAppointmentCreatedNotifyUsers`
- `onAppointmentUpdatedNotifyUsers`
- `onUserGoogleStatusUpdatedNotifyUsers`
- `sendPreReminderNotifications`

Regiao global configurada:

- `southamerica-east1`

---

## 10. Regras e convencoes

- Codigo e nomes tecnicos em ingles.
- Textos visiveis no app em portugues (pt-BR).
- Commits, PRs, reviews e comentarios em portugues.
- Branches de sprint usam `Sprint-X-descricao-curta`.
- A branch `fix-tests` foi uma excecao operacional de estabilizacao e ja foi mergeada.
- Usar rotas absolutas tipadas com `Href` no Expo Router; evitar `./` e `../` em navegacao.
- Nao usar Expo Go como alvo de testes.
- Nunca expor segredos, tokens, service account ou valores reais de `.env`.

---

## 11. Leitura recomendada

Ordem sugerida para retomar contexto:

1. `AGENTS.md`
2. `README.md`
3. `docs/AGENTS.md`
4. `docs/handoff-desenvolvimento.md`
5. `docs/guia-de-uso-piloto.md`
6. `docs/release-operacional.md`
7. `docs/sdd-harness/00-contexto-repo.md`
8. `docs/sdd-harness/harness.md`
9. `docs/sdd-harness/auditoria-consistencia.md`

---

## 12. Resumo final

O projeto esta em fase de estabilizacao de testes por APK. A principal pendencia externa e ativar Blaze no Firebase para publicar Functions e validar backend completo de 2FA, Google Calendar, schedulers, triggers e LGPD. Sem Blaze, continuar testando navegacao, auth, Firestore, dados seedados e fluxos client-side no APK `preview`.
