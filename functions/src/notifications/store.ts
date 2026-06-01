/* eslint-disable require-jsdoc */
import {createHash} from "node:crypto";
import {FieldValue, getFirestore} from "firebase-admin/firestore";
import {
  NotificationCreationResult,
  NotificationRecordInput,
} from "./models";

const NOTIFICATIONS_COLLECTION = "notifications";
const DEDUPE_PREFIX = "dedupe_";

function normalizeDedupeKey(key: string | null | undefined): string | null {
  if (typeof key !== "string") {
    return null;
  }

  const trimmedKey = key.trim();
  return trimmedKey.length > 0 ? trimmedKey : null;
}

function buildDedupeDocumentId(rawKey: string): string {
  const hash = createHash("sha256").update(rawKey).digest("hex");
  return `${DEDUPE_PREFIX}${hash}`;
}

function createNotificationPayload(
  input: NotificationRecordInput
): Record<string, unknown> {
  return {
    userId: input.userId,
    salonId: input.salonId,
    type: input.type,
    title: input.title,
    body: input.body,
    data: input.data,
    read: false,
    createdAt: FieldValue.serverTimestamp(),
    readAt: null,
  };
}

export async function createNotificationRecord(
  input: NotificationRecordInput
): Promise<NotificationCreationResult> {
  const collectionRef = getFirestore().collection(NOTIFICATIONS_COLLECTION);
  const payload = createNotificationPayload(input);
  const dedupeKey = normalizeDedupeKey(input.dedupeKey);

  if (!dedupeKey) {
    const documentRef = await collectionRef.add(payload);
    return {
      id: documentRef.id,
      created: true,
    };
  }

  const docId = buildDedupeDocumentId(dedupeKey);
  const docRef = collectionRef.doc(docId);

  const created = await getFirestore().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(docRef);

    if (snapshot.exists) {
      return false;
    }

    transaction.set(docRef, payload);
    return true;
  });

  return {
    id: docId,
    created,
  };
}

