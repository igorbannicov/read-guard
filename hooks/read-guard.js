// PreToolUse(Read): don't read big text files whole. Over READ_GUARD_LINES lines (default 400) without offset/limit
// the read is denied with a hint: find the place with Grep -n and read that part, or ask the Explore agent.
const fs = require('fs');
const path = require('path');

const limit = Number(process.env.READ_GUARD_LINES) || 400;
const skip = /\.(png|jpe?g|gif|webp|bmp|ico|pdf|ipynb)$/i;

let input = '';
process.stdin.on('data', d => (input += d));
process.stdin.on('end', () => {
  const args = JSON.parse(input).tool_input || {};
  const file = args.file_path;
  if (!file || args.offset || args.limit || skip.test(file)) return;
  let lines = 0;
  try {
    const buf = fs.readFileSync(file);
    for (const b of buf) if (b === 10) lines++;
  } catch { return; }
  if (lines <= limit) return;
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason:
        `${path.basename(file)} has ${lines} lines, more than ${limit}: don't read it whole. ` +
        `Find the place with Grep (-n) and read just that part with offset/limit. ` +
        `To understand the whole file, ask the Explore agent for a summary instead. ` +
        `If the whole file is really needed, read it in parts with offset/limit.`,
    },
  }));
});
