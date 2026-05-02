#!/bin/bash

# Configuration
DB_NAME="sms"
DB_USER="postgres"
BACKUP_DIR="/var/backups/sms"
RETENTION_DAYS=7
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/sms_db_$TIMESTAMP.sql.gz"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "Starting database backup for $DB_NAME..."

# Perform backup using pg_dump
# Note: This assumes the .pgpass file is configured or password is not required (e.g., peer auth on localhost)
pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "Backup successful: $BACKUP_FILE"
    
    # Remove backups older than RETENTION_DAYS
    echo "Cleaning up old backups (older than $RETENTION_DAYS days)..."
    find "$BACKUP_DIR" -type f -name "sms_db_*.sql.gz" -mtime +$RETENTION_DAYS -exec rm {} \;
    echo "Cleanup complete."
else
    echo "ERROR: Backup failed!"
    exit 1
fi
