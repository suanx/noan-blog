const AI_API_KEY = () => process.env.AI_API_KEY || "";
const AI_BASE_URL = () => (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
const AI_MODEL = () => process.env.AI_MODEL || "gpt-3.5-turbo";

export async function callAI(prompt, systemPrompt) {
  const apiKey = AI_API_KEY();
  const baseUrl = AI_BASE_URL();
  const model = AI_MODEL();

  if (!apiKey) {
    throw new Error("AI_API_KEY is not configured");
  }

  const messages = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const maxRetries = 3;
  let lastErr;
  const startTime = Date.now();

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 512,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        throw new Error(`AI API error ${res.status}: ${errBody || res.statusText}`);
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content?.trim();
      if (!text) {
        throw new Error("AI returned empty response");
      }

      const duration = Date.now() - startTime;
      console.log(JSON.stringify({
        level: "info",
        event: "ai_call",
        model,
        attempt,
        duration_ms: duration,
        success: true,
      }));

      return text;
    } catch (err) {
      lastErr = err;
      if (err.name === "AbortError") {
        throw new Error("AI request timed out after 5 seconds");
      }
      if (attempt < maxRetries - 1) {
        const delay = 1000 * (attempt + 1);
        await new Promise((r) => setTimeout(r, delay));
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  console.log(JSON.stringify({
    level: "error",
    event: "ai_call",
    model,
    duration_ms: Date.now() - startTime,
    success: false,
    error: lastErr?.message,
  }));

  throw lastErr;
}
