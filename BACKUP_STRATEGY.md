# Database Backup Strategy

This document outlines the backup strategy for the School Management System database.

## Backup Methods

### 1. Docker Volume Snapshots (Development)

For development environments, use Docker volume snapshots:

```bash
# Create a backup
docker run --rm -v sms-postgres_data:/data -v $(pwd)/backups:/backup \
  alpine tar czf /backup/postgres-backup-$(date +%Y%m%d-%H%M%S).tar.gz -C /data .

# Restore from backup
docker run --rm -v sms-postgres_data:/data -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/postgres-backup-YYYYMMDD-HHMMSS.tar.gz -C /data
```

### 2. pg_dump (Logical Backups)

For production, use PostgreSQL's native `pg_dump` for logical backups:

```bash
# Full database backup
pg_dump -U sms_user -h localhost sms_db > backup-$(date +%Y%m%d-%H%M%S).sql

# Compressed backup
pg_dump -U sms_user -h localhost sms_db | gzip > backup-$(date +%Y%m%d-%H%M%S).sql.gz

# Restore from backup
psql -U sms_user -h localhost sms_db < backup-YYYYMMDD-HHMMSS.sql

# Restore from compressed backup
gunzip -c backup-YYYYMMDD-HHMMSS.sql.gz | psql -U sms_user -h localhost sms_db
```

### 3. AWS S3 Backups

Automated backup to AWS S3 for production:

```bash
# Install AWS CLI
pip install awscli

# Configure AWS credentials
aws configure

# Backup to S3
pg_dump -U sms_user -h localhost sms_db | \
  gzip | \
  aws s3 cp - s3://sms-backups-prod/backup-$(date +%Y%m%d-%H%M%S).sql.gz

# List backups
aws s3 ls s3://sms-backups-prod/

# Restore from S3
aws s3 cp s3://sms-backups-prod/backup-YYYYMMDD-HHMMSS.sql.gz - | \
  gunzip | psql -U sms_user -h localhost sms_db
```

### 4. Automated Backups with Cron

Create a backup script (`/usr/local/bin/backup-sms-db.sh`):

```bash
#!/bin/bash

BACKUP_DIR="/backups"
S3_BUCKET="sms-backups-prod"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/sms-db-${TIMESTAMP}.sql.gz"

# Create backup
echo "Starting backup at $(date)"
pg_dump -U sms_user -h postgres sms_db | gzip > ${BACKUP_FILE}

if [ $? -eq 0 ]; then
  echo "Backup completed successfully: ${BACKUP_FILE}"
  
  # Upload to S3
  aws s3 cp ${BACKUP_FILE} s3://${S3_BUCKET}/$(basename ${BACKUP_FILE})
  echo "Uploaded to S3: s3://${S3_BUCKET}/$(basename ${BACKUP_FILE})"
  
  # Clean old backups (local)
  find ${BACKUP_DIR} -name "sms-db-*.sql.gz" -mtime +${RETENTION_DAYS} -delete
  echo "Cleaned up backups older than ${RETENTION_DAYS} days"
else
  echo "Backup failed!"
  exit 1
fi

echo "Backup process completed at $(date)"
```

Add to crontab for daily backups at 2 AM:

```bash
0 2 * * * /usr/local/bin/backup-sms-db.sh >> /var/log/sms-backup.log 2>&1
```

### 5. Backup Verification

Periodically verify backups:

```bash
# List and verify backup integrity
gzip -t /backups/sms-db-*.sql.gz

# Test restore in a test database
createdb sms_db_test
gunzip -c /backups/sms-db-YYYYMMDD-HHMMSS.sql.gz | psql -U sms_user sms_db_test
psql -U sms_user sms_db_test -c "SELECT count(*) FROM users;"
dropdb sms_db_test
```

## Backup Schedule

- **Frequency**: Daily at 2 AM (UTC)
- **Retention**: 30 days local, 90 days in S3
- **Verification**: Weekly automated integrity checks
- **Recovery Testing**: Monthly test restores

## Disaster Recovery Plan

### RTO (Recovery Time Objective): 1 hour
### RPO (Recovery Point Objective): 24 hours

**Steps to recover:**

1. Provision new database server (5 min)
2. Download backup from S3 (5 min)
3. Restore database (30 min)
4. Verify data integrity (10 min)
5. Update application connection (2 min)
6. Restart services (3 min)

## Monitoring and Alerts

Monitor backup success:

```bash
# Check latest backup
ls -lh /backups/sms-db-*.sql.gz | tail -1

# Monitor backup size
du -h /backups/

# Set up alerts
# - CloudWatch: Backup job failure
# - SNS: Send email notification
# - PagerDuty: Incident if backup fails 2 days
```

## Storage Considerations

- **Local backup size**: ~500MB - 2GB per backup
- **S3 storage cost**: ~$0.023 per GB/month
- **Monthly cost estimate**: $10-50 for 30-day retention

## Security

- Encrypt backups at rest (S3 encryption)
- Use IAM roles for S3 access
- Rotate backup credentials monthly
- Test backup restoration monthly
- Keep backups in separate AWS account (optional)
