# Spec - Notificacoes

Fonte obrigatoria: `docs/sdd-harness/00-contexto-repo.md`.

## 1. Objetivo
Entregar notificacoes push e in-app para eventos operacionais, preferencias do usuario, erros de sincronizacao e lembretes relevantes do piloto.

## 2. User stories
- Como `nail_technician`, quero receber lembretes e avisos de agenda para nao perder atendimentos.
- Como `salon_owner`, quero ser informado sobre operacoes relevantes do salao.
- Como `super_admin`, quero acompanhar alertas operacionais e auditoria.

## 3. Regras de negocio
1. Notificacao pertence a `userId`.
2. Usuario pode marcar notificacao como lida.
3. Preferencias e nao-perturbe controlam envio.
4. Push token depende de `EXPO_PUBLIC_EAS_PROJECT_ID`.
5. Escrita direta em `notifications` e bloqueada no Firestore; criacao ocorre pelo backend.

## 4. Criterios de aceite
- CA-01: Preferencias de notificacao sao respeitadas.
- CA-02: Central in-app lista notificacoes por usuario.
- CA-03: Usuario marca notificacao como lida.
- CA-04: Badge reflete nao lidas.
- CA-05: Push relevante chega em menos de 5s.

## 5. Casos de borda
- Usuario sem permissao de push.
- Token indisponivel.
- Horario de nao-perturbe ativo.
- Notificacao duplicada.
- Usuario tentando marcar notificacao de outro usuario.

## 6. Escopo fora
- Campanhas marketing.
- Templates ricos multicanal.
- Analytics avancado de entrega.

## 7. Rastreabilidade
| Camada | Arquivos |
|---|---|
| UI | `app/**/notifications/**` |
| Components | `src/components/features/notifications/**` |
| Hooks | `src/hooks/notifications/**` |
| Services | `src/services/notifications/**` |
| Functions | `functions/src/notifications/**` |
| Testes | `functions/src/notifications/models.test.ts`, `functions/src/notifications/preferences.test.ts` |

## 8. Lacunas de teste
- `⚠️ [LACUNA: E2E/medicao de badge em tempo real e push <5s ausente]`.
- `⚠️ [LACUNA: teste de rules/emulador para update seguro de notificacao ausente]`.
- `⚠️ [LACUNA: flows Maestro de central/preferencias ausentes]`.
