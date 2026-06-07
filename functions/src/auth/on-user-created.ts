/* eslint-disable require-jsdoc */
import {getAuth} from "firebase-admin/auth";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import * as functions from "firebase-functions/v1";

type SupportedRole = "super_admin" | "salon_owner" | "nail_technician";

interface ExistingUserProfile {
  email?: unknown;
  displayName?: unknown;
  createdAt?: unknown;
  fcmTokens?: unknown;
  role?: unknown;
  salonId?: unknown;
}

function getSuperAdminAllowlist(): Set<string> {
  const raw = process.env.SUPER_ADMIN_ALLOWLIST ?? "";
  return new Set(
    raw
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

function isSupportedRole(value: unknown): value is SupportedRole {
  return (
    value === "super_admin" ||
    value === "salon_owner" ||
    value === "nail_technician"
  );
}

function resolveSalonId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  const allowlist = getSuperAdminAllowlist();
  const email = (user.email ?? "").toLowerCase();
  const defaultRole: SupportedRole =
    allowlist.has(email) ? "super_admin" : "nail_technician";
  const userRef = getFirestore().collection("users").doc(user.uid);

  const persistedProfile = await getFirestore().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(userRef);
    const existingData = (snapshot.data() ?? {}) as ExistingUserProfile;
    const role = isSupportedRole(existingData.role) ?
      existingData.role :
      defaultRole;
    const salonId = resolveSalonId(existingData.salonId);

    transaction.set(
      userRef,
      {
        uid: user.uid,
        email: typeof existingData.email === "string" && existingData.email.trim() ?
          existingData.email :
          user.email ?? "",
        displayName:
          typeof existingData.displayName === "string" &&
          existingData.displayName.trim() ?
            existingData.displayName :
            user.displayName ?? "",
        role,
        ...(snapshot.exists || "salonId" in existingData ? {} : {salonId: null}),
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
        fcmTokens: Array.isArray(existingData.fcmTokens) ? existingData.fcmTokens : [],
        createdAt: snapshot.exists ?
          existingData.createdAt ?? FieldValue.serverTimestamp() :
          FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      {merge: true}
    );

    return {
      role,
      salonId,
    };
  });

  const authRecord = await getAuth().getUser(user.uid);

  await getAuth().setCustomUserClaims(user.uid, {
    ...(authRecord.customClaims ?? {}),
    role: persistedProfile.role,
  });

  logger.info("User bootstrap completed", {
    uid: user.uid,
    role: persistedProfile.role,
    salonId: persistedProfile.salonId,
  });
});
