# Backup Strategy Documentation

## Overview

This document outlines the backup strategy for Talk-To-My-Lawyer to ensure data safety and business continuity.

## Critical Data

### 1. Database (Supabase PostgreSQL)
- User profiles
- Letters and content
- Subscriptions
- Audit trails
- Commissions and payouts

### 2. Configuration
- Environment variables
- API keys and secrets
- Supabase configuration

### 3. Code Repository
- Application source code
- Database migrations
- Documentation

## Backup Schedule

### Automated Backups (Supabase)

| Data Type | Frequency | Retention | Location |
|-----------|-----------|-----------|----------|
| Database | Daily (automated) | 7 days (free tier) | Supabase Cloud |
| Database | Weekly | 4 weeks | Supabase Cloud |
| Point-in-Time Recovery | Continuous | 7 days | Supabase Cloud (Pro+) |

### Manual Backups

| Data Type | Frequency | Retention | Location |
|-----------|-----------|-----------|----------|
| Database Export | Weekly | 30 days | S3/GCS bucket |
| Configuration | On change | Indefinite | Secure storage |
| Code | On commit | Indefinite | GitHub |

## Supabase Backup Configuration

### Enable Automatic Backups

1. Go to Supabase Dashboard
2. Navigate to Settings > Database
3. Enable "Daily Backups"
4. Set retention period (7-30 days based on plan)
5. Configure backup window (off-peak hours)

### Point-in-Time Recovery (PITR)

Available on Pro plan and above:
- Continuous backup of all database changes
- Restore to any point within retention window
- 7-day retention on Pro, 30-day on Enterprise

## Manual Backup Procedures

### Database Backup

```bash
#!/bin/bash
# scripts/backup-database.sh

# Set variables
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/db_backup_${TIMESTAMP}.sql"

# Create backup directory
mkdir -p ${BACKUP_DIR}

# Export database using pg_dump
pg_dump $DATABASE_URL > ${BACKUP_FILE}

# Compress backup
gzip ${BACKUP_FILE}

# Upload to S3 (optional)
# aws s3 cp ${BACKUP_FILE}.gz s3://your-bucket/backups/

# Remove local backups older than 30 days
find ${BACKUP_DIR} -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

### Restore from Backup

```bash
#!/bin/bash
# scripts/restore-database.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./restore-database.sh <backup-file.sql.gz>"
  exit 1
fi

# Decompress backup
gunzip -c ${BACKUP_FILE} > restore.sql

# Restore database
psql $DATABASE_URL < restore.sql

# Cleanup
rm restore.sql

echo "Database restored from: ${BACKUP_FILE}"
```

## Configuration Backup

### Environment Variables

```bash
#!/bin/bash
# scripts/backup-env.sh

# IMPORTANT: Store encrypted in secure location only
# NEVER commit to git

BACKUP_DIR="./backups/config"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p ${BACKUP_DIR}

# Copy .env.production (be very careful with this!)
# Should be encrypted before storage
cp .env.production ${BACKUP_DIR}/env_${TIMESTAMP}.backup

# Encrypt the backup
gpg --symmetric --cipher-algo AES256 ${BACKUP_DIR}/env_${TIMESTAMP}.backup

# Remove unencrypted file
rm ${BACKUP_DIR}/env_${TIMESTAMP}.backup

echo "Config backed up (encrypted): ${BACKUP_DIR}/env_${TIMESTAMP}.backup.gpg"
```

## Disaster Recovery Plan

### Recovery Time Objective (RTO)

Maximum acceptable downtime: **4 hours**

### Recovery Point Objective (RPO)

Maximum acceptable data loss: **24 hours**

### Recovery Procedures

#### Scenario 1: Database Corruption

1. **Assess damage**
   ```bash
   # Check health
   curl https://yourdomain.com/api/health
   ```

2. **Stop application** (if necessary)
   ```bash
   # Vercel: Disable deployments
   # Docker: docker-compose down
   ```

3. **Restore from Supabase backup**
   - Go to Supabase Dashboard
   - Database > Backups
   - Select backup point
   - Click "Restore"
   - Confirm restoration

4. **Verify data integrity**
   ```bash
   # Run health check
   pnpm health-check
   
   # Verify critical tables
   # Check recent data
   ```

5. **Resume application**
   ```bash
   # Redeploy or start services
   ```

**Estimated Recovery Time: 1-2 hours**

#### Scenario 2: Complete Infrastructure Failure

1. **Assess situation**
   - Determine scope of failure
   - Check provider status pages

2. **Deploy to backup infrastructure**
   ```bash
   # Option A: Deploy to alternative Vercel project
   vercel --prod
   
   # Option B: Deploy to Docker/self-hosted
   docker-compose up -d
   ```

3. **Restore database**
   - Create new Supabase project (if needed)
   - Restore from latest backup
   - Update connection strings

4. **Update DNS**
   - Point domain to new infrastructure
   - Wait for propagation (5-60 minutes)

5. **Verify all services**
   - Test critical flows
   - Check integrations

**Estimated Recovery Time: 2-4 hours**

#### Scenario 3: Accidental Data Deletion

1. **Stop further deletions**
   - Identify affected users/data
   - Disable affected API endpoints if needed

2. **Restore from PITR** (if available)
   ```sql
   -- Supabase Dashboard > Database > Point in Time Recovery
   -- Select time before deletion
   -- Restore specific tables or entire database
   ```

3. **Or restore from daily backup**
   - May lose up to 24 hours of data
   - Merge recent data if possible

4. **Verify restoration**
   - Check affected records
   - Notify affected users

**Estimated Recovery Time: 30 minutes - 2 hours**

## Testing Backups

### Monthly Backup Test

**First Tuesday of each month:**

1. Download latest backup
2. Restore to staging environment
3. Verify data integrity
4. Test critical functionality
5. Document any issues
6. Clean up staging data

### Test Checklist

- [ ] Backup file is accessible
- [ ] Backup file is not corrupted
- [ ] Restoration completes without errors
- [ ] All tables are present
- [ ] Row counts match production
- [ ] Critical queries work
- [ ] Application functions correctly
- [ ] Authentication works
- [ ] Payments can be processed (test mode)

## Backup Monitoring

### Alerts to Configure

- Backup job failures
- Backup file size anomalies
- Missing daily backups
- Storage quota approaching limit

### Verification

```bash
#!/bin/bash
# scripts/verify-backups.sh

# Check if today's backup exists
BACKUP_DATE=$(date +%Y%m%d)
BACKUP_EXISTS=$(aws s3 ls s3://your-bucket/backups/ | grep ${BACKUP_DATE})

if [ -z "$BACKUP_EXISTS" ]; then
  echo "ERROR: No backup found for ${BACKUP_DATE}"
  # Send alert
  exit 1
else
  echo "✅ Backup verified for ${BACKUP_DATE}"
fi
```

## Off-site Backup Storage

### Recommended Services

1. **AWS S3**
   - Glacier for long-term storage
   - Versioning enabled
   - Server-side encryption

2. **Google Cloud Storage**
   - Coldline or Archive class
   - Object versioning
   - Customer-managed encryption

3. **Azure Blob Storage**
   - Archive tier
   - Soft delete enabled
   - Encryption at rest

### Backup Retention Policy

| Backup Age | Frequency | Location |
|------------|-----------|----------|
| 0-7 days | Daily | Supabase + S3 |
| 1-4 weeks | Weekly | S3 |
| 1-3 months | Monthly | S3 Glacier |
| 3-12 months | Quarterly | S3 Glacier Deep Archive |
| 1+ years | Yearly | S3 Glacier Deep Archive |

## Security Considerations

### Encryption

- All backups encrypted at rest
- Use AES-256 encryption
- Separate encryption keys from backups
- Rotate encryption keys annually

### Access Control

- Limit backup access to authorized personnel only
- Use MFA for backup access
- Audit backup access logs
- Separate backup credentials from production

### Compliance

- GDPR: User data in backups subject to deletion requests
- Retention: Follow legal requirements (7 years for payment data)
- Audit: Maintain backup access logs

## Cost Optimization

### Storage Costs

- Use compression (gzip) for SQL dumps
- Move old backups to cold storage
- Delete unnecessary backups per retention policy
- Use incremental backups where possible

### Estimated Costs

**Monthly Backup Storage (assuming 10GB database):**

```
Daily backups (7 days):    7 × 10GB = 70GB
Weekly backups (4 weeks):  4 × 10GB = 40GB
Monthly backups (3):       3 × 10GB = 30GB
Total:                     ~140GB

S3 Standard: ~$3.22/month
S3 Glacier:  ~$0.58/month (for older backups)
```

## Emergency Contacts

### Backup Recovery Team

- **Primary**: DevOps Lead
- **Secondary**: CTO
- **Database Admin**: External consultant (if applicable)

### Service Providers

- **Supabase Support**: support@supabase.com
- **Vercel Support**: support@vercel.com
- **AWS Support**: Enterprise support number

## Changelog

- **2024-12-26**: Initial backup strategy documented
- Future updates to be logged here

---

**Last Updated**: December 26, 2024
**Next Review**: March 26, 2025
