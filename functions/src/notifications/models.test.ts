import { describe, expect, it } from "vitest";

import { readUserNotificationProfile } from "./models";

describe("notifications/models", () => {
  it("applies defaults when profile data is missing", () => {
    const profile = readUserNotificationProfile("user-1", undefined);

    expect(profile.uid).toBe("user-1");
    expect(profile.role).toBeNull();
    expect(profile.salonId).toBeNull();
    expect(profile.displayName).toBe("");
    expect(profile.fcmTokens).toEqual([]);
    expect(profile.preferences).toEqual({
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
    });
  });

  it("normalizes duplicated and empty expo tokens", () => {
    const profile = readUserNotificationProfile("user-2", {
      fcmTokens: [
        "ExponentPushToken[token-1]",
        "",
        "   ",
        "ExponentPushToken[token-1]",
        " ExponentPushToken[token-2] ",
        "ExponentPushToken[token-2]",
        123,
      ],
    });

    expect(profile.fcmTokens).toEqual([
      "ExponentPushToken[token-1]",
      "ExponentPushToken[token-2]",
    ]);
  });

  it("reads and normalizes role, salonId and displayName", () => {
    const profile = readUserNotificationProfile("user-3", {
      role: " manicure ",
      salonId: " salon-123 ",
      displayName: " Ariel Gomes ",
    });

    expect(profile.role).toBe("nail_technician");
    expect(profile.salonId).toBe("salon-123");
    expect(profile.displayName).toBe("Ariel Gomes");
  });

  it("returns null role when user role is unknown", () => {
    const profile = readUserNotificationProfile("user-4", {
      role: "owner_admin",
    });

    expect(profile.role).toBeNull();
  });

  it("clamps preReminderMinutes to [5..1440]", () => {
    const belowMinimum = readUserNotificationProfile("user-5", {
      notificationPreferences: {
        preReminderMinutes: 1,
      },
    });
    const aboveMaximum = readUserNotificationProfile("user-6", {
      notificationPreferences: {
        preReminderMinutes: 9999,
      },
    });
    const decimalValue = readUserNotificationProfile("user-7", {
      notificationPreferences: {
        preReminderMinutes: 45.9,
      },
    });

    expect(belowMinimum.preferences.preReminderMinutes).toBe(5);
    expect(aboveMaximum.preferences.preReminderMinutes).toBe(1440);
    expect(decimalValue.preferences.preReminderMinutes).toBe(45);
  });

  it("uses preReminderMinutes default when input is invalid", () => {
    const nonNumericValue = readUserNotificationProfile("user-8", {
      notificationPreferences: {
        preReminderMinutes: "60",
      },
    });
    const nanValue = readUserNotificationProfile("user-9", {
      notificationPreferences: {
        preReminderMinutes: Number.NaN,
      },
    });

    expect(nonNumericValue.preferences.preReminderMinutes).toBe(60);
    expect(nanValue.preferences.preReminderMinutes).toBe(60);
  });
});

