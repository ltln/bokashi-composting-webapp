"use client";

import { useEffect } from "react";
import { EventType } from "@bokashi/contracts/events";
import { track } from "@/lib/tracking";

// Module scope, so the event fires once per app load: not again on client-side
// navigation, on a remount of the (app) layout, or on StrictMode's double effect.
let sent = false;

/** Logs `page_view` once per app load. Mounted only in the (app) layout, so never on /login. */
export function PageViewTracker() {
  useEffect(() => {
    if (sent) return;
    sent = true;
    track(EventType.PageView);
  }, []);
  return null;
}
