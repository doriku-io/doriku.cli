#!/usr/bin/env bash
set -uo pipefail
trap 'exit 0' ERR

if ! command -v jq &>/dev/null; then
  echo "doriku hook: jq is required but not installed" >&2
  exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/sync-doriku.env"

mkdir -p "${DORIKU_MAPPING_DIR}"

INPUT="$(cat)"

HOOK_EVENT="$(echo "$INPUT" | jq -r '.hook_event_name // empty')"
TOOL_NAME="$(echo "$INPUT" | jq -r '.tool_name // empty')"
SESSION_ID="$(echo "$INPUT" | jq -r '.session_id // empty')"

if [[ -z "$SESSION_ID" ]]; then
  exit 0
fi

MAPPING_FILE="${DORIKU_MAPPING_DIR}/${SESSION_ID}.json"

if [[ ! -f "$MAPPING_FILE" ]]; then
  echo '{"mappings":{}}' > "$MAPPING_FILE"
fi

get_doriku_id() {
  local task_id="$1"
  jq -r --arg id "$task_id" '.mappings[$id] // empty' "$MAPPING_FILE"
}

save_mapping() {
  local task_id="$1"
  local doriku_id="$2"
  local tmp
  tmp="$(mktemp)"
  jq --arg tid "$task_id" --arg did "$doriku_id" '.mappings[$tid] = $did' "$MAPPING_FILE" > "$tmp" && mv "$tmp" "$MAPPING_FILE"
}

map_status() {
  local status="$1"
  case "$status" in
    pending)     echo "pending" ;;
    in_progress) echo "running" ;;
    completed)   echo "completed" ;;
    deleted)     echo "cancelled" ;;
    *)           echo "pending" ;;
  esac
}

doriku_create_task() {
  local subject="$1"
  local description="${2:-}"

  local response
  response="$(curl -s --max-time 5 --connect-timeout 3 \
    -X POST "${DORIKU_API_BASE}/tasks" \
    -H "Authorization: Bearer ${DORIKU_API_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$(jq -n --arg t "$subject" --arg d "$description" '{title: $t, description: $d, status: "pending"}')" 2>/dev/null)" || return 0

  echo "$response" | jq -r '.id // .data.id // empty' 2>/dev/null
}

doriku_update_task() {
  local doriku_id="$1"
  local status="$2"

  curl -s --max-time 5 --connect-timeout 3 \
    -X PUT "${DORIKU_API_BASE}/tasks/${doriku_id}" \
    -H "Authorization: Bearer ${DORIKU_API_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$(jq -n --arg s "$status" '{status: $s}')" >/dev/null 2>&1 || true
}

doriku_log_task() {
  local doriku_id="$1"
  local message="$2"

  curl -s --max-time 5 --connect-timeout 3 \
    -X POST "${DORIKU_API_BASE}/tasks/${doriku_id}/log" \
    -H "Authorization: Bearer ${DORIKU_API_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$(jq -n --arg m "$message" '{message: $m}')" >/dev/null 2>&1 || true
}

handle_task_create() {
  local subject description task_id doriku_id

  subject="$(echo "$INPUT" | jq -r '.tool_input.subject // empty')"
  description="$(echo "$INPUT" | jq -r '.tool_input.description // empty')"
  task_id="$(echo "$INPUT" | jq -r '.tool_result.id // .tool_result.taskId // empty')"

  if [[ -z "$subject" ]]; then
    exit 0
  fi

  doriku_id="$(doriku_create_task "$subject" "$description")"

  if [[ -n "$doriku_id" && "$doriku_id" != "null" ]]; then
    if [[ -n "$task_id" ]]; then
      save_mapping "$task_id" "$doriku_id"
    fi
    doriku_log_task "$doriku_id" "Task created via Claude Code hook (session: ${SESSION_ID})"
  fi
}

handle_task_update() {
  local task_id status doriku_status doriku_id

  task_id="$(echo "$INPUT" | jq -r '.tool_input.taskId // empty')"
  status="$(echo "$INPUT" | jq -r '.tool_input.status // empty')"

  if [[ -z "$task_id" ]]; then
    exit 0
  fi

  doriku_id="$(get_doriku_id "$task_id")"

  if [[ -z "$doriku_id" ]]; then
    exit 0
  fi

  if [[ -n "$status" ]]; then
    doriku_status="$(map_status "$status")"
    doriku_update_task "$doriku_id" "$doriku_status"
    doriku_log_task "$doriku_id" "Status changed to '${status}' via Claude Code hook"
  fi
}

handle_task_completed() {
  local task_id doriku_id

  task_id="$(echo "$INPUT" | jq -r '.task_id // .taskId // empty')"

  if [[ -z "$task_id" ]]; then
    exit 0
  fi

  doriku_id="$(get_doriku_id "$task_id")"

  if [[ -z "$doriku_id" ]]; then
    exit 0
  fi

  doriku_update_task "$doriku_id" "completed"
  doriku_log_task "$doriku_id" "Task completed via Claude Code hook"
}

case "${HOOK_EVENT}:${TOOL_NAME}" in
  PostToolUse:TaskCreate)
    handle_task_create
    ;;
  PostToolUse:TaskUpdate)
    handle_task_update
    ;;
  TaskCompleted:*)
    handle_task_completed
    ;;
esac

exit 0
