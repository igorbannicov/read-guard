const os = require('os');
const path = require('path');

module.exports = {
  logFile: path.join(os.homedir(), '.claude', 'read-guard', 'log.jsonl'),
  tokens: text => Math.round(text.length / 4),   // rough estimate, the usual ~4 characters per token
};
