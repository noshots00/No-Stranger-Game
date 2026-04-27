export type TelemetryEventName =
  | 'echoes_generated'
  | 'echoes_used_events'
  | 'echoes_used_main_quest'
  | 'chapter_choice_recorded'
  | 'chapter_duplicate_rejected'
  | 'scrying_glimmers_seen'
  | 'tier3_policy_updated'
  | 'ledger_loaded'
  | 'convergence_detected'
  | 'proof_chain_loaded'
  | 'relay_region_seen'
  | 'dead_letter_created'
  | 'echo_scroll_sent'
  | 'forgetting_invoked';

interface TelemetryEvent {
  name: TelemetryEventName;
  timestamp: number;
  payload?: Record<string, string | number | boolean>;
}

const TELEMETRY_STORAGE_KEY = 'nsg:telemetry';
const MAX_TELEMETRY_EVENTS = 200;

export const trackTelemetry = (
  name: TelemetryEventName,
  payload?: Record<string, string | number | boolean>,
): void => {
  try {
    const raw = localStorage.getItem(TELEMETRY_STORAGE_KEY);
    const existing = raw ? JSON.parse(raw) as TelemetryEvent[] : [];
    const next: TelemetryEvent = { name, timestamp: Date.now(), payload };
    const merged = [...existing, next].slice(-MAX_TELEMETRY_EVENTS);
    localStorage.setItem(TELEMETRY_STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // Ignore telemetry failures.
  }
};
