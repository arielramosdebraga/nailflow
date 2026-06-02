import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { doc, getDoc, setDoc } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

const PROJECT_ID = 'nailflow-rules-test';
const SALON_A = 'salon-a';
const SALON_B = 'salon-b';
const OWNER_A_UID = 'owner-a';
const OWNER_B_UID = 'owner-b';

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    await Promise.all([
      setDoc(doc(db, 'users', OWNER_A_UID), {
        uid: OWNER_A_UID,
        email: 'owner-a@nailflow.app',
        displayName: 'Owner A',
        role: 'salon_owner',
        salonId: SALON_A,
      }),
      setDoc(doc(db, 'users', OWNER_B_UID), {
        uid: OWNER_B_UID,
        email: 'owner-b@nailflow.app',
        displayName: 'Owner B',
        role: 'salon_owner',
        salonId: SALON_B,
      }),
      setDoc(doc(db, 'clients', 'client-a'), {
        salonId: SALON_A,
        name: 'Cliente A',
      }),
    ]);
  });
});

function ownerContext(uid: string) {
  return testEnv.authenticatedContext(uid).firestore();
}

describe('firestore.rules - isolamento por salao', () => {
  it('permite que owner leia cliente do proprio salao', async () => {
    await assertSucceeds(getDoc(doc(ownerContext(OWNER_A_UID), 'clients', 'client-a')));
  });

  it('bloqueia owner de outro salao ao ler cliente', async () => {
    await assertFails(getDoc(doc(ownerContext(OWNER_B_UID), 'clients', 'client-a')));
  });

  it('bloqueia usuario nao autenticado ao ler cliente', async () => {
    const db = testEnv.unauthenticatedContext().firestore();

    await assertFails(getDoc(doc(db, 'clients', 'client-a')));
  });

  it('bloqueia criacao de cliente fora do salao do owner', async () => {
    await assertFails(
      setDoc(doc(ownerContext(OWNER_A_UID), 'clients', 'client-b'), {
        salonId: SALON_B,
        name: 'Cliente B',
      }),
    );
  });
});
