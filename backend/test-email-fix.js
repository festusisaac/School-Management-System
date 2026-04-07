function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

function filterValidEmails(emails) {
  const emailArray = Array.isArray(emails) ? emails : [emails];
  return emailArray.filter(email => isValidEmail(email));
}

function testEmailValidator() {
  const tests = [
    { input: 'PHJCS/2026/0026', expected: false },
    { input: 'real@email.com', expected: true },
    { input: 'invalid-email', expected: false },
    { input: 'test.user@school.edu.ng', expected: true },
    { input: '', expected: false },
    { input: null, expected: false },
    { input: undefined, expected: false },
  ];

  console.log('--- Testing Email Validator ---');
  let passCount = 0;
  tests.forEach(t => {
    const result = isValidEmail(t.input);
    const passed = result === t.expected;
    console.log(`Input: "${t.input}" | Expected: ${t.expected} | Result: ${result} | ${passed ? '✅ PASS' : '❌ FAIL'}`);
    if (passed) passCount++;
  });

  console.log(`\nPassed ${passCount}/${tests.length} tests.`);

  console.log('\n--- Testing Email Filter ---');
  const mixed = ['PHJCS/2026/0026', 'real@email.com', 'another@school.com', 'invalid'];
  const filtered = filterValidEmails(mixed);
  console.log('Mixed Input:', mixed);
  console.log('Filtered Output:', filtered);
  const filterPassed = filtered.length === 2 && filtered.includes('real@email.com') && filtered.includes('another@school.com');
  console.log(`Filter Test: ${filterPassed ? '✅ PASS' : '❌ FAIL'}`);
}

testEmailValidator();
