#!/bin/bash
# Create afdb-clusters.sqlite3 from the TSVs produced by build_tables.sh.
#
# Indices are built AFTER the import; creating them first makes a 5.8M-row import
# dramatically slower.
#
# Usage: load_db.sh <db-path> <schema.sql> <tsv-dir>
set -euo pipefail

DB="${1:?db path}"
SCHEMA="${2:?schema.sql}"
TSV="${3:?tsv dir}"

for f in entry.tsv cluster.tsv ictv.tsv taxonomy-accession_host.tsv \
         taxonomy-parent_child.tsv; do
    [ -f "$TSV/$f" ] || { echo "missing: $TSV/$f" >&2; exit 1; }
done
[ -f "$SCHEMA" ] || { echo "missing schema: $SCHEMA" >&2; exit 1; }

rm -f -- "$DB" "$DB-journal"
echo "loading $DB ..."

sqlite3 "$DB" <<SQL
PRAGMA page_size=8192;
PRAGMA journal_mode=OFF;
PRAGMA synchronous=OFF;
PRAGMA locking_mode=EXCLUSIVE;
PRAGMA temp_store=file;
PRAGMA cache_size=-4000000;

.read ${SCHEMA}

.mode tabs
.import "${TSV}/entry.tsv" entry
.import "${TSV}/cluster.tsv" cluster
.import "${TSV}/ictv.tsv" ictv
.import "${TSV}/taxonomy-accession_host.tsv" taxonomy_host
.import "${TSV}/taxonomy-parent_child.tsv" taxonomy_lineage

CREATE INDEX entry_cluster_idx    ON entry(cluster_id);
CREATE INDEX entry_tax_idx        ON entry(tax_id);
CREATE INDEX cluster_lca_idx      ON cluster(lca_tax_id);
CREATE INDEX taxonomy_lineage_idx ON taxonomy_lineage(parent);
CREATE INDEX taxonomy_host_idx    ON taxonomy_host(accession);

ANALYZE;
SQL

echo "row counts:"
sqlite3 "$DB" <<'SQL'
.mode column
SELECT 'entry'            AS "table", COUNT(*) AS rows FROM entry
UNION ALL SELECT 'cluster',          COUNT(*) FROM cluster
UNION ALL SELECT 'ictv',             COUNT(*) FROM ictv
UNION ALL SELECT 'taxonomy_host',    COUNT(*) FROM taxonomy_host
UNION ALL SELECT 'taxonomy_lineage', COUNT(*) FROM taxonomy_lineage;
SQL
ls -la "$DB"
