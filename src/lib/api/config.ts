/**
 * The public Luqma API base URL. It can be overridden only through the public
 * VITE_API_BASE_URL build-time value; the documented production URL is the default.
 * No secret or backend credential belongs in this value.
 */
const DEFAULT_API_BASE_URL = 'https://luqma-api.runasp.net';

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

export const API_BASE_URL = (configuredBaseUrl || DEFAULT_API_BASE_URL).replace(/\/+$/, '');

export const API_TIMEOUT_MS = 15_000;
