#!/usr/bin/env node
import { inspectDatabase } from '../../src/utils/migration/inspector.js';
import { compareDatabases } from '../../src/utils/migration/comparer.js';

function usage() {
  console.log('Usage: node scripts/migration/preview.js --source "<MONGO_URI>" --dest "<MONGO_URI>"');
  console.log('Or set MIGRATION_SOURCE_URI and MIGRATION_DEST_URI environment variables.');
}

function getArg(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  return process.argv[idx + 1];
}

async function main() {
  const src = getArg('--source') || process.env.MIGRATION_SOURCE_URI;
  const dst = getArg('--dest') || process.env.MIGRATION_DEST_URI;
  if (!src || !dst) {
    usage();
    process.exit(2);
  }

  console.log('Migration Preview (DRY RUN) — Inspecting databases (read-only)');
  console.log(`Source: ${src}`);
  console.log(`Dest  : ${dst}`);

  try {
    const [srcInfo, dstInfo] = await Promise.all([inspectDatabase(src), inspectDatabase(dst)]);

    console.log('--- Source Summary ---');
    console.log(`DB: ${srcInfo.dbName}`);
    console.log(`Collections: ${srcInfo.totalCollections}`);
    console.log(`Documents (approx): ${srcInfo.totalDocuments}`);

    console.log('--- Dest Summary ---');
    console.log(`DB: ${dstInfo.dbName}`);
    console.log(`Collections: ${dstInfo.totalCollections}`);
    console.log(`Documents (approx): ${dstInfo.totalDocuments}`);

    const report = compareDatabases(srcInfo, dstInfo);

    console.log('--- Comparison ---');
    console.log(`Collections only in source: ${report.onlyInSource.length}`);
    report.onlyInSource.slice(0, 50).forEach((c) => console.log(`  - ${c.name} (srcCount=${c.srcCount})`));
    console.log(`Collections only in dest: ${report.onlyInDest.length}`);
    report.onlyInDest.slice(0, 50).forEach((c) => console.log(`  - ${c.name} (dstCount=${c.dstCount})`));
    console.log(`Collections in both: ${report.inBoth.length}`);
    report.inBoth.slice(0, 50).forEach((c) => {
      const diff = c.srcCount - c.dstCount;
      console.log(`  - ${c.name} src=${c.srcCount} dst=${c.dstCount} diff=${diff}`);
      if (c.indexDiffs && (c.indexDiffs.onlyInSrc.length || c.indexDiffs.onlyInDst.length)) {
        console.log('    Index differences:');
        c.indexDiffs.onlyInSrc.forEach((i) => console.log(`      + index only in src: ${i.name} ${i.key}`));
        c.indexDiffs.onlyInDst.forEach((i) => console.log(`      + index only in dst: ${i.name} ${i.key}`));
      }
    });

    console.log('--- Summary ---');
    console.log(`Source collections: ${report.summary.srcCollections}`);
    console.log(`Dest collections  : ${report.summary.dstCollections}`);
    console.log(`Source documents  : ${report.summary.srcDocuments}`);
    console.log(`Dest documents    : ${report.summary.dstDocuments}`);

    const readiness = (report.onlyInSource.length === 0) ? 'Ready' : 'Not Ready (mismatched collections)';
    console.log('--- Migration Preview Result ---');
    console.log(`Result: ${readiness}`);
    process.exit(0);
  } catch (err) {
    console.error('Preview failed:', err.message || err);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

