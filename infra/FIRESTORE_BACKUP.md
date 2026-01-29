# Firestore Backup & Restore

## Bucket Configuration

- **Bucket**: `gs://pokeindex-firestore-backups`
- **Retention**: 90 days (auto-delete via GCS lifecycle)
- **Versioning**: Enabled (optional, for accidental overwrites)

## Export Firestore (Create Backup)

```bash
# Export all collections
gcloud firestore export gs://pokeindex-firestore-backups/$(date +%Y-%m-%d)

# Export specific collections
gcloud firestore export gs://pokeindex-firestore-backups/$(date +%Y-%m-%d) \
  --collection-ids=users,items,subscriptions
```

## List Available Backups

```bash
gsutil ls gs://pokeindex-firestore-backups/
```

## Restore from Backup

```bash
# Import all collections from a specific backup
gcloud firestore import gs://pokeindex-firestore-backups/2025-01-29

# Import specific collections
gcloud firestore import gs://pokeindex-firestore-backups/2025-01-29 \
  --collection-ids=users,items
```

> **Warning**: Import overwrites existing documents with the same IDs. Consider importing to a test project first.

## Lifecycle Policy

Objects older than 90 days are automatically deleted. To modify:

```bash
# View current policy
gsutil lifecycle get gs://pokeindex-firestore-backups

# Update policy
gsutil lifecycle set infra/gcs-lifecycle.json gs://pokeindex-firestore-backups
```

## Scheduled Backups (Optional)

Use Cloud Scheduler + Cloud Functions or a cron job:

```bash
# Example: Daily backup at 2am via Cloud Scheduler
gcloud scheduler jobs create http firestore-daily-backup \
  --schedule="0 2 * * *" \
  --uri="https://firestore.googleapis.com/v1/projects/YOUR_PROJECT/databases/(default):exportDocuments" \
  --http-method=POST \
  --oauth-service-account-email=YOUR_SA@YOUR_PROJECT.iam.gserviceaccount.com \
  --message-body='{"outputUriPrefix":"gs://pokeindex-firestore-backups"}'
```
