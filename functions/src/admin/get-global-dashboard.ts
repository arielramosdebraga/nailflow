/* eslint-disable require-jsdoc */
import {getFirestore} from "firebase-admin/firestore";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import {extractRequestMetadata} from "../audit/extract-request-metadata";
import {writeAuditLog} from "../audit/write-audit-log";
import {
  GetGlobalDashboardResponse,
  GlobalDashboardSummary,
  parseGetGlobalDashboardInput,
} from "./admin-dashboard.schema";
import {
  getUserProfile,
  requireAuthenticatedUid,
} from "../shared/user-context";

async function getCollectionCount(collectionName: string): Promise<number> {
  const snapshot = await getFirestore().collection(collectionName).count().get();
  return snapshot.data().count;
}

async function getUsersByRoleCount(
  role: "super_admin" | "salon_owner"
): Promise<number> {
  const snapshot = await getFirestore()
    .collection("users")
    .where("role", "==", role)
    .count()
    .get();

  return snapshot.data().count;
}

async function getNailTechniciansCount(): Promise<number> {
  const snapshot = await getFirestore()
    .collection("users")
    .where("role", "in", ["nail_technician", "manicure"])
    .count()
    .get();

  return snapshot.data().count;
}

async function getSalonsCount(includeInactiveSalons: boolean): Promise<{
  totalSalons: number;
  activeSalons: number;
}> {
  const activeSnapshot = await getFirestore()
    .collection("salons")
    .where("active", "==", true)
    .count()
    .get();

  const activeSalons = activeSnapshot.data().count;

  if (!includeInactiveSalons) {
    return {
      totalSalons: activeSalons,
      activeSalons,
    };
  }

  const totalSalons = await getCollectionCount("salons");

  return {
    totalSalons,
    activeSalons,
  };
}

export const getGlobalDashboard = onCall(async (request) => {
  const callerUid = requireAuthenticatedUid(request);
  const callerProfile = await getUserProfile(callerUid);

  if (callerProfile.role !== "super_admin") {
    throw new HttpsError(
      "permission-denied",
      "Somente super_admin pode acessar o dashboard global."
    );
  }

  const input = parseGetGlobalDashboardInput(request.data);
  const generatedAt = new Date().toISOString();

  const [{totalSalons, activeSalons}, totalUsers, superAdmins, salonOwners, nailTechnicians, totalClients, totalAppointments] = await Promise.all([
    getSalonsCount(input.includeInactiveSalons),
    getCollectionCount("users"),
    getUsersByRoleCount("super_admin"),
    getUsersByRoleCount("salon_owner"),
    getNailTechniciansCount(),
    getCollectionCount("clients"),
    getCollectionCount("appointments"),
  ]);

  const summary: GlobalDashboardSummary = {
    totalSalons,
    activeSalons,
    totalUsers,
    superAdmins,
    salonOwners,
    nailTechnicians,
    totalClients,
    totalAppointments,
  };

  await writeAuditLog({
    userId: callerUid,
    userRole: callerProfile.role,
    action: "admin.dashboard.global.read",
    targetType: "dashboard",
    targetId: "global",
    metadata: {
      includeInactiveSalons: input.includeInactiveSalons,
      totalSalons,
      activeSalons,
    },
    requestMetadata: extractRequestMetadata(request),
  });

  const response: GetGlobalDashboardResponse = {
    summary,
    generatedAt,
  };

  return response;
});
