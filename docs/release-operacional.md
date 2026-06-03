# Release Operacional - Sprint 10

## Objetivo
Padronizar o preparo de builds internas e de produção do NailFlow usando EAS, com checklist simples para reduzir erro operacional no piloto.

## Artefatos versionados
- `app.config.ts`
- `eas.json`
- `.env.example`
- `scripts/release-preflight.mjs`

## Variáveis mínimas para release

### App / EAS
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
- `EXPO_PUBLIC_FUNCTIONS_HEALTH_URL`
- `NAILFLOW_IOS_BUNDLE_IDENTIFIER`
- `NAILFLOW_ANDROID_PACKAGE`
- `NAILFLOW_IOS_BUILD_NUMBER`
- `NAILFLOW_ANDROID_VERSION_CODE`

### Functions / Firebase
- `GOOGLE_CALENDAR_CLIENT_ID`
- `GOOGLE_CALENDAR_CLIENT_SECRET`
- `GOOGLE_CALENDAR_REDIRECT_URI`
- `GOOGLE_TOKEN_ENCRYPTION_SECRET`
- `GOOGLE_CALENDAR_WEBHOOK_URL`
- `GOOGLE_CALENDAR_WATCH_TOKEN_SECRET`
- `SUPER_ADMIN_ALLOWLIST`
- `TOTP_ISSUER`
- `SCHEDULER_TIMEZONE`
- `TEST_ACCOUNT_PASSWORD`

## Passo a passo recomendado
1. Preencher `.env` local a partir de `.env.example`.
2. Sincronizar variáveis remotas do EAS:
   - `pnpm release:env:pull:preview`
   - `pnpm release:env:pull:production`
3. Rodar preflight:
   - `pnpm release:preflight`
4. Validar qualidade antes do build:
   - `pnpm lint`
   - `pnpm typecheck`
   - `pnpm test`
   - `pnpm --dir functions lint`
   - `pnpm --dir functions build`
5. Gerar build interna:
   - Android: `pnpm build:preview:android`
   - iOS: `pnpm build:preview:ios`
   - Piloto completo: `pnpm build:pilot:all`
6. Quando houver go/no-go para loja:
   - `pnpm build:production:all`
   - `pnpm submit:production:ios`
   - `pnpm submit:production:android`

## Checklist de piloto
- [ ] Health endpoint das functions respondendo com `ok: true`
- [ ] Login por e-mail funcionando
- [ ] 2FA obrigatório para `super_admin` e `salon_owner`
- [ ] Google Calendar conectando e sincronizando
- [ ] Push token registrando com `EXPO_PUBLIC_EAS_PROJECT_ID`
- [ ] Exportação LGPD gerando pacote no painel do `super_admin`
- [ ] Configurações globais exibindo readiness sem erros

## Limites desta entrega
- A geração dos binários continua dependendo de credenciais e contas externas no EAS/App Store/Google Play.
- Distribuição interna, onboarding presencial e coleta de feedback permanecem operacionais e manuais.
