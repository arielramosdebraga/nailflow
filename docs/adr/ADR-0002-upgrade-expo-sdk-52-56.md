# ADR-0002 — Upgrade do Expo SDK 52 → 56

## Contexto
O projeto evoluiu de uma base inicial no Expo SDK 52 para Expo SDK 56 para manter compatibilidade com o ecossistema atual, reduzir débitos de atualização e habilitar integrações já adotadas no projeto (expo-router, notifications, auth-session e pipeline de build/testes).

## Decisão
Atualizar o Expo SDK da versão 52 para a 56, alinhando também versões de React Native, React e dependências do ecossistema Expo.

## Consequências
- Dependências-chave atualizadas:
  - `expo` para `~56.0.6`
  - `react-native` para `0.85.x`
  - `react` para `19.2.x`
  - `expo-router` para `56.x`
- Ajustes técnicos aplicados durante a evolução:
  - compatibilização de rotas tipadas do Expo Router
  - atualização de plugins/babel para o stack Expo 56
  - ajustes de integração com Expo Go e bibliotecas de animação/worklets
- Riscos observados:
  - incompatibilidade de versão do Expo Go em dispositivos desatualizados
  - regressões de build em bibliotecas com APIs antigas
- Validações executadas:
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm --dir functions lint`
  - `pnpm --dir functions build`
