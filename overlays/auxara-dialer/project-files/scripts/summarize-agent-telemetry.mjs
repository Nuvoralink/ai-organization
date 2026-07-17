import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { telemetryDirectory } from './lib/agentTelemetry.mjs';

export function summarizeTelemetry(directory = telemetryDirectory(process.cwd())) {
  const logPath = path.join(directory, 'events.jsonl');
  const summary = {
    eventCount: 0,
    countsByEvent: {},
    completion: { allowed: 0, blocked: 0 },
    subagentReport: { allowed: 0, blocked: 0 },
    sessionDurationsMs: { count: 0, total: 0, min: null, max: null, average: null },
    malformedEventCount: 0,
  };
  if (!existsSync(logPath)) return summary;

  const durations = [];
  for (const line of readFileSync(logPath, 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      summary.malformedEventCount += 1;
      continue;
    }
    if (!event || typeof event.event_name !== 'string') {
      summary.malformedEventCount += 1;
      continue;
    }

    summary.eventCount += 1;
    summary.countsByEvent[event.event_name] = (summary.countsByEvent[event.event_name] ?? 0) + 1;
    if (event.event_name === 'Malformed') {
      summary.malformedEventCount +=
        Number.isInteger(event.malformed_count) && event.malformed_count >= 0
          ? event.malformed_count
          : 1;
    }
    if (event.event_name === 'TaskCompleted' && event.outcome === 'allow')
      summary.completion.allowed += 1;
    if (event.event_name === 'TaskCompleted' && event.outcome === 'block')
      summary.completion.blocked += 1;
    if (event.event_name === 'SubagentStop' && event.outcome === 'allow') {
      summary.subagentReport.allowed += 1;
    }
    if (event.event_name === 'SubagentStop' && event.outcome === 'block') {
      summary.subagentReport.blocked += 1;
    }
    if (
      event.event_name === 'SessionEnd' &&
      Number.isInteger(event.duration_ms) &&
      event.duration_ms >= 0
    ) {
      durations.push(event.duration_ms);
    }
  }

  if (durations.length > 0) {
    const total = durations.reduce((sum, duration) => sum + duration, 0);
    summary.sessionDurationsMs = {
      count: durations.length,
      total,
      min: Math.min(...durations),
      max: Math.max(...durations),
      average: Math.round(total / durations.length),
    };
  }
  return summary;
}

export function formatTelemetrySummary(summary) {
  const eventCounts = Object.entries(summary.countsByEvent)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([event, count]) => `${event}=${count}`)
    .join(', ');
  const duration = summary.sessionDurationsMs;
  return [
    `events: ${summary.eventCount}${eventCounts ? ` (${eventCounts})` : ''}`,
    `completion: allowed ${summary.completion.allowed}, blocked ${summary.completion.blocked}`,
    `subagent report: allowed ${summary.subagentReport.allowed}, rework blocks ${summary.subagentReport.blocked}`,
    `session durations: count ${duration.count}, min ${duration.min ?? '-'}ms, average ${
      duration.average ?? '-'
    }ms, max ${duration.max ?? '-'}ms`,
    `malformed events: ${summary.malformedEventCount}`,
  ].join('\n');
}

const summary = summarizeTelemetry();
if (process.argv.includes('--json')) {
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
} else {
  process.stdout.write(`${formatTelemetrySummary(summary)}\n`);
}
