/* eslint-disable require-jsdoc */
import {getFirestore} from "firebase-admin/firestore";
import {CallableRequest, HttpsError} from "firebase-functions/v2/https";

export type UserRole =
  | "super_admin"
  | "salon_owner"
  | "nail_technician"
  | "manicure";
export type AdminRole = "super_admin" | "salon_owner";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  salonId: string | null;
}

const USER_ROLES: ReadonlySet<string> = new Set([
  "super_admin",
  "salon_owner",
  "nail_technician",
  "manicure",
]);

function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && USER_ROLES.has(value);
}

function normalizeOptionalString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizeNullableString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

export function requireAuthenticatedUid(
  request: CallableRequest<unknown>
): string {
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError(
      "unauthenticated",
      "Autenticacao obrigatoria para executar esta operacao."
    );
  }

  return uid;
}

export async function getUserProfile(uid: string): Promise<UserProfile> {
  const snapshot = await getFirestore().collection("users").doc(uid).get();

  if (!snapshot.exists) {
    throw new HttpsError("not-found", "Perfil de usuario nao encontrado.");
  }

  const data = snapshot.data();

  if (!data || !isUserRole(data.role)) {
    throw new HttpsError(
      "failed-precondition",
      "Perfil de usuario sem role valida no Firestore."
    );
  }

  return {
    uid,
    email: normalizeOptionalString(data.email),
    displayName: normalizeOptionalString(data.displayName),
    role: data.role,
    salonId: normalizeNullableString(data.salonId),
  };
}

export function assertAdminRole(
  profile: UserProfile
): asserts profile is UserProfile & {role: AdminRole} {
  if (profile.role !== "super_admin" && profile.role !== "salon_owner") {
    throw new HttpsError(
      "permission-denied",
      "Somente super_admin e salon_owner podem executar esta operacao."
    );
  }
}
