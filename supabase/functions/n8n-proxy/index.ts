// n8n Webhook 프록시 Edge Function
// 브라우저 → Edge Function → n8n 으로 호출하여 Cloudflare cf_bm 브라우저 챌린지를 우회합니다.

const N8N_BASE = "https://upstage15.app.n8n.cloud";

const TARGETS: Record<string, string> = {
  scan: `${N8N_BASE}/webhook/5a5d0582-174a-46c2-a903-a213dc8311a4`,
  onboarding: `${N8N_BASE}/webhook/onboarding`,
  saveIntake: `${N8N_BASE}/webhook/saveIntake`,
  saveScan: `${N8N_BASE}/webhook/saveScan`,
  historyInquire: `${N8N_BASE}/webhook/historyInquire`,
  chat: `${N8N_BASE}/webhook/chat`,
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const target = url.searchParams.get("target") ?? "";
    const upstream = TARGETS[target];

    if (!upstream) {
      return new Response(
        JSON.stringify({ success: false, error: `Unknown target: ${target}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 요청 메서드 그대로 전달 (GET/POST 지원)
    const method = req.method;
    const contentType = req.headers.get("content-type") ?? "application/json";
    const hasBody = method !== "GET" && method !== "HEAD";
    const body = hasBody ? await req.arrayBuffer() : undefined;

    const upstreamHeaders: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      Accept: "application/json, text/plain, */*",
    };
    if (hasBody) upstreamHeaders["Content-Type"] = contentType;

    const upstreamRes = await fetch(upstream, {
      method,
      headers: upstreamHeaders,
      body,
    });

    const respBody = await upstreamRes.arrayBuffer();
    const respContentType = upstreamRes.headers.get("content-type") ?? "application/json";

    return new Response(respBody, {
      status: upstreamRes.status,
      headers: { ...corsHeaders, "Content-Type": respContentType },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ success: false, error: `Proxy error: ${message}` }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
