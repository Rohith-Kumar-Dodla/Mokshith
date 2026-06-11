# Load Testing Guide

## Overview
Load tests are used to verify the performance and scalability of the B2B backend under various levels of concurrent traffic.

## Prerequisites
- Server must be running (development or staging environment)
- Test data must be seeded
- Authentication tokens should be generated for authenticated endpoints

## Running Load Tests

### Run all scenarios
```bash
node tests/load/load-test.js
```

### Run specific scenario
```bash
node tests/load/load-test.js authLoad
node tests/load/load-test.js productLoad
node tests/load/load-test.js orderLoad
```

### Set custom target URL
```bash
TEST_URL=https://staging.example.com node tests/load/load-test.js
```

## Available Scenarios

### 1. authLoad
Tests authentication endpoint performance
- **Connections:** 100
- **Duration:** 30s
- **Target:** `/api/auth/login`

### 2. productLoad
Tests product listing performance
- **Connections:** 200
- **Duration:** 30s
- **Target:** `/api/products`

### 3. orderLoad
Tests order creation performance
- **Connections:** 50
- **Duration:** 30s
- **Target:** `/api/orders`

### 4. paymentLoad
Tests payment creation performance
- **Connections:** 30
- **Duration:** 30s
- **Target:** `/api/payments/create-order`

### 5. mixedLoad
Tests mixed read operations
- **Connections:** 300
- **Duration:** 60s
- **Target:** Multiple endpoints

## Performance Thresholds

| Metric | Threshold |
|--------|-----------|
| P50 Latency | ≤ 100ms |
| P95 Latency | ≤ 500ms |
| P99 Latency | ≤ 1000ms |
| Error Rate | ≤ 1% |
| Min Throughput | ≥ 100 req/s |

## Interpreting Results

### Successful Test
```
✅ Load test PASSED all thresholds
  Total Requests: 3000
  Requests/sec: 150.25
  P95 Latency: 425ms
  Error Rate: 0.1%
```

### Failed Test
```
❌ Load test FAILED - Performance thresholds not met
  P95 Latency: ❌ (850ms > 500ms)
  Error Rate: ❌ (2.5% > 1%)
```

## Customizing Tests

Edit `tests/load/load-test.js` to:
- Add new scenarios
- Modify connections/duration
- Adjust performance thresholds
- Add custom headers or payloads

## CI/CD Integration

Add to GitHub Actions:
```yaml
- name: Load Tests
  run: |
    npm start &
    sleep 10
    node tests/load/load-test.js authLoad productLoad
```

## Best Practices

1. **Warm up the server** before running load tests
2. **Use staging environment** for realistic tests
3. **Monitor server metrics** (CPU, memory, DB connections)
4. **Run during off-peak hours** to avoid affecting production
5. **Analyze failed tests** to identify bottlenecks
6. **Baseline results** to track performance over time

## Troubleshooting

### Connection Errors
- Verify server is running
- Check firewall settings
- Ensure URL is correct

### High Error Rates
- Check server logs
- Verify database connections
- Monitor memory usage

### Low Throughput
- Check for rate limiting
- Verify database indexes
- Monitor Redis performance
