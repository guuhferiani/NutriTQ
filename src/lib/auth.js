import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_NEON_AUTH_URL || (typeof window !== 'undefined' ? window.location.origin : '')
});

export const { signIn, signUp, useSession, signOut } = authClient;
