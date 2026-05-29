
### Componentes serverless complementares

Mesmo no monolito, use **serverless para tarefas pontuais**:

- **Cloudflare Workers** ou **AWS Lambda** para webhooks (Stripe, WhatsApp).
- **Cron jobs** (lembretes diários, aniversários) via Railway Cron ou EventBridge.
- **Processamento de imagens** assíncrono via BullMQ workers.

### Quando quebrar em microsserviços?

Apenas quando:

- Passar de ~10.000 salões ativos.
- Houver equipe > 15 devs.
- Algum módulo (ex: WhatsApp) tiver requisitos de escala muito distintos.

---

## 7. Integrações e Serviços Adicionais

### Banco de dados

**Principal: PostgreSQL** (Neon ou Supabase no início; RDS depois).

- Suporta JSON nativo (útil para preferências de clientes, observações flexíveis).
- Row Level Security para multi-tenant.
- Transações ACID — essencial para financeiro.
- Full-text search nativo para busca de clientes.

**Complementar: Redis** (Upstash).

- Cache de sessões.
- Filas de jobs (BullMQ).
- Rate limiting.

**Não recomendado NoSQL principal** para este caso — os dados são fortemente relacionais (cliente → atendimento → serviço → pagamento).

### Storage de mídia

**Cloudflare R2** (preferido) ou **AWS S3**.

- R2 não cobra egress → economia enorme com fotos.
- URLs assinadas com expiração.
- Bucket por tenant ou prefixo por `salon_id`.

### APIs externas essenciais

| Integração | Serviço | Uso |
|---|---|---|
| **WhatsApp** | Meta Cloud API (oficial) | Lembretes, confirmações, aniversários |
| **Pagamentos (assinatura SaaS)** | Stripe ou Pagar.me | Cobrança recorrente do plano |
| **Pagamentos (cliente final, futuro)** | Mercado Pago / Pix Asaas | Cliente paga manicure pelo app |
| **E-mail transacional** | Resend ou Amazon SES | Recuperação de senha, recibos |
| **SMS (fallback WhatsApp)** | Twilio ou Zenvia | Backup quando WhatsApp falha |
| **CEP/Endereço** | ViaCEP | Cadastro de salão |
| **Push notifications** | Firebase Cloud Messaging | Lembretes (web push + futuro app) |

### Autenticação

- **Próprio backend (Passport + JWT)** no início — controle total e sem custo extra.
- Login social opcional: **Google OAuth** (manicures usam muito Gmail).
- Alternativa pronta: **Clerk** ou **Auth0** — bom DX, mas custo cresce por usuário.

### Recomendação extra: catálogo público de agendamento

A funcionalidade "Catálogo online" do plano Premium pode ser uma **página pública por salão** (`nailflow.com.br/salao/nome-do-salao`):

- Cliente final agenda sem login.
- Reduz fricção e vira canal de aquisição.
- Implementável com rotas dinâmicas no Next.js.

---

## Resumo Executivo

| Item | Recomendação |
|---|---|
| **Plataforma** | PWA primeiro, React Native depois |
| **Frontend** | Next.js + TypeScript + Tailwind |
| **Backend** | NestJS + TypeScript |
| **Banco** | PostgreSQL (Neon/Supabase → RDS) |
| **Cache/filas** | Redis (Upstash) |
| **Storage** | Cloudflare R2 |
| **Hospedagem MVP** | Vercel + Railway |
| **Arquitetura** | Monolito modular |
| **Auth** | JWT próprio + Google OAuth |
| **Pagamentos** | Stripe (global) ou Pagar.me (BR) |
| **WhatsApp** | Meta Cloud API oficial |
| **Monitoramento** | Sentry + PostHog + Better Stack |
| **Custo infra MVP** | ~US$ 50–120/mês |

Essa stack permite **lançar o MVP em 3–4 meses com 1–2 devs**, validar o produto e escalar sem precisar refazer do zero. A escolha de TypeScript end-to-end + monolito modular é o que mais gera produtividade para uma equipe pequena num SaaS B2B nesse estágio.

---

## Próximos passos sugeridos

- [ ] Detalhar o **modelo de dados (schema PostgreSQL)** com tabelas e relacionamentos.
- [ ] Especificar a **arquitetura do módulo de WhatsApp + lembretes automáticos**.
- [ ] Definir o **fluxo de onboarding** do salão (cadastro → setup inicial → primeiro agendamento).
- [ ] Planejar a **estratégia de testes** (unit, integration, e2e).
- [ ] Criar o **roadmap técnico trimestral** dos primeiros 12 meses.

---

*Documento gerado em maio/2026 — NailFlow Infraestrutura v1.0*
