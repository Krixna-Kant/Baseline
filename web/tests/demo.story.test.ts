import { test } from "node:test";
import assert from "node:assert/strict";
import { khalid, MARIAM_DAY, STAGE_DAY, type DemoStage } from "../src/lib/demo.ts";
import { informantForEngine } from "../src/lib/context.ts";

const ENGINE = process.env.ENGINE_URL ?? "http://127.0.0.1:8000";
const NOW = Date.parse("2026-11-20T09:00:00Z");

async function run(stage: DemoStage) {
  const s = khalid(stage, NOW);
  const res = await fetch(`${ENGINE}/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessions: s.sessions, informant: informantForEngine(s.informant) }),
  });
  assert.equal(res.status, 200);
  const body = (await res.json()) as {
    explanation: { state: string; ruleFired: string };
    trajectory: { at: string; state: string; rule: string; compositeZ: number | null }[];
  };
  const start = NOW - STAGE_DAY[stage] * 86_400_000;
  const days = body.trajectory.map((p) => ({ ...p, day: Math.round((Date.parse(p.at) - start) / 86_400_000) }));
  if (process.env.DEMO_TRACE) {
    console.log(stage, body.explanation.state, body.explanation.ruleFired);
    for (const p of days.filter((x) => x.state !== "building")) console.log(`  d${p.day} ${p.state} ${p.rule} z=${p.compositeZ?.toFixed(2)}`);
  }
  return { ...body.explanation, days };
}

const engineUp = await fetch(`${ENGINE}/health`).then(
  () => true,
  () => false,
);

test("Khalid's story: each stage lands on the scripted state", { skip: !engineUp && "engine not running" }, async () => {
  const expected: Record<DemoStage, string> = {
    baseline: "stable",
    sleep: "watch_context",
    ramadan: "stable",
    watch: "watch",
    review: "review",
    shared: "review",
  };
  for (const stage of Object.keys(expected) as DemoStage[]) {
    const ev = await run(stage);
    assert.equal(ev.state, expected[stage], `${stage}: ${ev.ruleFired}`);
  }
});

test("Khalid's story: Ramadan fasting never raises Watch or Review", { skip: !engineUp && "engine not running" }, async () => {
  const ev = await run("ramadan");
  const during = ev.days.filter((p) => p.day >= 76);
  assert.ok(during.length > 8);
  for (const p of during) assert.ok(!["watch", "review"].includes(p.state), `day ${p.day}: ${p.state}`);
});

test("Khalid's story: Watch opens first, Review only after Mariam's report", { skip: !engineUp && "engine not running" }, async () => {
  const ev = await run("review");
  const firstWatch = ev.days.find((p) => p.state === "watch");
  const firstReview = ev.days.find((p) => p.state === "review");
  assert.ok(firstWatch && firstReview);
  assert.ok(firstWatch.day < MARIAM_DAY && firstReview.day > MARIAM_DAY, `watch d${firstWatch.day}, review d${firstReview.day}`);
  assert.equal(firstReview.rule, "decline_plus_informant");
  assert.ok(ev.days.filter((p) => p.day < 114).every((p) => p.state !== "watch" && p.state !== "review"));
});
