import type { ConfigContext, ExpoConfig } from 'expo/config';

const IOS_BUNDLE_IDENTIFIER = process.env.NAILFLOW_IOS_BUNDLE_IDENTIFIER?.trim() || 'app.nailflow.mobile';
const ANDROID_PACKAGE = process.env.NAILFLOW_ANDROID_PACKAGE?.trim() || 'app.nailflow.mobile';
const FUNCTIONS_HEALTH_URL = process.env.EXPO_PUBLIC_FUNCTIONS_HEALTH_URL?.trim() || undefined;
const APP_VERSION = '1.0.0';
const IOS_BUILD_NUMBER = process.env.NAILFLOW_IOS_BUILD_NUMBER?.trim() || '1';
const ANDROID_VERSION_CODE = Number(process.env.NAILFLOW_ANDROID_VERSION_CODE?.trim() || '1');

const getEasProjectId = (config: ConfigContext['config']): string | undefined => {
  const configuredEas = config.extra?.eas;
  const configuredProjectId =
    typeof configuredEas === 'object' && configuredEas !== null && 'projectId' in configuredEas
      ? String(configuredEas.projectId ?? '').trim()
      : undefined;

  return (
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim() ||
    process.env.EAS_PROJECT_ID?.trim() ||
    configuredProjectId ||
    undefined
  );
};

export default ({ config }: ConfigContext): ExpoConfig => {
  const easProjectId = getEasProjectId(config);

  return {
    ...config,
    name: 'NailFlow',
    slug: 'nailflow',
    version: APP_VERSION,
    orientation: 'portrait',
    scheme: 'nailflow',
    userInterfaceStyle: 'automatic',
    owner: process.env.EXPO_OWNER?.trim() || undefined,
    runtimeVersion: {
      policy: 'appVersion',
    },
    icon: './assets/icon.png',
    plugins: ['expo-router', 'expo-secure-store', 'expo-notifications'],
    ios: {
      buildNumber: IOS_BUILD_NUMBER,
      bundleIdentifier: IOS_BUNDLE_IDENTIFIER,
      supportsTablet: true,
    },
    android: {
      versionCode: Number.isFinite(ANDROID_VERSION_CODE) ? ANDROID_VERSION_CODE : 1,
      package: ANDROID_PACKAGE,
      adaptiveIcon: {
        foregroundImage: './assets/android-icon-foreground.png',
        monochromeImage: './assets/android-icon-monochrome.png',
        backgroundImage: './assets/android-icon-background.png',
        backgroundColor: '#111827',
      },
    },
    experiments: {
      typedRoutes: true,
    },
    web: {
      bundler: 'metro',
      favicon: './assets/favicon.png',
    },
    extra: {
      ...(config.extra ?? {}),
      release: {
        functionsHealthUrl: FUNCTIONS_HEALTH_URL,
        iosBundleIdentifier: IOS_BUNDLE_IDENTIFIER,
        androidPackage: ANDROID_PACKAGE,
        iosBuildNumber: IOS_BUILD_NUMBER,
        androidVersionCode: Number.isFinite(ANDROID_VERSION_CODE) ? ANDROID_VERSION_CODE : 1,
      },
      eas: easProjectId
        ? {
            projectId: easProjectId,
          }
        : undefined,
    },
  };
};
