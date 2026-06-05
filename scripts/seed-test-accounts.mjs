/* eslint-disable expo/no-dynamic-env-var */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, join, resolve } from 'node:path';

const requireFromFunctions = createRequire(resolve(process.cwd(), 'functions/package.json'));
const { cert, getApps, initializeApp } = requireFromFunctions('firebase-admin/app');
const { getAuth } = requireFromFunctions('firebase-admin/auth');
const { FieldValue, Timestamp, getFirestore } = requireFromFunctions('firebase-admin/firestore');

function loadDotEnvIfPresent() {
  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) {
    return;
  }

  const raw = readFileSync(envPath, 'utf-8');
  const lines = raw.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    value = value.replace(/^['"]|['"]$/g, '');

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variavel obrigatoria ausente: ${name}`);
  }
  return value;
}

function resolveServiceAccountPath() {
  const explicitPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (explicitPath && existsSync(explicitPath)) {
    return explicitPath;
  }

  const secretsDir = resolve(process.cwd(), 'secrets', 'firebase');
  if (!existsSync(secretsDir)) {
    throw new Error('Credencial admin nao encontrada em secrets/firebase.');
  }

  const serviceAccountFile = readdirSync(secretsDir).find(
    (fileName) => fileName.endsWith('.json') && fileName.includes('firebase-adminsdk')
  );

  if (!serviceAccountFile) {
    throw new Error('Arquivo firebase-adminsdk*.json nao encontrado em secrets/firebase.');
  }

  return join(secretsDir, serviceAccountFile);
}

function initializeAdmin(projectId) {
  if (getApps().length > 0) {
    return;
  }

  const serviceAccountPath = resolveServiceAccountPath();
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

  initializeApp({
    credential: cert(serviceAccount),
    projectId,
  });

  console.log(`Usando credencial admin local: ${basename(serviceAccountPath)}`);
}

async function ensureAuthUser(auth, account) {
  try {
    const user = await auth.getUserByEmail(account.email);
    await auth.updateUser(user.uid, {
      displayName: account.displayName,
      password: account.password,
      emailVerified: true,
    });
    return { user, created: false };
  } catch (error) {
    if (error?.code !== 'auth/user-not-found') {
      throw error;
    }

    const user = await auth.createUser({
      email: account.email,
      password: account.password,
      displayName: account.displayName,
      emailVerified: true,
    });
    return { user, created: true };
  }
}

async function setWithTimestamps(ref, payload) {
  const snapshot = await ref.get();
  const createdAt =
    snapshot.exists && snapshot.get('createdAt') ? snapshot.get('createdAt') : FieldValue.serverTimestamp();

  await ref.set(
    {
      ...payload,
      createdAt,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

function dateAtLocalTime(daysFromToday, hour, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function buildDefaultNotificationPreferences() {
  return {
    newAppointment: true,
    appointmentCanceled: true,
    appointmentRescheduled: true,
    preReminder: true,
    syncError: true,
    googleExpired: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
    preReminderMinutes: 60,
  };
}

function buildDefaultTwoFactor() {
  return {
    totp: {
      required: false,
      enabled: false,
      secret: null,
      pendingSecret: null,
      enrolledAt: null,
      enrollmentStartedAt: null,
      lastVerifiedAt: null,
    },
  };
}

async function seedUsers(db, auth, accounts) {
  const usersByKey = {};

  for (const account of accounts) {
    const { user, created } = await ensureAuthUser(auth, account);
    usersByKey[account.key] = user;

    await setWithTimestamps(db.collection('users').doc(user.uid), {
      uid: user.uid,
      email: account.email,
      displayName: account.displayName,
      role: account.role,
      salonId: account.salonId,
      googleCalendar: {
        connected: false,
        syncStatus: 'idle',
        tokenVersion: 1,
        isRefreshingToken: false,
      },
      notificationPreferences: buildDefaultNotificationPreferences(),
      twoFactor: buildDefaultTwoFactor(),
      fcmTokens: [],
    });

    console.log(`${created ? 'CRIADA' : 'ATUALIZADA'}: ${account.email} | role=${account.role}`);
  }

  return usersByKey;
}

async function seedTestEntities(db, usersByKey) {
  const salonId = 'salon-teste-001';
  const clientId = 'client-teste-001';
  const appointmentId = 'appointment-teste-001';
  const openCommandId = 'command-teste-aberta-001';
  const closedCommandId = 'command-teste-fechada-001';
  const ownerUid = usersByKey.owner.uid;
  const manicureUid = usersByKey.manicure.uid;
  const adminUid = usersByKey.admin.uid;
  const appointmentStart = dateAtLocalTime(0, 14, 0);
  const appointmentEnd = dateAtLocalTime(0, 15, 0);
  const closedAt = dateAtLocalTime(-1, 17, 30);

  await setWithTimestamps(db.collection('salons').doc(salonId), {
    name: 'Salao Teste NailFlow',
    ownerId: ownerUid,
    active: true,
    settings: {
      timezone: 'America/Sao_Paulo',
      currency: 'BRL',
    },
  });

  await setWithTimestamps(db.collection('clients').doc(clientId), {
    salonId,
    name: 'Cliente Teste',
    phone: '(11) 99999-0001',
    email: 'cliente.teste@nailflow.app',
    birthDate: null,
    notes: 'Cliente de exemplo para validar cadastro, busca e agendamento.',
    tags: ['teste', 'vip'],
    lastVisit: Timestamp.fromDate(dateAtLocalTime(-7, 10, 0)),
  });

  await setWithTimestamps(db.collection('appointments').doc(appointmentId), {
    salonId,
    manicureId: manicureUid,
    clientId,
    status: 'confirmed',
    startTime: Timestamp.fromDate(appointmentStart),
    endTime: Timestamp.fromDate(appointmentEnd),
    notes: 'Atendimento de exemplo criado pelo seed de testes.',
    priceCents: 8500,
    syncStatus: 'disabled',
    syncUpdatedAt: FieldValue.serverTimestamp(),
    syncErrorMessage: null,
    googleEventId: null,
  });

  await setWithTimestamps(db.collection('commands').doc(openCommandId), {
    salonId,
    appointmentId,
    clientId,
    manicureId: manicureUid,
    items: [
      {
        service: 'Manicure simples',
        price: 5000,
        quantity: 1,
      },
      {
        service: 'Decoracao filha unica',
        price: 1500,
        quantity: 1,
      },
    ],
    total: 6500,
    paymentMethod: null,
    status: 'open',
    closedAt: null,
  });

  await setWithTimestamps(db.collection('commands').doc(closedCommandId), {
    salonId,
    appointmentId,
    clientId,
    manicureId: manicureUid,
    items: [
      {
        service: 'Alongamento em gel',
        price: 12000,
        quantity: 1,
      },
    ],
    total: 12000,
    paymentMethod: 'pix',
    status: 'closed',
    closedAt: Timestamp.fromDate(closedAt),
  });

  const notificationExpiresAt = dateAtLocalTime(14, 23, 59);
  const notifications = [
    {
      id: 'notification-admin-teste-001',
      userId: adminUid,
      salonId: null,
      title: 'Ambiente de testes atualizado',
      body: 'Dados de exemplo foram criados para validar o painel administrativo.',
      type: 'new_appointment',
      priority: 'normal',
    },
    {
      id: 'notification-owner-teste-001',
      userId: ownerUid,
      salonId,
      title: 'Nova comanda de exemplo',
      body: 'Use esta notificacao para validar a central do salao.',
      type: 'new_appointment',
      priority: 'normal',
    },
    {
      id: 'notification-manicure-teste-001',
      userId: manicureUid,
      salonId,
      title: 'Atendimento confirmado',
      body: 'Cliente Teste possui atendimento confirmado para hoje.',
      type: 'pre_reminder',
      priority: 'high',
    },
  ];

  for (const notification of notifications) {
    await setWithTimestamps(db.collection('notifications').doc(notification.id), {
      userId: notification.userId,
      salonId: notification.salonId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      read: false,
      priority: notification.priority,
      channel: ['in_app'],
      data: {
        source: 'seed',
        appointmentId,
        clientId,
      },
      readAt: null,
      expiresAt: Timestamp.fromDate(notificationExpiresAt),
    });
  }

  await db
    .collection('auditLogs')
    .doc('audit-log-teste-001')
    .set(
      {
        userId: adminUid,
        userRole: 'super_admin',
        action: 'seed.test-data.upserted',
        targetType: 'seed',
        targetId: 'test-data',
        salonId,
        source: 'manual',
        metadata: {
          script: 'seed-test-accounts',
          deterministic: true,
        },
        ipAddress: null,
        userAgent: 'local-seed',
        requestId: null,
        timestamp: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

  await setWithTimestamps(db.collection('syncQueueDeadLetter').doc('sync-dead-letter-teste-001'), {
    userId: manicureUid,
    source: 'full_reconciliation',
    status: 'dead_letter',
    attempts: 3,
    maxAttempts: 3,
    forceFull: true,
    channelId: null,
    resourceId: null,
    resourceState: null,
    messageNumber: null,
    errorMessage: 'Exemplo inerte para validar leitura administrativa de fila morta.',
    failedAt: FieldValue.serverTimestamp(),
  });

  return {
    salonId,
    clientId,
    appointmentId,
    commandIds: [openCommandId, closedCommandId],
    notificationIds: notifications.map((notification) => notification.id),
  };
}

async function main() {
  loadDotEnvIfPresent();

  const projectId = requiredEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID');
  const defaultPassword = process.env.TEST_ACCOUNT_PASSWORD ?? 'Nailflow@123';
  const salonId = 'salon-teste-001';

  initializeAdmin(projectId);

  const accounts = [
    {
      key: 'manicure',
      email: 'manicure.teste@nailflow.app',
      password: defaultPassword,
      role: 'nail_technician',
      displayName: 'Manicure Teste',
      salonId,
    },
    {
      key: 'owner',
      email: 'owner.teste@nailflow.app',
      password: defaultPassword,
      role: 'salon_owner',
      displayName: 'Owner Teste',
      salonId,
    },
    {
      key: 'admin',
      email: 'admin.teste@nailflow.app',
      password: defaultPassword,
      role: 'super_admin',
      displayName: 'Admin Teste',
      salonId: null,
    },
  ];

  const auth = getAuth();
  const db = getFirestore();

  console.log('Criando/atualizando contas e dados de teste...');
  const usersByKey = await seedUsers(db, auth, accounts);
  const seeded = await seedTestEntities(db, usersByKey);

  console.log('Seed concluida.');
  console.log(`Entidades: salon=${seeded.salonId}, client=${seeded.clientId}, appointment=${seeded.appointmentId}`);
  console.log(`Comandas: ${seeded.commandIds.join(', ')}`);
  console.log(`Notificacoes: ${seeded.notificationIds.join(', ')}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Falha no seed de testes: ${message}`);
  process.exit(1);
});
