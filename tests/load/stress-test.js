/**
 * Pokéindex - Test de charge k6
 *
 * Installation k6:
 *   - Linux: sudo snap install k6 (ou via apt/brew)
 *   - Mac: brew install k6
 *   - Windows: choco install k6
 *
 * Lancer le test:
 *   k6 run tests/load/stress-test.js
 *
 * Avec dashboard web:
 *   k6 run --out web-dashboard tests/load/stress-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// === CONFIGURATION ===
const BASE_URL = __ENV.BASE_URL || 'https://www.pokeindex.fr';

// Métriques custom
const errorRate = new Rate('errors');
const pageLoadTrend = new Trend('page_load_time');
const apiResponseTrend = new Trend('api_response_time');

// === SCÉNARIOS DE CHARGE ===
export const options = {
  scenarios: {
    // Scénario 1: Montée progressive
    ramp_up: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 100 },   // Montée à 100 users en 1min
        { duration: '2m', target: 500 },   // Montée à 500 users en 2min
        { duration: '3m', target: 1000 },  // Montée à 1000 users en 3min
        { duration: '5m', target: 1000 },  // Maintien à 1000 users pendant 5min
        { duration: '2m', target: 0 },     // Descente progressive
      ],
      gracefulRampDown: '30s',
    },
  },

  // Seuils de performance (le test échoue si non respectés)
  thresholds: {
    http_req_duration: ['p(95)<3000'],      // 95% des requêtes < 3s
    http_req_failed: ['rate<0.05'],          // Moins de 5% d'erreurs
    errors: ['rate<0.1'],                    // Moins de 10% d'erreurs custom
    page_load_time: ['p(95)<5000'],          // Pages < 5s (95%)
    api_response_time: ['p(95)<2000'],       // API < 2s (95%)
  },
};

// === PAGES À TESTER ===
const PAGES = [
  { name: 'Home', path: '/', weight: 30 },
  { name: 'Analyse', path: '/analyse', weight: 25 },
  { name: 'Cartes', path: '/cartes', weight: 15 },
  { name: 'Recherche Pikachu', path: '/recherche?q=pikachu', weight: 10 },
  { name: 'Recherche ETB', path: '/recherche?q=etb', weight: 10 },
  { name: 'Méthodologie', path: '/methodologie', weight: 5 },
  { name: 'Pricing', path: '/pricing', weight: 5 },
];

// === API ENDPOINTS ===
const API_ENDPOINTS = [
  { name: 'Search API', path: '/api/search?q=display', weight: 40 },
  { name: 'Items API', path: '/api/items', weight: 30 },
  { name: 'Series API', path: '/api/series', weight: 30 },
];

// === HELPERS ===
function weightedRandom(items) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;

  for (const item of items) {
    random -= item.weight;
    if (random <= 0) return item;
  }
  return items[0];
}

function makeRequest(url, name, isApi = false) {
  const start = Date.now();
  const response = http.get(url, {
    headers: {
      'User-Agent': 'k6-load-test/1.0',
      'Accept': isApi ? 'application/json' : 'text/html',
    },
    timeout: '30s',
  });
  const duration = Date.now() - start;

  // Track metrics
  if (isApi) {
    apiResponseTrend.add(duration);
  } else {
    pageLoadTrend.add(duration);
  }

  // Vérifications
  const success = check(response, {
    [`${name} - status 200`]: (r) => r.status === 200,
    [`${name} - response time < 5s`]: (r) => r.timings.duration < 5000,
    [`${name} - has content`]: (r) => r.body && r.body.length > 0,
  });

  errorRate.add(!success);

  return response;
}

// === SCÉNARIO PRINCIPAL ===
export default function () {
  // Simuler un utilisateur réel avec navigation aléatoire

  group('Page Navigation', () => {
    // 70% du temps: visiter une page
    const page = weightedRandom(PAGES);
    makeRequest(`${BASE_URL}${page.path}`, page.name, false);

    // Pause réaliste entre les pages (1-5 secondes)
    sleep(Math.random() * 4 + 1);
  });

  group('API Calls', () => {
    // 30% du temps: appeler une API
    if (Math.random() < 0.3) {
      const endpoint = weightedRandom(API_ENDPOINTS);
      makeRequest(`${BASE_URL}${endpoint.path}`, endpoint.name, true);
      sleep(Math.random() * 2 + 0.5);
    }
  });

  // Pause entre les actions (simule le temps de lecture)
  sleep(Math.random() * 3 + 1);
}

// === SETUP (avant le test) ===
export function setup() {
  console.log(`🚀 Démarrage du test de charge sur ${BASE_URL}`);
  console.log(`📊 Scénario: Stress test jusqu'à 1000 utilisateurs simultanés`);

  // Vérifier que le site est accessible
  const response = http.get(BASE_URL);
  if (response.status !== 200) {
    throw new Error(`Le site ${BASE_URL} n'est pas accessible (status: ${response.status})`);
  }

  return { startTime: new Date().toISOString() };
}

// === TEARDOWN (après le test) ===
export function teardown(data) {
  console.log(`\n✅ Test terminé`);
  console.log(`⏱️  Démarré à: ${data.startTime}`);
  console.log(`⏱️  Terminé à: ${new Date().toISOString()}`);
}

// === RÉSUMÉ CUSTOM ===
export function handleSummary(data) {
  const summary = {
    'tests/load/results/summary.json': JSON.stringify(data, null, 2),
  };

  // Afficher un résumé lisible
  console.log('\n📈 RÉSUMÉ DU TEST DE CHARGE');
  console.log('═'.repeat(50));

  const metrics = data.metrics;

  if (metrics.http_req_duration) {
    console.log(`\n⏱️  Temps de réponse HTTP:`);
    console.log(`   - Médiane: ${metrics.http_req_duration.values.med?.toFixed(0)}ms`);
    console.log(`   - P95: ${metrics.http_req_duration.values['p(95)']?.toFixed(0)}ms`);
    console.log(`   - Max: ${metrics.http_req_duration.values.max?.toFixed(0)}ms`);
  }

  if (metrics.http_req_failed) {
    const failRate = (metrics.http_req_failed.values.rate * 100).toFixed(2);
    console.log(`\n❌ Taux d'erreur: ${failRate}%`);
  }

  if (metrics.http_reqs) {
    console.log(`\n📊 Total requêtes: ${metrics.http_reqs.values.count}`);
    console.log(`   - Requêtes/sec: ${metrics.http_reqs.values.rate?.toFixed(2)}`);
  }

  if (metrics.vus_max) {
    console.log(`\n👥 VUs max: ${metrics.vus_max.values.max}`);
  }

  console.log('\n' + '═'.repeat(50));

  return summary;
}
