# Constitution - NailFlow

Fonte obrigatoria: `docs/sdd-harness/00-contexto-repo.md`.

## 1. Principios inegociaveis

1. A Fase A usa Expo + Firebase.
   - Evidencia: `package.json`, `firebase.json`, `docs/adr/ADR-0001-estrategia-stack-duas-fases.md`.

2. Alteracoes estruturais em Expo devem considerar a documentacao versionada do SDK 56.
   - Evidencia: `AGENTS.md`, `docs/adr/ADR-0002-upgrade-expo-sdk-52-56.md`.

3. TypeScript strict faz parte da base do projeto.
   - Evidencia: `tsconfig.json`, `pnpm typecheck`.

4. Acesso a dados no app deve passar por services/hooks.
   - Evidencia: `src/services/**`, `src/hooks/**`.

5. Schemas Zod sao fonte de contratos das entidades centrais.
   - Evidencia: `src/schemas/**`.

6. Segredos nunca devem ser versionados.
   - Evidencia: `.gitignore`, `.env.template`, `docs/release-operacional.md`.

7. Expo Go nao e alvo de validacao do piloto.
   - Evidencia: `docs/guia-de-uso-piloto.md`.

8. Decisoes de billing/Blaze pertencem ao owner.
   - Evidencia: `docs/release-operacional.md`, `docs/handoff-desenvolvimento.md`.

## 2. Restricoes de arquitetura

1. Backend da Fase A e serverless em Firebase.
   - Evidencia: `functions/src/**`, `firebase.json`.

2. Cloud Functions ficam em `functions/`.
   - Evidencia: `functions/package.json`, `functions/src/index.ts`.

3. Firestore e a base operacional da Fase A.
   - Evidencia: `firestore.rules`, `firestore.indexes.json`.

4. Stack PostgreSQL/NestJS/Next.js pertence a Fase B.
   - Evidencia: `docs/nailflow-infraestrutura.md`, `docs/handoff-fase-b.md`.

5. Papel canonico do profissional e `nail_technician`.
   - Evidencia: `src/schemas/users/user.schema.ts`.

6. `manicure` e `manicureId` sao legado/compatibilidade ate migracao dedicada.
   - Evidencia: `docs/adr/ADR-0004-nail-technician-legado-manicure.md`.

7. `syncQueueDeadLetter` e collection operacional oficial.
   - Evidencia: `docs/adr/ADR-0003-sync-queue-dead-letter.md`.

## 3. Padroes de qualidade

Gates existentes:

- CI roda lint, typecheck, unit tests, coverage, functions lint e functions build.
- Pre-commit roda lint-staged e typecheck.
- Unitarios cobrem schemas, services e helpers de Functions.
- Integracao Firebase existe localmente com emuladores.
- E2E Maestro existe como smoke por fluxo.

Lacunas atuais:

- Integracao Firebase ainda nao roda no CI.
- E2E ainda e smoke e nao jornada completa.
- Coverage thresholds existem, mas sao graduais e baixos.
- Deploy de Functions nao foi comprovado em ambiente real por bloqueio Blaze.

## 4. DoD do harness

| Gate | Status atual | Regra |
|---|---|---|
| G1 | Parcial | CAs criticos devem manter teste unitario, integracao ou E2E mapeado |
| G2 | Cumprido gradual | Coverage deve rodar no CI e thresholds devem evoluir |
| G3 | Parcial | Unit, integracao e E2E existem; integracao deve entrar no CI |
| G4 | Cumprido | PR deve manter lint/typecheck/test/coverage/functions build verdes |
| G5 | Parcial | Rules/callables criticas devem ter cobertura em emulador |
| G6 | Parcial | Fluxos criticos do piloto devem evoluir de smoke para jornada completa |
| G7 | Cumprido | Pre-commit deve bloquear lint-staged/typecheck |
