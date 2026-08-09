import fs from 'fs';
import path from 'path';

const root = 'c:/Users/USER/Mokshith/Production/ME/src';
const files = [];

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (/\.(js|jsx)$/.test(ent.name)) files.push(p);
  }
}

walk(root);

const skip = new Set([
  path.normalize(path.join(root, 'utils/apiResponse.js')),
  path.normalize(path.join(root, 'utils/loginErrorMapper.js')),
  path.normalize(path.join(root, 'utils/orderReconciliation.js')),
]);

let changed = 0;

for (const file of files) {
  if (skip.has(path.normalize(file))) continue;

  let c = fs.readFileSync(file, 'utf8');
  const orig = c;

  c = c.replace(
    /const getErrorMessage = \(error, fallback\) =>\s*\r?\n?\s*error\?\.response\?\.data\?\.message \|\| error\?\.message \|\| fallback;\r?\n*/g,
    ''
  );
  c = c.replace(
    /const getErrorMessage = \(error, fallback\) =>\s*error\?\.response\?\.data\?\.message \|\| error\?\.message \|\| fallback;\r?\n*/g,
    ''
  );

  c = c.replace(
    /(\w+)\?\.response\?\.data\?\.message\s*\|\|\s*\1\?\.message\s*\|\|\s*/g,
    'getUserFacingErrorMessage($1, '
  );
  c = c.replace(
    /(\w+)\?\.response\?\.data\?\.message\s*\|\|\s*\1\.message\s*\|\|\s*/g,
    'getUserFacingErrorMessage($1, '
  );
  c = c.replace(/\bgetErrorMessage\(/g, 'getUserFacingErrorMessage(');

  if (c === orig) continue;

  if (c.includes('getUserFacingErrorMessage') && !/from ['"][^'"]*apiResponse['"]/.test(c)) {
    const importPath = path
      .relative(path.dirname(file), path.join(root, 'utils/apiResponse.js'))
      .replace(/\\/g, '/')
      .replace(/\.js$/, '');
    const normalized = importPath.startsWith('.') ? importPath : `./${importPath}`;
    const importLine = `import { getUserFacingErrorMessage } from '${normalized}';\n`;
    if (/^import /m.test(c)) {
      c = c.replace(/^(import .+;\r?\n)/m, `$1${importLine}`);
    } else {
      c = importLine + c;
    }
  }

  fs.writeFileSync(file, c);
  changed += 1;
  console.log('updated', path.relative(root, file));
}

console.log('total', changed);
