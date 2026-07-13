import fs from 'fs';
import path from 'path';

export function createLogger({ logsDir, verbose = false, repoRoot = null } = {}) {
  const filename = `qa-builder-${new Date().toISOString().replace(/[:.]/g, '-')}.log`;
  const logFile = path.join(logsDir, filename);

  function write(level, ...args) {
    const line = `[${new Date().toISOString()}] [${level}] ${args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')}\n`;
    try {
      fs.appendFileSync(logFile, line, { encoding: 'utf8' });
    } catch {}
    if (verbose || level !== 'DEBUG') {
      // Console output trimmed for readability
      console.log(line.trim());
    }
  }

  return {
    info: (...args) => write('INFO', ...args),
    warn: (...args) => write('WARN', ...args),
    error: (...args) => write('ERROR', ...args),
    debug: (...args) => write('DEBUG', ...args),
    logFile,
    logsDir,
    repoRoot,
  };
}

