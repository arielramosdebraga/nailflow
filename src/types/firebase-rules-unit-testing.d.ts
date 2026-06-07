declare module '@firebase/rules-unit-testing' {
  import type { Firestore } from 'firebase/firestore';

  export interface RulesTestContext {
    firestore(): Firestore;
  }

  export interface RulesTestEnvironment {
    cleanup(): Promise<void>;
    clearFirestore(): Promise<void>;
    withSecurityRulesDisabled(
      callback: (context: RulesTestContext) => Promise<void> | void
    ): Promise<void>;
    authenticatedContext(uid: string, tokenOptions?: Record<string, unknown>): RulesTestContext;
    unauthenticatedContext(): RulesTestContext;
  }

  export function initializeTestEnvironment(config: {
    projectId: string;
    firestore?: {
      rules?: string;
      host?: string;
      port?: number;
    };
  }): Promise<RulesTestEnvironment>;

  export function assertSucceeds<T>(promise: Promise<T>): Promise<T>;
  export function assertFails<T = unknown>(promise: Promise<T>): Promise<unknown>;
}
