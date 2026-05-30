import { callN8n, N8nError } from "@/lib/n8n";

/**
 * 중앙화된 API 서비스
 *
 * 모든 n8n webhook 호출은 이 파일을 통해 이루어집니다.
 * - 모든 요청은 POST + JSON 바디 (단, GET 지원 가능)
 * - userId / token 은 localStorage 에 저장하고 모든 요청에 자동 포함
 * - 통일된 에러 처리: ApiError 클래스
 */

const BASE_URL = "https://upstage15.app.n8n.cloud/webhook";

const ENDPOINTS = {
  signup: `${BASE_URL}/signup`,
  login: `${BASE_URL}/login`,
  onboarding: `${BASE_URL}/onboarding`,
  saveScan: `${BASE_URL}/saveScan`,
  analyzedFood: `${BASE_URL}/analyzedFood`,
  saveIntake: `${BASE_URL}/saveIntake`,
  historyInquire: `${BASE_URL}/historyInquire`,
} as const;

const STORAGE_KEYS = {
  user: "eatfit.user",
  token: "eatfit.token",
} as const;

const USER_ID_BY_EMAIL_KEY = "eatfit.userIdsByEmail";

export class ApiError extends Error {
  status?: number;
  body?: unknown;
  constructor(message: string, status?: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

// ---------------------------------------------------------------------------
// localStorage 헬퍼
// ---------------------------------------------------------------------------

interface StoredUser {
  userId?: string;
  user_Id?: string;
  user_id?: string;
  name?: string;
  email?: string;
  [k: string]: unknown;
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function normalizeEmail(email: unknown): string | undefined {
  return typeof email === "string" && email.trim() ? email.trim().toLowerCase() : undefined;
}

function readUserIdMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(USER_ID_BY_EMAIL_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function rememberUserId(email: unknown, userId: unknown): void {
  const key = normalizeEmail(email);
  const id = firstString(userId);
  if (!key || !id) return;
  try {
    localStorage.setItem(USER_ID_BY_EMAIL_KEY, JSON.stringify({ ...readUserIdMap(), [key]: id }));
  } catch {
    /* ignore */
  }
}

function stableUserIdForEmail(email: string): string {
  let hash = 5381;
  for (let i = 0; i < email.length; i += 1) hash = (hash * 33) ^ email.charCodeAt(i);
  return `email_${(hash >>> 0).toString(36)}`;
}

function resolveUserId(prev: StoredUser, incoming: StoredUser): string | undefined {
  const email = normalizeEmail(incoming.email ?? prev.email);
  const prevEmail = normalizeEmail(prev.email);
  const incomingId = firstString(incoming.userId, incoming.user_Id, incoming.user_id);
  const prevId = firstString(prev.userId, prev.user_Id, prev.user_id);
  if (incomingId) return incomingId;
  if (email && prevId && (!prevEmail || prevEmail === email)) return prevId;
  if (email) return readUserIdMap()[email] ?? stableUserIdForEmail(email);
  return prevId;
}

export function getStoredUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.user);
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: StoredUser): void {
  try {
    const prev = getStoredUser() ?? {};
    const next = { ...prev, ...user };
    const userId = resolveUserId(prev, user);
    if (userId) next.userId = userId;
    rememberUserId(next.email, next.userId);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.token);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.token, token);
  } catch {
    /* ignore */
  }
}

export function getUserId(): string | null {
  const user = getStoredUser();
  return firstString(user?.userId, user?.user_Id, user?.user_id) ?? null;
}

// ---------------------------------------------------------------------------
// 공통 요청 함수
// ---------------------------------------------------------------------------

interface RequestOptions {
  method?: "GET" | "POST";
  timeoutMs?: number;
  signal?: AbortSignal;
}

async function request<TResponse = unknown>(
  url: string,
  body: unknown,
  options: RequestOptions = {},
): Promise<TResponse> {
  const { method = "POST", timeoutMs = 30_000, signal } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = getStoredToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: method === "GET" ? undefined : JSON.stringify(body ?? {}),
      signal: controller.signal,
    });

    const text = await res.text();
    let data: unknown = undefined;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!res.ok) {
      throw new ApiError(
        `요청 실패 (${res.status}): ${res.statusText || "서버 오류"}`,
        res.status,
        data,
      );
    }
    return data as TResponse;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError("요청이 시간 초과되었어요. 다시 시도해주세요.");
    }
    throw new ApiError(
      err instanceof Error ? err.message : "네트워크 오류가 발생했어요.",
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

// ---------------------------------------------------------------------------
// 1. 회원가입
// ---------------------------------------------------------------------------
export interface SignupPayload {
  email: string;
  password: string;
  name: string;
}
export interface SignupResponse {
  userId?: string;
  token?: string;
  [k: string]: unknown;
}
export async function signup(payload: SignupPayload): Promise<SignupResponse> {
  const res = await request<SignupResponse>(ENDPOINTS.signup, {
    user_email: payload.email,
    user_password: payload.password,
    user_name: payload.name,
  });
  // 회원가입 시 입력한 이름을 항상 저장 (백엔드 응답 형태와 무관하게).
  const r = (res ?? {}) as Record<string, unknown>;
  const u = (r.user ?? {}) as Record<string, unknown>;
  const userId =
    (r.userId as string | undefined) ??
    (r.user_Id as string | undefined) ??
    (r.user_id as string | undefined) ??
    (u.userId as string | undefined) ??
    (u.user_Id as string | undefined) ??
    (u.user_id as string | undefined);
  setStoredUser({ name: payload.name, email: payload.email, ...(userId ? { userId } : {}) });
  if (res?.token) setStoredToken(res.token);
  return res ?? {};
}

// ---------------------------------------------------------------------------
// 2. 로그인
// ---------------------------------------------------------------------------
export interface LoginPayload {
  email: string;
  password: string;
}
export interface LoginResponse {
  userId?: string;
  token?: string;
  user?: StoredUser;
  [k: string]: unknown;
}
export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const res = await request<LoginResponse>(ENDPOINTS.login, {
    user_email: payload.email,
    user_password: payload.password,
  });
  // 백엔드가 돌려주는 다양한 필드명에서 userId / name 을 추출한다.
  const r = (res ?? {}) as Record<string, unknown>;
  const u = (r.user ?? {}) as Record<string, unknown>;
  const userId =
    (r.userId as string | undefined) ??
    (r.user_Id as string | undefined) ??
    (r.user_id as string | undefined) ??
    (u.userId as string | undefined) ??
    (u.user_Id as string | undefined) ??
    (u.user_id as string | undefined);
  const name =
    (r.user_name as string | undefined) ??
    (r.name as string | undefined) ??
    (u.user_name as string | undefined) ??
    (u.name as string | undefined);
  // 기존에 저장된 이름(회원가입 시 입력한 값)을 백엔드가 이름을 안 줄 때 보존.
  const prevName = getStoredUser()?.name;
  const finalName = name ?? prevName;
  const next: StoredUser = { email: payload.email };
  if (userId) next.userId = userId;
  if (finalName) next.name = finalName;
  setStoredUser(next);
  if (res?.token) setStoredToken(res.token);
  return res ?? {};
}

export function ensureStoredUserId(email?: string): string | null {
  const user = getStoredUser() ?? {};
  const userId = resolveUserId(user, { email: email ?? user.email });
  if (userId) setStoredUser({ userId, email: email ?? user.email });
  return userId ?? null;
}

// ---------------------------------------------------------------------------
// 3. 온보딩
// ---------------------------------------------------------------------------
export interface OnboardingPayload {
  userId?: string | null;
  [k: string]: unknown;
}

function readLocalJSON<T = unknown>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function buildOnboardingPayload(): OnboardingPayload {
  const user = readLocalJSON<StoredUser & { gender?: string; age?: number }>("eatfit.user") ?? {};
  const info = readLocalJSON<{ gender?: string; age?: number }>("onboarding.info") ?? {};
  const healthGoal = readLocalJSON<{ id?: string; label?: string }>("onboarding.healthGoal");
  const goal = readLocalJSON("onboarding.goal");
  const focus = readLocalJSON("onboarding.focus");
  const restricted = readLocalJSON("onboarding.restricted");
  const focusData = focus && typeof focus === "object" ? (focus as Record<string, unknown>) : {};
  const restrictedData = restricted && typeof restricted === "object" ? (restricted as Record<string, unknown>) : {};
  const focusSelected = Array.isArray(focusData.sel) ? focusData.sel : [];
  const focusTargets = focusData.targets ?? null;
  const focusManagement = focusData.management ?? null;
  const restrictedSelected = Array.isArray(restrictedData.sel) ? restrictedData.sel : [];
  const restrictedCustom = Array.isArray(restrictedData.custom) ? restrictedData.custom : [];
  const restrictedAll = Array.from(new Set([...restrictedSelected, ...restrictedCustom]));
  const gender = info.gender ?? user.gender ?? null;
  const age = info.age ?? user.age ?? null;
  const userId = firstString(user.userId, user.user_Id, user.user_id, getUserId());
  const healthGoalId = healthGoal?.id ?? healthGoal?.label ?? null;
  const healthGoalLabel = healthGoal?.label ?? null;

  return {
    user_Id: userId,
    user_id: userId,
    userId,
    user_name: user.name ?? null,
    userName: user.name ?? null,
    name: user.name ?? null,
    user_email: user.email ?? null,
    userEmail: user.email ?? null,
    email: user.email ?? null,
    gender,
    age,
    health_goal: healthGoalId,
    healthGoalId,
    health_goal_label: healthGoalLabel,
    healthGoalLabel,
    focus_areas: focus ?? null,
    focusAreas: focus ?? null,
    focus_selected: focusSelected,
    focus_targets: focusTargets,
    focus_management: focusManagement,
    restricted_items: restricted ?? null,
    restrictedItems: restricted ?? null,
    restricted_selected: restrictedSelected,
    restricted_custom: restrictedCustom,
    restricted_all: restrictedAll,
    updated_at: new Date().toISOString(),
    info: { gender, age },
    goal,
    healthGoal,
    focus,
    restricted,
  };
}

export async function submitOnboarding(payload: OnboardingPayload) {
  const userId = firstString(payload.userId, payload.user_Id, payload.user_id, getUserId());
  return request(ENDPOINTS.onboarding, {
    ...payload,
    action: "update",
    event_type: "onboarding_update",
    user_Id: userId,
    user_id: userId,
    userId,
  });
}

export async function syncOnboardingFromStorage() {
  const payload = buildOnboardingPayload();
  try {
    return await submitOnboarding(payload);
  } catch (err) {
    if (err instanceof ApiError || err instanceof N8nError) {
      return callN8n("onboarding", payload);
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// 4. 스캔 저장
// ---------------------------------------------------------------------------
export interface SaveScanPayload {
  scanData: unknown;
}
export async function saveScan(payload: SaveScanPayload) {
  return request(ENDPOINTS.saveScan, {
    user_Id: getUserId(),
    scanData: payload.scanData,
  });
}

// ---------------------------------------------------------------------------
// 5. 음식 분석
// ---------------------------------------------------------------------------
export interface AnalyzeFoodPayload {
  food_id?: string;
  foodData?: unknown;
}
export async function analyzeFood<T = unknown>(payload: AnalyzeFoodPayload): Promise<T> {
  return request<T>(ENDPOINTS.analyzedFood, {
    user_Id: getUserId(),
    food_id: payload.food_id,
    foodData: payload.foodData,
  });
}

// ---------------------------------------------------------------------------
// 6. 섭취 저장
// ---------------------------------------------------------------------------
export interface SaveIntakePayload {
  foodId?: string;
  food_Id?: string;
  [k: string]: unknown;
}
export async function saveIntake(payload: SaveIntakePayload) {
  const { foodId, food_Id, ...rest } = payload;
  return request(ENDPOINTS.saveIntake, {
    user_Id: getUserId(),
    food_Id: food_Id ?? foodId,
    ...rest,
  });
}

// ---------------------------------------------------------------------------
// 7. 히스토리 조회
// ---------------------------------------------------------------------------
export interface HistoryInquirePayload {
  food_id?: string;
  scan_id?: string;
  startDate?: string;
  endDate?: string;
}
export async function inquireHistory<T = unknown>(payload: HistoryInquirePayload = {}): Promise<T> {
  return request<T>(ENDPOINTS.historyInquire, {
    user_Id: getUserId(),
    ...payload,
  });
}
