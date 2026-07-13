(async ()=>{
  try {
    const pw = await import('playwright');
    const browser = await pw.chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    const requests = [];
    const responses = [];
    const consoleLogs = [];
    const pageErrors = [];

    page.on('request', r => {
      requests.push({ url: r.url(), method: r.method(), timestamp: Date.now() });
    });
    page.on('response', async r => {
      let body = '';
      try { body = await r.text(); } catch(e) { body = '[body read error]'; }
      responses.push({ url: r.url(), status: r.status(), body: body.slice(0,2000), timestamp: Date.now() });
    });
    page.on('requestfailed', (req) => {
      const failure = req.failure ? req.failure() : null;
      requests.push({ url: req.url(), method: req.method(), failed: true, failure: failure ? failure.errorText : null, timestamp: Date.now() });
    });
    page.on('console', msg => { consoleLogs.push({ type: msg.type(), text: msg.text() }); });
    page.on('pageerror', err => { pageErrors.push({ message: err.message, stack: err.stack }); });

    await page.addInitScript(() => {
      window.__localSetCalls = [];
      window.__localRemoveCalls = [];
      window.__localClearCalls = [];
      const _set = Storage.prototype.setItem;
      const _remove = Storage.prototype.removeItem;
      const _clear = Storage.prototype.clear;

      Storage.prototype.setItem = function(k, v) {
        try {
          if (this === window.localStorage) window.__localSetCalls.push({ k, v, ts: Date.now() });
        } catch (e) {}
        return _set.apply(this, arguments);
      };

      Storage.prototype.removeItem = function(k) {
        try {
          if (this === window.localStorage) window.__localRemoveCalls.push({ k, ts: Date.now() });
        } catch (e) {}
        return _remove.apply(this, arguments);
      };

      Storage.prototype.clear = function() {
        try {
          if (this === window.localStorage) window.__localClearCalls.push({ ts: Date.now() });
        } catch (e) {}
        return _clear.apply(this, arguments);
      };
    });

    const MOBILE = process.env.MOBILE || '9000000101';
    const PASSWORD = process.env.PASSWORD || 'Vendor@123';
    await page.goto('http://localhost:5173/login', { timeout: 30000 });
    await page.fill('input[name=\"mobile\"]', MOBILE);
    await page.fill('input[name=\"password\"]', PASSWORD);

    const loginPromise = page.waitForResponse(r => r.url().includes('/auth/login') && r.request().method() === 'POST', { timeout: 15000 });
    await page.click('button[type="submit"]');
    const loginResp = await loginPromise;
    const loginRespText = await loginResp.text().catch(() => null);

    const currentUrl = await page.evaluate(() => location.href);
    const storages = await page.evaluate(() => {
      const ls = {}; for (let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); ls[k]=localStorage.getItem(k);} 
      const ss = {}; for (let i=0;i<sessionStorage.length;i++){ const k=sessionStorage.key(i); ss[k]=sessionStorage.getItem(k);} 
      return { localStorage: ls, sessionStorage: ss, localSetCalls: window.__localSetCalls };
    });
    const docCookie = await page.evaluate(() => document.cookie);
    const cookies = await context.cookies();

    // After login, attempt to navigate to vendor products page like the smoke test
    try {
      // Wait for client redirect to vendor dashboard (if any)
      await page.waitForFunction(() => location.pathname.startsWith('/vendor'), { timeout: 15000 }).catch(() => null);
      const productsLink = await page.$('a[href=\"/vendor/products\"]');
      if (productsLink) {
        await Promise.all([
          page.waitForResponse((resp) => resp.url().includes('/api/v1/products') && resp.request().method() === 'GET', { timeout: 10000 }).catch(() => null),
          productsLink.click()
        ]);
      }
    } catch (e) {
      // ignore navigation errors
    }

    // wait briefly for any subsequent writes
    await new Promise(r => setTimeout(r, 2000));

    console.log(JSON.stringify({ loginResponse: { url: loginResp.url(), status: loginResp.status(), body: loginRespText }, currentUrl, storages, docCookie, cookies, requests, responses, consoleLogs, pageErrors }, null, 2));

    await browser.close();
    process.exit(0);
  } catch(e) {
    console.error('ERROR', e);
    process.exit(2);
  }
})();

