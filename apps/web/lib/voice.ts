"use client";

import { useSyncExternalStore } from "react";

let voiceMuted = false;
const listeners = new Set<() => void>();

function getSnapshot(): boolean {
  return voiceMuted;
}

function getServerSnapshot(): boolean {
  return false;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Sets global voiceover mute state and notifies all listeners. */
export function setVoiceMuted(muted: boolean): void {
  if (voiceMuted === muted) return;
  voiceMuted = muted;
  for (const listener of listeners) {
    listener();
  }
}

/** Toggles global voiceover mute state. */
export function toggleVoiceMuted(): void {
  setVoiceMuted(!voiceMuted);
}

/** Subscribes to global voiceover mute state across player instances. */
export function useVoiceMuted(): {
  muted: boolean;
  setVoiceMuted: (muted: boolean) => void;
  toggleVoiceMuted: () => void;
} {
  const muted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { muted, setVoiceMuted, toggleVoiceMuted };
}
