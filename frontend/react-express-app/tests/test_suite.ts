/**
 * CRIMVEXA AI — Automated Multilingual & Core Integration Test Suite
 */

const BASE_URL = 'http://localhost:3000/api';

async function runTestSuite() {
  console.log('====================================================');
  console.log('CRIMVEXA AI: RUNNING MULTILINGUAL & INTEGRATION TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`[FAIL] ${name}: ${err.message}`);
      failed++;
    }
  }

  // 1. Health check
  await test('GET /api/health confirms service & multilingual support', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    if (res.status !== 200 || data.status !== 'ok') throw new Error('Health check failed');
    if (!data.supportedLanguages.includes('ta') || !data.supportedLanguages.includes('ml')) {
      throw new Error('Missing Tamil/Malayalam in supported languages');
    }
  });

  // 2. Multilingual Processing: Tamil Voice Complaint
  await test('POST /api/multilingual/process transcribes and extracts Tamil incident indicators', async () => {
    const tamilText = 'எனது வாட்ஸ்அப் கணக்கிற்கு செய்தி வந்து ₹48,000 பணம் ஏமாத்திட்டாங்க யுபிஐ மூலம்.';
    const res = await fetch(`${BASE_URL}/multilingual/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: tamilText, language: 'ta' })
    });
    const data = await res.json();
    if (res.status !== 200) throw new Error('Multilingual processing failed');
    if (data.detectedLang !== 'ta') throw new Error(`Expected 'ta', got ${data.detectedLang}`);
    if (data.categoryHint !== 'UPI / Financial Fraud') throw new Error(`Expected UPI category hint, got ${data.categoryHint}`);
    if (!data.translatedEnglish.includes('Tamil statement')) throw new Error('Translation note missing');
  });

  // 3. Multilingual Processing: Malayalam Voice Complaint
  await test('POST /api/multilingual/process transcribes and extracts Malayalam incident indicators', async () => {
    const malayalamText = 'വൈദ്യുതി ബിൽ അടയ്ക്കാൻ വ്യാജ ലിങ്ക് വഴി ഒടിപി നൽകിയപ്പോൾ ₹1,20,000 നഷ്ടപ്പെട്ടു.';
    const res = await fetch(`${BASE_URL}/multilingual/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: malayalamText, language: 'ml' })
    });
    const data = await res.json();
    if (res.status !== 200) throw new Error('Malayalam processing failed');
    if (data.detectedLang !== 'ml') throw new Error(`Expected 'ml', got ${data.detectedLang}`);
    if (data.categoryHint !== 'Phishing & Malicious Links') throw new Error(`Expected Phishing hint, got ${data.categoryHint}`);
  });

  // 4. Auth: Role switch & registration
  await test('POST /api/auth/login switches persona to cyber officer', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'cyber_officer' })
    });
    const data = await res.json();
    if (res.status !== 200 || data.user.role !== 'cyber_officer') throw new Error('Role switch failed');
  });

  // 5. Validation error handling
  await test('POST /api/complaints rejects incomplete submission with 400', async () => {
    const res = await fetch(`${BASE_URL}/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test only' })
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // 6. Multilingual Complaint Registration in Tamil
  let testCaseId = '';
  await test('POST /api/complaints records Tamil complaint with SHA-256 evidence', async () => {
    const res = await fetch(`${BASE_URL}/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'வாட்ஸ்அப் மோசடி (WhatsApp Tamil Complaint)',
        description: 'யுபிஐ மூலம் ₹48,000 பணம் ஏமாத்திட்டாங்க.',
        originalLanguage: 'ta',
        incidentLocation: 'Chennai Online',
        city: 'Chennai',
        lossAmount: '₹48,000',
        evidenceItems: [
          {
            originalName: 'tamil_complaint_evidence.png',
            fileType: 'image/png',
            sizeBytes: 254100,
            base64Data: Buffer.from('RAW EVIDENCE BYTES').toString('base64')
          }
        ]
      })
    });
    const data = await res.json();
    if (res.status !== 201) throw new Error(`Failed to create complaint: ${JSON.stringify(data)}`);
    if (!data.id.startsWith('CVX-2026-')) throw new Error(`Invalid Case ID: ${data.id}`);
    if (data.complaint.category !== 'UPI / Financial Fraud') throw new Error(`Expected UPI category, got ${data.complaint.category}`);
    if (data.complaint.originalLanguage !== 'ta') throw new Error('Language not tagged as Tamil');
    testCaseId = data.id;
  });

  // 7. Case Retrieval
  await test(`GET /api/complaints/${testCaseId} returns persisted case record`, async () => {
    const res = await fetch(`${BASE_URL}/complaints/${testCaseId}`);
    const data = await res.json();
    if (res.status !== 200 || data.id !== testCaseId) throw new Error('Failed to retrieve case');
  });

  // 8. Status update
  await test(`PATCH /api/complaints/${testCaseId}/status updates status to UNDER_REVIEW`, async () => {
    const res = await fetch(`${BASE_URL}/complaints/${testCaseId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        newStatus: 'UNDER_REVIEW',
        note: 'Assigned to Cyber Cell Inspector'
      })
    });
    const data = await res.json();
    if (res.status !== 200 || data.complaint.status !== 'UNDER_REVIEW') throw new Error('Status update failed');
  });

  // 9. Official FIR Registration Transmission
  await test(`POST /api/fir/file-portal registers official electronic FIR`, async () => {
    const res = await fetch(`${BASE_URL}/fir/file-portal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        complaintId: testCaseId,
        userConfirmedConsent: true
      })
    });
    const data = await res.json();
    if (res.status !== 200 || !data.receipt.filingReceiptId.startsWith('FIR-2026-')) {
      throw new Error('FIR generation failed');
    }
  });

  // 10. Evidence SHA-256 Verification
  await test('POST /api/evidence/verify-hash verifies cryptographic hash integrity', async () => {
    const sampleHash = '9a2c5ef2978d38e2194c653fbb83901baae8433910cbe43b448bcae91244e891';
    const res = await fetch(`${BASE_URL}/evidence/verify-hash`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        evidenceId: 'ev-1042-1',
        originalHash: sampleHash
      })
    });
    const data = await res.json();
    if (!data.isMatch || data.integrityStatus !== 'UNMODIFIED_VALID') {
      throw new Error('Hash check failed');
    }
  });

  // 11. MCP Tool: search_similar_cases
  await test('POST /api/mcp/search-cases runs TF-IDF vector similarity', async () => {
    const res = await fetch(`${BASE_URL}/mcp/search-cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'WhatsApp money transfer fraud prof sharma' })
    });
    const data = await res.json();
    if (res.status !== 200 || data.tool !== 'search_similar_cases') throw new Error('MCP tool call failed');
  });

  // 12. Officer Dashboard live statistics
  await test('GET /api/officer/dashboard calculates live case metrics', async () => {
    const res = await fetch(`${BASE_URL}/officer/dashboard`);
    const data = await res.json();
    if (res.status !== 200 || typeof data.counts.total !== 'number') throw new Error('Dashboard stats failed');
  });

  console.log(`\n====================================================`);
  console.log(`TEST SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log(`====================================================\n`);

  if (failed > 0) process.exit(1);
}

runTestSuite();
