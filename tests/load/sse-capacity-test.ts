import http from 'http';

export interface SSEBenchmarkResult {
  targetConnections: number;
  activeConnections: number;
  connectionErrors: number;
  avgConnectTimeMs: number;
  memoryUsageMb: {
    heapUsed: number;
    rss: number;
  };
  durationSeconds: number;
}

export async function runSSECapacityTest(
  targetUrl: string,
  numConnections: number,
  holdDurationMs: number = 5000
): Promise<SSEBenchmarkResult> {
  const connections: http.ClientRequest[] = [];
  let activeConnections = 0;
  let connectionErrors = 0;
  const connectTimes: number[] = [];

  const initialMemory = process.memoryUsage();
  const startTime = performance.now();

  const connectPromises = Array.from({ length: numConnections }, (_, idx) => {
    return new Promise<void>((resolve) => {
      const connStart = performance.now();
      const req = http.get(targetUrl, (res) => {
        if (res.statusCode === 200) {
          activeConnections++;
          connectTimes.push(performance.now() - connStart);
        } else {
          connectionErrors++;
        }
        resolve();
      });

      req.on('error', () => {
        connectionErrors++;
        resolve();
      });

      connections.push(req);
    });
  });

  await Promise.all(connectPromises);

  // Hold connections for the specified duration to measure steady-state memory and heartbeat overhead
  await new Promise((resolve) => setTimeout(resolve, holdDurationMs));

  const finalMemory = process.memoryUsage();
  const durationSeconds = (performance.now() - startTime) / 1000;

  // Gracefully close all open connections
  for (const conn of connections) {
    try {
      conn.destroy();
    } catch {
      // ignore
    }
  }

  const avgConnectTimeMs =
    connectTimes.length > 0
      ? Math.round(connectTimes.reduce((a, b) => a + b, 0) / connectTimes.length)
      : 0;

  return {
    targetConnections: numConnections,
    activeConnections,
    connectionErrors,
    avgConnectTimeMs,
    memoryUsageMb: {
      heapUsed: Math.round((finalMemory.heapUsed - initialMemory.heapUsed) / (1024 * 1024)),
      rss: Math.round((finalMemory.rss - initialMemory.rss) / (1024 * 1024)),
    },
    durationSeconds,
  };
}

if (require.main === module) {
  const sseUrl = process.env.SSE_URL || 'http://localhost:3000/api/health/live';
  console.log(`Starting SSE Capacity Test on ${sseUrl} with 200 streaming connections...`);
  runSSECapacityTest(sseUrl, 200, 3000).then((res) => {
    console.log('--- SSE Capacity Results ---');
    console.log(`Target Connections: ${res.targetConnections}`);
    console.log(`Connected: ${res.activeConnections}`);
    console.log(`Errors: ${res.connectionErrors}`);
    console.log(`Avg Connect Time: ${res.avgConnectTimeMs}ms`);
    console.log(`Heap Delta: ${res.memoryUsageMb.heapUsed} MB`);
  });
}
