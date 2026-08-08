import fs from 'fs';
import path from 'path';

const root = 'c:/Users/USER/Mokshith/Production/ME/src';

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (/\.(js|jsx)$/.test(ent.name)) acc.push(p);
  }
  return acc;
}

function balanceCalls(source) {
  return source.replace(
    /getUserFacingErrorMessage\(([\s\S]*?)(;\s*$|\n\s*\)|\n\s*;)/gm,
    (match) => {
      // Simpler approach: process line-by-line for known broken patterns
      return match;
    }
  );
}

let fixedFiles = 0;
for (const file of walk(root)) {
  let c = fs.readFileSync(file, 'utf8');
  const orig = c;

  // Broken pattern after naive replace:
  // getUserFacingErrorMessage(err, 'message'
  // );
  // or getUserFacingErrorMessage(err, 'message'\n      );
  c = c.replace(
    /getUserFacingErrorMessage\(([^()]+?),\s*('[^']*'|"[^"]*")\s*\n(\s*)\);/g,
    (m, err, msg, indent) => `getUserFacingErrorMessage(${err}, ${msg})\n${indent});`
  );

  c = c.replace(
    /getUserFacingErrorMessage\(([^()]+?),\s*('[^']*'|"[^"]*")\s*\n(\s*)\)/g,
    (m, err, msg, indent) => `getUserFacingErrorMessage(${err}, ${msg})\n${indent})`
  );

  // Single-line missing paren before semicolon: getUserFacingErrorMessage(x, 'y';
  c = c.replace(
    /getUserFacingErrorMessage\(([^()]+?),\s*('[^']*'|"[^"]*")\s*;/g,
    'getUserFacingErrorMessage($1, $2);'
  );

  // Missing import when function used
  if (c.includes('getUserFacingErrorMessage') && !/from ['"][^'"]*apiResponse['"]/.test(c)) {
    const importPath = path
      .relative(path.dirname(file), path.join(root, 'utils/apiResponse.js'))
      .replace(/\\/g, '/')
      .replace(/\.js$/, '');
    const normalized = importPath.startsWith('.') ? importPath : `./${importPath}`;
    const importLine = `import { getUserFacingErrorMessage } from '${normalized}';\n`;
    if (/^import /m.test(c)) {
      // Prefer merging into existing apiResponse import
      if (/import \{[^}]*\} from ['"][^'"]*apiResponse['"]/.test(c)) {
        c = c.replace(
          /import \{([^}]*)\} from (['"][^'"]*apiResponse['"])/,
          (m, names, from) => {
            if (names.includes('getUserFacingErrorMessage')) return m;
            return `import { ${names.trim().replace(/,$/, '')}, getUserFacingErrorMessage } from ${from}`;
          }
        );
      } else {
        c = c.replace(/^(import .+;\r?\n)/m, `$1${importLine}`);
      }
    } else {
      c = importLine + c;
    }
  }

  // Merge getUserFacing into existing unwrap-only apiResponse imports
  if (
    c.includes('getUserFacingErrorMessage') &&
    /import \{([^}]*)\} from ['"][^'"]*apiResponse['"]/.test(c) &&
    !/import \{[^}]*getUserFacingErrorMessage[^}]*\} from ['"][^'"]*apiResponse['"]/.test(c)
  ) {
    c = c.replace(
      /import \{([^}]*)\} from (['"][^'"]*apiResponse['"])/,
      (m, names, from) =>
        `import { ${names.trim().replace(/,$/, '')}, getUserFacingErrorMessage } from ${from}`
    );
  }

  if (c !== orig) {
    fs.writeFileSync(file, c);
    fixedFiles += 1;
    console.log('fixed', path.relative(root, file));
  }
}

console.log('files', fixedFiles);
