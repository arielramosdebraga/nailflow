import {deleteApp, getApp, getApps, initializeApp} from "firebase-admin/app";
import {FieldValue, getFirestore, Timestamp} from "firebase-admin/firestore";
import {CallableRequest} from "firebase-functions/v2/https";
import {afterAll, beforeAll, beforeEach, describe, expect, it} from "vitest";

import {exportLgpdData} from "./export-lgpd-data";

const PROJECT_ID = "nailflow-lgpd-test";

type ExportLgpdResult = {
  summary: {
    users: number;
    salons: number;
    auditLogs: number;
  };
  users: {uid: string; role: string}[];
  salons: {id: string; name: string}[];
  auditLogs: {id: string; action: string}[];
};

function getDefaultApp() {
  return getApps().length > 0 ?
    getApp() :
    initializeApp({projectId: PROJECT_ID});
}

async function clearCollection(collectionName: string): Promise<void> {
  const firestore = getFirestore();
  const snapshot = await firestore.collection(collectionName).get();
  const batch = firestore.batch();

  snapshot.docs.forEach((documentSnapshot) => {
    batch.delete(documentSnapshot.ref);
  });

  await batch.commit();
}

function buildCallableRequest(uid?: string): CallableRequest<unknown> {
  return {
    auth: uid ? {uid, token: {}} : undefined,
    data: {},
  } as CallableRequest<unknown>;
}

async function runExport(uid?: string): Promise<ExportLgpdResult> {
  return exportLgpdData.run(
    buildCallableRequest(uid)
  ) as Promise<ExportLgpdResult>;
}

async function seedProfile(uid: string, role: string): Promise<void> {
  await getFirestore().collection("users").doc(uid).set({
    uid,
    email: `${uid}@nailflow.app`,
    displayName: uid,
    role,
    salonId: role === "super_admin" ? null : "salon-a",
    active: true,
    createdAt: FieldValue.serverTimestamp(),
  });
}

describe("admin/export-lgpd-data", () => {
  beforeAll(() => {
    process.env.GCLOUD_PROJECT = PROJECT_ID;
    getDefaultApp();
  });

  beforeEach(async () => {
    await Promise.all([
      clearCollection("auditLogs"),
      clearCollection("salons"),
      clearCollection("users"),
    ]);
  });

  afterAll(async () => {
    await Promise.all(getApps().map((app) => deleteApp(app)));
  });

  it("exporta dados LGPD para super_admin e registra auditoria", async () => {
    const firestore = getFirestore();

    await Promise.all([
      seedProfile("super-admin", "super_admin"),
      seedProfile("owner-a", "salon_owner"),
      firestore.collection("salons").doc("salon-a").set({
        name: "Salao A",
        ownerId: "owner-a",
        active: true,
      }),
      firestore.collection("auditLogs").doc("existing-log").set({
        action: "user.created",
        userId: "owner-a",
        targetType: "user",
        targetId: "owner-a",
        timestamp: Timestamp.fromDate(new Date("2026-06-02T12:00:00.000Z")),
      }),
    ]);

    const result = await runExport("super-admin");

    expect(result.summary).toEqual({
      users: 2,
      salons: 1,
      auditLogs: 1,
    });
    expect(result.users.map((user) => user.uid)).toContain("super-admin");
    expect(result.salons).toEqual([
      expect.objectContaining({id: "salon-a", name: "Salao A"}),
    ]);
    expect(result.auditLogs).toEqual([
      expect.objectContaining({id: "existing-log", action: "user.created"}),
    ]);

    const auditSnapshot = await firestore
      .collection("auditLogs")
      .where("action", "==", "lgpd.export.generated")
      .get();

    expect(auditSnapshot.size).toBe(1);
  });

  it("bloqueia exportacao para salon_owner", async () => {
    await seedProfile("owner-a", "salon_owner");

    await expect(runExport("owner-a")).rejects.toMatchObject({
      code: "permission-denied",
    });
  });

  it("bloqueia exportacao sem autenticacao", async () => {
    await expect(runExport()).rejects.toMatchObject({
      code: "unauthenticated",
    });
  });
});
