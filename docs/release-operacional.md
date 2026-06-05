# Release Operacional - NailFlow

## Objetivo

Padronizar o preparo de APKs internos e builds de producao do NailFlow usando EAS, reduzindo erro operacional durante piloto e deixando claro o que depende de Firebase Blaze.

## Artefatos versionados

- `app.config.ts`
- `app.json`
- `eas.json`
- `.env.template`
- `scripts/release-preflight.mjs`
- `firebase.json`
- `firestore.rules`
- `firestore.indexes.json`

## Premissas

- O piloto Android usa APK gerado por EAS, nao Expo Go.
- `app.config.ts` e a fonte efetiva da configuracao Expo.
- `eas.json` usa `appVersionSource: remote`.
- Perfis EAS `development`, `preview`, `pilot` e `production` usam `autoIncrement: true`.
- O deploy de Cloud Functions exige Firebase no plano Blaze.
- Indices Firestore podem ser publicados sem Blaze, desde que o projeto Firebase esteja acessivel pela CLI.

## Pre-requisitos locais

- Node.js 22.13.x ou superior dentro da faixa suportada pelo Expo SDK 56.
- pnpm instalado.
- JDK 21 LTS para build Android local/Gradle quando necessario.
- Android Studio com Android SDK/API 36 para build local ou emulador.
- Login EAS para builds remotas:
  - `npx eas-cli@latest login`
- Firebase CLI autenticado para deploy de rules/indexes/functions:
  - `npx firebase-tools login`

## Variaveis do app

Obrigatorias para app e build:

- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- `EXPO_PUBLIC_EAS_PROJECT_ID`

Recomendadas/operacionais:

- `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID`
- `EXPO_PUBLIC_GOOGLE_CALENDAR_BEGIN_CALLABLE`
- `EXPO_PUBLIC_GOOGLE_CALENDAR_CONFIRM_CALLABLE`
- `EXPO_PUBLIC_FUNCTIONS_HEALTH_URL`
- `EXPO_OWNER`
- `NAILFLOW_IOS_BUNDLE_IDENTIFIER`
- `NAILFLOW_ANDROID_PACKAGE`
- `NAILFLOW_IOS_BUILD_NUMBER`
- `NAILFLOW_ANDROID_VERSION_CODE`

## Variaveis de Functions

Necessarias para backend completo:

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

Nao registrar valores reais em docs, commits, PRs ou logs.

## Passo a passo Android preview

1. Atualizar `.env` local a partir de `.env.template`.
2. Rodar preflight:

```bash
pnpm release:preflight
```

3. Rodar validacoes:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm test:coverage
pnpm --dir functions build
npx expo-doctor
```

4. Publicar indices se houve mudanca em `firestore.indexes.json`:

```bash
npx firebase-tools deploy --only firestore:indexes --project nailflow-8776c
```

5. Gerar APK Android interno:

```bash
pnpm build:preview:android
```

6. Acompanhar no dashboard EAS:

```text
https://expo.dev/accounts/guhzynhuh/projects/nailflow/builds
```

7. Instalar o APK no aparelho e rodar checklist de `docs/guia-de-uso-piloto.md`.

## Passo a passo Functions

Executar build local:

```bash
pnpm --dir functions build
```

Deploy:

```bash
npx firebase-tools deploy --only functions --project nailflow-8776c
```

Se falhar com erro de `cloudbuild.googleapis.com` ou `artifactregistry.googleapis.com`, a causa esperada e o projeto Firebase ainda nao estar no plano Blaze.

Depois do deploy, validar:

- `health` responde `ok: true`;
- callables de 2FA respondem;
- callables Google Calendar respondem;
- schedulers/triggers aparecem no Firebase Console;
- app nao mostra mensagens de Function ausente.

## Build de referencia

Build Android preview mais recente conhecida:

- ID: `95bf855a-29e4-447c-9caf-4d4865358d2a`
- Status: `FINISHED`
- Commit: `7da07de`
- `appBuildVersion`: `3`
- URL: `https://expo.dev/accounts/guhzynhuh/projects/nailflow/builds/95bf855a-29e4-447c-9caf-4d4865358d2a`

Evite documentar link direto do artifact como fonte canonica, porque URLs de artifact podem expirar.

## Checklist de piloto

- [ ] APK instalado em aparelho real.
- [ ] Login por e-mail funcionando.
- [ ] Perfis seedados redirecionam corretamente.
- [ ] Clientes, agenda e comandas abrem sem `Unmatched Route`.
- [ ] Notificacoes in-app abrem sem erro de indice.
- [ ] Dashboard admin usa fallback Firestore quando Functions nao estao publicadas.
- [ ] 2FA real validado somente apos deploy de Functions.
- [ ] Google Calendar real validado somente apos deploy de Functions.
- [ ] Exportacao LGPD validada somente apos deploy de Functions.

## Limites desta entrega

- Blaze e uma decisao de billing e nao deve ser ativado automaticamente por agente.
- Sem Blaze, Functions nao sao publicadas e parte do backend fica indisponivel.
- Distribuicao interna, onboarding presencial e coleta de feedback permanecem atividades operacionais fora do repositorio.
