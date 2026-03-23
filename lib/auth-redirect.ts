export const DEFAULT_AUTH_REDIRECT = "/";

export function getSafeCallbackPath(callbackUrl?: string | null) {
  if (!callbackUrl || !callbackUrl.startsWith("/") || callbackUrl.startsWith("//")) {
    return DEFAULT_AUTH_REDIRECT;
  }

  try {
    const parsedUrl = new URL(callbackUrl, "http://localhost");
    return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
  } catch {
    return DEFAULT_AUTH_REDIRECT;
  }
}
