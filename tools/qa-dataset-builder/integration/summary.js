export function buildIntegrationSummary({ environmentRes, builderRes, apiRes, datasetRes, playwrightRes, durationMs }) {
  const ok = environmentRes.ok && builderRes.ok && apiRes.ok && datasetRes.ok && playwrightRes.ok;
  const score = [
    environmentRes.ok ? 20 : 0,
    builderRes.ok ? 20 : 0,
    apiRes.ok ? 20 : 0,
    datasetRes.ok ? 20 : 0,
    playwrightRes.ok ? 20 : 0,
  ].reduce((a,b)=>a+b,0);
  return {
    ok,
    score,
    durationMs,
    components: { environmentRes, builderRes, apiRes, datasetRes, playwrightRes }
  };
}

export default { buildIntegrationSummary };

