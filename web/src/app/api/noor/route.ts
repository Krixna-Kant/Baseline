/**
 * Optional LLM restyling for Noor's unlocked replies. Off unless NOOR_LLM_API_KEY is set; the client keeps the
 * template whenever this returns 204 or the candidate fails `acceptRephrase`. Only the approved reply text is sent,
 * never the user's history or identifiers.
 */
export async function POST(request: Request) {
  const key = process.env.NOOR_LLM_API_KEY;
  if (!key) return new Response(null, { status: 204 });

  const { text, lang, persona } = (await request.json()) as { text?: string; lang?: string; persona?: string };
  if (!text || text.length > 1200) return new Response(null, { status: 400 });

  const base = process.env.NOOR_LLM_BASE_URL ?? "https://api.openai.com/v1";
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.NOOR_LLM_MODEL ?? "gpt-4o-mini",
      temperature: 0.3,
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content:
            `You are ${persona === "rashid" ? "Rashid" : "Noor"}, a warm assistant for older adults in the UAE. ` +
            `Rewrite the message in simple, kind ${lang === "ar" ? "Gulf-friendly Modern Standard Arabic" : "English"}. ` +
            "Keep every fact and every number exactly. Do not add advice, numbers, health states, or medical terms. " +
            "Reply with the rewritten message only.",
        },
        { role: "user", content: text },
      ],
    }),
    signal: AbortSignal.timeout(6000),
  }).catch(() => null);
  if (!res?.ok) return new Response(null, { status: 204 });
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const out = data.choices?.[0]?.message?.content?.trim();
  return out ? Response.json({ text: out }) : new Response(null, { status: 204 });
}
