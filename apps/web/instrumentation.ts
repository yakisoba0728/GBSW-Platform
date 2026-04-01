import { validateWebRuntimeEnv } from './lib/runtime-env'

export async function register() {
  validateWebRuntimeEnv()
}
