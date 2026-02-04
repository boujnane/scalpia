/**
 * Pokéindex - Test de montée en charge (breakpoint test)
 *
 * Augmente progressivement la charge jusqu'à trouver le point de rupture.
 * Objectif: identifier la capacité maximale du système.
 *
 * Lancer: k6 run tests/load/rampup-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'https://www.pokeindex.fr';

// Métriques custom
const errorRate = new Rate('error_rate');
const responseTime = new Trend('response_time');
const requestCount = new Counter('request_count');
const successCount = new Counter('success_count');
const failCount = new Counter('fail_count');

// Seuil de rupture: quand le taux d'erreur dépasse ce %, on considère que le système est saturé
const BREAKING_POINT_ERROR_RATE = 0.10; // 10%

export const options = {
  scenarios: {
    // Montée continue jusqu'à trouver la limite
    ramp_to_breaking_point: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        // Montée progressive par paliers de 100 users
        { duration: '1m', target: 100 },
        { duration: '1m', target: 200 },
        { duration: '1m', target: 300 },
        { duration: '1m', target: 400 },
        { duration: '1m', target: 500 },
        { duration: '1m', target: 600 },
        { duration: '1m', target: 700 },
        { duration: '1m', target: 800 },
        { duration: '1m', target: 900 },
        { duration: '1m', target: 1000 },
        { duration: '1m', target: 1200 },
        { duration: '1m', target: 1400 },
        { duration: '1m', target: 1600 },
        { duration: '1m', target: 1800 },
        { duration: '1m', target: 2000 },
        // Maintien au max pour confirmer
        { duration: '2m', target: 2000 },
        // Descente
        { duration: '1m', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },

  // Pas de seuils stricts - on veut observer jusqu'où ça tient
  thresholds: {
    // Ces seuils sont informatifs, pas bloquants
    http_req_duration: ['p(95)<10000'],  // Alerte si > 10s
    error_rate: ['rate<0.30'],            // Alerte si > 30% d'erreurs
  },
};

// Pages à tester avec leur poids (fréquence relative)
const ENDPOINTS = [
  { name: 'Home', path: '/', weight: 25, type: 'page' },
  { name: 'Analyse', path: '/analyse', weight: 30, type: 'page' },
  { name: 'Cartes', path: '/cartes', weight: 15, type: 'page' },
  { name: 'Recherche', path: '/recherche?q=etb', weight: 10, type: 'page' },
  { name: 'API Search', path: '/api/search?q=display', weight: 10, type: 'api' },
  { name: 'API Items', path: '/api/items', weight: 5, type: 'api' },
  { name: 'Pricing', path: '/pricing', weight: 5, type: 'page' },
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
  const endpoint = weightedRandom(ENDPOINTS);
  const url = `${BASE_URL}${endpoint.path}`;

  const start = Date.now();

  const response = http.get(url, {
    headers: {
      'User-Agent': 'k6-rampup-test/1.0',
      'Accept': endpoint.type === 'api' ? 'application/json' : 'text/html',
    },
    timeout: '30s',
  });

  const duration = Date.now() - start;
  responseTime.add(duration);
  requestCount.add(1);

  // Vérifications
  const isSuccess = check(response, {
    'status 2xx': (r) => r.status >= 200 && r.status < 300,
    'not timeout': (r) => r.timings.duration < 30000,
    'has body': (r) => r.body && r.body.length > 0,
  });

  if (isSuccess) {
    successCount.add(1);
    errorRate.add(0);
  } else {
    failCount.add(1);
    errorRate.add(1);

    // Log les erreurs pour debug
    if (response.status >= 500) {
      console.log(`❌ [${endpoint.name}] Status ${response.status} - ${duration}ms`);
    }
  }

  // Pause réaliste (plus courte sous forte charge = utilisateurs impatients)
  sleep(Math.random() * 2 + 0.5);
}

export function setup() {
  console.log('═'.repeat(60));
  console.log('📈 TEST DE MONTÉE EN CHARGE - RECHERCHE DU POINT DE RUPTURE');
  console.log('═'.repeat(60));
  console.log(`\n🎯 Cible: ${BASE_URL}`);
  console.log('📊 Scénario: 0 → 2000 utilisateurs par paliers de 100');
  console.log('⏱️  Durée totale: ~19 minutes');
  console.log('\n💡 Surveillez:');
  console.log('   - Le temps de réponse moyen');
  console.log('   - Le taux d\'erreur');
  console.log('   - Les métriques serveur (CPU, RAM, connexions)');
  console.log('\n⚠️  Le test continue même si des erreurs apparaissent');
  console.log('   pour identifier précisément le point de rupture.\n');

  // Vérifier que le site répond
  const warmup = http.get(BASE_URL);
  if (warmup.status !== 200) {
    console.log(`⚠️  Warning: Le site a répondu avec status ${warmup.status}`);
  }

  return { startTime: new Date().toISOString() };
}

export function teardown(data) {
  console.log('\n' + '═'.repeat(60));
  console.log('✅ TEST TERMINÉ');
  console.log('═'.repeat(60));
}

export function handleSummary(data) {
  const metrics = data.metrics;

  console.log('\n' + '═'.repeat(60));
  console.log('📊 RAPPORT DE MONTÉE EN CHARGE');
  console.log('═'.repeat(60));

  // Capacité maximale atteinte
  const maxVUs = metrics.vus_max?.values?.max || 0;
  console.log(`\n👥 Utilisateurs max atteints: ${maxVUs}`);

  // Temps de réponse
  if (metrics.http_req_duration) {
    const med = metrics.http_req_duration.values.med?.toFixed(0);
    const p95 = metrics.http_req_duration.values['p(95)']?.toFixed(0);
    const p99 = metrics.http_req_duration.values['p(99)']?.toFixed(0);
    const max = metrics.http_req_duration.values.max?.toFixed(0);

    console.log(`\n⏱️  Temps de réponse:`);
    console.log(`   Médiane: ${med}ms`);
    console.log(`   P95: ${p95}ms`);
    console.log(`   P99: ${p99}ms`);
    console.log(`   Max: ${max}ms`);
  }

  // Taux d'erreur
  if (metrics.error_rate) {
    const rate = (metrics.error_rate.values.rate * 100).toFixed(2);
    const status = rate < 5 ? '✅' : rate < 10 ? '⚠️' : '❌';
    console.log(`\n${status} Taux d'erreur global: ${rate}%`);
  }

  // Requêtes
  if (metrics.http_reqs) {
    const total = metrics.http_reqs.values.count;
    const rps = metrics.http_reqs.values.rate?.toFixed(2);
    console.log(`\n📈 Total requêtes: ${total}`);
    console.log(`   Débit moyen: ${rps} req/s`);
  }

  // Analyse du point de rupture
  console.log('\n' + '─'.repeat(60));
  console.log('🔍 ANALYSE DU POINT DE RUPTURE');
  console.log('─'.repeat(60));

  const errorRateValue = metrics.error_rate?.values?.rate || 0;
  const p95 = metrics.http_req_duration?.values?.['p(95)'] || 0;

  if (errorRateValue < 0.01 && p95 < 2000) {
    console.log('\n✅ EXCELLENT: Le système tient parfaitement la charge');
    console.log('   → Capacité > 2000 utilisateurs simultanés');
  } else if (errorRateValue < 0.05 && p95 < 3000) {
    console.log('\n✅ BON: Le système tient bien la charge');
    console.log('   → Quelques ralentissements mais acceptable');
  } else if (errorRateValue < 0.10 && p95 < 5000) {
    console.log('\n⚠️  MOYEN: Le système montre des signes de saturation');
    console.log('   → Optimisations recommandées avant mise en production');
  } else if (errorRateValue < 0.20) {
    console.log('\n⚠️  LIMITE ATTEINTE: Point de rupture approché');
    console.log(`   → Capacité estimée: ~${Math.floor(maxVUs * 0.7)} utilisateurs`);
  } else {
    console.log('\n❌ POINT DE RUPTURE DÉPASSÉ');
    console.log(`   → Le système ne supporte pas ${maxVUs} utilisateurs`);
    console.log(`   → Capacité estimée: ~${Math.floor(maxVUs * 0.5)} utilisateurs`);
  }

  console.log('\n💡 Recommandations:');
  if (p95 > 3000) {
    console.log('   - Optimiser les requêtes lentes (cache, DB, API externes)');
  }
  if (errorRateValue > 0.05) {
    console.log('   - Augmenter les ressources serveur (CPU/RAM)');
    console.log('   - Vérifier les limites de connexions (DB, workers)');
  }
  if (maxVUs >= 2000 && errorRateValue < 0.05) {
    console.log('   - 🎉 Excellent! Le site peut gérer un trafic intense');
  }

  console.log('\n' + '═'.repeat(60));

  return {
    'tests/load/results/rampup-summary.json': JSON.stringify(data, null, 2),
  };
}
