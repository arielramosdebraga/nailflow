/* eslint-disable require-jsdoc */
import * as logger from "firebase-functions/logger";
import {
  onDocumentCreated,
  onDocumentDeleted,
  onDocumentUpdated,
} from "firebase-functions/v2/firestore";
import {readAppointmentData} from "./models";
import {
  shouldHandleAppointmentUpdate,
  syncCreatedAppointmentToGoogle,
  syncDeletedAppointmentToGoogle,
  syncUpdatedAppointmentToGoogle,
} from "./sync";

export const onAppointmentCreatedSyncGoogleCalendar = onDocumentCreated(
  "appointments/{appointmentId}",
  async (event) => {
    const snapshot = event.data;

    if (!snapshot) {
      return;
    }

    const appointment = readAppointmentData(snapshot.id, snapshot.data());

    try {
      await syncCreatedAppointmentToGoogle(appointment);
    } catch (error) {
      logger.error("Failed to sync created appointment to Google Calendar", {
        appointmentId: appointment.id,
        manicureId: appointment.manicureId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

export const onAppointmentUpdatedSyncGoogleCalendar = onDocumentUpdated(
  "appointments/{appointmentId}",
  async (event) => {
    const beforeSnapshot = event.data?.before;
    const afterSnapshot = event.data?.after;

    if (!beforeSnapshot || !afterSnapshot) {
      return;
    }

    const beforeAppointment = readAppointmentData(
      beforeSnapshot.id,
      beforeSnapshot.data()
    );
    const afterAppointment = readAppointmentData(
      afterSnapshot.id,
      afterSnapshot.data()
    );

    if (!shouldHandleAppointmentUpdate(beforeAppointment, afterAppointment)) {
      return;
    }

    try {
      await syncUpdatedAppointmentToGoogle(beforeAppointment, afterAppointment);
    } catch (error) {
      logger.error("Failed to sync updated appointment to Google Calendar", {
        appointmentId: afterAppointment.id,
        manicureId: afterAppointment.manicureId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

export const onAppointmentDeletedSyncGoogleCalendar = onDocumentDeleted(
  "appointments/{appointmentId}",
  async (event) => {
    const snapshot = event.data;

    if (!snapshot) {
      return;
    }

    const appointment = readAppointmentData(snapshot.id, snapshot.data());

    try {
      await syncDeletedAppointmentToGoogle(appointment);
    } catch (error) {
      logger.error("Failed to sync deleted appointment to Google Calendar", {
        appointmentId: appointment.id,
        manicureId: appointment.manicureId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);
