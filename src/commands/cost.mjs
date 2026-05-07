import { log, error, success, warn, info, header } from '../ui.mjs';
import { prompt, confirm } from '../ui.mjs';

const PAD = '  ';

export async function runCost(subcommand, _positionals, client) {
  switch (subcommand) {
    case 'status':
      return costStatus(client);
    case 'set':
      return costSet(client);
    default:
      error(`Unknown cost subcommand: ${subcommand}`);
      log(costUsage());
      process.exit(1);
  }
}

export function costUsage() {
  return `
Usage: doriku cost <subcommand>

Subcommands:
  status     Show current daily token usage and cap settings
  set        Configure daily token cap (interactive)
`;
}

async function costStatus(client) {
  const s = await client.get('/governance/cost');

  log('');
  header('Cost Cap Status');
  log('');

  const usedPct = s.daily_token_cap > 0
    ? ((s.daily_tokens_used / s.daily_token_cap) * 100).toFixed(1)
    : null;

  info(`Daily tokens used:  ${s.daily_tokens_used.toLocaleString()}`);
  if (s.daily_token_cap > 0) {
    info(`Daily token cap:    ${s.daily_token_cap.toLocaleString()} (${usedPct}% used)`);
    info(`Alert threshold:    ${s.alert_at_pct > 0 ? `${(s.alert_at_pct * 100).toFixed(0)}%` : 'disabled'}`);
    info(`Hard stop:          ${s.hard_stop ? 'enabled' : 'disabled'}`);
  } else {
    info(`Daily token cap:    unlimited`);
  }
  info(`Resets at:          ${s.reset_at}`);

  log('');
  if (s.hard_stopped) {
    warn('HARD STOPPED — step claims are blocked until cap resets');
  } else if (s.alert_triggered) {
    warn('Alert triggered — usage has exceeded the alert threshold');
  } else {
    info('Status: OK');
  }
  log('');
}

async function costSet(client) {
  header('Configure Cost Cap');
  log('');

  const capRaw = await prompt('Daily token cap (0 for unlimited)');
  const cap = parseInt(capRaw, 10);
  if (isNaN(cap) || cap < 0) {
    error('daily_token_cap must be a non-negative integer');
    process.exit(1);
  }

  let alertAtPct = 0;
  let hardStop = false;

  if (cap > 0) {
    const alertRaw = await prompt('Alert threshold 0.0–1.0 (e.g. 0.8 = 80%, 0 to disable)');
    alertAtPct = parseFloat(alertRaw);
    if (isNaN(alertAtPct) || alertAtPct < 0 || alertAtPct > 1) {
      error('alert_at_pct must be between 0.0 and 1.0');
      process.exit(1);
    }

    hardStop = await confirm('Block step claims when cap is reached (hard stop)?');
  }

  await client.put('/governance/cost', {
    daily_token_cap: cap,
    alert_at_pct: alertAtPct,
    hard_stop: hardStop,
  });

  log('');
  success('Cost cap updated');
  if (cap === 0) {
    info(`Daily cap: unlimited`);
  } else {
    info(`Daily cap: ${cap.toLocaleString()} tokens`);
    info(`Alert at:  ${alertAtPct > 0 ? `${(alertAtPct * 100).toFixed(0)}%` : 'disabled'}`);
    info(`Hard stop: ${hardStop ? 'enabled' : 'disabled'}`);
  }
  log(PAD);
}
