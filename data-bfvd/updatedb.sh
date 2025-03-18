## USAGE: ./updatedb.sh <db.sqlite3> <clusters.tsv>
sqlite3 $1 << EOF
DROP TABLE IF EXISTS tmpUpdate;

-- Create temporary table for update data
CREATE TABLE tmpUpdate (
	rep_accession TEXT,
	is_dark BOOLEAN,
	n_mem INTEGER,
	rep_len INTEGER,
	avg_len REAL,
	rep_plddt REAL,
	avg_plddt REAL,
	lca_tax_id INTEGER
);

-- Set mode for tab-separated values and import the update TSV
.mode tabs
.import "${2}" tmpUpdate

-- Update the cluster table based on rep_accession
UPDATE cluster
SET rep_plddt = (
    SELECT tmpUpdate.rep_plddt
    FROM tmpUpdate
    WHERE tmpUpdate.rep_accession = cluster.rep_accession
),
avg_plddt = (
    SELECT tmpUpdate.avg_plddt
    FROM tmpUpdate
    WHERE tmpUpdate.rep_accession = cluster.rep_accession
)
WHERE rep_accession IN (SELECT rep_accession FROM tmpUpdate);

-- Optionally, drop the temporary update table after the update
DROP TABLE tmpUpdate;
EOF

