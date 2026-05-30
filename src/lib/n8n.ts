/**
 * n8n Webhook 호출 유틸리티 (Supabase Edge Function 프록시 경유)
 *
 * 브라우저 → Supabase Edge Function (`n8n-proxy`) → n8n
 * Cloudflare `cf_bm` 봇 챌린지를 우회하기 위해 모든 n8n 호출은
 * Edge Function을 통해 서버사이드로 프록시됩니다.
 */

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ?? (typeof process !== "undefined" ? process.env.SUPABASE_URL : "");
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  (typeof process !== "undefined" ? process.env.SUPABASE_PUBLISHABLE_KEY : "");

const PROXY_BASE = `${SUPABASE_URL}/functions/v1/n8n-proxy`;

/** n8n Webhook 타겟 키 — Edge Function의 TARGETS 매핑과 일치해야 합니다. */
export const N8N_TARGETS = ["signup", "scan", "onboarding", "saveIntake", "saveScan", "historyInquire", "chat"] as const;
export type N8nTarget = (typeof N8N_TARGETS)[number];

function proxyUrl(target: N8nTarget): string {
  return `${PROXY_BASE}?target=${encodeURIComponent(target)}`;
}

function proxyHeaders(extra?: Record<string, string>): Record<string, string> {
  const base: Record<string, string> = {};
  if (SUPABASE_ANON_KEY) {
    base["apikey"] = SUPABASE_ANON_KEY;
    base["Authorization"] = `Bearer ${SUPABASE_ANON_KEY}`;
  }
  return { ...base, ...(extra ?? {}) };
}

export interface CallN8nOptions {
  headers?: Record<string, string>;
  timeoutMs?: number;
  parseJson?: boolean;
  signal?: AbortSignal;
}

export class N8nError extends Error {
  status?: number;
  body?: unknown;
  constructor(message: string, status?: number, body?: unknown) {
    super(message);
    this.name = "N8nError";
    this.status = status;
    this.body = body;
  }
}

function safeParseArray<T = unknown>(val: unknown): T[] {
  if (Array.isArray(val)) return val as T[];
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** Edge Function 프록시를 통해 n8n Webhook 호출 (JSON 본문). */
export async function callN8n<TResponse = unknown, TPayload = unknown>(
  target: N8nTarget,
  payload: TPayload,
  options: CallN8nOptions = {},
): Promise<TResponse> {
  const { headers, timeoutMs = 30_000, parseJson = true, signal } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  try {
    const res = await fetch(proxyUrl(target), {
      method: "POST",
      headers: proxyHeaders({ "Content-Type": "application/json", ...headers }),
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) {
      let errBody: unknown;
      try {
        errBody = await res.text();
      } catch {
        /* ignore */
      }
      throw new N8nError(`n8n webhook 요청 실패: ${res.status} ${res.statusText}`, res.status, errBody);
    }

    if (!parseJson) {
      return (await res.text()) as unknown as TResponse;
    }
    const text = await res.text();
    if (!text) return undefined as unknown as TResponse;
    try {
      return JSON.parse(text) as TResponse;
    } catch {
      return text as unknown as TResponse;
    }
  } catch (err) {
    if (err instanceof N8nError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new N8nError("n8n webhook 요청이 타임아웃되었습니다.");
    }
    throw new N8nError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
  } finally {
    clearTimeout(timeoutId);
  }
}

// ---------------------------------------------------------------------------
// 기능별 헬퍼
// ---------------------------------------------------------------------------

export interface ScanPayload {
  image: string;
  filename?: string;
  mimeType?: string;
  label_type?: string;
  gender?: string;
  age?: string;
  health_goal?: string;
  nutrient_targets?: Record<string, unknown>;
  avoid_ingredients?: string[];
  allergies?: string[];
  user_id?: string;
}

export interface ScanNutritionResponse {
  success: boolean;
  overall: string;
  coach_message: string;
  nutrition_summary: Array<{
    name: string;
    amount: string;
    daily_ratio: string;
    evaluation: string;
  }>;
  warning_ingredients: Array<{
    name: string;
    level: string;
    reason: string;
  }>;
  alternatives: Array<{
    product_name: string;
    reason: string;
  }>;
}

function base64ToBlob(base64: string, mimeType = "image/jpeg"): Blob {
  const base64Data = base64.includes(",") ? base64.split(",")[1] : base64;
  const actualMime = base64.includes("data:") ? base64.split(";")[0].replace("data:", "") : mimeType;
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Uint8Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  return new Blob([byteNumbers], { type: actualMime });
}

/**
 * 영양 성분표 스캔 및 분석 — multipart/form-data 로 Edge Function 경유 전송.
 */
export async function scanNutrition(
  payload: ScanPayload,
  options: CallN8nOptions = {},
): Promise<ScanNutritionResponse> {
  const { timeoutMs = 60_000, signal } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  try {
    const formData = new FormData();
    const blob = base64ToBlob(payload.image, payload.mimeType ?? "image/jpeg");
    formData.append("file", blob, payload.filename ?? "image.jpg");

    if (payload.label_type) formData.append("label_type", payload.label_type);
    if (payload.gender) formData.append("gender", payload.gender);
    if (payload.age) formData.append("age", payload.age);
    if (payload.health_goal) formData.append("health_goal", payload.health_goal);
    if (payload.user_id) formData.append("user_id", payload.user_id);
    if (payload.nutrient_targets) {
      formData.append("nutrient_targets", JSON.stringify(payload.nutrient_targets));
    }
    if (payload.avoid_ingredients) {
      formData.append("avoid_ingredients", JSON.stringify(payload.avoid_ingredients));
    }
    if (payload.allergies) {
      formData.append("allergies", JSON.stringify(payload.allergies));
    }

    // FormData 사용 시 Content-Type 헤더를 명시하지 않아야 boundary 가 자동 설정됨
    const res = await fetch(proxyUrl("scan"), {
      method: "POST",
      headers: proxyHeaders(),
      body: formData,
      signal: controller.signal,
    });

    if (!res.ok) {
      let errBody: unknown;
      try {
        errBody = await res.text();
      } catch {
        /* ignore */
      }
      throw new N8nError(`스캔 요청 실패: ${res.status} ${res.statusText}`, res.status, errBody);
    }

    const text = await res.text();
    if (!text) throw new N8nError("빈 응답이 반환되었습니다.");

    let raw: Record<string, unknown>;
    try {
      raw = JSON.parse(text);
    } catch {
      throw new N8nError("응답 JSON 파싱 실패", undefined, text);
    }

    return {
      success: Boolean(raw.success ?? true),
      overall: String(raw.overall ?? ""),
      coach_message: String(raw.coach_message ?? ""),
      nutrition_summary: safeParseArray(raw.nutrition_summary),
      warning_ingredients: safeParseArray(raw.warning_ingredients),
      alternatives: safeParseArray(raw.alternatives),
    };
  } catch (err) {
    if (err instanceof N8nError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new N8nError("스캔 요청이 타임아웃되었습니다.");
    }
    throw new N8nError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
  } finally {
    clearTimeout(timeoutId);
  }
}

/** 누적 섭취량 업데이트 */
export function saveIntake<T = unknown, P = unknown>(payload: P, options?: CallN8nOptions) {
  return callN8n<T, P>("saveIntake", payload, options);
}

/** 스캔 기록 저장 */
export function saveScan<T = unknown, P = unknown>(payload: P, options?: CallN8nOptions) {
  return callN8n<T, P>("saveScan", payload, options);
}

/** 스캔 기록 조회 (n8n webhook이 GET으로 등록되어 있음) */
export async function inquireHistory<T = unknown>(
  _payload: unknown = {},
  options: CallN8nOptions = {},
): Promise<T> {
  const { timeoutMs = 30_000, signal, parseJson = true } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", () => controller.abort(), { once: true });
  }
  try {
    const res = await fetch(proxyUrl("historyInquire"), {
      method: "GET",
      headers: proxyHeaders(),
      signal: controller.signal,
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => undefined);
      throw new N8nError(`기록 조회 실패: ${res.status} ${res.statusText}`, res.status, errBody);
    }
    const text = await res.text();
    if (!text) return undefined as unknown as T;
    if (!parseJson) return text as unknown as T;
    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  } catch (err) {
    if (err instanceof N8nError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new N8nError("기록 조회 요청이 타임아웃되었습니다.");
    }
    throw new N8nError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
  } finally {
    clearTimeout(timeoutId);
  }
}

export interface ChatPayload {
  message: string;
  history?: Array<{ role: "user" | "ai"; text: string }>;
}

/** 챗봇 */
export function chatWithBot<T = { reply?: string; text?: string; message?: string }>(
  payload: ChatPayload,
  options?: CallN8nOptions,
) {
  return callN8n<T, ChatPayload>("chat", payload, options);
}
