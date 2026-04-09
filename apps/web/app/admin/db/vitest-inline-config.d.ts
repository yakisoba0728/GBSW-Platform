import 'vitest/config'

declare module 'vitest/config' {
  // Keep the workspace config type-checkable without editing the root vitest config.
  export function defineConfig(config: {
    [key: string]: unknown
    test?: {
      [key: string]: unknown
      environmentMatchGlobs?: Array<[string, string]>
    }
  }): unknown

  interface InlineConfig {
    environmentMatchGlobs?: Array<[string, string]>
  }
}

declare module 'vitest/dist/chunks/reporters.d.B0uk8id2.js' {
  interface InlineConfig {
    environmentMatchGlobs?: Array<[string, string]>
  }
}
