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
