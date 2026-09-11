#!/bin/bash
# Build the five import TSVs for the BFVD v2 webserver database.
#
#   entry.tsv                    accession, len, plddt, tax_id, flag, cluster_id
#   cluster.tsv                  cluster_id, n_mem, avg_len, avg_plddt, is_singleton, lca_tax_id
#   ictv.tsv                     tax_id, ictv_id, ictv_accession, ictv_host, mapping_step
#   taxonomy-accession_host.tsv  accession, tax_id
#   taxonomy-parent_child.tsv    parent, child
#
#   flag        1 = ColabFold-AF2, 2 = ESMFold+ProteinTTT_MSA
#   lca_tax_id  read from make_lca.sh's output, which uses `mmseqs lca` over the
#               sequence clustering -- not computed here
#   'NA'        every absent ICTV value, never NULL or ''
#
# No ictv_species column: resolved to its species-rank ancestor, the NCBI scientific
# name equals the ICTV species for 176,302 of 176,330 mapped taxids (100.0%), so the
# entry page reads species off the NCBI tree instead.
#
# Usage: build_tables.sh <bfvd2-root> <taxdump-dir> <out-dir> <lca.tsv>
set -euo pipefail

B="${1:?bfvd2 root}"
TAX="${2:?taxdump dir with nodes.dmp/merged.dmp}"
OUT="${3:?out dir}"
LCA="${4:?lca tsv from make_lca.sh}"
A="$B/analyses"

SEQCLU="$B/work/cluster/bfvd_v2_seqclu.tsv"
SCORES="$B/proteinttt/bfvd2_final_release/bfvd2_proteinttt_integrated.tsv"
LENGTHS="$B/data/uniprot_2025_03_virus_1st-acc_len_lentrimmed_unk_netunk_batchid.tsv"
TAXIDS="$B/data/bfvd2_uniprot_2025_03_1st-acc_taxid_taxname_host.tsv"
ICTV_MAP="$A/09_ictv_taxonomy_mapping/results/bfvd_taxid_ictv_mapping.tsv"
ICTV_ACC="$A/09_ictv_taxonomy_mapping/results/vmr_accessions_long.tsv"
ICTV_HOST="$A/07_host_coverage/results/ictv_host_by_species.tsv"
NODES="$TAX/nodes.dmp"
MERGED="$TAX/merged.dmp"
ROOT=10239

for f in "$SEQCLU" "$SCORES" "$LENGTHS" "$TAXIDS" "$ICTV_MAP" "$ICTV_ACC" \
         "$ICTV_HOST" "$NODES" "$MERGED" "$LCA"; do
    [ -f "$f" ] || { echo "missing input: $f" >&2; exit 1; }
done
mkdir -p "$OUT"

say () { echo "[$(date +%H:%M:%S)] $*"; }

# ---------------------------------------------------------------- entry.tsv
# UniProt accessions contain no underscore, so cutting at the first one strips the
# '_unrelaxed_rank_001_...' suffix the clustering carries.
say "entry.tsv"
gawk -F'\t' '
    # RS strips CR: several of these inputs are CRLF, and a trailing \r silently
    # breaks string comparisons like $5 == "N/A".
    BEGIN { RS = "\r?\n" }
    function acc(s,   i) { i = index(s, "_"); return (i ? substr(s, 1, i-1) : s) }
    FNR == NR && FILENAME == LEN  { len[$1] = $2; next }
    FILENAME == SCO { if (FNR > 1) { pl[$1] = $3; fl[$1] = ($5 == "ProteinTTT" ? 2 : 1) } next }
    FILENAME == TAX { tx[$1] = $2 + 0; next }
    {
        c = acc($1); a = acc($2)
        if (!(a in len)) { m_len++; len[a] = 0 }
        if (!(a in pl))  { m_pl++;  pl[a]  = 0 }
        if (!(a in tx))  { m_tx++;  tx[a]  = 0 }
        print a "\t" len[a] "\t" pl[a] "\t" tx[a] "\t" (a in fl ? fl[a] : 1) "\t" c
        n++
    }
    END {
        printf("  entries %d, missing len=%d plddt=%d tax=%d\n",
               n, m_len+0, m_pl+0, m_tx+0) > "/dev/stderr"
        if (m_len + m_pl + m_tx > 0)
            print "  WARNING: rows with missing metadata written as 0" > "/dev/stderr"
    }
' LEN="$LENGTHS" SCO="$SCORES" TAX="$TAXIDS" \
  "$LENGTHS" "$SCORES" "$TAXIDS" "$SEQCLU" > "$OUT/entry.tsv"

# ---------------------------------------------------------------- cluster.tsv
# Grouped by cluster_id so only one cluster is resident at a time. The LCA is joined in
# from make_lca.sh (`mmseqs lca`) rather than recomputed here.
say "cluster.tsv (aggregates + LCA from mmseqs)"
LC_ALL=C sort -k6,6 "$OUT/entry.tsv" | gawk -F'\t' -v lca="$LCA" '
    BEGIN {
        RS = "\r?\n"
        while ((getline line < lca) > 0) {
            split(line, a, "\t")
            tax[a[1]] = a[2]
        }
    }
    function flush() {
        if (n == 0) return
        printf "%s\t%d\t%.2f\t%.4f\t%d\t%d\n", cid, n, tot_l / n, tot_p / n, (n == 1),
               (cid in tax ? tax[cid] : 0)
        if (!(cid in tax)) miss++
        nc++
    }
    {
        if ($6 != cid) { flush(); cid = $6; n = 0; tot_l = 0; tot_p = 0 }
        n++; tot_l += $2; tot_p += $3
    }
    END {
        flush()
        printf("  clusters %d, without an LCA %d\n", nc, miss+0) > "/dev/stderr"
        if (miss > 0) print "  WARNING: clusters missing from the LCA table got 0" > "/dev/stderr"
    }
' > "$OUT/cluster.tsv"

# ---------------------------------------------------------------- ictv.tsv
say "ictv.tsv"
gawk -F'\t' '
    BEGIN { RS = "\r?\n" }
    function na(v) { return (v == "" || v == "N/A" || v == "NA" || v == "-") ? "NA" : v }
    FILENAME == ACC { if (FNR > 1 && $5 != "" && !(($1 SUBSEP $5) in seen)) {
                          seen[$1, $5] = 1
                          ia[$1] = ($1 in ia ? ia[$1] ";" $5 : $5) } next }
    FILENAME == HST { if (FNR > 1 && $3 != "") ih[$1] = $3; next }
    FNR > 1 {
        id = na($3)
        if (id != "NA") {
            mapped++
            a = "NA"
            if ($3 in ia) {          # sort for a deterministic, diffable list
                k = split(ia[$3], parts, ";")
                asort(parts)
                a = parts[1]
                for (j = 2; j <= k; j++) a = a ";" parts[j]
            }
            h = na($3 in ih ? ih[$3] : "")
        } else { a = "NA"; h = "NA" }
        if (a != "NA") wa++
        if (h != "NA") wh++
        print $1 "\t" id "\t" a "\t" h "\t" na($5)
        n++
    }
    END { printf("  taxids %d; mapped %d, with accession %d, with host %d\n",
                 n, mapped+0, wa+0, wh+0) > "/dev/stderr" }
' ACC="$ICTV_ACC" HST="$ICTV_HOST" "$ICTV_ACC" "$ICTV_HOST" "$ICTV_MAP" > "$OUT/ictv.tsv"

# ------------------------------------------- taxonomy-accession_host.tsv
# UniProt "Virus hosts" is a '; '-joined list of 'Name (...) [TaxID: N]'.
say "taxonomy-accession_host.tsv"
gawk -F'\t' '
    BEGIN { RS = "\r?\n" }
    $4 != "" {
        s = $4; delete got; hit = 0
        while (match(s, /\[TaxID: *[0-9]+\]/)) {
            t = substr(s, RSTART, RLENGTH)
            gsub(/[^0-9]/, "", t)
            if (!(t in got)) { got[t] = 1; print $1 "\t" t; rows++ }
            hit = 1
            s = substr(s, RSTART + RLENGTH)
        }
        if (hit) entries++
    }
    END { printf("  %d rows over %d entries\n", rows+0, entries+0) > "/dev/stderr" }
' "$TAXIDS" > "$OUT/taxonomy-accession_host.tsv"

# ------------------------------------------- taxonomy-parent_child.tsv
# Ancestor -> descendant closure of the viral subtree. Walking up from every node
# and keeping those that reach the root gives the same closure as a DFS, without
# recursion (v1's script recurses and would very likely exceed Python's recursion
# limit on a 2025+ dump).
say "taxonomy-parent_child.tsv"
gawk -v root="$ROOT" '
    BEGIN { RS = "\r?\n" }
    { split($0, a, /\t\|\t/); parent[a[1]] = a[2] }
    END {
        for (t in parent) {
            n = 0; cur = t
            while (cur != "" && n < 100) {
                chain[++n] = cur
                if (cur == root) break
                cur = (cur in parent ? parent[cur] : "")
            }
            if (n == 0 || chain[n] != root) continue
            for (i = 1; i <= n; i++) print chain[i] "\t" t
            rows += n; nodes++
        }
        printf("  %d nodes under %s, %d rows\n", nodes+0, root, rows+0) > "/dev/stderr"
    }
' "$NODES" > "$OUT/taxonomy-parent_child.tsv"

say "done"
wc -l "$OUT"/entry.tsv "$OUT"/cluster.tsv "$OUT"/ictv.tsv \
      "$OUT"/taxonomy-accession_host.tsv "$OUT"/taxonomy-parent_child.tsv
