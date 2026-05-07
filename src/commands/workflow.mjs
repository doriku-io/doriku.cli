import { log, error, success, warn, info, header } from '../ui.mjs';
import { prompt } from '../ui.mjs';

const PAD = '  ';

function fmt(val, width) {
  const s = String(val ?? '');
  return s.length > width ? s.slice(0, width - 1) + '…' : s.padEnd(width);
}

function fmtDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString();
}

function separator(width) {
  return '─'.repeat(width);
}

export async function runWorkflow(subcommand, positionals, client) {
  switch (subcommand) {
    case 'list':
      return workflowList(client);
    case 'run':
      return workflowRun(positionals[0], client);
    case 'status':
      return workflowStatus(positionals[0], client);
    case 'logs':
      return workflowLogs(positionals[0], client);
    case 'cancel':
      return workflowCancel(positionals[0], client);
    default:
      error(`Unknown workflow subcommand: ${subcommand}`);
      log(workflowUsage());
      process.exit(1);
  }
}

export function workflowUsage() {
  return `
Usage: doriku workflow <subcommand> [args]

Subcommands:
  list                   List all workflow definitions
  run <slug>             Start a workflow run by slug
  status <runId>         Show run status
  logs <runId>           Show step-level timeline for a run
  cancel <runId>         Cancel an in-progress run
`;
}

async function workflowList(client) {
  const data = await client.get('/workflows');
  const workflows = data.workflows ?? [];

  if (workflows.length === 0) {
    info('No workflows defined yet.');
    info('Define one via MCP: doriku_workflow define');
    return;
  }

  log('');
  log(PAD + [
    fmt('ID',      36),
    fmt('NAME',    22),
    fmt('SLUG',    22),
    fmt('STEPS',    6),
    fmt('ENABLED',  7),
  ].join('  '));
  log(PAD + separator(99));

  for (const wf of workflows) {
    const steps = wf.spec?.steps?.length ?? 0;
    log(PAD + [
      fmt(wf.id,      36),
      fmt(wf.name,    22),
      fmt(wf.slug,    22),
      fmt(steps,       6),
      fmt(wf.enabled ? 'yes' : 'no', 7),
    ].join('  '));
  }
  log('');
  info(`${data.total ?? workflows.length} workflow(s) total`);
}

async function workflowRun(slug, client) {
  if (!slug) {
    error('slug is required: doriku workflow run <slug>');
    process.exit(1);
  }

  // find by slug in list
  const data = await client.get('/workflows?limit=200');
  const wf = (data.workflows ?? []).find(w => w.slug === slug);
  if (!wf) {
    error(`Workflow not found: ${slug}`);
    process.exit(1);
  }
  if (!wf.enabled) {
    warn(`Workflow '${slug}' is disabled. Enable it first.`);
    process.exit(1);
  }

  const run = await client.post(`/workflows/${wf.id}/runs`, { inputs: {}, trigger_payload: {} });
  success(`Workflow run started`);
  log('');
  info(`Run ID:    ${run.id}`);
  info(`Workflow:  ${wf.name} (${wf.slug})`);
  info(`Status:    ${run.status}`);
  info(`Trigger:   ${run.trigger_type}`);
  log('');
  info(`Track progress: doriku workflow status ${run.id}`);
}

async function workflowStatus(runId, client) {
  if (!runId) {
    error('runId is required: doriku workflow status <runId>');
    process.exit(1);
  }

  const data = await client.get(`/workflows/runs/${runId}`);
  const run = data.run;
  const steps = data.steps ?? [];

  log('');
  header(`Workflow Run`);
  log('');
  info(`Run ID:      ${run.id}`);
  info(`Workflow ID: ${run.workflow_id}`);
  info(`Status:      ${run.status}`);
  info(`Trigger:     ${run.trigger_type}`);
  if (run.current_step_id) info(`Current step: ${run.current_step_id}`);
  info(`Started:     ${fmtDate(run.started_at)}`);
  if (run.completed_at) info(`Completed:   ${fmtDate(run.completed_at)}`);
  if (run.error) warn(`Error:       ${run.error}`);

  if (steps.length > 0) {
    log('');
    log(PAD + [
      fmt('STEP',     20),
      fmt('STATUS',   10),
      fmt('ATTEMPT',   7),
      fmt('STARTED',  22),
      fmt('COMPLETED', 22),
    ].join('  '));
    log(PAD + separator(85));
    for (const s of steps) {
      log(PAD + [
        fmt(s.step_id,    20),
        fmt(s.status,     10),
        fmt(s.attempt,     7),
        fmt(fmtDate(s.started_at),   22),
        fmt(fmtDate(s.completed_at), 22),
      ].join('  '));
    }
  }
  log('');
}

async function workflowLogs(runId, client) {
  if (!runId) {
    error('runId is required: doriku workflow logs <runId>');
    process.exit(1);
  }

  const data = await client.get(`/workflows/runs/${runId}/steps`);
  const steps = data.steps ?? [];

  if (steps.length === 0) {
    info('No step runs found for this run.');
    return;
  }

  log('');
  log(PAD + [
    fmt('STEP',      20),
    fmt('STATUS',    10),
    fmt('AGENT',     36),
    fmt('ATT',        4),
    fmt('STARTED',   22),
    fmt('COMPLETED', 22),
  ].join('  '));
  log(PAD + separator(118));

  for (const s of steps) {
    log(PAD + [
      fmt(s.step_id,           20),
      fmt(s.status,            10),
      fmt(s.assigned_agent ?? s.agent_selector, 36),
      fmt(s.attempt,            4),
      fmt(fmtDate(s.started_at),   22),
      fmt(fmtDate(s.completed_at), 22),
    ].join('  '));
    if (s.error) warn(`  Error: ${s.error}`);
  }
  log('');
  info(`${steps.length} step run(s)`);
}

async function workflowCancel(runId, client) {
  if (!runId) {
    error('runId is required: doriku workflow cancel <runId>');
    process.exit(1);
  }

  await client.post(`/workflows/runs/${runId}/cancel`, {});
  success(`Run ${runId} cancelled`);
}
