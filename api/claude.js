import crypto from "node:crypto";

/* 앱 토큰 비교. 길이가 달라도 타이밍이 새지 않도록 해시로 고정 길이 비교 */
function tokenMatches(got, expected) {
  if (typeof got !== "string" || typeof expected !== "string" || !got || !expected) return false;
  const a = crypto.createHash("sha256").update(got).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  /* ALLOWED_ORIGINS 가 설정돼 있으면 그 목록에서만 호출을 받는다.
     비어 있으면 (로컬 개발 등) 출처는 제한하지 않되 토큰은 그대로 요구한다. */
  const allowList = (process.env.ALLOWED_ORIGINS || "")
    .split(",").map((s) => s.trim()).filter(Boolean);
  const origin = req.headers.origin || "";
  const allowOrigin = allowList.length === 0
    ? "*"
    : (allowList.includes(origin) ? origin : null);

  if (allowOrigin) res.setHeader("Access-Control-Allow-Origin", allowOrigin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-app-token");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (!allowOrigin) {
    return res.status(403).json({ error: { message: "허용되지 않은 위치에서의 요청입니다." } });
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "POST only" } });
  }

  if (!process.env.APP_TOKEN) {
    return res.status(500).json({ error: { message: "APP_TOKEN이 설정되지 않았습니다. (Vercel 환경 변수 확인)" } });
  }
  if (!tokenMatches(req.headers["x-app-token"], process.env.APP_TOKEN)) {
    return res.status(401).json({ error: { message: "이용 권한이 없습니다. 앱에서 AI 이용 키를 확인해 주세요." } });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: { message: "ANTHROPIC_API_KEY not set" } });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY.trim(),
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.text();
    res.status(response.status).setHeader("Content-Type", "application/json").send(data);
  } catch (err) {
    res.status(500).json({ error: { message: "Proxy error: " + err.message } });
  }
}
