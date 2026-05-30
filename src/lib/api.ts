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
  name?: string;
  email?: string;
  [k: string]: unknown;
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
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify({ ...prev, ...user }));
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
  return getStoredUser()?.userId ?? null;
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
  if (res?.userId) setStoredUser({ userId: res.userId, name: payload.name, email: payload.email });
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

// ---------------------------------------------------------------------------
// 3. 온보딩
// ---------------------------------------------------------------------------
export interface OnboardingPayload {
  userId?: string | null;
  [k: string]: unknown;
}
export async function submitOnboarding(payload: OnboardingPayload) {
  return request(ENDPOINTS.onboarding, {
    user_Id: getUserId(),
    ...payload,
  });
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
