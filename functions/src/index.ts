/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {initializeApp} from "firebase-admin/app";
import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/https";
import * as logger from "firebase-functions/logger";
import {getGlobalDashboard} from "./admin/get-global-dashboard";
import {onUserCreated} from "./auth/on-user-created";
import {
  beginTotpEnrollment,
  confirmTotpEnrollment,
  getTotpStatus,
  verifyTotpCode,
} from "./auth/totp-callables";
import {
  beginGoogleCalendarConnection,
  completeGoogleCalendarConnection,
  getGoogleCalendarStatus,
  refreshGoogleCalendarWatch,
} from "./google/callables";
import {
  onAppointmentCreatedSyncGoogleCalendar,
  onAppointmentDeletedSyncGoogleCalendar,
  onAppointmentUpdatedSyncGoogleCalendar,
} from "./google/appointment-triggers";
import {onGoogleCalendarSyncQueueCreated} from "./google/sync-queue";
import {receiveGoogleCalendarWatchWebhook} from "./google/watch-webhook";
import {
  reconcileGoogleCalendarAtNight,
  renewGoogleCalendarWatchChannels,
} from "./google/watch-scheduler";
import {
  onAppointmentCreatedNotifyUsers,
  onAppointmentUpdatedNotifyUsers,
  onUserGoogleStatusUpdatedNotifyUsers,
  sendPreReminderNotifications,
} from "./notifications/triggers";
import {createSalon} from "./salons/create-salon";

setGlobalOptions({
  maxInstances: 10,
  region: "southamerica-east1",
});

initializeApp();

export const health = onRequest((request, response) => {
  logger.info("Health check request", {path: request.path});
  response.status(200).json({
    ok: true,
    service: "nailflow-functions",
    timestamp: new Date().toISOString(),
  });
});

export {onUserCreated};
export {
  createSalon,
  getGlobalDashboard,
  getTotpStatus,
  beginTotpEnrollment,
  confirmTotpEnrollment,
  verifyTotpCode,
  getGoogleCalendarStatus,
  beginGoogleCalendarConnection,
  completeGoogleCalendarConnection,
  refreshGoogleCalendarWatch,
  onAppointmentCreatedSyncGoogleCalendar,
  onAppointmentUpdatedSyncGoogleCalendar,
  onAppointmentDeletedSyncGoogleCalendar,
  receiveGoogleCalendarWatchWebhook,
  onGoogleCalendarSyncQueueCreated,
  renewGoogleCalendarWatchChannels,
  reconcileGoogleCalendarAtNight,
  onAppointmentCreatedNotifyUsers,
  onAppointmentUpdatedNotifyUsers,
  onUserGoogleStatusUpdatedNotifyUsers,
  sendPreReminderNotifications,
};