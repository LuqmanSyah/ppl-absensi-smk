#!/usr/bin/env bash
# Backup database PostgreSQL (S3-09, NFR-04).
#
# Pemakaian:
#   ./scripts/backup-db.sh                 # simpan ke ./backups, simpan 14 backup terakhir
#   BACKUP_DIR=/mnt/backup KEEP=30 ./scripts/backup-db.sh
#
# Butuh `pg_dump` (paket postgresql-client) ATAU container database dari docker-compose.yml.
# Membaca DATABASE_URL dari environment atau file .env.
set -euo pipefail

cd "$(dirname "$0")/.."
BACKUP_DIR="${BACKUP_DIR:-./backups}"
KEEP="${KEEP:-14}"

if [ -z "${DATABASE_URL:-}" ] && [ -f .env ]; then
  DATABASE_URL="$(grep -E '^DATABASE_URL=' .env | head -1 | cut -d= -f2- | tr -d '"')"
fi
if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL tidak ditemukan." >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
FILE="$BACKUP_DIR/absensi-$(date +%Y%m%d-%H%M%S).dump"

if command -v pg_dump >/dev/null 2>&1; then
  pg_dump --format=custom --no-owner --file="$FILE" "$DATABASE_URL"
else
  # Tanpa pg_dump di komputer: jalankan pg_dump di dalam container database.
  ENGINE="$(command -v docker || command -v podman || true)"
  if [ -z "$ENGINE" ]; then
    echo "pg_dump, docker, atau podman tidak ditemukan." >&2
    exit 1
  fi
  DB_NAME="$(echo "$DATABASE_URL" | sed -E 's#.*/([^/?]+)(\?.*)?$#\1#')"
  DB_USER="$(echo "$DATABASE_URL" | sed -E 's#^[a-z]+://([^:@]+).*#\1#')"
  "$ENGINE" exec absensi-db pg_dump --format=custom --no-owner -U "$DB_USER" "$DB_NAME" > "$FILE"
fi

echo "Backup tersimpan: $FILE ($(du -h "$FILE" | cut -f1))"

# Hapus backup lama, simpan $KEEP terbaru.
ls -1t "$BACKUP_DIR"/absensi-*.dump 2>/dev/null | tail -n +"$((KEEP + 1))" | xargs -r rm --
