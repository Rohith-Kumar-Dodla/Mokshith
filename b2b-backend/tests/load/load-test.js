import autocannon from 'autocannon';
import { promisify } from 'util';

const runLoadTest = promisify(autocannon);

/**
 * Load Test Configuration for B2B Backend
 * Run with: node tests/load/load-test.js
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:5000';

// Test scenarios
const scenarios = {
  // Scenario 1: Authentication Load
  authLoad: {
    title: 'Authentication Endpoint Load Test',
    url: `${BASE_URL}/api/auth/login`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      identifier: 'loadtest@example.com',
      password: 'LoadTest@123',
    }),
    connections: 100, // concurrent connections
    duration: 30, // test duration in seconds
    pipelining: 1,
  },

  // Scenario 2: Product Listing Load
  productLoad: {
    title: 'Product Listing Endpoint Load Test',
    url: `${BASE_URL}/api/products?page=1&limit=20`,
    method: 'GET',
    connections: 200,
    duration: 30,
    pipelining: 1,
  },

  // Scenario 3: Order Creation Load
  orderLoad: {
    title: 'Order Creation Endpoint Load Test',
    url: `${BASE_URL}/api/orders`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer YOUR_TEST_TOKEN', // Replace with valid token
    },
    body: JSON.stringify({
      items: [
        {
          productId: '507f1f77bcf86cd799439011',
          quantity: 10,
          price: 1000,
        },
      ],
      shippingAddress: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        pincode: '123456',
      },
    }),
    connections: 50,
    duration: 30,
    pipelining: 1,
  },

  // Scenario 4: Payment Creation Load
  paymentLoad: {
    title: 'Payment Creation Endpoint Load Test',
    url: `${BASE_URL}/api/payments/create-order`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer YOUR_TEST_TOKEN',
    },
    body: JSON.stringify({
      orderId: '507f1f77bcf86cd799439011',
      amount: 10000,
    }),
    connections: 30,
    duration: 30,
    pipelining: 1,
  },

  // Scenario 5: Read-heavy mixed load
  mixedLoad: {
    title: 'Mixed Read Operations Load Test',
    requests: [
      {
        method: 'GET',
        path: '/api/products?page=1&limit=20',
      },
      {
        method: 'GET',
        path: '/api/categories',
      },
      {
        method: 'GET',
        path: '/api/orders',
      },
    ],
    connections: 300,
    duration: 60,
  },
};

// Performance thresholds
const thresholds = {
  latencyP50: 100, // 50th percentile latency in ms
  latencyP95: 500, // 95th percentile latency in ms
  latencyP99: 1000, // 99th percentile latency in ms
  errorRate: 1, // Maximum acceptable error rate (%)
  minThroughput: 100, // Minimum requests per second
};

/**
 * Run a single load test scenario
 */
async function runScenario(scenarioName, config) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Running: ${config.title}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    const result = await runLoadTest({
      url: config.url,
      method: config.method || 'GET',
      headers: config.headers || {},
      body: config.body,
      connections: config.connections || 100,
      duration: config.duration || 30,
      pipelining: config.pipelining || 1,
      timeout: 30,
    });

    // Display results
    console.log('\n📊 Load Test Results:');
    console.log(`  Total Requests: ${result.requests.total}`);
    console.log(`  Requests/sec: ${result.requests.average.toFixed(2)}`);
    console.log(`  Throughput: ${(result.throughput.average / 1024 / 1024).toFixed(2)} MB/s`);
    console.log(`\n⏱️  Latency:`);
    console.log(`  Mean: ${result.latency.mean.toFixed(2)} ms`);
    console.log(`  P50: ${result.latency.p50} ms`);
    console.log(`  P95: ${result.latency.p95} ms`);
    console.log(`  P99: ${result.latency.p99} ms`);
    console.log(`  Max: ${result.latency.max} ms`);
    console.log(`\n📈 Status Codes:`);
    Object.entries(result.statusCodeStats || {}).forEach(([code, count]) => {
      console.log(`  ${code}: ${count}`);
    });
    console.log(`\n❌ Errors: ${result.errors}`);

    // Check against thresholds
    const passed = checkThresholds(result);

    if (passed) {
      console.log('\n✅ Load test PASSED all thresholds');
    } else {
      console.log('\n❌ Load test FAILED - Performance thresholds not met');
    }

    return { scenarioName, result, passed };
  } catch (error) {
    console.error(`\n❌ Load test failed with error:`, error.message);
    return { scenarioName, error, passed: false };
  }
}

/**
 * Check if results meet performance thresholds
 */
function checkThresholds(result) {
  const checks = {
    p50: result.latency.p50 <= thresholds.latencyP50,
    p95: result.latency.p95 <= thresholds.latencyP95,
    p99: result.latency.p99 <= thresholds.latencyP99,
    throughput: result.requests.average >= thresholds.minThroughput,
    errorRate: (result.errors / result.requests.total) * 100 <= thresholds.errorRate,
  };

  console.log('\n🎯 Threshold Checks:');
  console.log(`  P50 Latency: ${checks.p50 ? '✅' : '❌'} (${result.latency.p50}ms <= ${thresholds.latencyP50}ms)`);
  console.log(`  P95 Latency: ${checks.p95 ? '✅' : '❌'} (${result.latency.p95}ms <= ${thresholds.latencyP95}ms)`);
  console.log(`  P99 Latency: ${checks.p99 ? '✅' : '❌'} (${result.latency.p99}ms <= ${thresholds.latencyP99}ms)`);
  console.log(`  Throughput: ${checks.throughput ? '✅' : '❌'} (${result.requests.average.toFixed(2)} req/s >= ${thresholds.minThroughput} req/s)`);
  console.log(`  Error Rate: ${checks.errorRate ? '✅' : '❌'} (${((result.errors / result.requests.total) * 100).toFixed(2)}% <= ${thresholds.errorRate}%)`);

  return Object.values(checks).every((check) => check === true);
}

/**
 * Run all scenarios
 */
async function runAllScenarios() {
  console.log('🚀 Starting Load Tests for B2B Backend');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Time: ${new Date().toISOString()}\n`);

  const results = [];

  // Get scenarios to run from command line args or run all
  const scenariosToRun = process.argv[2]
    ? [process.argv[2]]
    : Object.keys(scenarios);

  for (const scenarioName of scenariosToRun) {
    if (!scenarios[scenarioName]) {
      console.error(`❌ Unknown scenario: ${scenarioName}`);
      continue;
    }

    const result = await runScenario(scenarioName, scenarios[scenarioName]);
    results.push(result);

    // Wait between scenarios
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('📋 LOAD TEST SUMMARY');
  console.log(`${'='.repeat(60)}\n`);

  results.forEach(({ scenarioName, result, passed, error }) => {
    if (error) {
      console.log(`❌ ${scenarioName}: FAILED (${error.message})`);
    } else {
      console.log(`${passed ? '✅' : '❌'} ${scenarioName}: ${passed ? 'PASSED' : 'FAILED'}`);
      console.log(`   RPS: ${result.requests.average.toFixed(2)} | P95: ${result.latency.p95}ms | Errors: ${result.errors}`);
    }
  });

  const allPassed = results.every((r) => r.passed);
  console.log(`\n${allPassed ? '✅ All load tests PASSED' : '❌ Some load tests FAILED'}\n`);

  process.exit(allPassed ? 0 : 1);
}

// Usage information
function printUsage() {
  console.log('Load Test Tool for B2B Backend\n');
  console.log('Usage: node load-test.js [scenario]\n');
  console.log('Available scenarios:');
  Object.keys(scenarios).forEach((name) => {
    console.log(`  - ${name}: ${scenarios[name].title}`);
  });
  console.log('\nIf no scenario is specified, all scenarios will run.\n');
  console.log('Environment variables:');
  console.log('  TEST_URL - Base URL for testing (default: http://localhost:5000)\n');
}

// Main execution
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  printUsage();
  process.exit(0);
}

// Run tests
runAllScenarios().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
