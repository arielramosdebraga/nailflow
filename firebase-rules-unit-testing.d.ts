declare module '@firebase/rules-unit-testing' {
  interface RulesTestContext {
    firestore(): import('firebase/firestore').Firestore;
  }

  interface RulesTestEnvironment {
    authenticatedContext(uid: string, tokenOptions?: Record<string, unknown>): RulesTestContext;
    unauthenticatedContext(): RulesTestContext;
    withSecurityRulesDisabled<T>(callback: (context: RulesTestContext) => Promise<T>): Promise<T>;
    clearFirestore(): Promise<void>;
    cleanup(): Promise<void>;
  }

  interface InitializeTestEnvironmentOptions {
    projectId: string;
    firestore?: {
      rules?: string;
      host?: string;
      port?: number;
    };
  }

  export function initializeTestEnvironment(
    options: InitializeTestEnvironmentOptions
  ): Promise<RulesTestEnvironment>;

  export function assertSucceeds<T>(promise: Promise<T>): Promise<T>;
  export function assertFails(promise: Promise<unknown>): Promise<void>;

  export type { RulesTestContext, RulesTestEnvironment };
}
