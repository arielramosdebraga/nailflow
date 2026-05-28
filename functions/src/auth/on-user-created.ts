import {getAuth} from "firebase-admin/auth";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import * as functions from "firebase-functions/v1";

function getSuperAdminAllowlist(): Set<string> {
  const raw = process.env.SUPER_ADMIN_ALLOWLIST ?? "";
  return new Set(
    raw
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  const allowlist = getSuperAdminAllowlist();
  const email = (user.email ?? "").toLowerCase();
  const role = allowlist.has(email) ? "super_admin" : "manicure";

  await getFirestore().collection("users").doc(user.uid).set(
    {
      uid: user.uid,
      email: user.email ?? "",
      displayName: user.displayName ?? "",
      role,
      salonId: null,
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
      },
      fcmTokens: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    {merge: true}
  );

  await getAuth().setCustomUserClaims(user.uid, {
    role,
  });

  logger.info("User bootstrap completed", {
    uid: user.uid,
    role,
  });
});
