import { log, error, success, info, header } from '../ui.mjs';
import { prompt } from '../ui.mjs';

const PAD = '  ';

function fmt(val, width) {
  const s = String(val ?? '');
  return s.length > width ? s.slice(0, width - 1) + '…' : s.padEnd(width);
}

function separator(width) {
  return '─'.repeat(width);
}

export async function runLock(subcommand, _positionals, client) {
  switch (subcommand) {
    case 'list':
      return lockList(client);
    case 'policy':
      return lockPolicy(client);
    default:
      error(`Unknown lock subcommand: ${subcommand}`);
      log(lockUsage());
      process.exit(1);
  }
}

export function lockUsage() {
  return `
Usage: doriku lock <subcommand>

Subcommands:
  list       List all file-lock policies
  policy     Define a new file-lock policy (interactive)
`;
}

async function lockList(client) {
  const data = await client.get('/governance/locks');
  const policies = data.policies ?? [];

  if (policies.length === 0) {
    info('No lock policies defined.');
    info('Define one: doriku lock policy');
    return;
  }

  log('');
  log(PAD + [
    fmt('ID',      36),
    fmt('PATTERN', 28),
    fmt('POLICY',  12),
    fmt('AGENTS',  30),
  ].join('  '));
  log(PAD + separator(110));

  for (const p of policies) {
    const agents = p.applies_to_agents?.length > 0 ? p.applies_to_agents.join(', ') : '(all agents)';
    log(PAD + [
      fmt(p.id,          36),
      fmt(p.path_pattern, 28),
      fmt(p.policy,       12),
      fmt(agents,         30),
    ].join('  '));
  }
  log('');
  info(`${policies.length} policy(ies) total`);
}

async function lockPolicy(client) {
  header('Define File-Lock Policy');
  log('');

  const pathPattern = await prompt('Path pattern (e.g. src/auth/**)');
  if (!pathPattern) {
    error('Path pattern is required.');
    process.exit(1);
  }

  const policyRaw = await prompt('Policy [exclusive/shared/advisory/deny] (default: exclusive)');
  const policy = policyRaw.trim() || 'exclusive';
  const validPolicies = ['exclusive', 'shared', 'advisory', 'deny'];
  if (!validPolicies.includes(policy)) {
    error(`Invalid policy. Must be one of: ${validPolicies.join(', ')}`);
    process.exit(1);
  }

  const agentsRaw = await prompt('Apply to agent capabilities (comma-separated, empty for all)');
  const appliesToAgents = agentsRaw
    ? agentsRaw.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const p = await client.post('/governance/locks', {
    path_pattern: pathPattern,
    policy,
    applies_to_agents: appliesToAgents,
  });

  log('');
  success('Lock policy created');
  info(`ID:       ${p.id}`);
  info(`Pattern:  ${p.path_pattern}`);
  info(`Policy:   ${p.policy}`);
  info(`Agents:   ${p.applies_to_agents?.length > 0 ? p.applies_to_agents.join(', ') : '(all)'}`);
}
