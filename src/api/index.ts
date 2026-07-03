import { realApi, BASE_URL } from "./client";
import { mockApi } from "./mock";

// Backend isn't deployed yet (or VITE_API_BASE_URL isn't set) -> fall back to the
// in-memory mock so frontend work isn't blocked. Once the backend is live and
// VITE_API_BASE_URL is set as a repo secret, this automatically switches to realApi.
export const isMockApi = !BASE_URL;
export const api = BASE_URL ? realApi : mockApi;

export type { Api } from "./client";
export { ApiError } from "./client";
