/**
 * Noor's decision layer. Pure: no React, no storage, no network, so the red-team suite can run it under `node --test`.
 * Noor never computes a state or a number. Every fact in a reply comes from a tool result, the user's own words,
 * or an approved template.
 */
import type { EngineState } from "../engine";
import type { ParsedReading } from "../context";
import type { CheckIn } from "../types";
import type { WeeklyStory } from "../plan";
import { parseSpokenReading } from "../context.ts";

export type Intent =
  | "red_flag"
  | "diagnosis"
  | "hide"
  | "medication"
  | "raw_numbers"
  | "dependence"
  | "help"
  | "identity"
  | "checkin_sleep"
  | "reading"
  | "story"
  | "state"
  | "plan"
  | "packet"
  | "family"
  | "schedule"
  | "greeting"
  | "thanks"
  | "unknown";

export type RedFlagKind = "stroke" | "confusion" | "headache" | "chest" | "faint" | "head_injury" | "seizure" | "vision" | "self_harm";

/** Lower-case, strip Arabic diacritics and tatweel, unify alef/ya/ta-marbuta, Arabic digits → ASCII. */
export function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[’`]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

const RED_FLAGS: [RedFlagKind, RegExp][] = [
  [
    "stroke",
    /face (is )?(droop|numb|twist)|droop(ing|y) face|(can'?t|cannot|unable to) (move|feel|lift|raise) (my )?((left|right) )?(arm|leg|hand|face|side)|sudden(ly)? (weak|numb)|one side .*(weak|numb)|slurr|(can'?t|cannot) (speak|talk|get (my )?words)|trouble (speaking|talking)|stroke|وجهي (مايل|مرتخي|معوج)|ارتخاء (في )?(الوجه|وجهي)|(ما|لا) (اقدر|استطيع) (احرك|ارفع) (يدي|ايدي|ذراعي|رجلي)|(تنميل|خدر|ضعف) مفاجئ|ثقل (في )?(لساني|كلامي)|(لساني|كلامي) (ثقيل|متلعثم)|(ما|لا) (اقدر|استطيع) (اتكلم|اتحدث)|صعوبه (في )?(الكلام|النطق)|جلطه/,
  ],
  [
    "confusion",
    /sudden(ly)? (confus|disorient|lost)|(don'?t|do not) know where i am|(تشوش|ارتباك|لخبطه) مفاجئ|(ما|لا) (اعرف|ادري) (وين|اين) (انا|انا)/,
  ],
  ["headache", /worst headache|thunderclap|sudden (severe|terrible|bad) headache|اسوا صداع|صداع (شديد|قوي) (و)?مفاجئ|صداع مفاجئ/],
  ["chest", /chest pain|pain in (my )?chest|ضيق (في )?(الصدر|صدري)|الم (في )?(الصدر|صدري)|وجع (في )?صدري/],
  ["faint", /faint|passed out|unconscious|blacked out|collapsed|اغمي علي|فقدت الوعي|غبت عن الوعي/],
  ["head_injury", /(fell|fall|fallen).*(hit|bang|bump)\w* (my )?head|hit my head|(طحت|سقطت|وقعت).*(راسي)|ضربت راسي/],
  ["seizure", /seizure|convuls|تشنج|نوبه صرع/],
  ["vision", /sudden(ly)? (lost|losing|can'?t see|blind|double vision)|(lost|losing) (my )?(sight|vision) sudden|فقدت (النظر|البصر)|(ما|لا) (اشوف|اري) فجا/],
  [
    "self_harm",
    /kill myself|suicid|end (my|it all)|end my life|hurt myself|harm myself|(don'?t|do not) want to (live|be alive)|better off dead|انتحر|انتحار|اقتل نفسي|انهي حياتي|اذي نفسي|(ما|لا) (ابي|اريد|ابغي) (اعيش|احيا)/,
  ],
];

export function detectRedFlag(text: string): RedFlagKind | null {
  const n = normalize(text);
  for (const [kind, re] of RED_FLAGS) if (re.test(n)) return kind;
  return null;
}

const INTENTS: [Exclude<Intent, "red_flag" | "reading" | "unknown">, RegExp][] = [
  ["diagnosis", /dementia|alzheimer|diagnos|senile|(do|have) i (have|got) .*(memory|disease|condition)|losing my mind|is (it|this) (serious|a disease)|خرف|زهايمر|تشخيص|هل (انا )?مصاب|هل عندي (مرض|خرف)/],
  ["hide", /\bhide\b|(don'?t|do not) (tell|show|let)|keep (it|this) (secret|from)|secret from|change (my|the) (result|state|status)|make it (stable|green|normal)|lower the (state|alert|level)|downgrade|delete (my|the) (result|flag)|remove the (flag|review)|اخفي|اخف |(لا|ما) (تخبر|تقول|تعلم|تبلغ|توري)|غير (النتيجه|الحاله)|احذف (النتيجه|التنبيه)|خلها مستقره/],
  ["medication", /medicine|medication|\bpills?\b|tablets?|\bdose|dosage|\bdrugs?\b|supplement|vitamin|aspirin|insulin|metformin|statin|should i (take|stop)|دواء|الدواء|ادويه|حبوب|جرعه|انسولين|مكمل|فيتامين/],
  ["raw_numbers", /\bscores?\b|\braw\b|exact (number|value|result)|z[- ]?score|percent|percentile|\bpoints?\b|my numbers|what number|درجتي|الدرجه|درجه|الرقم|ارقامي|رقمي|نسبه|كم نقطه|النقاط/],
  ["dependence", /only friend|love you|you'?re all i have|you are all i have|(don'?t|do not) need (anyone|people|my family|others)|be my (friend|wife|husband)|marry me|only one who understands|احبك|ما عندي غيرك|ما احتاج احد|صديقي الوحيد|صديقتي الوحيده|انت كل شي/],
  ["help", /what can you do|how (do|can) you help|\bhelp\b|ساعدني|مساعده|وش تقدر|ماذا تستطيع/],
  ["identity", /who are you|what are you|are you (a |an )?(doctor|human|real|person|robot|ai|bot)|من انت|منو انت|هل انت (طبيب|دكتور|انسان|حقيقي)|انت (روبوت|دكتور)/],
  ["checkin_sleep", /\bslept\b|\bsleep\b|insomnia|tired|exhausted|(didn'?t|did not|couldn'?t) sleep|نمت|النوم|نومي|ما نمت|سهران|تعبان|ارق/],
  ["story", /\bweek|weekly|story|trend|lately|recently|الاسبوع|اسبوعي|هالاسبوع|مؤخرا/],
  ["state", /how am i|how('?s| is) my|my results?|am i (ok|okay|alright|fine|well)|status|what do you see|how did i do|كيف حالي|نتيجتي|نتايجي|نتائجي|وضعي|هل انا بخير|كيف سويت/],
  ["plan", /what (can|should) i do|\bplan\b|\bgoals?\b|prevent|healthy|exercise|\bdiet\b|improve|stay sharp|keep my (brain|memory)|وش اسوي|ماذا افعل|خطه|هدف|وقايه|رياضه|اكل صحي|احافظ علي/],
  ["packet", /doctor|summary|clinic|\bshare\b|report|refer|طبيب|دكتور|الدكتور|ملخص|عياده|شارك|تقرير/],
  ["family", /family|\bson\b|daughter|\bwife\b|husband|invite|caregiver|عائله|اسره|ولدي|بنتي|زوجتي|زوجي|ادعو|اهلي/],
  ["schedule", /\bwhen\b|next (session|check|time)|remind|schedule|retest|متي|موعد|ذكرني|الجلسه الجايه|الجلسه القادمه/],
  ["greeting", /^(hi|hello|hey|salam|good (morning|afternoon|evening))\b|السلام|مرحبا|هلا|صباح الخير|مساء الخير/],
  ["thanks", /thank|shukran|شكرا|مشكور|يعطيك العافيه/],
];

export interface Classified {
  intent: Intent;
  redFlag?: RedFlagKind;
  reading?: ParsedReading;
  sleepHours?: number;
}

export function classify(text: string): Classified {
  const redFlag = detectRedFlag(text);
  if (redFlag) return { intent: "red_flag", redFlag };
  const n = normalize(text);
  const match = (intent: Intent) => INTENTS.find(([i]) => i === intent)![1].test(n);
  // Safety and boundary intents outrank everything else, in this order.
  for (const intent of ["diagnosis", "hide", "medication", "raw_numbers", "dependence"] as const) {
    if (match(intent)) return { intent };
  }
  if (match("checkin_sleep")) {
    const h = n.match(/(\d+(?:\.\d+)?)\s*(hours?|hrs?|h\b|ساعات|ساعه)/);
    const hours = h ? Number(h[1]) : undefined;
    return { intent: "checkin_sleep", sleepHours: hours !== undefined && hours <= 16 ? hours : undefined };
  }
  if (/\d/.test(n)) {
    const reading = parseSpokenReading(text);
    if (reading) return { intent: "reading", reading };
  }
  for (const [intent, re] of INTENTS) {
    if (!["diagnosis", "hide", "medication", "raw_numbers", "dependence", "checkin_sleep"].includes(intent) && re.test(n)) {
      return { intent };
    }
  }
  return { intent: "unknown" };
}

// ---------------------------------------------------------------- tools

export interface StateFact {
  state: EngineState;
  ruleFired: string;
  nextStep: string;
  baselineSessions: number;
  baselineNeeded: number;
}

/** The only way Noor gets facts. Implemented over the local store and engine in the app, faked in tests. */
export interface NoorTools {
  get_state(): StateFact | null;
  get_trajectory_summary(): WeeklyStory | null;
  get_template(key: TemplateKey): string;
  get_goal(): { title: string; body: string } | null;
  draft_packet(): { href: string };
  invite_informant(): { href: string };
  schedule_retest(): { date: string } | null;
  escalate(kind: RedFlagKind): void;
}

export type TemplateKey = "urgent" | `state.${EngineState}`;

export type NoorAction =
  | { kind: "call"; number: "998" }
  | { kind: "link"; href: string; label: string }
  | { kind: "confirm_reading"; reading: ParsedReading }
  | { kind: "confirm_sleep"; draft: Partial<CheckIn> };

export interface NoorReply {
  intent: Intent;
  text: string;
  /** Review and Urgent replies are template-only and must never be rephrased. */
  locked: boolean;
  tools: string[];
  actions: NoorAction[];
}

export interface NoorText {
  name: string;
  replies: Record<string, string>;
  links: Record<"packet" | "plan" | "family" | "privacy" | "devices", string>;
  story: {
    sessions: string;
    family: Record<"steady" | "lower" | "higher", string>;
    tasks: Record<"memory" | "speed" | "executive", string>;
    context: string;
    contextNames: Record<string, string>;
    joiner: string;
  };
  readingTypes: Record<string, string>;
  dayName: (iso: string) => string;
}

function fill(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}

function formatParsed(r: ParsedReading) {
  return r.type === "bp" ? `${r.values.systolic}/${r.values.diastolic}` : String(r.values.value);
}

export function storyText(story: WeeklyStory, t: NoorText["story"]) {
  const lines = [fill(t.sessions, { n: story.sessions })];
  for (const f of ["memory", "speed", "executive"] as const) {
    const trend = story.families[f];
    if (trend !== "unknown") lines.push(fill(t.family[trend], { task: t.tasks[f] }));
  }
  for (const c of story.context) {
    lines.push(fill(t.context, { context: t.contextNames[c.factor], days: c.days.join(t.joiner) }));
  }
  return lines.join(" ");
}

export function respond(message: string, tools: NoorTools, t: NoorText): NoorReply {
  const used: string[] = [];
  const call = <K extends keyof NoorTools>(name: K, ...args: Parameters<NoorTools[K]>): ReturnType<NoorTools[K]> => {
    used.push(name);
    return (tools[name] as (...a: Parameters<NoorTools[K]>) => ReturnType<NoorTools[K]>)(...args);
  };
  const r = t.replies;
  const reply = (intent: Intent, text: string, actions: NoorAction[] = [], locked = false): NoorReply => ({
    intent,
    text,
    locked,
    tools: used,
    actions,
  });
  const link = (key: keyof NoorText["links"], href: string): NoorAction => ({ kind: "link", href, label: t.links[key] });

  const c = classify(message);
  switch (c.intent) {
    case "red_flag":
      call("escalate", c.redFlag!);
      return reply("red_flag", call("get_template", "urgent"), [{ kind: "call", number: "998" }], true);
    case "diagnosis":
      return reply("diagnosis", r.diagnosis, [link("packet", call("draft_packet").href)]);
    case "hide":
      return reply("hide", r.hide, [link("privacy", "privacy")]);
    case "medication":
      return reply("medication", r.medication);
    case "raw_numbers":
      return reply("raw_numbers", r.rawNumbers, [link("packet", call("draft_packet").href)]);
    case "dependence":
      return reply("dependence", r.dependence, [link("family", call("invite_informant").href)]);
    case "help":
      return reply("help", fill(r.help, { name: t.name }));
    case "identity":
      return reply("identity", fill(r.identity, { name: t.name }));
    case "checkin_sleep": {
      const draft: Partial<CheckIn> = c.sleepHours !== undefined ? { sleepHours: c.sleepHours } : { sleepQuality: 2 };
      const text = c.sleepHours !== undefined ? fill(r.sleepHours, { hours: c.sleepHours }) : r.sleepPoor;
      return reply("checkin_sleep", text, [{ kind: "confirm_sleep", draft }]);
    }
    case "reading":
      return reply(
        "reading",
        fill(r.readingConfirm, { type: t.readingTypes[c.reading!.type], value: formatParsed(c.reading!) }),
        [{ kind: "confirm_reading", reading: c.reading! }],
      );
    case "story": {
      const story = call("get_trajectory_summary");
      return reply("story", story ? storyText(story, t.story) : r.noResults);
    }
    case "state": {
      const s = call("get_state");
      if (!s) return reply("state", r.noResults);
      if (s.state === "building") {
        return reply("state", fill(r.building, { done: s.baselineSessions, total: s.baselineNeeded }));
      }
      const body = call("get_template", `state.${s.state}`);
      const locked = s.state === "review" || s.state === "urgent";
      const actions: NoorAction[] = s.state === "urgent" ? [{ kind: "call", number: "998" }] : [];
      if (s.state === "review" || s.state === "watch") actions.push(link("packet", call("draft_packet").href));
      return reply("state", locked ? body : `${r.statePrefix} ${body}`, actions, locked);
    }
    case "plan": {
      const goal = call("get_goal");
      return reply("plan", goal ? fill(r.plan, { title: goal.title, body: goal.body }) : r.planEmpty, [link("plan", "plan")]);
    }
    case "packet":
      return reply("packet", r.packet, [link("packet", call("draft_packet").href)]);
    case "family":
      return reply("family", r.family, [link("family", call("invite_informant").href)]);
    case "schedule": {
      const s = call("get_state");
      if (s?.state === "urgent") return reply("schedule", call("get_template", "urgent"), [{ kind: "call", number: "998" }], true);
      if (s?.nextStep.startsWith("retest")) {
        const slot = call("schedule_retest");
        if (slot) return reply("schedule", fill(r.retest, { date: slot.date }));
      }
      if (s?.state === "review") return reply("schedule", r.scheduleReview, [link("packet", call("draft_packet").href)]);
      return reply("schedule", r.scheduleNormal);
    }
    case "greeting":
      return reply("greeting", fill(r.greeting, { name: t.name }));
    case "thanks":
      return reply("thanks", r.thanks);
    default:
      return reply("unknown", fill(r.unknown, { name: t.name }));
  }
}

// ---------------------------------------------------------------- LLM guard

const BANNED = /diagnos|dementia|alzheimer|impair|abnormal|failed|decline|\bscore|تشخيص|خرف|زهايمر|ضعف ادراكي/i;

function numbers(text: string) {
  return (normalize(text).match(/\d+(?:\.\d+)?/g) ?? []).sort();
}

/**
 * An optional LLM may only restyle an unlocked reply. Reject anything that adds, drops or changes a number,
 * introduces a banned word, mentions a state the template did not, or balloons in length.
 */
export function acceptRephrase(template: string, candidate: string, stateWords: string[]) {
  const c = candidate.trim();
  if (!c || c.length > template.length * 1.6 + 40) return false;
  if (numbers(c).join(",") !== numbers(template).join(",")) return false;
  if (BANNED.test(normalize(c)) && !BANNED.test(normalize(template))) return false;
  const lc = normalize(c);
  const lt = normalize(template);
  return stateWords.every((w) => !lc.includes(normalize(w)) || lt.includes(normalize(w)));
}
