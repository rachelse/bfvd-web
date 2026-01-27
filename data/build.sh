# Run like:
#   ./build.sh <db.sqlite3> <members.tsv> <clusters.tsv>
# Where:
#   members.tsv  = rep_id, mem_id, flag, tax_id
#   clusters.tsv = acc, is_dark, n_mem, rep_len, avg_len, rep_plddt, avg_plddt, lca_tax_id

sqlite3 $1 << EOF
CREATE TABLE member (
	accession INTEGER PRIMARY KEY,
	diclu_rep_accession INTEGER,
	intclu_rep_accession INTEGER,
	tax_id1 TEXT,
	tax_id2 TEXT,
	flag INTEGER,
	uniprot_id1 TEXT,
	uniprot_id2 TEXT,
	pdb_id TEXT,
	chain1 TEXT,
	chain2 TEXT,
	chain1_id INTEGER,
	chain2_id INTEGER
);

CREATE TABLE cluster (
	intclu_rep_accession INTEGER PRIMARY KEY,
	rep_len INTEGER,
	rep_plddt REAL,
	is_dark BOOLEAN,
	n_mem INTEGER,
	avg_len INTEGER,
	avg_plddt REAL,
	lca_tax_id INTEGER
);

PRAGMA journal_mode=OFF;
PRAGMA synchronous=OFF;
PRAGMA locking_mode=EXCLUSIVE;
PRAGMA temp_store=file;
PRAGMA cache_size=4000000000;
PRAGMA max_page_limit=13107200;

-- Import data into temp tables
.mode tabs

CREATE TABLE tmpMember (
	intclu_id INTEGER,
	diclu_id INTEGER,
	mem_id INTEGER,
	flag INTEGER,
	tax_id1 INTEGER,
	tax_id2 INTEGER,
	pdb_id TEXT,
	chain1 TEXT,
	chain2 TEXT,
	uniprot_id1 TEXT,
	uniprot_id2 TEXT,
	chain1_id INTEGER,
	chain2_id INTEGER
);

CREATE TABLE tmpCluster (
	rep_id INTEGER,
	is_dark BOOLEAN,
	n_mem INTEGER,
	rep_len INTEGER,
	avg_len REAL,
	rep_plddt REAL,
	avg_plddt REAL,
	lca_tax_id INTEGER
);

.import "${2}" tmpMember
.import "${3}" tmpCluster

-- Process names
UPDATE tmpMember
SET pdb_id = SUBSTR(pdb_id, 1, INSTR(pdb_id, '-assembly') - 1);

-- Insert members & index on accession
INSERT INTO member (accession, diclu_rep_accession, intclu_rep_accession, flag, 
					tax_id1, tax_id2, uniprot_id1, uniprot_id2, pdb_id, chain1, chain2, chain1_id, chain2_id)
SELECT mem_id, diclu_id, intclu_id, flag, 
		tax_id1, tax_id2, uniprot_id1, uniprot_id2, pdb_id, chain1, chain2, chain1_id, chain2_id
FROM tmpMember;

-- Index on member accessions
CREATE INDEX member_acc_idx
ON member(accession);

-- Index on member representative accessions
CREATE INDEX member_rep_idx
ON member(intclu_rep_accession);

-- Index on UniProt IDs
CREATE INDEX member_uniprot1_idx
ON member(uniprot_id1);
CREATE INDEX member_uniprot2_idx
ON member(uniprot_id2);

-- Insert clusters
INSERT INTO cluster (intclu_rep_accession, is_dark, n_mem, rep_len, avg_len, rep_plddt, avg_plddt, lca_tax_id)
SELECT rep_id, is_dark, n_mem, rep_len, avg_len, rep_plddt, avg_plddt, lca_tax_id
FROM tmpCluster;

-- Index on cluster representative accessions
CREATE INDEX cluster_rep_idx
ON cluster(intclu_rep_accession);

-- Index on cluster lca tax id
CREATE INDEX cluster_lca_tax_id_idx
ON cluster(lca_tax_id);

-- Cleanup
DROP TABLE IF EXISTS tmpMember;
DROP TABLE IF EXISTS tmpCluster;
EOF

