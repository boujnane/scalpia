/**
 * Pokéindex - Test de pic (spike test)
 *
 * Simule un pic soudain de trafic (ex: mention par un YouTuber, tweet viral).
 * Teste la capacité du site à gérer un afflux brutal puis revenir à la normale.
 *
 * Lancer: k6 run tests/load/spike-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'https://www.pokeindex.fr';

const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

export const options = {
  scenarios: {
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },    // Trafic normal
        { duration: '10s', target: 1500 },  // SPIKE! Montée brutale
        { duration: '1m', target: 1500 },   // Maintien du pic
        { duration: '10s', target: 50 },    // Retour brutal à la normale
        { duration: '1m', target: 50 },     // Vérifier la récupération
        { duration: '30s', target: 0 },     // Fin
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<5000'],  // Plus tolérant pendant le spike
    http_req_failed: ['rate<0.15'],      // Jusqu'à 15% d'erreurs acceptables en spike
    errors: ['rate<0.2'],
  },
};

const PAGES = [
  { path: '/', weight: 40 },
  { path: '/analyse', weight: 35 },
  { path: '/cartes', weight: 15 },
  { path: '/recherche?q=pikachu', weight: 10 },
];

function weightedRandom(items) {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return items[0];
}

export default function () {
  const page = weightedRandom(PAGES);
  const start = Date.now();

  const response = http.get(`${BASE_URL}${page.path}`, {
    timeout: '30s',
  });

  responseTime.add(Date.now() - start);

  const success = check(response, {
    'status 200': (r) => r.status === 200,
    'not timeout': (r) => r.timings.duration < 30000,
  });

  errorRate.add(!success);

  // Pause courte pendant le spike (utilisateurs impatients)
  sleep(Math.random() * 2 + 0.5);
}

export function setup() {
  console.log('⚡ TEST DE PIC - Simulation d\'un afflux soudain de trafic');
  console.log(`📍 Cible: ${BASE_URL}`);
  console.log('📈 Scénario: 50 → 1500 → 50 utilisateurs');
}

export function teardown() {
  console.log('\n✅ Spike test terminé');
  console.log('💡 Vérifiez les métriques pendant la phase de pic (1500 VUs)');
}
