import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { AddressInfo } from 'node:net';
import { once } from 'node:events';

const maxAudioBytes = 20 * 1024 * 1024;
const tamilTranscript = 'என் வங்கிக் கணக்கிலிருந்து பணம் எடுக்கப்பட்டது.';

async function getAvailablePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as AddressInfo).port;
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  return port;
}

async function main() {
  let upstreamStatus = 200;
  let upstreamText: string | null = tamilTranscript;
  let dropUpstreamConnection = false;
  let capturedAuthorization = '';
  let capturedRequest = '';
  const openAIServer = createServer((req: IncomingMessage, res: ServerResponse) => {
    const chunks: Buffer[] = [];
    req.on('data', chunk => chunks.push(Buffer.from(chunk)));
    req.on('end', () => {
      capturedAuthorization = req.headers.authorization || '';
      capturedRequest = Buffer.concat(chunks).toString('latin1');
      if (dropUpstreamConnection) {
        res.destroy();
        return;
      }
      res.writeHead(upstreamStatus, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(upstreamText === null ? {} : { text: upstreamText }));
    });
  });
  await new Promise<void>(resolve => openAIServer.listen(0, '127.0.0.1', resolve));
  const openAIPort = (openAIServer.address() as AddressInfo).port;
  const appPort = await getAvailablePort();
  const app = spawn(process.execPath, ['--import', 'tsx', 'server.ts'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: 'development',
      DISABLE_HMR: 'true',
      PORT: String(appPort),
      OPENAI_API_KEY: 'test-only-key',
      OPENAI_TRANSCRIPTION_MODEL: 'gpt-transcribe-test',
      OPENAI_TRANSCRIPTION_URL: `http://127.0.0.1:${openAIPort}/v1/audio/transcriptions`
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let appOutput = '';
  app.stdout?.on('data', chunk => appOutput += chunk.toString());
  app.stderr?.on('data', chunk => appOutput += chunk.toString());

  const baseUrl = `http://127.0.0.1:${appPort}/api/audio/transcriptions`;
  const waitForApp = async () => {
    for (let attempt = 0; attempt < 100; attempt++) {
      if (app.exitCode !== null) throw new Error(`Test server exited early:\n${appOutput}`);
      try {
        const response = await fetch(`http://127.0.0.1:${appPort}/api/health`);
        if (response.ok) return;
      } catch {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    throw new Error(`Test server did not start:\n${appOutput}`);
  };

  const submitRecording = async (audio: Blob, language = 'ta') => {
    const form = new FormData();
    form.append('audio', audio, 'recording.webm');
    form.append('language', language);
    return fetch(baseUrl, { method: 'POST', body: form });
  };

  try {
    await waitForApp();

    const transcription = await submitRecording(
      new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'audio/webm' })
    );
    const transcriptionBody = await transcription.json();
    assert.equal(transcription.status, 200);
    assert.equal(transcriptionBody.text, tamilTranscript, 'Tamil transcript should be returned without translation');
    assert.ok(capturedAuthorization.startsWith('Bearer '), 'server should use its environment key for OpenAI authorization');
    assert.match(capturedRequest, /name="model"\r\n\r\ngpt-transcribe-test/);
    assert.match(capturedRequest, /name="language"\r\n\r\nta/);
    assert.match(capturedRequest, /filename="recording\.webm"/);
    assert.ok(capturedRequest.includes(Buffer.from([1, 2, 3, 4]).toString('latin1')));
    console.log('[PASS] Multipart recording is sent with configured model and Tamil language, and returned unchanged');

    upstreamText = 'Money was taken from my bank account without permission.';
    const english = await submitRecording(
      new Blob([new Uint8Array([5, 6])], { type: 'audio/webm' }),
      'en'
    );
    assert.equal(english.status, 200);
    assert.equal((await english.json()).text, upstreamText);
    assert.match(capturedRequest, /name="language"\r\n\r\nen/);
    console.log('[PASS] English transcripts are returned without translation');

    const emptyAudio = await submitRecording(new Blob([], { type: 'audio/webm' }));
    assert.equal(emptyAudio.status, 400);
    assert.equal((await emptyAudio.json()).error.code, 'EMPTY_AUDIO');
    console.log('[PASS] Empty recordings are rejected');

    const unsupported = await submitRecording(new Blob(['not audio'], { type: 'text/plain' }));
    assert.equal(unsupported.status, 415);
    assert.equal((await unsupported.json()).error.code, 'UNSUPPORTED_AUDIO_FORMAT');
    console.log('[PASS] Unsupported audio formats are rejected');

    const oversized = await submitRecording(
      new Blob([new Uint8Array(maxAudioBytes + 1)], { type: 'audio/webm' })
    );
    assert.equal(oversized.status, 413);
    assert.equal((await oversized.json()).error.code, 'AUDIO_TOO_LARGE');
    console.log('[PASS] Audio uploads over 20 MB are rejected');

    upstreamStatus = 429;
    const busy = await submitRecording(new Blob([new Uint8Array([1])], { type: 'audio/webm' }));
    assert.equal(busy.status, 503);
    assert.equal((await busy.json()).error.code, 'TRANSCRIPTION_BUSY');
    console.log('[PASS] OpenAI rate-limit failures return a retryable error');

    upstreamStatus = 200;
    upstreamText = null;
    const noSpeech = await submitRecording(new Blob([new Uint8Array([1])], { type: 'audio/webm' }));
    assert.equal(noSpeech.status, 502);
    assert.equal((await noSpeech.json()).error.code, 'EMPTY_TRANSCRIPTION');
    console.log('[PASS] Empty OpenAI transcripts return a clear error');

    dropUpstreamConnection = true;
    const networkFailure = await submitRecording(new Blob([new Uint8Array([1])], { type: 'audio/webm' }));
    dropUpstreamConnection = false;
    assert.equal(networkFailure.status, 502);
    assert.equal((await networkFailure.json()).error.code, 'TRANSCRIPTION_NETWORK_ERROR');
    console.log('[PASS] Upstream network failures return a clear error');
  } finally {
    if (app.exitCode === null && app.signalCode === null) {
      const exited = once(app, 'exit');
      app.kill();
      await exited;
    }
    await new Promise<void>((resolve, reject) => openAIServer.close(error => error ? reject(error) : resolve()));
  }
}

main().catch(error => {
  console.error('[FAIL] Audio transcription integration test:', error);
  process.exitCode = 1;
});
