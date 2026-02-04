/**
 * Pokéindex - Test rapide (smoke test)
 *
 * Test léger pour vérifier que tout fonctionne.
 * À lancer avant un déploiement ou en CI/CD.
 *
 * Lancer: k6 run tests/load/quick-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://www.pokeindex.fr';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.01'],
  },
};

const PAGES = [
  '/',
  '/analyse',
  '/cartes',
  '/pricing',
  '/methodologie',
];

export default function () {
  const page = PAGES[Math.floor(Math.random() * PAGES.length)];
  const response = http.get(`${BASE_URL}${page}`);

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 2s': (r) => r.timings.duration < 2000,
  });

  sleep(1);
}
