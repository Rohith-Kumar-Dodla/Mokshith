export function compareDatabases(src, dst) {
  const srcCols = new Map(src.collections.map((c) => [c.name, c]));
  const dstCols = new Map(dst.collections.map((c) => [c.name, c]));

  const onlyInSource = [];
  const onlyInDest = [];
  const inBoth = [];

  for (const [name, sCol] of srcCols) {
    if (!dstCols.has(name)) {
      onlyInSource.push({ name, srcCount: sCol.count });
    } else {
      const dCol = dstCols.get(name);
      const indexDiffs = diffIndexes(sCol.indexes || [], dCol.indexes || []);
      inBoth.push({
        name,
        srcCount: sCol.count,
        dstCount: dCol.count,
        indexDiffs,
      });
      dstCols.delete(name);
    }
  }

  for (const [name, dCol] of dstCols) {
    onlyInDest.push({ name, dstCount: dCol.count });
  }

  return {
    onlyInSource,
    onlyInDest,
    inBoth,
    summary: {
      srcCollections: src.totalCollections,
      dstCollections: dst.totalCollections,
      srcDocuments: src.totalDocuments,
      dstDocuments: dst.totalDocuments,
    },
  };
}

function normalizeIndex(idx) {
  return {
    name: idx.name,
    key: JSON.stringify(idx.key || {}),
    unique: !!idx.unique,
  };
}

function diffIndexes(srcIdxs, dstIdxs) {
  const s = (srcIdxs || []).map(normalizeIndex);
  const d = (dstIdxs || []).map(normalizeIndex);
  const onlyInSrc = s.filter((si) => !d.some((di) => di.name === si.name && di.key === si.key && di.unique === si.unique));
  const onlyInDst = d.filter((di) => !s.some((si) => si.name === di.name && si.key === di.key && si.unique === di.unique));
  return { onlyInSrc, onlyInDst };
}

export default { compareDatabases };

