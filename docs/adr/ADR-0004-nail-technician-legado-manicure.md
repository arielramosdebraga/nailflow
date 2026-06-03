# ADR-0004 — Papel canonico nail_technician e legado manicure

## Contexto
O papel canonico do profissional no NailFlow passou a ser `nail_technician`.
Ainda existem dados, campos tecnicos e compatibilidades antigas usando `manicure` ou `manicureId`, principalmente em documentos persistidos e contratos de agenda/comandas.
Essa divergencia foi marcada como AUD-004 nos artefatos SDD-harness.

## Decisao
Manter `nail_technician` como papel canonico para codigo novo, regras de negocio e textos de documentacao tecnica.
Aceitar `manicure` apenas como valor legado normalizado para `nail_technician`.
Manter campos tecnicos como `manicureId` ate uma migracao dedicada de modelo de dados, porque eles fazem parte dos contratos atuais de Firestore, Functions e sincronizacao Google.

## Consequencias
- Codigo novo nao deve criar novas roles, rotas ou textos de negocio com `manicure`.
- Schemas e regras continuam aceitando o legado para nao quebrar usuarios e documentos ja existentes.
- Testes podem referenciar `manicureId` quando validarem contratos persistidos existentes.
- Uma migracao futura pode renomear campos tecnicos para `nailTechnicianId`, acompanhada de plano de dados, indices, regras, Functions e compatibilidade temporaria.
