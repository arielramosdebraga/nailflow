# Constitution - NailFlow

Fonte obrigatoria: `docs/sdd-harness/00-contexto-repo.md`.

## 1. Principios inegociaveis

### Regras existentes com evidencia
1. TypeScript faz parte da base do projeto.
   - Evidencia: `package.json`, `tsconfig.json`, `pnpm typecheck`.

2. A Fase A usa Firebase + Expo.
   - Evidencia: `docs/adr/ADR-0001-estrategia-stack-duas-fases.md`, `package.json`, `firebase.json`.

3. O acesso a dados no app passa por services e hooks.
   - Evidencia: `src/services/**`, `src/hooks/**`, rotas em `app/**`.

4. Schemas Zod existem para entidades centrais.
   - Evidencia: `src/schemas/**`.

5. 2FA e obrigatorio para papeis administrativos.
   - Evidencia: `src/stores/sessionStore.ts`, `src/hooks/auth/useTotpAuth.ts`, `functions/src/auth/totp-callables.ts`.

6. Segredos nao devem ser versionados.
   - Evidencia: `.gitignore`, `.env.example`, `docs/release-operacional.md`.

### Regras sugeridas por lacuna
1. `SUGERIDA`: criar testes automatizados especificos para 2FA administrativo.
   - Motivo: `00-contexto-repo.md` marca criterios de aceite de 2FA sem teste dedicado.

2. `SUGERIDA`: adicionar coverage thresholds no `vitest.config.ts`.
   - Motivo: `00-contexto-repo.md` registra ausencia de META de cobertura.

## 2. Restricoes de arquitetura

### Existentes
1. Backend serverless na Fase A.
   - Evidencia: `functions/src/**`, `firebase.json`, `docs/adr/ADR-0001-estrategia-stack-duas-fases.md`.

2. Cloud Functions ficam em `functions/`.
   - Evidencia: `firebase.json`, `functions/package.json`.

3. Firestore e a base de dados operacional da Fase A.
   - Evidencia: `firestore.rules`, `firestore.indexes.json`, `src/services/**`.

4. Stack Postgres/NestJS/Next.js pertence a Fase B.
   - Evidencia: `docs/adr/ADR-0001-estrategia-stack-duas-fases.md`, `docs/handoff-fase-b.md`.

5. Papel canonico do profissional e `nail_technician`.
   - Evidencia: `src/schemas/users/user.schema.ts`, `docs/handoff-fase-b.md`.

### Divergencias e lacunas
1. `⚠️ [DIVERGENCIA]` Instrucoes citam 8 colecoes oficiais, mas o repositorio usa tambem `syncQueueDeadLetter`.
   - Evidencia: `firestore.rules`, `firestore.indexes.json`.

2. `⚠️ [DIVERGENCIA]` `manicure` ainda existe como papel/termo legado aceito e como campo tecnico `manicureId`.
   - Evidencia: `firestore.rules`, `functions/src/shared/user-context.ts`, `src/schemas/users/user.schema.ts`.

## 3. Padroes de qualidade

### Gates existentes
1. CI em PR roda lint, typecheck, test e build de functions.
   - Evidencia: `.github/workflows/ci.yml`.

2. Pre-commit roda lint-staged e typecheck.
   - Evidencia: `.husky/pre-commit`, `.lintstagedrc.cjs`.

3. Testes unitarios existem para schemas, services e helpers de functions.
   - Evidencia: arquivos `*.test.ts` listados em `00-contexto-repo.md`.

4. E2E Maestro existe para smoke de autenticacao.
   - Evidencia: `.maestro/auth-smoke.yaml`, `scripts/run-maestro.mjs`.

### Lacunas vinculantes do harness
1. `⚠️ [LACUNA]` Coverage META nao existe em `vitest.config.ts`.
2. `⚠️ [LACUNA]` Coverage ATUAL nao existe porque `coverage/coverage-summary.json` nao foi encontrado.
3. `⚠️ [LACUNA]` Nao ha teste de integracao com emulador Firebase.
4. `⚠️ [LACUNA]` E2E cobre auth, mas nao todos os fluxos do piloto.

## 4. DoD do harness

| Gate | Status atual | Regra |
|---|---|---|
| G1 | Parcial / nao cumprido | Feature critica so deve fechar quando todo CA critico tiver teste mapeado |
| G2 | Nao cumprido | CI deve falhar quando cobertura atual ficar abaixo da meta configurada |
| G3 | Nao cumprido | Piramide deve ter unit, integracao e E2E |
| G4 | Cumprido | PR deve rodar lint, typecheck, test e build |
| G5 | Nao cumprido | Functions devem ter integracao contra emulador |
| G6 | Parcial | Fluxos criticos do piloto devem ter flows Maestro |
| G7 | Cumprido | Pre-commit deve bloquear lint/typecheck |
