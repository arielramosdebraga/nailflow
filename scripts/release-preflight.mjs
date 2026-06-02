/* eslint-disable expo/no-dynamic-env-var */
const requiredPublicEnv = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
];

const recommendedPublicEnv = [
  'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID',
  'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID',
  'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
  'EXPO_PUBLIC_EAS_PROJECT_ID',
  'EXPO_PUBLIC_FUNCTIONS_HEALTH_URL',
];

const requiredBuildEnv = ['NAILFLOW_IOS_BUNDLE_IDENTIFIER', 'NAILFLOW_ANDROID_PACKAGE'];

function readStatus(name) {
  const value = process.env[name];
  return typeof value === 'string' && value.trim().length > 0;
}

function logGroup(title, variables) {
  console.log(`\n${title}`);
  for (const variable of variables) {
    console.log(`- ${variable}: ${readStatus(variable) ? 'ok' : 'ausente'}`);
  }
}

const missingRequired = [...requiredPublicEnv, ...requiredBuildEnv].filter((item) => !readStatus(item));

console.log('Preflight de release do NailFlow');
logGroup('Obrigatorias para o app', requiredPublicEnv);
logGroup('Obrigatorias para build', requiredBuildEnv);
logGroup('Recomendadas para piloto', recommendedPublicEnv);

if (missingRequired.length > 0) {
  console.error('\nFalha no preflight. Variaveis obrigatorias ausentes:');
  for (const item of missingRequired) {
    console.error(`- ${item}`);
  }
  process.exit(1);
}

console.log('\nPreflight concluido com sucesso.');
