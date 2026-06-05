/* eslint-disable require-jsdoc */
import {FieldValue, getFirestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {isNotificationTypeEnabled, isWithinQuietHours} from "./preferences";
import {
  NotificationRecordInput,
  UserNotificationProfile,
  readUserNotificationProfile,
} from "./models";
import {sendPushToExpoTokens} from "./push";
import {createNotificationRecord} from "./store";

export interface DispatchNotificationResult {
  skipped: boolean;
  createdNotification: boolean;
  pushAttempted: boolean;
}

async function readUserProfileById(
  userId: string
): Promise<UserNotificationProfile | null> {
  const userSnapshot = await getFirestore().collection("users").doc(userId).get();

  if (!userSnapshot.exists) {
    return null;
  }

  return readUserNotificationProfile(userSnapshot.id, userSnapshot.data());
}

async function removeInvalidPushTokens(
  userId: string,
  invalidTokens: string[]
): Promise<void> {
  if (invalidTokens.length === 0) {
    return;
  }

  await getFirestore().collection("users").doc(userId).set(
    {
      fcmTokens: FieldValue.arrayRemove(...invalidTokens),
      updatedAt: FieldValue.serverTimestamp(),
    },
    {merge: true}
  );
}

export async function dispatchNotificationToUser(
  input: NotificationRecordInput
): Promise<DispatchNotificationResult> {
  const profile = await readUserProfileById(input.userId);

  if (!profile) {
    logger.warn("Skipping notification because user profile was not found", {
      userId: input.userId,
      type: input.type,
    });

    return {
      skipped: true,
      createdNotification: false,
      pushAttempted: false,
    };
  }

  if (!isNotificationTypeEnabled(input.type, profile.preferences)) {
    return {
      skipped: true,
      createdNotification: false,
      pushAttempted: false,
    };
  }

  const creation = await createNotificationRecord(input);

  if (!creation.created) {
    return {
      skipped: true,
      createdNotification: false,
      pushAttempted: false,
    };
  }

  if (isWithinQuietHours(profile.preferences)) {
    return {
      skipped: false,
      createdNotification: true,
      pushAttempted: false,
    };
  }

  const pushResult = await sendPushToExpoTokens({
    userId: profile.uid,
    tokens: profile.fcmTokens,
    title: input.title,
    body: input.body,
    data: input.data,
  });

  if (pushResult.invalidTokens.length > 0) {
    await removeInvalidPushTokens(profile.uid, pushResult.invalidTokens);
  }

  return {
    skipped: false,
    createdNotification: true,
    pushAttempted: pushResult.attemptedTokens > 0,
  };
}

