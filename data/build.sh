# Run like:
#   ./build.sh <db.sqlite3> <members.tsv> <clusters.tsv>
# Where:
#   members.tsv  = rep_id, mem_id, flag, tax_id
#   clusters.tsv = acc, is_dark, n_mem, rep_len, avg_len, rep_plddt, avg_plddt, lca_tax_id

sqlite3 $1 << EOF
CREATE TABLE member (
	accession TEXT PRIMARY KEY,
	diclu_rep_accession TEXT,
	intclu_rep_accession TEXT,
	tax_id1 TEXT,
	tax_id2 TEXT,
	flag INTEGER,
	uniprot_id1 TEXT,
	uniprot_id2 TEXT,
	pdb_id TEXT,
	chain1 TEXT,
	chain2 TEXT,
	chain1_id TEXT,
	chain2_id TEXT,
	protein1_status BOOLEAN,
	protein2_status BOOLEAN,
	iftype1 INTEGER,
	iftype2 INTEGER
);

CREATE TABLE cluster (
	intclu_rep_accession TEXT PRIMARY KEY,
	n_mem INTEGER,
	lca_tax_id INTEGER,
	lca_tax_chain1_id INTEGER,
	lca_tax_chain2_id INTEGER,

	ord_disdis_pct REAL,
	ord_disord_pct REAL,
	ord_ordord_pct REAL,
	ord_unanno_pct REAL,

	ss_mixedaB_pct REAL,
	ss_mostlya_pct REAL,
	ss_onlyaB_pct REAL,
	ss_other_pct REAL
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
	intclu_id TEXT,
	diclu_id TEXT,
	mem_id TEXT,
	flag INTEGER,
	tax_id1 INTEGER,
	tax_id2 INTEGER,
	pdb_id TEXT,
	chain1 TEXT,
	chain2 TEXT,
	uniprot_id1 TEXT,
	uniprot_id2 TEXT,
	chain1_id TEXT,
	chain2_id TEXT,
	protein1_status BOOLEAN,
	protein2_status BOOLEAN,
	iftype1 INTEGER,
	iftype2 INTEGER
);

CREATE TABLE tmpCluster (
	rep_id TEXT,
	n_mem INTEGER,
	lca_tax_id INTEGER,
	lca_tax_chain1_id INTEGER,
	lca_tax_chain2_id INTEGER,

	ord_disdis_pct REAL,
	ord_disord_pct REAL,
	ord_ordord_pct REAL,
	ord_unanno_pct REAL,
	ss_mixedaB_pct REAL,
	ss_mostlya_pct REAL,
	ss_onlyaB_pct REAL,
	ss_other_pct REAL
);

.import "${2}" tmpMember
.import "${3}" tmpCluster

-- Process names
UPDATE tmpMember
SET pdb_id = SUBSTR(pdb_id, 1, INSTR(pdb_id, '-assembly') - 1);

-- Insert members & index on accession
INSERT INTO member (accession, diclu_rep_accession, intclu_rep_accession, flag, 
					tax_id1, tax_id2, uniprot_id1, uniprot_id2, pdb_id, 
					chain1, chain2, chain1_id, chain2_id, protein1_status, protein2_status, iftype1, iftype2)
SELECT mem_id, diclu_id, intclu_id, flag, 
		tax_id1, tax_id2, uniprot_id1, uniprot_id2, pdb_id, 
		chain1, chain2, chain1_id, chain2_id, protein1_status, protein2_status, iftype1, iftype2
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
INSERT INTO cluster (intclu_rep_accession, n_mem, lca_tax_id, lca_tax_chain1_id, lca_tax_chain2_id,
					ord_disdis_pct, ord_disord_pct, ord_ordord_pct, ord_unanno_pct,
					ss_mixedaB_pct, ss_mostlya_pct, ss_onlyaB_pct, ss_other_pct)
SELECT rep_id, n_mem, lca_tax_id, lca_tax_chain1_id, lca_tax_chain2_id,
		ord_disdis_pct, ord_disord_pct, ord_ordord_pct, ord_unanno_pct,
		ss_mixedaB_pct, ss_mostlya_pct, ss_onlyaB_pct, ss_other_pct
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