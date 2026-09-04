/**
 * Utilidades PKCE (RFC 7636) para el flujo Authorization Code + PKCE de Spotify.
 *
 * Estas funciones son puras y agnósticas de entorno: funcionan tanto en el
 * navegador (Web Crypto API) como en Node.js 18+ (misma Web Crypto API global).
 */

/**
 * Genera un code_verifier aleatorio de 64 bytes codificado en base64url.
 * El verifier se guarda en el cliente y NUNCA se manda a Spotify directamente.
 */
export function generateCodeVerifier(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(64));
  return base64url(bytes);
}

/**
 * Calcula el code_challenge a partir del verifier.
 * challenge = base64url(SHA-256(verifier))
 * Es lo que se manda a Spotify en el paso de /authorize.
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoded = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return base64url(new Uint8Array(digest));
}

/**
 * Genera un state aleatorio de 16 bytes para proteger contra CSRF.
 * Se manda en /authorize y se verifica cuando Spotify redirige de vuelta.
 */
export function generateState(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return base64url(bytes);
}

// --- helpers internos ---

/**
 * Codifica un Uint8Array en base64url (sin padding).
 * base64url difiere de base64 estándar en tres caracteres: +→-, /→_, sin =
 */
function base64url(bytes: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
