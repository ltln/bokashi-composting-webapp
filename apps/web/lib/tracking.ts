/**
 * Tracking client: STABLE PUBLIC API. Call it from any milestone now.
 *
 *   track("page_view");
 *   track("switch_tab", "Tab_2_FAQ");
 *   track(EventType.View3DStep, FeatureTarget.SetupLayer1);
 *
 * Never hand-type strings outside the generated unions; import constants from
 * "@bokashi/contracts/events" when convenient. Never call it on /login.
 *
 * M0: no-op. M5 implements the anonymous session id, the in-memory queue
 * (flush every 3 s or at 10 events), sendBeacon on visibilitychange and
 * localStorage retry, without changing this signature.
 */
import type { EventType, FeatureTarget } from "@bokashi/contracts/events";

export type { EventType, FeatureTarget };

export function track(eventType: EventType, featureTarget?: FeatureTarget): void {
  void eventType;
  void featureTarget;
}
