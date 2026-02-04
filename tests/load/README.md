# Tests de charge Pokéindex

Tests de performance avec [k6](https://k6.io/) pour valider la résistance du site.

## Installation de k6

```bash
# Ubuntu/Debian
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# macOS
brew install k6

# Windows
choco install k6

# Snap (toutes distros)
sudo snap install k6
```

## Tests disponibles

| Test | Description | Durée | VUs max |
|------|-------------|-------|---------|
| `quick-test.js` | Smoke test rapide | 30s | 10 |
| `stress-test.js` | Test complet avec montée | ~13min | 1000 |
| `spike-test.js` | Simulation de pic viral | ~4min | 1500 |
| `rampup-test.js` | Montée en charge (breakpoint) | ~19min | 2000 |

## Lancer les tests

### Test rapide (avant déploiement)
```bash
k6 run tests/load/quick-test.js
```

### Stress test complet
```bash
k6 run tests/load/stress-test.js
```

### Test de pic (simulation virale)
```bash
k6 run tests/load/spike-test.js
```

### Test de montée en charge (trouver la limite)
```bash
k6 run tests/load/rampup-test.js
```

### Avec dashboard web en temps réel
```bash
k6 run --out web-dashboard tests/load/stress-test.js
# Ouvre http://127.0.0.1:5665 dans ton navigateur
```

### Tester un autre environnement
```bash
# Staging
k6 run -e BASE_URL=https://staging.pokeindex.fr tests/load/stress-test.js

# Local
k6 run -e BASE_URL=http://localhost:3000 tests/load/quick-test.js
```

## Interpréter les résultats

### Métriques clés

| Métrique | Seuil OK | Description |
|----------|----------|-------------|
| `http_req_duration p(95)` | < 3s | 95% des requêtes en moins de 3s |
| `http_req_failed` | < 5% | Moins de 5% d'erreurs HTTP |
| `vus_max` | - | Nombre max d'utilisateurs simultanés |
| `http_reqs` | - | Total de requêtes effectuées |

### Signaux d'alerte

- **p(95) > 5s** : Temps de réponse trop lents
- **http_req_failed > 10%** : Trop d'erreurs, le serveur sature
- **Erreurs 502/503** : Le serveur ne tient pas la charge

## Bonnes pratiques

1. **Ne jamais tester en prod sans prévenir** - Informe l'équipe/hébergeur
2. **Commencer par quick-test** - Valide que tout marche avant le stress
3. **Surveiller les métriques serveur** - CPU, RAM, connexions DB pendant le test
4. **Tester aux heures creuses** - Évite d'impacter les vrais utilisateurs
5. **Garder les résultats** - Compare entre les versions

## Résultats

Les résultats JSON sont sauvés dans `tests/load/results/`.
