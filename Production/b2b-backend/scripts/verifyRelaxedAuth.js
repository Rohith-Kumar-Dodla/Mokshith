const ts = Date.now();
const baseMobile = 9000000000 + (ts % 900000000);

const cases = [
  { label: '123456', password: '123456', expectStatus: 201 },
  { label: 'test123', password: 'test123', expectStatus: 201 },
  { label: 'abc', password: 'abc', expectStatus: 400 },
];

for (const [index, testCase] of cases.entries()) {
  const body = {
    name: 'UAT Test',
    email: `uat_${ts}_${testCase.label}@test.com`,
    mobile: String(baseMobile + index),
    password: testCase.password,
    role: 'B2B_CUSTOMER',
  };

  const response = await fetch('http://localhost:5000/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const json = await response.json();
  const pass = response.status === testCase.expectStatus;
  console.log(
    `${pass ? 'PASS' : 'FAIL'} | password=${testCase.label} | expected=${testCase.expectStatus} | got=${response.status} | ${json.message || 'ok'}`
  );
}
