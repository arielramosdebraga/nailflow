/* eslint-disable require-jsdoc */
import {getFirestore} from "firebase-admin/firestore";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {writeAuditLog} from "../audit";
import {getUserProfile, requireAuthenticatedUid} from "../shared/user-context";

interface ExportUserRecord {
  uid: string;
  displayName: string;
  email: string;
  role: string;
  salonId: string | null;
  active: boolean;
}

interface ExportSalonRecord {
  id: string;
  name: string;
  ownerId: string | null;
  active: boolean;
}

interface ExportAuditRecord {
  id: string;
  action: string;
  userId: string;
  targetType: string;
  targetId: string | null;
  timestamp: string | null;
}

function assertSuperAdmin(role: string): void {
  if (role !== "super_admin") {
    throw new HttpsError(
      "permission-denied",
      "Somente superadministradores podem exportar dados LGPD."
    );
  }
}

function parseDateIso(value: unknown): string | null {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().toISOString();
  }

  return null;
}

function mapUser(
  snapshot: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>
): ExportUserRecord {
  const data = snapshot.data();

  return {
    uid: snapshot.id,
    displayName: typeof data.displayName === "string" ? data.displayName : "",
    email: typeof data.email === "string" ? data.email : "",
    role: typeof data.role === "string" ? data.role : "unknown",
    salonId: typeof data.salonId === "string" ? data.salonId : null,
    active: data.active !== false,
  };
}

function mapSalon(
  snapshot: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>
): ExportSalonRecord {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    name: typeof data.name === "string" ? data.name : "",
    ownerId: typeof data.ownerId === "string" ? data.ownerId : null,
    active: data.active !== false,
  };
}

function mapAudit(
  snapshot: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>
): ExportAuditRecord {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    action: typeof data.action === "string" ? data.action : "",
    userId: typeof data.userId === "string" ? data.userId : "",
    targetType: typeof data.targetType === "string" ? data.targetType : "",
    targetId: typeof data.targetId === "string" ? data.targetId : null,
    timestamp: parseDateIso(data.timestamp),
  };
}

export const exportLgpdData = onCall(async (request) => {
  const uid = requireAuthenticatedUid(request);
  const profile = await getUserProfile(uid);
  assertSuperAdmin(profile.role);

  const firestore = getFirestore();
  const [usersSnapshot, salonsSnapshot, auditLogsSnapshot] = await Promise.all([
    firestore.collection("users").orderBy("displayName", "asc").limit(500).get(),
    firestore.collection("salons").orderBy("name", "asc").limit(200).get(),
    firestore.collection("auditLogs").orderBy("timestamp", "desc").limit(500).get(),
  ]);

  const users = usersSnapshot.docs.map((item) => mapUser(item));
  const salons = salonsSnapshot.docs.map((item) => mapSalon(item));
  const auditLogs = auditLogsSnapshot.docs.map((item) => mapAudit(item));

  try {
    await writeAuditLog({
      userId: uid,
      actorRole: profile.role,
      action: "lgpd.export.generated",
      targetType: "compliance",
      targetId: uid,
      salonId: null,
      source: "callable",
      metadata: {
        users: users.length,
        salons: salons.length,
        auditLogs: auditLogs.length,
      },
    });
  } catch (error) {
    logger.warn("Failed to persist audit log for exportLgpdData", {
      uid,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      users: users.length,
      salons: salons.length,
      auditLogs: auditLogs.length,
    },
    users,
    salons,
    auditLogs,
  };
});
