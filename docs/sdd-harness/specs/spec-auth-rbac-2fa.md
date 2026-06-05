# Spec - Auth, RBAC e 2FA

Fonte obrigatoria: `docs/sdd-harness/00-contexto-repo.md`.

## 1. Objetivo
Garantir acesso seguro ao NailFlow por e-mail/senha, Google Auth, roles de dominio e segundo fator para papeis administrativos, mantendo usuarios fora de escopo longe de rotas protegidas.

## 2. User stories
- Como `super_admin`, quero acessar o painel global com 2FA para proteger operacoes administrativas.
- Como `salon_owner`, quero acessar dados do meu salao com 2FA para proteger informacoes operacionais.
- Como `nail_technician`, quero entrar na minha agenda sem friccao administrativa para operar os atendimentos do dia.
- Como usuario nao autenticado, quero ser redirecionado para login para evitar acesso indevido.

## 3. Regras de negocio
1. `super_admin` e `salon_owner` devem usar 2FA no produto.
2. `nail_technician` e o papel canonico do profissional.
3. `manicure` e legado aceito/normalizado para compatibilidade.
4. Usuario nao autenticado deve ir para `/login`.
5. Rotas admin aceitam apenas `super_admin`.
6. A implementacao atual so bloqueia a sessao quando `twoFactor.totp.enabled === true`.
7. Enrollment e validacao TOTP real dependem de Functions publicadas.

## 4. Criterios de aceite
- CA-01: Usuario nao autenticado acessando rota protegida e redirecionado para login.
- CA-02: `super_admin` sem TOTP valido nao acessa painel admin.
- CA-03: `salon_owner` sem TOTP valido nao acessa painel owner.
- CA-04: Cadastro/login e telas legais aparecem no smoke E2E.
- CA-05: Role legado `manicure` e normalizado para `nail_technician`.

## 5. Casos de borda
- Sessao expirada.
- Role ausente ou invalida no Firestore.
- Usuario admin sem enrollment TOTP.
- Usuario legado com role `manicure`.
- Firebase nao configurado no ambiente.

## 6. Escopo fora
- Provider corporativo SSO.
- Politica avancada de device trust.
- Admin console web da Fase B.

## 7. Rastreabilidade
| Camada | Arquivos |
|---|---|
| UI | `app/(auth)/**`, `app/(admin)/**`, `app/(owner)/**`, `app/(nail-technician)/**` |
| Store/hooks | `src/stores/sessionStore.ts`, `src/hooks/auth/useAuthSession.ts`, `src/hooks/auth/useTotpAuth.ts`, `src/hooks/auth/useGoogleAuth.ts` |
| Services | `src/services/auth/authService.ts`, `src/services/users/userService.ts` |
| Schemas | `src/schemas/auth/**`, `src/schemas/users/user.schema.ts` |
| Functions | `functions/src/auth/**`, `functions/src/shared/user-context.ts` |
| Rules | `firestore.rules` |
| Testes | `src/schemas/auth/auth.schema.test.ts`, `src/schemas/users/user.schema.test.ts`, `functions/src/auth/totp-callables.test.ts`, `.maestro/auth-smoke.yaml` |

## 8. Lacunas de teste
- `⚠️ [LACUNA: teste automatizado especifico para redirecionamento de nao autenticado nao encontrado]`.
- `⚠️ [LACUNA: teste de rules/emulador para RBAC administrativo completo ausente]`.
- `⚠️ [LACUNA: E2E completo de enrollment/validacao 2FA depende de Functions publicadas]`.
