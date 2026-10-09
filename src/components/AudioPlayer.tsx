import React, { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

export function speakText(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-IN";
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

export function AudioButton({ text, className = "" }: { text: string; className?: string }) {
  const [playing, setPlaying] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 0.9;
    setPlaying(true);

    utterance.onend = () => setPlaying(false);
    utterance.onerror = () => setPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={`Listen to pronunciation of "${text}"`}
      className={`inline-flex items-center justify-center p-1.5 rounded-full text-primary hover:bg-primary/10 transition-colors ${className}`}
    >
      {playing ? <VolumeX className="w-4 h-4 animate-pulse" /> : <Volume2 className="w-4 h-4" />}
    </button>
  );
}
