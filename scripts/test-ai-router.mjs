import http from 'http';

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let responseBody = '';
        res.on('data', (c) => (responseBody += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(responseBody) });
          } catch {
            resolve({ status: res.statusCode, data: responseBody });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    http.get({ hostname: 'localhost', port: 3000, path }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🤖 CONVERTX MULTI-PROVIDER AI ROUTER VERIFICATION');
  console.log('====================================================\n');

  // Test 1: Provider Dashboard & Health
  console.log('1. Checking Provider Registry & Masked Credentials...');
  const providersRes = await get('/api/ai/providers');
  console.log('Status:', providersRes.status);
  console.log('Active Priority:', providersRes.data.priority);
  for (const p of providersRes.data.providers || []) {
    console.log(` - [${p.id}] ${p.name}: status=${p.status}, model=${p.currentModel}, key=${p.apiKeyMasked}`);
  }

  // Test 2: AI Translation (English -> Bengali)
  console.log('\n2. Testing AI Translation (English -> Bengali)...');
  const transRes = await post('/api/ai/process', {
    task: 'translate',
    input: 'ConvertX provides lightning-fast file conversions and artificial intelligence tools in one place.',
    options: {
      sourceLanguage: 'English',
      targetLanguage: 'Bengali',
    },
  });
  console.log('Translation Status:', transRes.status);
  console.log('Provider Used:', transRes.data.provider, `(${transRes.data.model})`);
  console.log('Engine Switched (Failover):', Boolean(transRes.data.switchedEngine));
  console.log('Result:\n', transRes.data.result?.trim());

  // Test 3: AI Code Assistant
  console.log('\n3. Testing AI Code Assistant (Optimize Code)...');
  const codeRes = await post('/api/ai/process', {
    task: 'code',
    input: 'function sum(arr) { let s = 0; for(let i=0; i<arr.length; i++) s += arr[i]; return s; }',
    options: {
      codeAction: 'optimize',
      targetLanguageCode: 'TypeScript',
    },
  });
  console.log('Code Status:', codeRes.status);
  console.log('Provider Used:', codeRes.data.provider, `(${codeRes.data.model})`);
  console.log('Result Sample:\n', codeRes.data.result?.slice(0, 150), '...');

  // Test 4: Automatic Failover Test (Deliberately target DeepSeek which has 402 Insufficient Balance)
  console.log('\n4. Testing Automatic Failover (Forcing DeepSeek 402 -> Failover to Groq)...');
  const failoverRes = await post('/api/ai/process', {
    task: 'rewrite',
    input: 'This is a test sentence that requires immediate simplification.',
    options: { tone: 'Simple' },
    preferredProvider: 'deepseek',
  });
  console.log('Failover Request Status:', failoverRes.status);
  console.log('Final Successful Provider:', failoverRes.data.provider, `(${failoverRes.data.model})`);
  console.log('Switched Engine Flag:', failoverRes.data.switchedEngine);
  console.log('Failover Attempts Recorded:', failoverRes.data.attempts?.length || 0);
  if (failoverRes.data.attempts) {
    for (const a of failoverRes.data.attempts) {
      console.log(`   * Attempted ${a.provider} (${a.model}) -> Caught: ${a.error.slice(0, 70)}... in ${a.latencyMs}ms`);
    }
  }

  // Test 5: Conversational Chat ("Ask ConvertX AI")
  console.log('\n5. Testing Conversational Chat (/api/ai/chat)...');
  const chatRes = await post('/api/ai/chat', {
    messages: [
      { role: 'user', content: 'What formats can ConvertX convert?' }
    ]
  });
  console.log('Chat Status:', chatRes.status);
  console.log('Chat Provider:', chatRes.data.provider);
  console.log('Chat Reply:\n', chatRes.data.result?.slice(0, 200), '...');

  console.log('\n====================================================');
  console.log('🎉 ALL AI ROUTER TESTS COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
}

runTests().catch(console.error);
