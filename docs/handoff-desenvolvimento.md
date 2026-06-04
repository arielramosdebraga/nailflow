# Handoff de Desenvolvimento — NailFlow

> Última atualização: 03/06/2026  
> Objetivo: permitir que outra conta assuma o desenvolvimento/operação do projeto com o mínimo de atrito.

---

## 1. Resumo executivo

O NailFlow é um app mobile em `Expo + React Native + TypeScript + Firebase` para operação de salão, com:

- autenticação por e-mail/senha e Google
- RBAC por perfil (`super_admin`, `salon_owner`, `nail_technician`)
- 2FA TOTP para perfis administrativos
- agenda e atendimentos
- comandas
- sync com Google Calendar
- central de notificações
- auditoria administrativa
- preparação de release/piloto via EAS

### Situação atual

- `Sprint 0` a `Sprint 9`: entregues e mergeadas em `develop`
- `Sprint 10`: implementada em código, mas o PR ainda está aberto e precisa ser atualizado contra `develop`
- O que resta não é mais desenvolvimento funcional principal, e sim:
  - concluir a integração final da Sprint 10 com `develop`
  - executar o fluxo operacional do piloto
  - gerar/distribuir builds reais
  - validar ambiente real de Firebase/EAS

---

## 2. Estado remoto confirmado

### PRs

- PR `#9` `Sprint-7-sync-google-app`: `merged`
- PR `#10` `Sprint-8-notificacoes`: `merged`
- PR `#11` `Sprint-9-qualidade-performance`: `merged`
- PR `#12` `Sprint-10-piloto-estabilizacao`: `open` e, na última verificação, `mergeable: false`

### Leitura prática

Se outra conta for assumir agora, o ponto natural de continuidade é:

1. revisar a branch `Sprint-10-piloto-estabilizacao`
2. sincronizar essa branch com `develop`
3. resolver o conflito remanescente do PR `#12`
4. mergear a Sprint 10
5. seguir para operação de piloto/builds

---

## 3. Ponto recomendado para começar

### Melhor branch para continuidade

Se a intenção for continuar o projeto na linha mais atual, use preferencialmente:

- branch: `Sprint-10-piloto-estabilizacao`
- worktree local já existente:
  - `C:\Users\ariel\Documents\Projects\nailflow-s10`

### Atenção importante

O workspace atual `C:\Users\ariel\Documents\Projects\nailflow` está na branch:

- `Sprint-8-notificacoes`

Então ele **não representa sozinho** o estado mais novo do projeto.

Para retomar com segurança:

1. abra `nailflow-s10` para contexto mais recente
2. compare com `develop`
3. não assuma que README/planejamento da branch `Sprint-8-notificacoes` sejam a fonte mais atual

---

## 4. Worktrees locais existentes

Na máquina existem os seguintes worktrees:

- `C:\Users\ariel\Documents\Projects\nailflow` → `Sprint-8-notificacoes`
- `C:\Users\ariel\Documents\Projects\nailflow-s10` → `Sprint-10-piloto-estabilizacao`
- `C:\Users\ariel\Documents\Projects\nailflow-s2` → `Sprint-2-estrutura-projeto`
- `C:\Users\ariel\Documents\Projects\nailflow-s3` → `Sprint-3-agenda-atendimentos`
- `C:\Users\ariel\Documents\Projects\nailflow-s4` → `Sprint-4-comandas-owner`
- `C:\Users\ariel\Documents\Projects\nailflow-s5` → `Sprint-5-super-admin-auditoria`
- `C:\Users\ariel\Documents\Projects\nailflow-s6` → `Sprint-6-google-oauth-sync-app-google`
- `C:\Users\ariel\Documents\Projects\nailflow-s7` → `Sprint-7-sync-google-app`
- `C:\Users\ariel\Documents\Projects\nailflow-s8` → `Sprint-9-qualidade-performance`

### Uso prático

- manter esses worktrees ajuda a inspecionar historicamente cada sprint
- para trabalho novo, prefira `develop` ou a worktree da Sprint 10

---

## 5. Stack e versões relevantes

- `Expo SDK 56`
- `React Native 0.85.3`
- `React 19.2.3`
- `TypeScript ~5.9.3`
- `expo-router ^56.2.7`
- `nativewind ^4.2.4`
- `zustand ^5.0.13`
- `@tanstack/react-query ^5.100.14`
- Firebase JS SDK `^12.13.0`
- `firebase-admin ^13.6.0`
- `firebase-functions ^7.0.0`

### Regra importante do projeto

Antes de alterar qualquer coisa estrutural em Expo, ler a documentação exata da versão:

- [Expo SDK 56](https://docs.expo.dev/versions/v56.0.0/)

---

## 6. Convenções obrigatórias do projeto

### Idioma

- código e nomes técnicos: **inglês**
- textos visíveis no app: **português (pt-BR)**
- commits, PRs, reviews e comentários: **português**

### Git

- uma branch por sprint
- padrão de branch:
  - `Sprint-X-descricao-curta`
- commits semânticos em português
- PR sempre para `develop`

### Execução

- implementar ponta a ponta quando necessário
- sempre validar após mudanças:
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm --dir functions lint`
  - `pnpm --dir functions build`

---

## 7. Estrutura do repositório

### App

- `app/`
  - rotas por grupo com `expo-router`
  - `(auth)`
  - `(nail-technician)`
  - `(owner)`
  - `(admin)`

### Camadas principais

- `src/components/`
- `src/hooks/`
- `src/providers/`
- `src/schemas/`
- `src/services/`
- `src/stores/`
- `src/utils/`

### Backend

- `functions/`
  - Cloud Functions em TypeScript
  - auth, audit, admin, google, notifications, salons etc.

### Documentação

- `docs/planejamento.md`
- `docs/AGENTS.md`
- `docs/sprints/*.md`
- na Sprint 10 também existem docs mais atualizadas no worktree `nailflow-s10`, como:
  - `docs/release-operacional.md`
  - `docs/guia-de-uso-piloto.md`
  - `docs/handoff-fase-b.md`

---

## 8. Ambientes e variáveis

### App (`.env`)

O projeto depende de variáveis de Expo/Firebase/Google.  
Na Sprint 10 existe `.env.example` em:

- [`.env.example`](C:\Users\ariel\Documents\Projects\nailflow-s10\.env.example)

Campos esperados incluem, entre outros:

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

### Functions

Variáveis relevantes já usadas no projeto:

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

### Segredos

- não versionar segredos
- usar `secrets/` apenas para arquivos locais sensíveis
- JSON de service account deve ficar fora do Git

---

## 9. Comandos de trabalho

### Instalação

```bash
pnpm install
pnpm --dir functions install
```

### App

```bash
pnpm start
pnpm android
pnpm ios
pnpm web
```

### Qualidade

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm --dir functions lint
pnpm --dir functions build
```

### E2E

No branch raiz atual ainda existe script placeholder para E2E.  
Na trilha mais nova da Sprint 10 o projeto já evoluiu para flows Maestro versionados.

Se for continuar pelo estado mais novo, confira a worktree `nailflow-s10`.

### Release/piloto

Na Sprint 10 foram adicionados scripts de release/build/submit no worktree `nailflow-s10`.  
Se a próxima conta for atuar em piloto/release, usar essa base como referência.

---

## 10. Contas de teste

Existe seed versionado em:

- [seed-test-accounts.mjs](C:\Users\ariel\Documents\Projects\nailflow\scripts\seed-test-accounts.mjs)

### Contas criadas pelo script

- `manicure.teste@nailflow.app` → `nail_technician`
- `owner.teste@nailflow.app` → `salon_owner`
- `admin.teste@nailflow.app` → `super_admin`

### Senha padrão

- `Nailflow@123`

ou o valor de:

- `TEST_ACCOUNT_PASSWORD`

### Observação

Historicamente também foram usados usuários criados manualmente no Firebase.  
Se houver divergência entre script e ambiente real, confiar no Firebase do ambiente antes de alterar dados de produção/teste.

---

## 11. Decisões e armadilhas já conhecidas

### 11.1 Node das Functions

As `functions` esperam:

- `Node 22`

Mas localmente já houve ambiente em:

- `Node 24`

Resultado:

- `lint` e `build` passam
- aparece warning de engine

Não tratar isso como erro funcional imediato, mas alinhar o ambiente é recomendado.

### 11.2 Documentação divergente entre worktrees

Nem toda documentação da branch `Sprint-8-notificacoes` está no mesmo nível de atualização da worktree `Sprint-10-piloto-estabilizacao`.

Se o objetivo for continuidade real do projeto:

- usar a documentação da Sprint 10 como fonte principal
- atualizar `develop` depois do merge do PR `#12`

### 11.3 Typed routes do Expo Router

Houve ajustes em várias sprints por causa de typed routes mais estritas.

Ao mexer em navegação:

- evitar `as never`
- preferir `Href`
- usar rotas absolutas tipadas quando necessário

### 11.4 Maestro

Parte do material menciona E2E com Maestro, mas a execução local depende da CLI instalada no ambiente.

---

## 12. O que já foi entregue por sprint

### Sprints já consolidadas

- Sprint 0: setup técnico
- Sprint 1: auth + RBAC
- Sprint 2: modelagem + clientes + 2FA admin
- Sprint 3: agenda + atendimentos
- Sprint 4: comandas + owner dashboard
- Sprint 5: super admin + auditoria (escopo depois complementado)
- Sprint 6: OAuth Google + sync App → Google
- Sprint 7: sync Google → App + reconciliação
- Sprint 8: notificações
- Sprint 9: qualidade, governança, LGPD, testes e documentação

### Sprint 10

Implementada em código na branch:

- `Sprint-10-piloto-estabilizacao`

Inclui:

- readiness de release
- `app.config.ts`/`eas.json`
- scripts de build/preflight
- configurações globais do `super_admin`
- exportação LGPD com auditoria
- documentação operacional

Pendência principal atual:

- reconciliar PR `#12` com `develop`

---

## 13. Próximos passos recomendados para a próxima conta

### Ordem sugerida

1. Abrir a worktree `C:\Users\ariel\Documents\Projects\nailflow-s10`
2. Revisar PR `#12`
3. Fazer merge de `develop` em `Sprint-10-piloto-estabilizacao`
4. Resolver conflitos e revalidar:
   - `pnpm lint`
   - `pnpm typecheck`
   - `pnpm test`
   - `pnpm --dir functions lint`
   - `pnpm --dir functions build`
5. Atualizar docs finais se necessário
6. Fazer push da Sprint 10
7. Mergear PR `#12`
8. A partir de `develop`, seguir para:
   - build EAS
   - distribuição interna
   - onboarding
   - piloto

### Se a intenção for só desenvolvimento novo

Depois da Sprint 10 entrar em `develop`, criar nova branch a partir de `develop` e não continuar a partir da `Sprint-8-notificacoes`.

---

## 14. Arquivos que a próxima conta deve ler primeiro

### Ordem recomendada

1. [AGENTS.md](C:\Users\ariel\Documents\Projects\nailflow\AGENTS.md)
2. [README.md](C:\Users\ariel\Documents\Projects\nailflow-s10\README.md)
3. [planejamento.md](C:\Users\ariel\Documents\Projects\nailflow\docs\planejamento.md)
4. [TODO.md](C:\Users\ariel\Documents\Projects\nailflow\docs\TODO.md)
5. `docs/release-operacional.md` na worktree `nailflow-s10`
6. `docs/guia-de-uso-piloto.md` na worktree `nailflow-s10`
7. `docs/handoff-fase-b.md` na worktree `nailflow-s10`

---

## 15. Resumo final em uma frase

Se outra conta assumir hoje, ela deve tratar a Sprint 10 como a última frente de integração técnica e, depois disso, o projeto entra principalmente em fase de execução operacional de piloto.
