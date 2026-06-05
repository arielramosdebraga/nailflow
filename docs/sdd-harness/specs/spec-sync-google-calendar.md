# Spec - Sync Google Calendar

Fonte obrigatoria: `docs/sdd-harness/00-contexto-repo.md`.

## 1. Objetivo
Sincronizar atendimentos entre NailFlow e Google Calendar, preservando eventos criados no app, atualizacoes vindas do Google, reconciliacao e tratamento de falhas.

## 2. User stories
- Como `nail_technician`, quero conectar minha conta Google para manter minha agenda sincronizada.
- Como `salon_owner`, quero que alteracoes de atendimentos reflitam no calendario da equipe para reduzir retrabalho.
- Como `super_admin`, quero observar erros de sync para apoiar o piloto.

## 3. Regras de negocio
1. Apenas roles autorizadas podem conectar Google Calendar.
2. Tokens sensiveis ficam tratados nas Functions.
3. Atendimentos criados/editados/excluidos no app disparam sync App -> Google.
4. Alteracoes vindas do Google passam por webhook, sync incremental e fila.
5. Falhas recorrentes devem ir para `syncQueueDeadLetter`.

## 4. Criterios de aceite
- CA-01: Conexao Google inicia e retorna parametros OAuth.
- CA-02: Atendimento criado no app e enviado ao Google.
- CA-03: Alteracao no Google volta para o app.
- CA-04: Sync App -> Google ocorre em menos de 10s.
- CA-05: Sync Google -> App ocorre em menos de 10s.
- CA-06: Falhas de fila sao registradas para tratamento.

## 5. Casos de borda
- Refresh token ausente ou revogado.
- Webhook expirado.
- Evento alterado simultaneamente no app e no Google.
- `syncToken` invalido.
- Falha de rede/Google API.
- Profissional sem calendario conectado.

## 6. Escopo fora
- Sincronizacao multi-calendario avancada.
- Migracao para workers dedicados da Fase B.
- UI web de observabilidade.

## 7. Rastreabilidade
| Camada | Arquivos |
|---|---|
| UI | `app/(nail-technician)/nail-technician/google-calendar/index.tsx`, `app/google-calendar/oauth.tsx` |
| Hooks | `src/hooks/google/useGoogleCalendarConnection.ts` |
| Services | `src/services/google/googleCalendarService.ts` |
| Functions | `functions/src/google/**` |
| Colecoes | `users`, `appointments`, `syncQueue`, `syncQueueDeadLetter` |
| Testes | `src/services/google/googleCalendarService.test.ts`, `functions/src/google/sync-queue.test.ts` |

## 8. Lacunas de teste
- `⚠️ [LACUNA: teste E2E/integracao de sync Google -> App ausente]`.
- `⚠️ [LACUNA: medicao automatizada de latencia <10s ausente]`.
- `⚠️ [LACUNA: testes contra emulador Firebase ausentes]`.
