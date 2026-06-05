# ADR-0003 — Oficializar dead-letter da fila de sincronizacao

## Contexto
Os documentos iniciais citam oito colecoes oficiais para a Fase A, mas a implementacao do Google Calendar ja utiliza `syncQueueDeadLetter` para registrar falhas recorrentes de sincronizacao.
Essa divergencia foi marcada como AUD-003 nos artefatos SDD-harness.

## Decisao
Oficializar `syncQueueDeadLetter` como colecao operacional da Fase A, vinculada exclusivamente ao subsistema de sincronizacao Google Calendar.
A colecao permanece sem acesso direto pelo cliente nas regras Firestore.

## Consequencias
- Falhas que excedem a politica de retry ficam rastreaveis sem bloquear a fila principal.
- A colecao deve permanecer coberta por regras, indices e testes de integracao quando houver mudancas no sync.
- A lista de colecoes oficiais da documentacao deve tratar `syncQueueDeadLetter` como excecao operacional planejada.
- Qualquer exposicao futura dessa fila para UI ou suporte deve passar por nova decisao arquitetural.

