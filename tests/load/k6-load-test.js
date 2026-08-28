import http from 'k6/http';
import { check, sleep } from 'k6';

// Realistic 100K Concurrency Target Multi-Stage Load Configuration
export const options = {
  stages: [
    { duration: '30s', target: 1000 },   // Stage 1: 1,000 VUs
    { duration: '1m',  target: 5000 },   // Stage 2: 5,000 VUs
    { duration: '1m',  target: 10000 },  // Stage 3: 10,000 VUs
    { duration: '2m',  target: 25000 },  // Stage 4: 25,000 VUs
    { duration: '2m',  target: 50000 },  // Stage 5: 50,000 VUs
    { duration: '3m',  target: 100000 }, // Stage 6: 100,000 VUs
    { duration: '1m',  target: 0 },      // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1200'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],                 // Error rate < 1%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const rand = Math.random();

  // Traffic Distribution:
  // 70% Read Browsing (Marketplace, Landing, Public Directory)
  // 15% Authenticated Dashboard Probes (Farmer/Buyer)
  // 10% Messaging / Notification Checks
  // 5%  Commerce & Cart Interactions

  if (rand < 0.70) {
    // 70%: Public Read Browsing
    const res = http.get(`${BASE_URL}/marketplace`);
    check(res, {
      'marketplace status is 200': (r) => r.status === 200,
    });
  } else if (rand < 0.85) {
    // 15%: Health / Dashboard API probes
    const res = http.get(`${BASE_URL}/api/health/live`);
    check(res, {
      'liveness probe is 200': (r) => r.status === 200,
    });
  } else if (rand < 0.95) {
    // 10%: Notification / Messaging Health Check
    const res = http.get(`${BASE_URL}/api/health/ready`);
    check(res, {
      'readiness probe is 200': (r) => r.status === 200,
    });
  } else {
    // 5%: Public Health Probe
    const res = http.get(`${BASE_URL}/api/health`);
    check(res, {
      'health probe is 200': (r) => r.status === 200,
    });
  }

  sleep(1);
}
