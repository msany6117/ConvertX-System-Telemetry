import fs from 'fs';
import path from 'path';
import http from 'http';
import { execSync } from 'child_process';

const PORT = 3000;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const TMP_DIR = path.resolve('.test_artifacts');

if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

console.log('====================================================');
console.log('🚀 CONVERTX ALL-TOOLS AUTOMATED VERIFICATION SUITE');
console.log('====================================================\n');

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(endpoint, options = {}, bodyBuffer = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
    const req = http.request(
      url,
      {
        method: options.method || 'GET',
        headers: options.headers || {},
      },
      (res) => {
        const chunks = [];
        res.on('data', (d) => chunks.push(d));
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          let json = null;
          try {
            json = JSON.parse(buffer.toString('utf8'));
          } catch {
            // Not JSON
          }
          resolve({ status: res.statusCode, headers: res.headers, body: buffer, json });
        });
      }
    );

    req.on('error', reject);
    if (bodyBuffer) {
      req.write(bodyBuffer);
    }
    req.end();
  });
}

async function uploadFile(filePath, filename, mimeType) {
  const boundary = '----ConvertXTestBoundary' + Math.random().toString(36).substring(2);
  const fileData = fs.readFileSync(filePath);

  const header = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`
  );
  const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
  const payload = Buffer.concat([header, fileData, footer]);

  const res = await request('/api/upload', {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': payload.length,
    },
  }, payload);

  if (res.status !== 200 || !res.json?.files?.[0]?.fileId) {
    throw new Error(`Upload failed for ${filename}: ${JSON.stringify(res.json || res.body.toString())}`);
  }
  return res.json.files[0];
}

async function runJob(fileId, targetFormat, options = {}) {
  const postData = Buffer.from(JSON.stringify({
    jobs: [{ fileId, targetFormat, options }]
  }));

  const convertRes = await request('/api/jobs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': postData.length,
    },
  }, postData);

  const jobId = convertRes.json?.jobs?.[0]?.jobId;
  if (convertRes.status !== 200 || !jobId) {
    throw new Error(`Job creation failed: ${JSON.stringify(convertRes.json || convertRes.body.toString())}`);
  }

  // Poll job until completed
  for (let attempt = 0; attempt < 40; attempt++) {
    await sleep(350);
    const pollRes = await request(`/api/jobs/${jobId}`);
    if (pollRes.status !== 200) {
      throw new Error(`Poll failed for job ${jobId}`);
    }
    const state = pollRes.json;
    if (state.status === 'COMPLETED') {
      return state;
    }
    if (state.status === 'FAILED') {
      throw new Error(`Job ${jobId} failed: ${state.errorMessage || 'Unknown error'}`);
    }
  }
  throw new Error(`Job ${jobId} timed out`);
}

async function testSuite() {
  const results = [];

  // 1. Health & Security Headers
  try {
    const health = await request('/api/health');
    const hasSecHeaders = !!health.headers['x-content-type-options'] && !!health.headers['x-frame-options'];
    if (health.status === 200 && health.json?.status === 'ok' && hasSecHeaders) {
      results.push({ name: 'System Health & Security Headers', status: 'PASS', details: 'Status 200 OK + Strict Headers' });
    } else {
      results.push({ name: 'System Health & Security Headers', status: 'FAIL', details: 'Non-200 or missing headers' });
    }
  } catch (err) {
    results.push({ name: 'System Health & Security Headers', status: 'FAIL', details: err.message });
  }

  // 2. Image: PNG -> WebP (Sharp)
  try {
    const testPng = path.join(TMP_DIR, 'test_input.png');
    execSync(`ffmpeg -y -f lavfi -i color=c=blue:s=100x100 -frames:v 1 "${testPng}" 2>/dev/null`);
    const fileMeta = await uploadFile(testPng, 'test_input.png', 'image/png');
    const jobResult = await runJob(fileMeta.fileId, 'webp', { quality: 85 });
    results.push({
      name: 'Image Converter (PNG -> WebP)',
      status: 'PASS',
      details: `Generated ${jobResult.outputFilename} (${jobResult.outputSize} bytes)`,
    });
  } catch (err) {
    results.push({ name: 'Image Converter (PNG -> WebP)', status: 'FAIL', details: err.message });
  }

  // 3. Image: PNG -> JPG with Resize & Grayscale
  try {
    const testPng = path.join(TMP_DIR, 'test_input.png');
    const fileMeta = await uploadFile(testPng, 'test_input.png', 'image/png');
    const jobResult = await runJob(fileMeta.fileId, 'jpg', { resizeWidth: 64, grayscale: true, quality: 90 });
    results.push({
      name: 'Image Editor/Resizer (PNG -> JPG + Grayscale)',
      status: 'PASS',
      details: `Generated ${jobResult.outputFilename} (${jobResult.outputSize} bytes)`,
    });
  } catch (err) {
    results.push({ name: 'Image Editor/Resizer (PNG -> JPG)', status: 'FAIL', details: err.message });
  }

  // 4. Audio: WAV -> MP3 (FFmpeg)
  try {
    const testWav = path.join(TMP_DIR, 'test_audio.wav');
    execSync(`ffmpeg -y -f lavfi -i "sine=frequency=440:duration=1" "${testWav}" 2>/dev/null`);
    const fileMeta = await uploadFile(testWav, 'test_audio.wav', 'audio/wav');
    const jobResult = await runJob(fileMeta.fileId, 'mp3', { audioBitrate: '192k' });
    results.push({
      name: 'Audio Converter (WAV -> MP3)',
      status: 'PASS',
      details: `Generated ${jobResult.outputFilename} (${jobResult.outputSize} bytes)`,
    });
  } catch (err) {
    results.push({ name: 'Audio Converter (WAV -> MP3)', status: 'FAIL', details: err.message });
  }

  // 5. Video: MP4 -> WebM (FFmpeg)
  try {
    const testMp4 = path.join(TMP_DIR, 'test_video.mp4');
    execSync(`ffmpeg -y -f lavfi -i testsrc=duration=1:size=320x240:rate=10 "${testMp4}" 2>/dev/null`);
    const fileMeta = await uploadFile(testMp4, 'test_video.mp4', 'video/mp4');
    const jobResult = await runJob(fileMeta.fileId, 'webm', { videoResolution: '480p' });
    results.push({
      name: 'Video Converter (MP4 -> WebM)',
      status: 'PASS',
      details: `Generated ${jobResult.outputFilename} (${jobResult.outputSize} bytes)`,
    });
  } catch (err) {
    results.push({ name: 'Video Converter (MP4 -> WebM)', status: 'FAIL', details: err.message });
  }

  // 6. Video Audio Extractor: MP4 -> MP3
  try {
    const testMp4 = path.join(TMP_DIR, 'test_video.mp4');
    execSync(`ffmpeg -y -f lavfi -i testsrc=duration=1:size=320x240:rate=10 -f lavfi -i "sine=frequency=440:duration=1" -c:v libx264 -c:a aac "${testMp4}" 2>/dev/null`);
    const fileMeta = await uploadFile(testMp4, 'test_video.mp4', 'video/mp4');
    const jobResult = await runJob(fileMeta.fileId, 'mp3', {});
    results.push({
      name: 'Video to Audio Extractor (MP4 -> MP3)',
      status: 'PASS',
      details: `Generated ${jobResult.outputFilename} (${jobResult.outputSize} bytes)`,
    });
  } catch (err) {
    results.push({ name: 'Video to Audio Extractor (MP4 -> MP3)', status: 'FAIL', details: err.message });
  }

  // 7. PDF Tools: PDF Rotate (pdf-lib)
  try {
    const testPdf = path.join(TMP_DIR, 'test_doc.pdf');
    const minPdf = `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 300 300]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF`;
    fs.writeFileSync(testPdf, minPdf);
    const fileMeta = await uploadFile(testPdf, 'test_doc.pdf', 'application/pdf');
    const jobResult = await runJob(fileMeta.fileId, 'pdf', { pdfAction: 'rotate', pdfRotation: 90 });
    results.push({
      name: 'PDF Tools (Rotate PDF 90°)',
      status: 'PASS',
      details: `Generated ${jobResult.outputFilename} (${jobResult.outputSize} bytes)`,
    });
  } catch (err) {
    results.push({ name: 'PDF Tools (Rotate PDF)', status: 'FAIL', details: err.message });
  }

  // 8. Document Converter: TXT -> HTML
  try {
    const testTxt = path.join(TMP_DIR, 'test_sample.txt');
    fs.writeFileSync(testTxt, '# ConvertX Documentation\n\nFast and secure online conversion suite.');
    const fileMeta = await uploadFile(testTxt, 'test_sample.txt', 'text/plain');
    const jobResult = await runJob(fileMeta.fileId, 'html', {});
    results.push({
      name: 'Document Converter (TXT -> HTML)',
      status: 'PASS',
      details: `Generated ${jobResult.outputFilename} (${jobResult.outputSize} bytes)`,
    });
  } catch (err) {
    results.push({ name: 'Document Converter (TXT -> HTML)', status: 'FAIL', details: err.message });
  }

  // 9. Archive Tool: File -> ZIP
  try {
    const testTxt = path.join(TMP_DIR, 'test_sample.txt');
    const fileMeta = await uploadFile(testTxt, 'test_sample.txt', 'text/plain');
    const jobResult = await runJob(fileMeta.fileId, 'zip', {});
    results.push({
      name: 'Archive Creator (File -> ZIP)',
      status: 'PASS',
      details: `Generated ${jobResult.outputFilename} (${jobResult.outputSize} bytes)`,
    });
  } catch (err) {
    results.push({ name: 'Archive Creator (File -> ZIP)', status: 'FAIL', details: err.message });
  }

  // Print Summary Table
  console.log('\n📊 TEST EXECUTION SUMMARY:');
  console.log('----------------------------------------------------');
  for (const r of results) {
    const icon = r.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} [${r.status}] ${r.name.padEnd(42)} : ${r.details}`);
  }
  console.log('----------------------------------------------------');

  const allPassed = results.every((r) => r.status === 'PASS');
  if (allPassed) {
    console.log(`\n🎉 ALL ${results.length} TOOL CATEGORIES PASSED WITH 100% SUCCESS!`);
  } else {
    console.log('\n⚠️ Some tests failed.');
  }

  // Clean test artifacts
  try {
    fs.rmSync(TMP_DIR, { recursive: true, force: true });
  } catch {}
}

testSuite();
