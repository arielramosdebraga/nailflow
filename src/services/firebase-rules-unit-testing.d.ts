declare module '@firebase/rules-unit-testing' {
  import type { Firestore } from 'firebase/firestore';

  export interface RulesTestContext {
    firestore(): Firestore;
  }

  export interface RulesTestEnvironment {
    cleanup(): Promise<void>;
    clearFirestore(): Promise<void>;
    authenticatedContext(uid: string): RulesTestContext;
    unauthenticatedContext(): RulesTestContext;
    withSecurityRulesDisabled<T>(callback: (context: RulesTestContext) => Promise<T>): Promise<T>;
  }

  export function initializeTestEnvironment(config: {
    projectId: string;
    firestore: {
      rules: string;
      host?: string;
      port?: number;
    };
  }): Promise<RulesTestEnvironment>;

  export function assertSucceeds<T>(promise: Promise<T>): Promise<T>;
  export function assertFails(promise: Promise<unknown>): Promise<unknown>;
}
