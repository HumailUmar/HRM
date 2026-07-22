const { spawn, execFileSync } = require('node:child_process');

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const run = (args) => execFileSync(npm, args, { stdio: 'inherit', env: { ...process.env, CI: 'true' } });

async function waitForHealth(url, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
      lastError = new Error(`health status ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw lastError || new Error('health check timed out');
}

async function main() {
  run(['run', 'lint']);
  run(['test', '--', '--runInBand', '--coverage=false']);
  run(['run', 'build']);

  const port = '4317';
  const child = spawn(process.execPath, ['dist/server.cjs'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'test',
      PORT: port,
      HOST: '127.0.0.1',
    },
  });

  try {
    await waitForHealth(`http://127.0.0.1:${port}/api/health`);
    console.log('Pre-deployment health check passed.');
  } finally {
    child.kill('SIGTERM');
    await new Promise(resolve => child.once('exit', resolve));
  }
}

main().catch(error => {
  console.error(`Pre-deployment check failed: ${error.message}`);
  process.exitCode = 1;
});
