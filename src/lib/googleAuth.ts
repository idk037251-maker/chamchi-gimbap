/**
 * Real Google OAuth 2.0 & Google Identity Services (GSI) Integration
 *
 * Directs the browser straight to accounts.google.com as shown in user screenshot.
 */

export interface GoogleUserPayload {
  email: string;
  name: string;
  picture: string;
  sub: string;
}

export const DEFAULT_GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  (typeof window !== "undefined"
    ? localStorage.getItem("kakaocord_google_client_id") || ""
    : "");

export function saveGoogleClientId(clientId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("kakaocord_google_client_id", clientId.trim());
}

export function getGoogleClientId(): string {
  if (typeof window === "undefined") return "";
  return (
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    localStorage.getItem("kakaocord_google_client_id") ||
    ""
  );
}

/**
 * Parses JWT id_token from Google OAuth response
 */
export function parseGoogleJwt(token: string): GoogleUserPayload | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Failed to parse Google JWT", e);
    return null;
  }
}

/**
 * Redirects browser directly to https://accounts.google.com/o/oauth2/v2/auth
 */
export function redirectToGoogleLogin(clientId: string, redirectUri?: string) {
  if (typeof window === "undefined") return;

  const currentOrigin = window.location.origin;
  const currentPath = window.location.pathname;
  const targetRedirectUri = redirectUri || `${currentOrigin}${currentPath}`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: targetRedirectUri,
    response_type: "token id_token",
    scope: "openid email profile",
    nonce: Date.now().toString(),
    prompt: "select_account",
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  window.location.href = googleAuthUrl;
}

/**
 * Checks URL hash after returning from accounts.google.com
 */
export function extractGoogleTokensFromHash(): { idToken: string; accessToken: string } | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash;
  if (!hash || hash.length < 2) return null;

  const params = new URLSearchParams(hash.slice(1));
  const idToken = params.get("id_token") || "";
  const accessToken = params.get("access_token") || "";

  if (idToken || accessToken) {
    window.history.replaceState(null, "", window.location.pathname);
    return { idToken, accessToken };
  }
  return null;
}
