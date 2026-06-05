import Constants from 'expo-constants';

interface EnvChecklistItem {
  key: string;
  required: boolean;
  configured: boolean;
}

export interface ReleaseReadinessSnapshot {
  appVersion: string;
  iosBundleIdentifier: string;
  androidPackage: string;
  easProjectIdConfigured: boolean;
  firebaseConfigured: boolean;
  googleAuthConfigured: boolean;
  functionsHealthUrl: string | null;
  functionsHealthStatus: 'ok' | 'error' | 'not_configured';
  envChecklist: EnvChecklistItem[];
}

const firebaseEnvKeys = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
] as const;

const googleEnvKeys = [
  'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID',
  'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID',
  'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
] as const;

const releaseEnvKeys = [
  { key: 'EXPO_PUBLIC_EAS_PROJECT_ID', required: true },
  { key: 'NAILFLOW_IOS_BUNDLE_IDENTIFIER', required: true },
  { key: 'NAILFLOW_ANDROID_PACKAGE', required: true },
  { key: 'EXPO_PUBLIC_FUNCTIONS_HEALTH_URL', required: false },
] as const;

function isConfigured(value: string | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

async function checkFunctionsHealthAsync(url: string | null): Promise<'ok' | 'error' | 'not_configured'> {
  if (!url) {
    return 'not_configured';
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return 'error';
    }

    const payload = (await response.json()) as { ok?: unknown };
    return payload.ok === true ? 'ok' : 'error';
  } catch {
    return 'error';
  }
}

export async function getReleaseReadinessSnapshotAsync(): Promise<ReleaseReadinessSnapshot> {
  const config = Constants.expoConfig;
  const releaseConfig =
    typeof config?.extra?.release === 'object' && config.extra.release !== null
      ? (config.extra.release as {
          functionsHealthUrl?: unknown;
          iosBundleIdentifier?: unknown;
          androidPackage?: unknown;
        })
      : {};

  const easProjectId =
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim() ||
    (typeof config?.extra?.eas === 'object' && config.extra.eas !== null
      ? ((config.extra.eas as { projectId?: unknown }).projectId as string | undefined)
      : undefined) ||
    Constants.easConfig?.projectId ||
    '';

  const functionsHealthUrl =
    process.env.EXPO_PUBLIC_FUNCTIONS_HEALTH_URL?.trim() ||
    (typeof releaseConfig.functionsHealthUrl === 'string' ? releaseConfig.functionsHealthUrl : null);

  const releaseEnvFallbacks: Record<string, boolean> = {
    EXPO_PUBLIC_EAS_PROJECT_ID: isConfigured(easProjectId),
    NAILFLOW_IOS_BUNDLE_IDENTIFIER:
      isConfigured(process.env.NAILFLOW_IOS_BUNDLE_IDENTIFIER) ||
      typeof releaseConfig.iosBundleIdentifier === 'string',
    NAILFLOW_ANDROID_PACKAGE:
      isConfigured(process.env.NAILFLOW_ANDROID_PACKAGE) || typeof releaseConfig.androidPackage === 'string',
    EXPO_PUBLIC_FUNCTIONS_HEALTH_URL: Boolean(functionsHealthUrl),
  };

  const envChecklist: EnvChecklistItem[] = releaseEnvKeys.map((item) => ({
    key: item.key,
    required: item.required,
    configured: releaseEnvFallbacks[item.key] ?? isConfigured(process.env[item.key]),
  }));

  const firebaseConfigured = firebaseEnvKeys.every((key) => isConfigured(process.env[key]));
  const googleAuthConfigured = googleEnvKeys.some((key) => isConfigured(process.env[key]));

  return {
    appVersion: config?.version ?? '0.1.0',
    iosBundleIdentifier:
      process.env.NAILFLOW_IOS_BUNDLE_IDENTIFIER?.trim() ||
      (typeof releaseConfig.iosBundleIdentifier === 'string' ? releaseConfig.iosBundleIdentifier : 'Nao configurado'),
    androidPackage:
      process.env.NAILFLOW_ANDROID_PACKAGE?.trim() ||
      (typeof releaseConfig.androidPackage === 'string' ? releaseConfig.androidPackage : 'Nao configurado'),
    easProjectIdConfigured: isConfigured(easProjectId),
    firebaseConfigured,
    googleAuthConfigured,
    functionsHealthUrl,
    functionsHealthStatus: await checkFunctionsHealthAsync(functionsHealthUrl),
    envChecklist,
  };
}
