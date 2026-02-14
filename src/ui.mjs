import * as readline from 'node:readline';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const MAGENTA = '\x1b[35m';

export function log(msg) {
  console.log(msg);
}

export function info(msg) {
  console.log(`${CYAN}i${RESET} ${msg}`);
}

export function success(msg) {
  console.log(`${GREEN}\u2713${RESET} ${msg}`);
}

export function warn(msg) {
  console.log(`${YELLOW}\u26A0${RESET} ${msg}`);
}

export function error(msg) {
  console.error(`${RED}\u2717${RESET} ${msg}`);
}

export function header(msg) {
  console.log(`\n${BOLD}${MAGENTA}${msg}${RESET}`);
}

export function step(num, total, msg) {
  console.log(`\n${DIM}[${num}/${total}]${RESET} ${BOLD}${msg}${RESET}`);
}

export async function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(`${CYAN}?${RESET} ${question} `, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

export async function confirm(question) {
  const answer = await prompt(`${question} (Y/n)`);
  return answer === '' || answer.toLowerCase().startsWith('y');
}
