#!/bin/bash
# Validate a staged BFVD v2 dataset before it is swapped into data/.
#
# Exits non-zero if any check fails. Checks that would otherwise fail silently at
# runtime (index sort order, pLDDT/sequence length parity) are the point of this
# script -- dbreader.mjs binary-searches its index and the viewer indexes the pLDDT
# string positionally, so neither errors when wrong, it just returns nonsense.
#
# Usage: validate.sh <out-dir> <taxdump-dir> [expected-entries]
set -uo pipefail

OUT="${1:?staged out dir}"
TAX="${2:?taxdump dir}"
N_EXPECT="${3:-5776417}"
N_CLUSTER_EXPECT=647298
DB="$OUT/afdb-clusters.sqlite3"

fail=0
ok   () { echo "  PASS  $*"; }
bad  () { echo "  FAIL  $*"; fail=1; }
skip () { echo "  SKIP  $*"; }
head_() { echo; echo "== $*"; }

# ---------------------------------------------------------------- 1. key parity
head_ "1. index key counts and key sets"
DBS=(afdb afdb_ca afdb_plddt afdb_desc)
[ -f "$OUT/ava_db.index" ] && DBS+=(ava_db)
for d in "${DBS[@]}"; do
    f="$OUT/$d.index"
    if [ ! -f "$f" ]; then bad "$d.index missing"; continue; fi
    n=$(wc -l < "$f")
    if [ "$d" = "ava_db" ]; then
        ok "$d.index $n keys (ava may legitimately cover a subset)"
    elif [ "$n" -eq "$N_EXPECT" ]; then ok "$d.index $n keys"
    else bad "$d.index has $n keys, expected $N_EXPECT"; fi
done

if [ -f "$OUT/afdb.index" ]; then
    for d in afdb_ca afdb_plddt afdb_desc; do
        [ -f "$OUT/$d.index" ] || continue
        if diff -q <(cut -f1 "$OUT/afdb.index") <(cut -f1 "$OUT/$d.index") >/dev/null; then
            ok "$d key set identical to afdb"
        else
            bad "$d key set differs from afdb"
        fi
    done
fi

# --------------------------------------------------- 2. pLDDT / sequence parity
head_ "2. pLDDT length parity (one digit per residue)"
if [ -f "$OUT/afdb.index" ] && [ -f "$OUT/afdb_plddt.index" ]; then
    m=$(diff <(cut -f1,3 "$OUT/afdb.index") <(cut -f1,3 "$OUT/afdb_plddt.index") | grep -c '^<')
    if [ "$m" -eq 0 ]; then ok "every entry's pLDDT string matches its sequence length"
    else bad "$m entries have a pLDDT/sequence length mismatch"; fi
else
    skip "afdb or afdb_plddt index missing"
fi

# ------------------------------------------------------------ 3. index sortedness
head_ "3. index sort order (LC_ALL=C)"
for d in "${DBS[@]}"; do
    f="$OUT/$d.index"
    [ -f "$f" ] || continue
    if LC_ALL=C sort -c -k1,1 "$f" 2>/dev/null; then ok "$d.index sorted"
    else bad "$d.index NOT sorted - dbreader would return wrong records"; fi
done

# --------------------------------------------------------------- 4. blob offsets
head_ "4. index offsets within blob"
for d in "${DBS[@]}"; do
    f="$OUT/$d.index"; b="$OUT/$d"
    [ -f "$f" ] && [ -f "$b" ] || continue
    size=$(stat -c%s "$b")
    end=$(gawk -F'\t' '{ e = $2 + $3; if (e > m) m = e } END { print m+0 }' "$f")
    if [ "$end" -eq "$size" ]; then ok "$d max(offset+size) == filesize ($size)"
    else bad "$d max(offset+size)=$end but filesize=$size"; fi
done

# ------------------------------------------------------------------- 5-8. sqlite
if [ ! -f "$DB" ]; then
    head_ "5-8. sqlite"; skip "$DB not built yet"
else
    head_ "5. table rows and referential integrity"
    read -r n_entry n_cluster n_ictv n_host n_lin <<<"$(sqlite3 "$DB" "
        SELECT (SELECT COUNT(*) FROM entry), (SELECT COUNT(*) FROM cluster),
               (SELECT COUNT(*) FROM ictv), (SELECT COUNT(*) FROM taxonomy_host),
               (SELECT COUNT(*) FROM taxonomy_lineage);" | tr '|' ' ')"
    echo "  entry=$n_entry cluster=$n_cluster ictv=$n_ictv host=$n_host lineage=$n_lin"
    [ "$n_entry"   -eq "$N_EXPECT" ]         && ok "entry rows"   || bad "entry rows $n_entry != $N_EXPECT"
    [ "$n_cluster" -eq "$N_CLUSTER_EXPECT" ] && ok "cluster rows" || bad "cluster rows $n_cluster != $N_CLUSTER_EXPECT"

    orphan=$(sqlite3 "$DB" "SELECT COUNT(*) FROM entry e LEFT JOIN cluster c ON e.cluster_id=c.cluster_id WHERE c.cluster_id IS NULL;")
    [ "$orphan" -eq 0 ] && ok "every entry.cluster_id exists in cluster" || bad "$orphan entries reference a missing cluster"

    orphan2=$(sqlite3 "$DB" "SELECT COUNT(*) FROM cluster c LEFT JOIN entry e ON c.cluster_id=e.accession WHERE e.accession IS NULL;")
    [ "$orphan2" -eq 0 ] && ok "every cluster representative exists as an entry" || bad "$orphan2 clusters have no representative entry"

    summem=$(sqlite3 "$DB" "SELECT COALESCE(SUM(n_mem),0) FROM cluster;")
    [ "$summem" -eq "$N_EXPECT" ] && ok "SUM(n_mem) == $N_EXPECT" || bad "SUM(n_mem)=$summem != $N_EXPECT"

    head_ "6. flag and is_singleton"
    f1=$(sqlite3 "$DB" "SELECT COUNT(*) FROM entry WHERE flag=1;")
    f2=$(sqlite3 "$DB" "SELECT COUNT(*) FROM entry WHERE flag=2;")
    fx=$(sqlite3 "$DB" "SELECT COUNT(*) FROM entry WHERE flag NOT IN (1,2);")
    echo "  flag1(ColabFold)=$f1 flag2(ProteinTTT)=$f2 other=$fx"
    [ "$f1" -eq 5735893 ] && ok "ColabFold count" || bad "ColabFold count $f1 != 5735893"
    [ "$f2" -eq 40524 ]   && ok "ProteinTTT count" || bad "ProteinTTT count $f2 != 40524"
    [ "$fx" -eq 0 ]       && ok "no other flag values" || bad "$fx rows with an unexpected flag"

    badsing=$(sqlite3 "$DB" "SELECT COUNT(*) FROM cluster WHERE is_singleton <> (n_mem=1);")
    [ "$badsing" -eq 0 ] && ok "is_singleton == (n_mem==1) everywhere" || bad "$badsing rows disagree"

    head_ "7. ICTV 'NA' discipline"
    nulls=$(sqlite3 "$DB" "SELECT COUNT(*) FROM ictv WHERE ictv_id IS NULL OR ictv_id='' OR ictv_accession IS NULL OR ictv_accession='' OR ictv_host IS NULL OR ictv_host='' OR mapping_step IS NULL OR mapping_step='';")
    [ "$nulls" -eq 0 ] && ok "no NULL or empty ICTV values" || bad "$nulls ICTV rows are NULL/empty"
    slash=$(sqlite3 "$DB" "SELECT COUNT(*) FROM ictv WHERE ictv_id='N/A' OR ictv_accession='N/A' OR ictv_host='N/A' OR mapping_step='N/A';")
    [ "$slash" -eq 0 ] && ok "no surviving 'N/A' (normalized to 'NA')" || bad "$slash rows still carry 'N/A'"
    mapped=$(sqlite3 "$DB" "SELECT COUNT(*) FROM ictv WHERE ictv_id<>'NA';")
    echo "  ictv_id mapped: $mapped / $n_ictv"

    head_ "8. entries resolve to an ICTV row"
    miss=$(sqlite3 "$DB" "SELECT COUNT(*) FROM (SELECT DISTINCT tax_id FROM entry) e LEFT JOIN ictv i ON CAST(e.tax_id AS TEXT)=i.tax_id WHERE i.tax_id IS NULL;")
    [ "$miss" -eq 0 ] && ok "every distinct entry.tax_id has an ictv row" || bad "$miss distinct taxids have no ictv row"
fi

# ------------------------------------------------------------------ 9. taxonomy
head_ "9. taxids present in the taxonomy dump"
if [ -f "$DB" ] && [ -f "$TAX/nodes.dmp" ]; then
    unresolved=$(sqlite3 "$DB" "SELECT DISTINCT tax_id FROM entry UNION SELECT DISTINCT lca_tax_id FROM cluster;" \
        | gawk -v nodes="$TAX/nodes.dmp" '
            BEGIN { while ((getline line < nodes) > 0) { split(line, a, "\t|\t"); known[a[1]] = 1 } }
            $1 != "" && $1 != 0 && !($1 in known) { n++ }
            END { print n+0 }')
    if [ "$unresolved" -eq 0 ]; then ok "all taxids resolve in nodes.dmp"
    else echo "  NOTE  $unresolved taxids absent from nodes.dmp (obsolete taxids do occur)"; fi
else
    skip "db or nodes.dmp missing"
fi

echo
if [ "$fail" -eq 0 ]; then echo "ALL CHECKS PASSED"; else echo "SOME CHECKS FAILED"; fi
exit "$fail"
