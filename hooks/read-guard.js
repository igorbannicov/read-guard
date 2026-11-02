// PreToolUse(Read): don't read big text files whole. Over READ_GUARD_LINES lines (default 400) without offset/limit
// the read is denied with a hint: find the place with Grep -n and read that part, or ask the Explore agent.
// For the stats every denied read and every later partial read of that file in the same session go to log.jsonl.
const fs = require('fs');
const path = require('path');
const { logFile, tokens } = require('./common');

const limit = Number(process.env.READ_GUARD_LINES) || 400;
const skip = /\.(png|jpe?g|gif|webp|bmp|ico|pdf|ipynb)$/i;

function log(entry) {
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  fs.appendFileSync(logFile, JSON.stringify({ t: Date.now(), ...entry }) + '\n');
}

function blockedBefore(session, file) {
  try {
    return fs.readFileSync(logFile, 'utf8').split('\n')
      .some(l => l.includes('"blocked"') && l.includes(session) && JSON.parse(l).file === file);
  } catch { return false; }
}

let input = '';
process.stdin.on('data', d => (input += d));
process.stdin.on('end', () => {
  const { session_id: session, tool_input: args = {} } = JSON.parse(input);
  const file = args.file_path;
  if (!file || skip.test(file)) return;
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { return; }
  const lines = text.split('\n');

  if (args.offset || args.limit) {
    if (!blockedBefore(session, file)) return;
    const start = Math.max((args.offset || 1) - 1, 0);
    log({ kind: 'part', session, file, tokens: tokens(lines.slice(start, start + (args.limit || 2000)).join('\n')) });
    return;
  }

  if (lines.length - 1 <= limit) return;
  log({ kind: 'blocked', session, file, tokens: tokens(text) });
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason:
        `${path.basename(file)} has ${lines.length - 1} lines, more than ${limit}: don't read it whole. ` +
        `Find the place with Grep (-n) and read just that part with offset/limit. ` +
        `To understand the whole file, ask the Explore agent for a summary instead. ` +
        `If the whole file is really needed, read it in parts with offset/limit.`,
    },
  }));
});
