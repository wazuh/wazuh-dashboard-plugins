/**
 * HTTP-related constants used by DevTools.
 */
export const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE"] as const;
export type HttpMethod = typeof HTTP_METHODS[number];

export const DEFAULT_HTTP_METHOD: HttpMethod = "GET";

