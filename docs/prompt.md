# 📱 NailFlow — Sistema de Gestão para Salões de Manicure

> **Documento mestre do projeto** — versão 1.0
> Última atualização: Maio/2026
> Autor: Ariel
> Status: Especificação aprovada para desenvolvimento da Fase A

---

## 1. 🎯 Visão Geral

O **NailFlow** é um aplicativo mobile multiplataforma (iOS e Android) para gestão de salões de manicure, com integração nativa ao **Google Calendar**. O sistema permite que donos de salão gerenciem suas manicures, atendimentos, clientes e finanças, enquanto cada manicure possui sua própria agenda sincronizada bidirecionalmente com o Google Calendar pessoal.

### 1.1 Diferenciais

- 📅 **Sincronização bidirecional real** com Google Calendar (mudanças em qualquer lado refletem no outro em ~5 segundos)
- 👥 **Visão administrativa multinível** (dono do salão acompanha todas as manicures)
- 🔔 **Notificações em tempo real** (push + in-app)
- 🎨 **UI moderna** com Tailwind CSS (via NativeWind)
- 🔒 **Segurança robusta** (RBAC + 2FA + auditoria)

---

## 2. 🚀 Fases do Projeto

### Fase A — Piloto (5 meses)
- 1 salão piloto
- 1 super admin (Ariel)
- 1 dono de salão
- 2 manicures
- Validação do produto em ambiente real

### Fase B — Expansão
- Múltiplos salões
- Onboarding self-service
- Notificações expandidas (aniversários, inativos, resumos)
- WhatsApp Business API
- E-mails automáticos (SendGrid/Firebase Trigger Email)
- Publicação OAuth Google em produção
- Versão web (opcional)

---

## 3. 🛠️ Stack Tecnológico

### 3.1 Frontend (Mobile)

| Categoria | Tecnologia | Versão |
|---|---|---|
| Framework | React Native | 0.85.3 |
| Plataforma | Expo SDK | 56 |
| Linguagem | TypeScript | 6.0.x |
| Roteamento | Expo Router | 56.x (file-based) |
| Estilização | **NativeWind** | v4 |
| Componentes UI | React Native Reusables | latest |
| Estado global | Zustand | latest |
| Data fetching | TanStack Query | v5 |
| Formulários | React Hook Form + Zod | latest |
| Datas | date-fns | v3+ |
| Ícones | Lucide React Native | latest |
| Calendário visual | react-native-calendars | latest |
| Notificações | expo-notifications | latest |

### 3.2 Backend (Serverless)

| Categoria | Tecnologia |
|---|---|
| Autenticação | Firebase Authentication |
| Banco de dados | Cloud Firestore |
| Funções serverless | Cloud Functions for Firebase (Node.js 22, TypeScript) |
| Push notifications | Firebase Cloud Messaging (FCM) |
| Storage | Firebase Storage |
| Fila assíncrona | Cloud Pub/Sub |
| Agendamento | Cloud Scheduler |
| Logs | Cloud Logging |

### 3.3 Integrações

| Serviço | Uso |
|---|---|
| Google Calendar API | Sincronização bidirecional de eventos |
| Google OAuth 2.0 | Autenticação e autorização |
| Google Push Notifications | Webhooks de mudanças em calendários |

---

## 4. 🏗️ Arquitetura

### 4.1 Visão geral

```
┌─────────────────────────────────────────────────────────┐
│                    APP MOBILE (RN+Expo)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  Manicure   │  │ Salon Owner │  │ Super Admin │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    FIREBASE BACKEND                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │   Auth   │  │Firestore │  │Functions │  │  FCM   │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │   Google Calendar API  │
            │   (OAuth + Webhooks)   │
            └────────────────────────┘
```

### 4.2 Princípios arquiteturais

- **Serverless first**: sem servidores dedicados, escalabilidade automática
- **Real-time**: Firestore listeners para atualizações instantâneas
- **Offline-first**: cache local com TanStack Query
- **Type-safe**: TypeScript end-to-end (app + functions)
- **Security by design**: regras Firestore + Cloud Functions validadoras

---

## 5. 🗄️ Modelagem de Dados (Firestore)

### 5.1 Coleções principais

```
salons/{salonId}
  ├── name: string
  ├── ownerId: string (uid)
  ├── createdAt: timestamp
  ├── settings: { timezone, currency, ... }
  └── active: boolean

users/{userId}
  ├── email: string
  ├── displayName: string
  ├── role: "super_admin" | "salon_owner" | "manicure"
  ├── salonId: string (null para super_admin)
  ├── phone: string
  ├── photoURL: string
  ├── googleCalendar: {
  │     connected: boolean,
  │     refreshToken: string (criptografado),
  │     calendarId: string (Nível 3: calendário dedicado),
  │     watchChannelId: string,
  │     watchExpiration: timestamp,
  │     syncToken: string
  │   }
  ├── notificationPreferences: { ... }
  ├── fcmTokens: string[]
  └── createdAt: timestamp

clients/{clientId}
  ├── salonId: string
  ├── name: string
  ├── phone: string
  ├── email: string
  ├── birthDate: timestamp
  ├── notes: string
  ├── tags: string[]
  ├── createdAt: timestamp
  └── lastVisit: timestamp

appointments/{appointmentId}
  ├── salonId: string
  ├── manicureId: string (userId)
  ├── clientId: string
  ├── services: [{ name, duration, price }]
  ├── startTime: timestamp
  ├── endTime: timestamp
  ├── status: "scheduled" | "confirmed" | "completed" | "cancelled"
  ├── totalPrice: number
  ├── notes: string
  ├── googleEventId: string (link bidirecional)
  ├── syncStatus: "synced" | "pending" | "error"
  ├── createdBy: string (userId)
  ├── createdAt: timestamp
  └── updatedAt: timestamp

commands/{commandId}
  ├── salonId: string
  ├── appointmentId: string
  ├── clientId: string
  ├── manicureId: string
  ├── items: [{ service, price, quantity }]
  ├── total: number
  ├── paymentMethod: "cash" | "pix" | "credit" | "debit"
  ├── status: "open" | "closed"
  ├── closedAt: timestamp
  └── createdAt: timestamp

notifications/{notificationId}
  ├── userId: string
  ├── type: string
  ├── title: string
  ├── body: string
  ├── data: object
  ├── read: boolean
  ├── priority: "high" | "normal" | "low"
  ├── channel: ["push", "in_app"]
  └── createdAt: timestamp

auditLogs/{logId}
  ├── userId: string
  ├── action: string
  ├── targetType: string
  ├── targetId: string
  ├── metadata: object
  ├── ipAddress: string
  └── timestamp: timestamp

syncQueue/{taskId}
  ├── type: "create" | "update" | "delete"
  ├── userId: string
  ├── appointmentId: string
  ├── direction: "to_google" | "from_google"
  ├── attempts: number
  ├── status: "pending" | "processing" | "completed" | "failed"
  ├── error: string
  └── createdAt: timestamp
```

### 5.2 Índices recomendados

- `appointments`: `salonId + startTime`, `manicureId + startTime`, `clientId + startTime`
- `notifications`: `userId + createdAt (desc)`, `userId + read + createdAt`
- `clients`: `salonId + name`, `salonId + lastVisit`
- `auditLogs`: `userId + timestamp`, `targetId + timestamp`

---

## 6. 🔐 Autenticação e Autorização (RBAC)

### 6.1 Papéis

| Papel | Descrição | Permissões |
|---|---|---|
| `super_admin` | Ariel (criador da plataforma) | Acesso total a todos os salões, auditoria, configurações globais |
| `salon_owner` | Dono do salão | Gerencia manicures, vê agendas de todas, finanças do salão |
| `manicure` | Profissional | Gerencia própria agenda, próprios clientes, próprias comandas |

### 6.2 Métodos de autenticação

- **E-mail + senha** (Firebase Auth)
- **Login com Google** (recomendado)
- **2FA obrigatório** para `super_admin` e `salon_owner`

### 6.3 Allowlist Super Admin

Apenas e-mails pré-aprovados podem se cadastrar como `super_admin` (configurado em Cloud Function via variável de ambiente segura).

### 6.4 Regras Firestore (resumo)

```javascript
// Pseudocódigo das regras
match /salons/{salonId} {
  allow read: if isAuthenticated() && (isSuperAdmin() || belongsToSalon(salonId));
  allow write: if isSuperAdmin() || isSalonOwner(salonId);
}

match /appointments/{appointmentId} {
  allow read: if isAuthenticated() &&
    (isSuperAdmin() ||
     isSalonOwnerOf(resource.data.salonId) ||
     isManicure(resource.data.manicureId));
  allow create, update: if canManageAppointment();
}

match /auditLogs/{logId} {
  allow read: if isSuperAdmin();
  allow write: if false; // só via Cloud Functions
}
```

---

## 7. 📅 Integração Google Calendar — Sincronização Bidirecional Completa

### 7.1 Estratégia adotada

**Nível 1 + Nível 2 + Nível 3** (completo desde a Fase A):

- **Nível 1**: Leitura de eventos do calendário pessoal (para detectar conflitos)
- **Nível 2**: Sincronização bidirecional em tempo real (~5 segundos)
- **Nível 3**: Calendário dedicado "NailFlow" criado automaticamente

### 7.2 Fluxo de conexão

1. Manicure clica em "Conectar Google Calendar"
2. OAuth 2.0 (escopos: `calendar`, `calendar.events`)
3. App recebe `refresh_token` (armazenado criptografado no Firestore)
4. Cloud Function cria calendário "NailFlow - [Nome da Manicure]"
5. Registra webhook (watch channel) para receber notificações
6. Faz sync inicial (bidirecional)

### 7.3 Sincronização App → Google

Quando um atendimento é criado/editado/excluído no app:

1. Salva no Firestore
2. Cloud Function (trigger) cria/atualiza/exclui evento no Google Calendar
3. Salva `googleEventId` no documento do atendimento
4. Atualiza `syncStatus`

### 7.4 Sincronização Google → App

Quando o usuário altera algo no Google Calendar (mesmo no celular):

1. Google envia webhook (push notification) para Cloud Function
2. Function usa `syncToken` para buscar apenas mudanças incrementais
3. Para cada mudança:
   - Identifica `googleEventId` → busca `appointment` correspondente
   - Atualiza Firestore
   - Listener no app atualiza UI em tempo real
4. **Tempo total: ~5 segundos**

### 7.5 Renovação de webhooks

- Webhooks do Google expiram em **7 dias**
- Cloud Scheduler executa job diário que renova webhooks expirando em <2 dias

### 7.6 Resolução de conflitos

- Estratégia **last-write-wins** com base em `updated` timestamp
- Conflitos logados em `auditLogs` para análise
- Notificação ao usuário se sobrescrever algo importante

### 7.7 Reconciliação periódica

Job diário (3h da manhã) compara estado Firestore vs Google Calendar e corrige inconsistências.

### 7.8 OAuth Status

- **Fase A**: modo Testing (até 100 usuários, sem verificação Google)
- **Fase B**: publicação em produção (verificação Google necessária)

---

## 8. 🔔 Sistema de Notificações

### 8.1 Canais (Fase A)

- **Push Notifications**: Expo Notifications + Firebase Cloud Messaging
- **In-app Notifications**: Firestore real-time + central com sino 🔔

### 8.2 Tipos de notificação (Fase A)

| # | Tipo | Trigger | Canal |
|---|---|---|---|
| 1 | Novo atendimento agendado | Cliente/dono cria atendimento | Push + In-app |
| 2 | Atendimento cancelado | Cancelamento | Push + In-app |
| 3 | Atendimento remarcado | Alteração de data/hora | Push + In-app |
| 4 | Lembrete pré-atendimento | 30min antes (configurável) | Push |
| 5 | Erro de sincronização Google | Falha persistente | Push + In-app |
| 6 | Conexão Google expirou | Token revogado | Push + In-app |

### 8.3 Central de notificações (in-app)

- Ícone de sino 🔔 no header com badge de não lidas
- Agrupamento por data (Hoje, Ontem, Esta semana, Mais antigas)
- Swipe para excluir
- Botão "Marcar todas como lidas"
- Filtros por tipo
- Toque abre item relacionado
- Histórico de 90 dias

### 8.4 Configurações por usuário

Tela dedicada permite:
- Ativar/desativar push e in-app por tipo de notificação
- Configurar tempo do lembrete pré-atendimento
- Definir horário "Não perturbe" (ex: 22h–7h)

### 8.5 Notificações da Fase B (adiadas)

- Aniversários de clientes
- Clientes inativos (60+ dias)
- Resumos diários/semanais
- Metas atingidas
- E-mails automáticos
- WhatsApp para clientes finais

---

## 9. 👑 Painel Administrativo

### 9.1 Localização

Integrado ao próprio app (não há painel web separado na Fase A). Acessível apenas para `super_admin` e parcialmente para `salon_owner`.

### 9.2 Funcionalidades Super Admin (Ariel)

- Dashboard geral (salões ativos, métricas)
- Gerenciar salões (criar, editar, desativar)
- Gerenciar usuários (todos os papéis)
- Visualizar logs de auditoria
- Monitorar erros de sincronização Google
- Configurações globais da plataforma

### 9.3 Funcionalidades Salon Owner

- Dashboard do salão (atendimentos do dia, faturamento)
- Gerenciar manicures (adicionar, remover, editar)
- Visualizar agendas de todas as manicures (visão consolidada)
- Visualizar todos os clientes
- Relatórios financeiros do salão
- Configurações do salão

### 9.4 Segurança

- Allowlist para `super_admin`
- 2FA obrigatório para `super_admin` e `salon_owner`
- Todos os acessos administrativos registrados em `auditLogs`
- Sessões com expiração reduzida (1h de inatividade)

---

## 10. 📱 Telas e Fluxos do App

### 10.1 Fluxos por papel

#### 🔵 Manicure
1. Login → Onboarding (conectar Google Calendar)
2. Home: agenda do dia
3. Calendário mensal/semanal
4. Detalhes do atendimento
5. Criar/editar atendimento
6. Lista de clientes
7. Detalhes do cliente
8. Comandas (abrir, fechar)
9. Notificações
10. Perfil e configurações

#### 🟣 Salon Owner
- Tudo da manicure +
- Dashboard administrativo
- Gerenciar manicures
- Visão consolidada de agendas
- Relatórios financeiros

#### 🔴 Super Admin
- Dashboard global
- Gerenciar salões
- Gerenciar usuários
- Auditoria
- Monitoramento

### 10.2 Telas principais (estimativa)

- **Auth**: Login, Cadastro, Recuperar senha, 2FA
- **Onboarding**: Conectar Google, Configurar perfil
- **Agenda**: Calendário, Detalhes, Criar/editar
- **Clientes**: Lista, Detalhes, Criar/editar
- **Comandas**: Lista, Criar, Fechar
- **Notificações**: Central, Configurações
- **Admin**: Dashboard, Salões, Usuários, Logs
- **Perfil**: Configurações, Sair

**Total estimado: ~30 telas**

---

## 11. 🔒 Segurança e LGPD

### 11.1 Princípios

- Criptografia em trânsito (HTTPS/TLS)
- Criptografia em repouso (Firebase nativo + tokens Google em campo criptografado)
- Princípio do menor privilégio (RBAC)
- Auditoria completa de ações sensíveis

### 11.2 LGPD

- Termo de consentimento na criação de conta
- Política de privacidade clara
- Direito de exportação de dados (Cloud Function dedicada)
- Direito de exclusão (anonimização + soft delete)
- DPO identificado (Ariel para Fase A)
- Logs de acesso a dados pessoais

### 11.3 Práticas técnicas

- Validação dupla (cliente + Cloud Functions)
- Rate limiting em endpoints sensíveis
- Sanitização de inputs
- Proteção contra injection
- Tokens com rotação periódica

---

## 12. 📅 Cronograma Detalhado — Fase A (5 meses)

### Mês 1 — Fundação
- Setup do projeto (Expo, TypeScript, NativeWind)
- Configuração Firebase
- Sistema de autenticação
- RBAC e regras Firestore
- Telas base de auth
- Allowlist super admin + 2FA

### Mês 2 — Core do App
- Modelagem completa Firestore
- CRUD de clientes
- CRUD de atendimentos
- Calendário visual (react-native-calendars)
- CRUD de comandas
- Estado global (Zustand) + TanStack Query

### Mês 3 — Admin e Integração Google (parte 1)
- Painel admin (super_admin + salon_owner)
- Gerenciamento de salões e usuários
- Auditoria de ações
- OAuth Google Calendar
- Sync App → Google (Nível 1)
- Criação de calendário dedicado (Nível 3)

### Mês 4 — Sincronização Bidirecional + Notificações
- Webhooks Google Calendar (Nível 2)
- Renovação automática de canais
- Resolução de conflitos
- Reconciliação periódica
- Sistema de notificações (push + in-app)
- Central de notificações
- Configurações de notificação

### Mês 5 — Testes, Refinamentos e Piloto
- Testes E2E (Maestro)
- Testes manuais com piloto
- Performance e otimização
- Acessibilidade básica
- Documentação de uso
- Início do piloto real

---

## 13. ✅ Critérios de Aceite do Piloto

- [ ] Manicure consegue conectar Google Calendar em <2 minutos
- [ ] Atendimento criado no app aparece no Google em <10 segundos
- [ ] Alteração no Google aparece no app em <10 segundos
- [ ] Push notification entregue em <5 segundos do trigger
- [ ] Zero perda de dados em 30 dias de uso real
- [ ] Tempo de carregamento da agenda <2 segundos
- [ ] Funciona em iOS 15+ e Android 10+
- [ ] Dono do salão visualiza agendas das 2 manicures
- [ ] Logs de auditoria registram 100% das ações admin
- [ ] 2FA funcional para super_admin e salon_owner

---

## 14. 🚀 Roadmap Fase B (pós-piloto)

### Funcionalidades
- Onboarding self-service de novos salões
- Notificações expandidas (aniversários, inativos, resumos)
- WhatsApp Business API (confirmação automática para clientes)
- E-mails automáticos
- Relatórios avançados e BI
- Programa de fidelidade
- Agendamento online para clientes finais
- Sistema de avaliações
- Versão web (Next.js + Tamagui ou similar)

### Técnico
- Publicação OAuth Google em produção
- CI/CD completo (EAS Build + EAS Submit)
- Monitoramento avançado (Sentry, Datadog)
- A/B testing
- Internacionalização (i18n)

---

## 15. 📐 Diretrizes de Código

### 15.1 TypeScript
- Strict mode habilitado
- Sem `any` exceto em casos justificados com comentário
- Tipos derivados via Zod schemas quando possível
- Interfaces para contratos externos, types para uniões/utilitários

### 15.2 Estrutura de pastas (Expo Router)

```
app/
  (auth)/
    login.tsx
    signup.tsx
  (manicure)/
    agenda.tsx
    clients.tsx
  (admin)/
    dashboard.tsx
    salons.tsx
  _layout.tsx

src/
  components/      # componentes reutilizáveis
    ui/            # primitivos (Button, Input, Card)
    features/      # específicos de feature
  hooks/           # custom hooks
  services/        # Firebase, Google Calendar, etc
  stores/          # Zustand stores
  types/           # tipos globais
  utils/           # utilitários
  constants/       # constantes
  schemas/         # Zod schemas

functions/         # Cloud Functions
  src/
    auth/
    calendar/
    notifications/
    audit/
```

### 15.3 NativeWind
- Sempre `className` em vez de `style` (exceto casos específicos)
- Tema customizado em `tailwind.config.js`
- Cores semânticas: `primary`, `secondary`, `accent`, `success`, `error`
- Dark mode pronto desde o início

### 15.4 Padrões
- Componentes funcionais com hooks
- Custom hooks para lógica reutilizável
- Cloud Functions modulares e testáveis
- Commits semânticos (Conventional Commits)
- Branches: `main`, `develop`, `feature/*`, `fix/*`

### 15.5 Qualidade
- ESLint + Prettier configurados
- Husky + lint-staged (pre-commit)
- Testes unitários (Vitest) para lógica crítica
- Testes E2E (Maestro) para fluxos principais

---

## 16. 📊 Métricas de Sucesso

### Técnicas
- Crash-free rate >99.5%
- Tempo médio de sincronização <10s
- Uptime backend >99.9%
- Score de performance (Lighthouse mobile equivalente) >90

### Produto
- NPS do piloto >50
- Taxa de retenção do piloto >90% em 30 dias
- Tempo médio de onboarding <5 minutos
- Zero perda de atendimentos por falha técnica

---

## 17. 📞 Stakeholders

| Papel | Pessoa | Responsabilidade |
|---|---|---|
| Product Owner | Ariel | Visão, decisões, super admin |
| Salon Owner Piloto | A definir | Validação de negócio |
| Manicures Piloto | 2 a definir | Validação de uso |

---

## 18. 🎯 Considerações Finais

Este documento representa a especificação completa e aprovada da Fase A do NailFlow. Todas as decisões técnicas e de produto foram validadas e devem ser seguidas como referência mestra durante o desenvolvimento.

Qualquer mudança de escopo deve ser documentada como ADR (Architecture Decision Record) e versionada neste documento.

**Status**: ✅ Aprovado para início de desenvolvimento
**Próximo passo**: Setup do projeto e início do Mês 1

---

*Documento gerado em colaboração entre Ariel e Claude Opus 4.7 (Anthropic).*
