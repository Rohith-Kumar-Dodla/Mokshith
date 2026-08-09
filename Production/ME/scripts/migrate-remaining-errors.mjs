import fs from 'fs';
import path from 'path';

const root = 'c:/Users/USER/Mokshith/Production/ME/src';
const targets = [
  'pages/Admin/Support.jsx',
  'pages/Vendor/Support.jsx',
  'pages/SuperAdmin/SystemSettings.jsx',
  'pages/SuperAdmin/StaffOnboarding.jsx',
];

for (const rel of targets) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) {
    console.log('missing', rel);
    continue;
  }
  let c = fs.readFileSync(file, 'utf8');
  const orig = c;
  c = c.replace(
    /(\w+)\?\.response\?\.data\?\.message\s*\|\|\s*\1\.message\s*\|\|\s*/g,
    'getUserFacingErrorMessage($1, '
  );
  c = c.replace(
    /(\w+)\?\.response\?\.data\?\.message\s*\|\|\s*\1\?\.message\s*\|\|\s*/g,
    'getUserFacingErrorMessage($1, '
  );
  if (c !== orig && !/from ['"][^'"]*apiResponse['"]/.test(c)) {
    const importPath = path
      .relative(path.dirname(file), path.join(root, 'utils/apiResponse.js'))
      .replace(/\\/g, '/')
      .replace(/\.js$/, '');
    const importLine = `import { getUserFacingErrorMessage } from '${importPath.startsWith('.') ? importPath : `./${importPath}`}';\n`;
    c = c.replace(/^(import .+;\r?\n)/m, `$1${importLine}`);
  }
  if (c !== orig) {
    fs.writeFileSync(file, c);
    console.log('updated', rel);
  } else {
    console.log('nochange', rel);
  }
}
