# ADR-0001 — Estratégia de Stack em Duas Fases

## Contexto
O NailFlow foi planejado para validar rapidamente o produto em um piloto real com equipe enxuta e custo operacional mínimo.
Na Fase A, a prioridade é time-to-market, simplicidade operacional e velocidade de ajuste.
Na Fase B, o produto evolui para um SaaS completo com maior escala, governança e portal web.

## Decisão
- Fase A (piloto): Firebase (Firestore, Functions, Auth) + Expo/React Native.
- Fase B (expansão): PostgreSQL + NestJS + Next.js, mantendo o app React Native.

## Consequências
- A transição exigirá migração de dados (Firestore → PostgreSQL) e estratégia de compatibilidade.
- O uso de TypeScript e schemas Zod reduz risco de reescrita de contratos na migração.
- Aceita-se o acoplamento ao Firebase na Fase A como dívida técnica planejada e documentada.
