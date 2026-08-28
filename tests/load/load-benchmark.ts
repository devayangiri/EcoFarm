import http from 'http';

interface BenchmarkResult {
  totalRequests: number;
  successful: number;
  failed: number;
  durationSeconds: number;
  rps: number;
  latencies: number[];
  p50: number;
  p95: number;
  p99: number;
}

async function sendRequest(url: string): Promise<{ success: boolean; duration: number }> {
  const start = performance.now();
  return new Promise((resolve) => {
    http.get(url, (res) => {
      res.resume();
      res.on('end', () => {
        const duration = performance.now() - start;
        resolve({ success: res.statusCode === 200, duration });
      });
    }).on('error', () => {
      const duration = performance.now() - start;
      resolve({ success: false, duration });
    });
  });
}

export async function runLoadBenchmark(
  targetUrl: string,
  concurrency: number,
  totalRequests: number
): Promise<BenchmarkResult> {
  const latencies: number[] = [];
  let successful = 0;
  let failed = 0;

  const startTime = performance.now();
  let completed = 0;

  async function worker() {
    while (completed < totalRequests) {
      completed++;
      const res = await sendRequest(targetUrl);
      latencies.push(res.duration);
      if (res.success) successful++;
      else failed++;
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  const durationSeconds = (performance.now() - startTime) / 1000;
  latencies.sort((a, b) => a - b);

  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;

  return {
    totalRequests,
    successful,
    failed,
    durationSeconds,
    rps: Math.round(totalRequests / durationSeconds),
    latencies,
    p50: Math.round(p50),
    p95: Math.round(p95),
    p99: Math.round(p99),
  };
}

if (require.main === module) {
  const target = process.env.TARGET_URL || 'http://localhost:3000/api/health';
  console.log(`Starting baseline benchmark against ${target}...`);
  runLoadBenchmark(target, 50, 1000).then((res) => {
    console.log('--- Benchmark Results ---');
    console.log(`Requests: ${res.totalRequests}`);
    console.log(`Success Rate: ${((res.successful / res.totalRequests) * 100).toFixed(1)}%`);
    console.log(`RPS: ${res.rps}`);
    console.log(`p50: ${res.p50}ms`);
    console.log(`p95: ${res.p95}ms`);
    console.log(`p99: ${res.p99}ms`);
  });
}
