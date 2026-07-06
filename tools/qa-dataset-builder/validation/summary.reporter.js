import fs from 'fs';
import path from 'path';

export async function writeValidationSummary({ summary, config, logger }) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = config.logsDir;
  try {
    fs.mkdirSync(outDir, { recursive: true });
    const jsonPath = path.join(outDir, `validation-summary-${ts}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2), 'utf8');
    const mdPath = path.join(outDir, `validation-summary-${ts}.md`);
    const md = buildMarkdown(summary);
    fs.writeFileSync(mdPath, md, 'utf8');
    logger?.info(`Validation summary written: ${jsonPath}`);
    return { jsonPath, mdPath };
  } catch (err) {
    logger?.error('writeValidationSummary failed', err.message);
    return null;
  }
}

function buildMarkdown(summary) {
  const lines = [];
  lines.push(`# Validation Summary - ${summary.meta?.runAt || ''}`);
  lines.push(`Environment: ${summary.meta?.environment || ''}`);
  lines.push(`Target DB: ${summary.meta?.targetDatabase || ''}`);
  lines.push('');
  for (const cat of Object.keys(summary.results || {})) {
    lines.push(`## ${cat}`);
    lines.push('```json');
    lines.push(JSON.stringify(summary.results[cat], null, 2));
    lines.push('```');
  }
  lines.push('');
  lines.push(`Score: ${summary.score || 0}`);
  return lines.join('\n');
}

export default { writeValidationSummary };

