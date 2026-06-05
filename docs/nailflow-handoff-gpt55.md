# 📦 NailFlow — Handoff de Correções e Testes (Dev IA GPT-5.5)

> **Documento de execução** — Fase A (Firebase + Expo)
> **Data:** 2026-06-02
> **Stack confirmada:** `pnpm` (raiz) · Vitest · Firebase Emulator · Maestro · Node 22 · Expo SDK 56
> **Fonte:** artefatos SDD-harness (`00-contexto-repo.md`, `harness.md`, `constitution.md`, `auditoria-consistencia.md`, `plan.md`)
> **Objetivo:** fechar/avançar os Gates **G1, G2, G3, G5, G6** e resolver as divergências **AUD-003** e **AUD-004** via ADRs.

---

## 0. Regras de Execução (LER ANTES DE CODAR)

Você (GPT-5.5) deve implementar os itens abaixo **no repositório real do NailFlow**.

> ⚠️ **CONFIRMAR CONTRA O CÓDIGO REAL** (os docs não expõem as assinaturas exatas):
> 1. **Exports reais**: `hasConflict`, `canReopenCommand`, `verifyTotp` — ajuste imports/nomes ao que existe no repositório.
> 2. **Claims das `firestore.rules`**: confirme o formato do token (`role`, `salonId`) que os helpers esperam (`isNailTechnician()`, `belongsToSalon()` etc.).

**Regras gerais:**
- Sempre usar `pnpm` na raiz.
- Não introduzir o termo `manicure` em código novo (ver ADR-0004).
- Suites de integração rodam **em série** (compartilham estado do emulador).
- Thresholds de cobertura são **graduais**: sobem a cada onda concluída.

---

# (A) Test Plan Executável Priorizado

## Onda 1 — Quick wins unitários (sem infra, fecha parte de G1)

| # | Arquivo a criar | CA / Achado | Gate |
|---|-----------------|-------------|------|
| C1 | `src/services/appointments/conflictValidation.test.ts` | Conflito de horário bloqueado (AUD-008) | G1 |
| C2 | `src/services/commands/command-reopen.test.ts` | Comanda fechada não reabre sem admin (AUD-009) | G1 |
| C3 | `functions/src/auth/totp-callables.test.ts` | 2FA bloqueia sem TOTP válido (AUD-006) | G1 |

## Onda 2 — Integração com Emulador (destrava G3 + G5)

| # | Arquivo a criar | CA / Achado | Gate |
|---|-----------------|-------------|------|
| B1 | `firebase.json` (bloco `emulators`) | Infra base | G5 |
| B2 | `vitest.integration.config.ts` + scripts | Infra base | G3/G5 |
| B5 | `tests/integration/firestore.rules.integration.test.ts` | Isolamento por salão (AUD-007) | G1/G5 |
| B6 | `functions/src/admin/export-lgpd-data.integration.test.ts` | Exportação LGPD callable (AUD-010) | G1/G5 |

## Onda 3 — Coverage (G2) + E2E (G6)

| # | Ação | Achado | Gate |
|---|------|--------|------|
| A7 | Script `test:coverage` + thresholds em `vitest.config.ts` + step CI | AUD-011/12/13 | G2 |
| A8 | Flows Maestro: agenda, comandas, notificações, google, admin | AUD-016 | G6 |

## Ordem de execução recomendada

1. **B2 → B1** (infra: dependências, emulador, configs/scripts)
2. **C1 → C2 → C3** (unitários — feedback rápido, sem emulador)
3. **B5 → B6** (integração com emulador)
4. **A7** (coverage gate — só após os testes existirem)
5. **A8** (E2E Maestro)
6. **ADRs** (D)

---

# (B) Setup Completo do Emulador

## B2.1 Dependências

```bash
pnpm add -D @firebase/rules-unit-testing @vitest/coverage-v8
```

## B1 — `firebase.json` (adicionar bloco `emulators`)

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": {
    "source": "functions"
  },
  "emulators": {
    "auth": {
      "port": 9099
    },
    "firestore": {
      "port": 8080
    },
    "functions": {
      "port": 5001
    },
    "ui": {
      "enabled": true,
      "port": 4000
    },
    "singleProjectMode": true
  }
}
```

## B2.2 — `vitest.integration.config.ts` (suite separada da unit)

```typescript
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "node",
    include: ["**/*.integration.test.ts"],
    // Roda em série: emulador compartilha estado
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
});
```

## B2.3 — Scripts (raiz `package.json`)

```json
{
  "scripts": {
    "test:coverage": "vitest run --coverage",
    "test:integration": "firebase emulators:exec --only firestore,auth \"vitest run --config vitest.integration.config.ts\""
  }
}
```

## B5 — Modelo `tests/integration/firestore.rules.integration.test.ts` (Isolamento por salão)

```typescript
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { doc, getDoc, setDoc } from "firebase/firestore";

let testEnv: RulesTestEnvironment;

const SALON_A = "salon-a";
const SALON_B = "salon-b";

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "nailflow-test",
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();

  // Semeia 1 cliente no salão A
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "clients/client-1"), {
      salonId: SALON_A,
      name: "Cliente A",
    });
  });
});

function ownerOfSalon(salonId: string) {
  return testEnv.authenticatedContext("owner-uid", {
    role: "salon_owner",
    salonId,
  });
}

describe("Isolamento por salão - clients", () => {
  it("owner do salão A LÊ cliente do próprio salão", async () => {
    const db = ownerOfSalon(SALON_A).firestore();
    await assertSucceeds(getDoc(doc(db, "clients/client-1")));
  });

  it("owner do salão B NÃO lê cliente do salão A", async () => {
    const db = ownerOfSalon(SALON_B).firestore();
    await assertFails(getDoc(doc(db, "clients/client-1")));
  });

  it("não-autenticado NÃO lê clientes", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, "clients/client-1")));
  });

  it("owner NÃO cria cliente em salão diferente do seu", async () => {
    const db = ownerOfSalon(SALON_A).firestore();
    await assertFails(
      setDoc(doc(db, "clients/client-2"), { salonId: SALON_B, name: "X" }),
    );
  });
});
```

> ⚠️ **Nota:** os claims (`role`, `salonId`) e os nomes de helpers (`isNailTechnician()`, `belongsToSalon()`) devem ser conferidos contra o `firestore.rules` real. Ajuste os campos do token para o formato que as rules esperam.

## B6 — `export-lgpd-data.integration.test.ts` (roteiro)

> ⚠️ **Implementar somente após inspecionar a assinatura real da callable em `functions/src/admin/export-lgpd-data.ts`.** Roteiro esperado:
> - Semear dados de um titular (clients/appointments/commands) em um salão.
> - Invocar `exportLgpdData` com contexto de `salon_owner`/`super_admin` autenticado.
> - Validar retorno com **todos** os dados do titular e **apenas** do salão correto.
> - Validar **rejeição** (`permission-denied`) para `nail_technician` ou outro salão.
> - Validar geração de **registro de auditoria** (AUD-010).

---

# (C) Testes Unitários — Onda 1

## C1 — `src/services/appointments/conflictValidation.test.ts`

```typescript
import { describe, expect, it } from "vitest";
// ⚠️ Ajustar o import ao export real de conflictValidation.ts
import { hasConflict } from "@/services/appointments/conflictValidation";

const base = (startTime: string, endTime: string, manicureId = "m1") => ({
  manicureId,
  startTime: new Date(startTime),
  endTime: new Date(endTime),
});

describe("conflictValidation - conflito de horário", () => {
  const existing = [base("2026-06-02T10:00:00Z", "2026-06-02T11:00:00Z")];

  it("bloqueia sobreposição total do mesmo profissional", () => {
    const novo = base("2026-06-02T10:15:00Z", "2026-06-02T10:45:00Z");
    expect(hasConflict(novo, existing)).toBe(true);
  });

  it("bloqueia sobreposição parcial (início dentro do intervalo)", () => {
    const novo = base("2026-06-02T10:30:00Z", "2026-06-02T11:30:00Z");
    expect(hasConflict(novo, existing)).toBe(true);
  });

  it("permite horário adjacente sem sobreposição", () => {
    const novo = base("2026-06-02T11:00:00Z", "2026-06-02T12:00:00Z");
    expect(hasConflict(novo, existing)).toBe(false);
  });

  it("não conflita entre profissionais diferentes", () => {
    const novo = base("2026-06-02T10:15:00Z", "2026-06-02T10:45:00Z", "m2");
    expect(hasConflict(novo, existing)).toBe(false);
  });

  it("permite agenda vazia", () => {
    const novo = base("2026-06-02T10:00:00Z", "2026-06-02T11:00:00Z");
    expect(hasConflict(novo, [])).toBe(false);
  });
});
```

## C2 — `src/services/commands/command-reopen.test.ts`

```typescript
import { describe, expect, it } from "vitest";
// ⚠️ Ajustar import à função real (ex.: canReopenCommand / assertCanReopen)
import { canReopenCommand } from "@/services/commands/commandsService";

describe("Comanda fechada não reabre sem admin", () => {
  const closed = { id: "c1", status: "closed" as const };

  it("nail_technician NÃO reabre comanda fechada", () => {
    expect(canReopenCommand(closed, { role: "nail_technician" })).toBe(false);
  });

  it("salon_owner reabre comanda fechada", () => {
    expect(canReopenCommand(closed, { role: "salon_owner" })).toBe(true);
  });

  it("super_admin reabre comanda fechada", () => {
    expect(canReopenCommand(closed, { role: "super_admin" })).toBe(true);
  });

  it("comanda aberta não exige privilégio admin", () => {
    const open = { id: "c2", status: "open" as const };
    expect(canReopenCommand(open, { role: "nail_technician" })).toBe(true);
  });

  it("aceita legado manicure como nail_technician (sem reabrir)", () => {
    expect(canReopenCommand(closed, { role: "manicure" })).toBe(false);
  });
});
```

## C3 — `functions/src/auth/totp-callables.test.ts`

```typescript
import { describe, expect, it } from "vitest";
// ⚠️ Ajustar imports aos exports reais de totp-callables.ts
import { verifyTotp } from "../auth/totp-callables";

describe("2FA / TOTP - bloqueio sem código válido", () => {
  it("rejeita quando TOTP é inválido", async () => {
    await expect(
      verifyTotp({ uid: "u1", token: "000000", secret: "JBSWY3DPEHPK3PXP" }),
    ).resolves.toBe(false);
  });

  it("aceita TOTP válido gerado para o secret", async () => {
    // usar gerador determinístico (otplib) com clock fixo (vi.setSystemTime)
    const valid = "<token-gerado-no-teste>";
    await expect(
      verifyTotp({ uid: "u1", token: valid, secret: "JBSWY3DPEHPK3PXP" }),
    ).resolves.toBe(true);
  });

  it("bloqueia callable sem contexto autenticado", async () => {
    await expect(verifyTotp({ token: "123456" } as never)).rejects.toThrow(
      /unauthenticated|auth/i,
    );
  *
