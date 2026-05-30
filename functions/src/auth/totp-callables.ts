/* eslint-disable require-jsdoc */
import {FieldValue, getFirestore} from "firebase-admin/firestore";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import {
  assertAdminRole,
  getUserProfile,
  requireAuthenticatedUid,
} from "../shared/user-context";
import {
  buildTotpUri,
  generateTotpSecret,
  getTotpConfig,
  verifyTotpToken,
} from "./totp-utils";

interface TotpState {
  enabled: boolean;
  required: boolean;
  secret: string | null;
  pendingSecret: string | null;
  enrollmentStartedAt: string | null;
  enrolledAt: string | null;
  lastVerifiedAt: string | null;
}

function getRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ?
    (value as Record<string, unknown>) :
    {};
}

function readOptionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function readBoolean(value: unknown): boolean {
  return typeof value === "boolean" ? value : false;
}

function toIsoString(value: unknown): string | null {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const possibleTimestamp = value as {toDate?: () => Date};

  if (typeof possibleTimestamp.toDate === "function") {
    return possibleTimestamp.toDate().toISOString();
  }

  return null;
}

function readTotpState(
  userData: Record<string, unknown> | undefined
): TotpState {
  const data = userData ?? {};
  const twoFactor = getRecord(data.twoFactor);
  const totp = getRecord(twoFactor.totp);

  return {
    enabled: readBoolean(totp.enabled),
    required: readBoolean(totp.required),
    secret: readOptionalString(totp.secret),
    pendingSecret: readOptionalString(totp.pendingSecret),
    enrollmentStartedAt: toIsoString(totp.enrollmentStartedAt),
    enrolledAt: toIsoString(totp.enrolledAt),
    lastVerifiedAt: toIsoString(totp.lastVerifiedAt),
  };
}

function getTotpIssuer(): string {
  const issuer = process.env.TOTP_ISSUER;

  if (typeof issuer !== "string") {
    return "NailFlow";
  }

  const trimmedIssuer = issuer.trim();
  return trimmedIssuer.length > 0 ? trimmedIssuer : "NailFlow";
}

function validateCodeFromPayload(data: unknown): string {
  const payload = getRecord(data);
  const code = readOptionalString(payload.code);

  if (!code || !/^\d{6}$/.test(code)) {
    throw new HttpsError(
      "invalid-argument",
      "Codigo TOTP invalido. Informe exatamente 6 digitos numericos."
    );
  }

  return code;
}

export const getTotpStatus = onCall(async (request) => {
  const uid = requireAuthenticatedUid(request);
  const profile = await getUserProfile(uid);

  const userSnapshot = await getFirestore().collection("users").doc(uid).get();
  const totpState = readTotpState(userSnapshot.data());
  const isAdmin =
    profile.role === "super_admin" || profile.role === "salon_owner";

  return {
    role: profile.role,
    required: isAdmin,
    enabled: isAdmin && totpState.enabled,
    hasPendingEnrollment: isAdmin && Boolean(totpState.pendingSecret),
    enrolledAt: isAdmin ? totpState.enrolledAt : null,
    enrollmentStartedAt: isAdmin ? totpState.enrollmentStartedAt : null,
    lastVerifiedAt: isAdmin ? totpState.lastVerifiedAt : null,
    algorithm: getTotpConfig().algorithm,
    digits: getTotpConfig().digits,
    periodSeconds: getTotpConfig().periodSeconds,
  };
});

export const beginTotpEnrollment = onCall(async (request) => {
  const uid = requireAuthenticatedUid(request);
  const profile = await getUserProfile(uid);
  assertAdminRole(profile);

  const userRef = getFirestore().collection("users").doc(uid);
  const userSnapshot = await userRef.get();
  const totpState = readTotpState(userSnapshot.data());

  if (totpState.enabled && totpState.secret) {
    throw new HttpsError(
      "already-exists",
      "TOTP ja esta habilitado para este usuario."
    );
  }

  const secret = generateTotpSecret();
  const accountName = profile.email || profile.uid;
  const otpauthUrl = buildTotpUri({
    issuer: getTotpIssuer(),
    accountName,
    secret,
  });

  await userRef.set(
    {
      twoFactor: {
        totp: {
          required: true,
          enabled: false,
          secret: null,
          pendingSecret: secret,
          enrollmentStartedAt: FieldValue.serverTimestamp(),
          enrolledAt: null,
          lastVerifiedAt: null,
          updatedAt: FieldValue.serverTimestamp(),
        },
      },
      updatedAt: FieldValue.serverTimestamp(),
    },
    {merge: true}
  );

  return {
    secret,
    otpauthUri: otpauthUrl,
    algorithm: getTotpConfig().algorithm,
    digits: getTotpConfig().digits,
    periodSeconds: getTotpConfig().periodSeconds,
  };
});

export const confirmTotpEnrollment = onCall(async (request) => {
  const uid = requireAuthenticatedUid(request);
  const profile = await getUserProfile(uid);
  assertAdminRole(profile);
  const code = validateCodeFromPayload(request.data);

  const userRef = getFirestore().collection("users").doc(uid);
  const userSnapshot = await userRef.get();
  const totpState = readTotpState(userSnapshot.data());

  if (!totpState.pendingSecret) {
    throw new HttpsError(
      "failed-precondition",
      "Nenhum processo de cadastro TOTP em andamento para este usuario."
    );
  }

  const isCodeValid = verifyTotpToken({
    token: code,
    secret: totpState.pendingSecret,
  });

  if (!isCodeValid) {
    throw new HttpsError(
      "invalid-argument",
      "Codigo TOTP invalido ou expirado."
    );
  }

  await userRef.set(
    {
      twoFactor: {
        totp: {
          required: true,
          enabled: true,
          secret: totpState.pendingSecret,
          pendingSecret: null,
          enrolledAt: FieldValue.serverTimestamp(),
          lastVerifiedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
      },
      updatedAt: FieldValue.serverTimestamp(),
    },
    {merge: true}
  );

  return {
    enabled: true,
    message: "TOTP habilitado com sucesso.",
  };
});

export const verifyTotpCode = onCall(async (request) => {
  const uid = requireAuthenticatedUid(request);
  const profile = await getUserProfile(uid);
  assertAdminRole(profile);
  const code = validateCodeFromPayload(request.data);

  const userRef = getFirestore().collection("users").doc(uid);
  const userSnapshot = await userRef.get();
  const totpState = readTotpState(userSnapshot.data());

  if (!totpState.enabled || !totpState.secret) {
    throw new HttpsError(
      "failed-precondition",
      "TOTP ainda nao esta habilitado para este usuario."
    );
  }

  const isCodeValid = verifyTotpToken({
    token: code,
    secret: totpState.secret,
  });

  if (!isCodeValid) {
    throw new HttpsError(
      "invalid-argument",
      "Codigo TOTP invalido ou expirado."
    );
  }

  await userRef.set(
    {
      twoFactor: {
        totp: {
          lastVerifiedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
      },
      updatedAt: FieldValue.serverTimestamp(),
    },
    {merge: true}
  );

  return {
    verified: true,
    verifiedAt: new Date().toISOString(),
  };
});
