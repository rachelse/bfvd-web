#!/bin/bash
# Per-cluster lowest common ancestor from the SEQUENCE CLUSTERING, via MMseqs2's own
# `lca` module -- the same approach BFVD v1 used (bfvd-analysis/script/lca.sh).
#
# What is actually being computed: for each sequence cluster, fold the NCBI taxa of its
# members to their lowest common ancestor. Structure prediction plays no part; ProteinTTT
# is irrelevant here.
#
# `mmseqs lca <targetDB> <resultDB> <lcaDB>` takes the clustering as the *result* DB.
# The target DB is only a carrier: it supplies the key -> taxid mapping and the taxonomy,
# and its keys must be the key space the clustering was built on. Nothing of its payload
# is read.
#
# That key space is bfvd_v2's. Beware: bfvd_v2 and bfvd_v2_proteinttt agree on most keys
# but diverge at 396 of them, because short 6-character accessions order differently
# between the two. Passing the ProteinTTT database here silently mislabels those
# clusters, so the output is checked against the clustering TSV before being accepted.
#
# Usage:
#   ACC2TAXID=<accession<TAB>taxid> \
#   make_lca.sh <clustered-seq-db> <clustering-db> <clustering-tsv> <taxdump> <work> <out.tsv>
#
# Output columns: cluster_id, lca_tax_id, rank, scientific_name
set -euo pipefail

SEQDB="${1:?the sequence db the clustering was built on (defines its key space)}"
CLUDB="${2:?clustering db, e.g. .../bfvd_v2_seqclu}"
CLUTSV="${3:?clustering tsv, used to verify the cluster ids}"
TAXDUMP="${4:?NCBI taxdump directory}"
WORK="${5:?work dir}"
OUT="${6:?output tsv}"
SUFFIX='_unrelaxed_rank_001_alphafold2_ptm_model_4_seed_000'

command -v mmseqs >/dev/null || { echo "mmseqs not on PATH (conda env bfvd-analysis)" >&2; exit 1; }
: "${ACC2TAXID:?set ACC2TAXID to an accession<TAB>taxid file}"
for f in "$SEQDB.index" "$SEQDB.lookup" "${SEQDB}_h.index" "$CLUDB.index" \
         "$CLUTSV" "$TAXDUMP/nodes.dmp" "$ACC2TAXID"; do
    [ -f "$f" ] || { echo "missing input: $f" >&2; exit 1; }
done

OUT="$(readlink -f "$OUT" 2>/dev/null || echo "$OUT")"
CLUTSV="$(readlink -f "$CLUTSV")"
mkdir -p "$WORK"
cd "$WORK"

# Symlink the inputs so createtaxdb writes its _mapping and _taxonomy here rather than
# into the shared database directory.
for ext in "" .index .dbtype .lookup .source; do
    [ -f "$SEQDB$ext" ] && ln -sf "$SEQDB$ext" "seqdb$ext"
done
for ext in "" .index .dbtype; do
    ln -sf "${SEQDB}_h$ext" "seqdb_h$ext"
done
ln -sf "$CLUDB" cludb
ln -sf "$CLUDB.index" cludb.index
ln -sf "$CLUDB.dbtype" cludb.dbtype
for part in "$CLUDB".[0-9]*; do
    [ -e "$part" ] && ln -sf "$part" "cludb.${part##*.}"
done

# createtaxdb matches its mapping file against the .lookup names, which carry the
# ColabFold suffix, so key the mapping by those names rather than bare accessions.
echo "building name -> taxid mapping ..."
awk -F'\t' 'NR==FNR { t[$1] = $2; next }
            { a = $2; sub(/_.*/, "", a); if (a in t) print $2 "\t" t[a] }' \
    "$ACC2TAXID" "$SEQDB.lookup" > name2taxid.tsv

echo "createtaxdb ..."
mmseqs createtaxdb seqdb tmp \
    --ncbi-tax-dump "$TAXDUMP" \
    --tax-mapping-file name2taxid.tsv \
    --tax-mapping-mode 0 > createtaxdb.log 2>&1

echo "lca ..."
mmseqs lca seqdb cludb lcadb > lca.log 2>&1

echo "createtsv ..."
mmseqs createtsv seqdb lcadb lca_raw.tsv > createtsv.log 2>&1
sed "s/${SUFFIX}//" lca_raw.tsv > "$OUT"

# The clustering TSV is the ground truth for which accessions are representatives. If
# the key space were wrong, the ids here would not match it.
echo "verifying cluster ids against $CLUTSV ..."
cut -f1 "$CLUTSV" | sed "s/${SUFFIX}//" | LC_ALL=C sort -u > expected_reps.txt
cut -f1 "$OUT" | LC_ALL=C sort -u > got_reps.txt
if ! cmp -s expected_reps.txt got_reps.txt; then
    echo "FAIL: cluster ids disagree with the clustering -- wrong key space?" >&2
    echo "  only in clustering: $(comm -23 expected_reps.txt got_reps.txt | wc -l)" >&2
    echo "  only in lca output: $(comm -13 expected_reps.txt got_reps.txt | wc -l)" >&2
    exit 1
fi
rm -f expected_reps.txt got_reps.txt

echo "wrote $OUT ($(wc -l < "$OUT") clusters)"
