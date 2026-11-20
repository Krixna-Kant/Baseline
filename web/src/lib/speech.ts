"use client";

export function canSpeak() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function voiceFor(lang: "ar" | "en") {
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => v.lang.toLowerCase().startsWith(lang));
}

export function hasVoice(lang: "ar" | "en") {
  return canSpeak() && Boolean(voiceFor(lang));
}

export function speak(text: string, lang: "ar" | "en", onEnd?: () => void) {
  if (!canSpeak()) {
    onEnd?.();
    return false;
  }
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === "ar" ? "ar-SA" : "en-US";
  const voice = voiceFor(lang);
  if (voice) u.voice = voice;
  u.rate = 0.9;
  u.onend = () => onEnd?.();
  u.onerror = () => onEnd?.();
  synth.speak(u);
  return true;
}

export function stopSpeaking() {
  if (canSpeak()) window.speechSynthesis.cancel();
}

interface Recognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}

function recognitionCtor(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as (new () => Recognition) | null;
}

export function canListen() {
  return recognitionCtor() !== null;
}

/** One utterance → transcript. Returns a stop function. */
export function listenOnce(lang: "ar" | "en", onText: (text: string) => void, onEnd: () => void) {
  const Ctor = recognitionCtor();
  if (!Ctor) {
    onEnd();
    return () => {};
  }
  const rec = new Ctor();
  rec.lang = lang === "ar" ? "ar-AE" : "en-US";
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  rec.onresult = (e) => onText(e.results[0]?.[0]?.transcript ?? "");
  rec.onend = onEnd;
  rec.onerror = onEnd;
  rec.start();
  return () => rec.stop();
}
