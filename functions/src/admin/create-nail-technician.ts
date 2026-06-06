/* eslint-disable require-jsdoc */
import {randomBytes} from "node:crypto";
import {getAuth} from "firebase-admin/auth";
import {FieldValue, getFirestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import {extractRequestMetadata} from "../audit/extract-request-metadata";
import {writeAuditLog} from "../audit/write-audit-log";
import {
  assertAdminRole,
  getUserProfile,
  requireAuthenticatedUid,
} from "../shared/user-context";

interface CreateNailTechnicianInput {
  displayName: string;
  email: string;
  phone: string | null;
}

interface ExistingUserProfile {
  email?: unknown;
  displayName?: unknown;
  createdAt?: unknown;
  fcmTokens?: unknown;
  role?: unknown;
  salonId?: unknown;
}

function getRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ?
    (value as Record<string, unknown>) :
    {};
}

function readRequiredDisplayName(value: unknown): string {
  if (typeof value !== "string") {
    throw new HttpsError(
      "invalid-argument",
      "Nome da profissional e obrigatorio."
    );
  }

  const trimmedValue = value.trim();

  if (trimmedValue.length < 2 || trimmedValue.length > 120) {
    throw new HttpsError(
      "invalid-argument",
      "Nome da profissional deve ter entre 2 e 120 caracteres."
    );
  }

  return trimmedValue;
}

function readRequiredEmail(value: unknown): string {
  if (typeof value !== "string") {
    throw new HttpsError("invalid-argument", "E-mail e obrigatorio.");
  }

  const normalizedEmail = value.trim().toLowerCase();

  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new HttpsError("invalid-argument", "E-mail invalido.");
  }

  return normalizedEmail;
}

function readOptionalPhone(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  if (trimmedValue.length > 30) {
    throw new HttpsError(
      "invalid-argument",
      "Telefone deve ter no maximo 30 caracteres."
    );
  }

  return trimmedValue;
}

function parseCreateNailTechnicianInput(
  data: unknown
): CreateNailTechnicianInput {
  const payload = getRecord(data);

  return {
    displayName: readRequiredDisplayName(payload.displayName),
    email: readRequiredEmail(payload.email),
    phone: readOptionalPhone(payload.phone),
  };
}

function normalizeExistingSalonId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function isExistingRoleAllowed(value: unknown): boolean {
  return value === "nail_technician" || value === "manicure";
}

function getAuthErrorCode(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return null;
  }

  return typeof error.code === "string" ? error.code : null;
}

function buildTemporaryPassword(): string {
  return `Tmp#${randomBytes(12).toString("base64url")}9a`;
}

export const createNailTechnician = onCall(async (request) => {
  const callerUid = requireAuthenticatedUid(request);
  const callerProfile = await getUserProfile(callerUid);
  assertAdminRole(callerProfile);

  if (!callerProfile.salonId) {
    throw new HttpsError(
      "failed-precondition",
      "Usuario administrador sem salao vinculado nao pode criar profissional."
    );
  }

  const input = parseCreateNailTechnicianInput(request.data);
  const auth = getAuth();
  const firestore = getFirestore();

  let createdUserUid: string | null = null;
  let createdNewAuthUser = false;

  try {
    let userRecord;

    try {
      userRecord = await auth.getUserByEmail(input.email);
    } catch (error) {
      const authErrorCode = getAuthErrorCode(error);

      if (authErrorCode !== "auth/user-not-found") {
        throw error;
      }

      userRecord = await auth.createUser({
        email: input.email,
        password: buildTemporaryPassword(),
        displayName: input.displayName,
        emailVerified: false,
        disabled: false,
      });

      createdNewAuthUser = true;
    }

    createdUserUid = userRecord.uid;

    const userRef = firestore.collection("users").doc(createdUserUid);
    let onboardingStatus: "created" | "pending" = createdNewAuthUser ?
      "created" :
      "pending";

    await firestore.runTransaction(async (transaction) => {
      const existingSnapshot = await transaction.get(userRef);
      const existingData = (existingSnapshot.data() ?? {}) as ExistingUserProfile;
      const existingSalonId = normalizeExistingSalonId(existingData.salonId);

      if (existingSnapshot.exists) {
        if (existingSalonId && existingSalonId !== callerProfile.salonId) {
          throw new HttpsError(
            "already-exists",
            "Usuario ja vinculado a outro salao."
          );
        }

        if (
          existingData.role !== undefined &&
          !isExistingRoleAllowed(existingData.role)
        ) {
          throw new HttpsError(
            "already-exists",
            "Usuario existente nao pode ser convertido por este fluxo."
          );
        }
      } else if (!createdNewAuthUser) {
        throw new HttpsError(
          "already-exists",
          "Ja existe um usuario com este e-mail fora do fluxo seguro do salao."
        );
      }

      transaction.set(
        userRef,
        {
          uid: createdUserUid,
          email: input.email,
          displayName: input.displayName,
          role: "nail_technician",
          salonId: callerProfile.salonId,
          phone: input.phone,
          active: true,
          onboarding: {
            activationMethod: "recover_password",
            createdBy: callerUid,
            status: createdNewAuthUser ?
              "pending_password_definition" :
              "pending_access_recovery",
            updatedAt: FieldValue.serverTimestamp(),
          },
          googleCalendar: {
            connected: false,
          },
          notificationPreferences: {
            newAppointment: true,
            appointmentCanceled: true,
            appointmentRescheduled: true,
            preReminder: true,
            syncError: true,
            googleExpired: true,
            quietHoursEnabled: false,
            quietHoursStart: "22:00",
            quietHoursEnd: "07:00",
            preReminderMinutes: 60,
          },
          createdAt: existingSnapshot.exists ?
            existingSnapshot.get("createdAt") ?? FieldValue.serverTimestamp() :
            FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        {merge: true}
      );

      if (existingSnapshot.exists) {
        onboardingStatus = "pending";
      }
    });

    await auth.setCustomUserClaims(createdUserUid, {
      ...(userRecord.customClaims ?? {}),
      role: "nail_technician",
    });

    try {
      await writeAuditLog({
        userId: callerUid,
        userRole: callerProfile.role,
        action: "admin.nail_technician.create",
        targetType: "user",
        targetId: createdUserUid,
        metadata: {
          createdUserRole: "nail_technician",
          createdUserEmail: input.email,
          salonId: callerProfile.salonId,
        },
        requestMetadata: extractRequestMetadata(request),
      });
    } catch (error) {
      logger.warn("Failed to persist audit log for createNailTechnician", {
        callerUid,
        createdUserUid,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return {
      uid: createdUserUid,
      salonId: callerProfile.salonId,
      status: onboardingStatus,
      message: onboardingStatus === "created" ?
        "Conta criada com seguranca. Oriente a profissional a usar \"Esqueci minha senha\" no login para definir a propria senha." :
        "Profissional vinculada ao salao. Oriente a redefinir a senha no login para ativar ou recuperar o acesso.",
    };
  } catch (error) {
    if (createdNewAuthUser && createdUserUid) {
      try {
        await auth.deleteUser(createdUserUid);
      } catch (cleanupError) {
        logger.error("Failed to rollback auth user after createNailTechnician", {
          createdUserUid,
          error:
            cleanupError instanceof Error ?
              cleanupError.message :
              String(cleanupError),
        });
      }

      try {
        await firestore.collection("users").doc(createdUserUid).delete();
      } catch (cleanupError) {
        logger.error(
          "Failed to rollback Firestore user after createNailTechnician",
          {
            createdUserUid,
            error:
              cleanupError instanceof Error ?
                cleanupError.message :
                String(cleanupError),
          }
        );
      }
    }

    const errorCode = error instanceof Error ? error.message : String(error);
    logger.error("Failed to create nail technician", {
      callerUid,
      email: input.email,
      error: errorCode,
    });

    if (error instanceof HttpsError) {
      throw error;
    }

    const authErrorCode = getAuthErrorCode(error);

    if (authErrorCode === "auth/email-already-exists") {
      throw new HttpsError(
        "already-exists",
        "Ja existe um usuario com este e-mail."
      );
    }

    throw new HttpsError(
      "internal",
      "Nao foi possivel criar a profissional no momento."
    );
  }
});
