/* eslint-disable require-jsdoc */
import {getAuth} from "firebase-admin/auth";
import {FieldValue, getFirestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import {
  getUserProfile,
  requireAuthenticatedUid,
  type UserProfile,
} from "../shared/user-context";
import {writeAuditLog} from "../audit";
import {ensureValidIanaTimeZoneOrThrow} from "../shared/timezone";

interface CreateSalonInput {
  name: string;
  ownerId: string | null;
  settings: {
    timezone: string;
    currency: string;
  };
  active: boolean;
}

function getRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ?
    (value as Record<string, unknown>) :
    {};
}

function readRequiredName(value: unknown): string {
  if (typeof value !== "string") {
    throw new HttpsError("invalid-argument", "Nome do salao e obrigatorio.");
  }

  const trimmedValue = value.trim();

  if (trimmedValue.length < 2 || trimmedValue.length > 120) {
    throw new HttpsError(
      "invalid-argument",
      "Nome do salao deve ter entre 2 e 120 caracteres."
    );
  }

  return trimmedValue;
}

function readOptionalOwnerId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function readBooleanWithDefault(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function readSettings(value: unknown): {timezone: string; currency: string} {
  const settingsRecord = getRecord(value);
  const rawTimezone = settingsRecord.timezone;
  const rawCurrency = settingsRecord.currency;

  const timezone = typeof rawTimezone === "string" ?
    rawTimezone.trim() :
    "America/Sao_Paulo";

  if (!timezone) {
    throw new HttpsError("invalid-argument", "Timezone nao pode ser vazia.");
  }

  ensureValidIanaTimeZoneOrThrow(timezone);

  const currency = typeof rawCurrency === "string" ?
    rawCurrency.trim().toUpperCase() :
    "BRL";

  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new HttpsError(
      "invalid-argument",
      "Moeda invalida. Use codigo ISO-4217 com 3 letras (ex.: BRL)."
    );
  }

  return {
    timezone,
    currency,
  };
}

function parseCreateSalonInput(data: unknown): CreateSalonInput {
  const payload = getRecord(data);

  return {
    name: readRequiredName(payload.name),
    ownerId: readOptionalOwnerId(payload.ownerId),
    settings: readSettings(payload.settings),
    active: readBooleanWithDefault(payload.active, true),
  };
}

function ensureCallerCanCreateSalon(
  callerProfile: UserProfile,
  callerUid: string,
  requestedOwnerId: string | null
): string {
  if (
    callerProfile.role !== "super_admin" &&
    callerProfile.role !== "salon_owner"
  ) {
    throw new HttpsError(
      "permission-denied",
      "Somente super_admin e salon_owner podem criar salao."
    );
  }

  if (callerProfile.role === "salon_owner") {
    if (requestedOwnerId && requestedOwnerId !== callerUid) {
      throw new HttpsError(
        "permission-denied",
        "salon_owner so pode criar salao para si mesmo."
      );
    }

    return callerUid;
  }

  return requestedOwnerId ?? callerUid;
}

export const createSalon = onCall(async (request) => {
  const callerUid = requireAuthenticatedUid(request);
  const callerProfile = await getUserProfile(callerUid);
  const input = parseCreateSalonInput(request.data);

  const ownerUid = ensureCallerCanCreateSalon(
    callerProfile,
    callerUid,
    input.ownerId
  );

  const ownerProfile = await getUserProfile(ownerUid);

  if (ownerProfile.role === "super_admin") {
    throw new HttpsError(
      "invalid-argument",
      "super_admin nao pode ser owner de salao. Escolha outro usuario."
    );
  }

  if (callerProfile.role === "salon_owner" && callerProfile.salonId) {
    throw new HttpsError(
      "failed-precondition",
      "Este salon_owner ja esta vinculado a um salao."
    );
  }

  const firestore = getFirestore();
  const salonRef = firestore.collection("salons").doc();
  const ownerRef = firestore.collection("users").doc(ownerUid);

  await firestore.runTransaction(async (transaction) => {
    const ownerSnapshot = await transaction.get(ownerRef);

    if (!ownerSnapshot.exists) {
      throw new HttpsError("not-found", "Usuario owner nao encontrado.");
    }

    const ownerData = ownerSnapshot.data() ?? {};
    const ownerSalonId =
      typeof ownerData.salonId === "string" && ownerData.salonId.trim() ?
        ownerData.salonId.trim() :
        null;

    if (ownerSalonId) {
      throw new HttpsError(
        "failed-precondition",
        "Usuario owner ja vinculado a outro salao."
      );
    }

    transaction.set(salonRef, {
      name: input.name,
      ownerId: ownerUid,
      active: input.active,
      settings: {
        timezone: input.settings.timezone,
        currency: input.settings.currency,
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    transaction.set(
      ownerRef,
      {
        role: "salon_owner",
        salonId: salonRef.id,
        updatedAt: FieldValue.serverTimestamp(),
      },
      {merge: true}
    );
  });

  const auth = getAuth();
  const ownerAuthRecord = await auth.getUser(ownerUid);
  const existingClaims = ownerAuthRecord.customClaims ?? {};

  if (existingClaims.role !== "salon_owner") {
    await auth.setCustomUserClaims(ownerUid, {
      ...existingClaims,
      role: "salon_owner",
    });
  }

  try {
    const forwardedForHeader = request.rawRequest.headers["x-forwarded-for"];
    const forwardedFor =
      typeof forwardedForHeader === "string" ?
        forwardedForHeader.split(",")[0]?.trim() ?? null :
        null;
    const ipAddress = forwardedFor ?? request.rawRequest.ip ?? null;

    await writeAuditLog({
      userId: callerUid,
      actorRole: callerProfile.role,
      action: "salon.create",
      targetType: "salon",
      targetId: salonRef.id,
      salonId: salonRef.id,
      source: "callable",
      ipAddress,
      metadata: {
        ownerId: ownerUid,
        active: input.active,
        timezone: input.settings.timezone,
        currency: input.settings.currency,
      },
    });
  } catch (error) {
    logger.warn("Failed to persist audit log for createSalon", {
      callerUid,
      salonId: salonRef.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return {
    salonId: salonRef.id,
    ownerId: ownerUid,
    name: input.name,
    active: input.active,
    settings: input.settings,
  };
});
