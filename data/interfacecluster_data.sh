ava_file=intclu_ava-qid_tid_qtm_ttm_qcov_tcov_qchaintm_tchaintm_intlddt.tsv
members_with_genes=members-intrep_memrep.with_genes.tsv

if false; then
awk -F"\t" 'BEGIN {OFS="\t"}
NR==FNR {
    g = $3;
    split(g, genes, ",");
    gene = genes[1];
    key = $1 "\t" $2;
    geneByPdbChain[key] = gene;
    next;
}
{
    pdb = $7;
    sub(/-assembly.*/, "", pdb);
    gene1 = geneByPdbChain[pdb "\t" $8];
    gene2 = geneByPdbChain[pdb "\t" $9];
    print $0, gene1, gene2;
}' interfaces_gene-names_mapped.tsv members-intrep_memrep.tsv > "${members_with_genes}"

./build.sh interfaceclusterdb.sqlite3 "${members_with_genes}" clusters.tsv
# ./build.sh interfaceclusterdb.sqlite3 members.tsv clusters.tsv
./build_taxonomy.sh interfaceclusterdb.sqlite3 taxonomy-parent_child.tsv
fi

## humanPPI processing
humanppi_aln=13subdb_twochainmatched
# humanppi_aln=humanppiInt_against_pdbintrep_qtmabove0.4_or_ttmabove0.4
humanppi_out=humanppi_similar_predictions.tsv

# Process humanPPI alignment file into the format expected by the SimilarPredictions panel.
#
# Input columns (tab-separated):
#   $1: query accession        e.g. Humanppi_A0A_S0__A0B_S0_A_B
#   $2: target (our cluster)   e.g. 212320687DI_4unt-assembly1
#   $3: query chain IDs        e.g. "A,B"  (comma-separated; single-chain matches have no comma)
#   $4: target chain IDs       e.g. "G,H"  (same)
#   $5: query TM-score
#   $6: target TM-score
#   $7: U rotation matrix      (9 comma-separated values, row-major)
#   $8: T translation vector   (3 comma-separated values)
#   $9: number of aligned residues (unused here)
#
# Output columns (tab-separated):
#   1:  query_accession
#   2:  cluster_id             (numeric cluster id, e.g. 212320687; the DI_<pdb>-assembly<n>
#                               suffix from the target member accession is stripped so the
#                               id matches cluster.intclu_rep_accession in the SQLite DB)
#   3:  query_chain1
#   4:  query_chain2
#   5:  target_chain1
#   6:  target_chain2
#   7:  qtm
#   8:  ttm
#   9:  tax_id1                (NCBI tax id for chain 1; HumanPPI => 9606)
#   10: tax_id2                (NCBI tax id for chain 2; HumanPPI => 9606)
#   11: u_matrix               (9 values, comma-separated; may be dropped later)
#   12: t_vector               (3 values, comma-separated; may be dropped later)
if false; then
awk -F"\t" 'BEGIN { OFS="\t"; tax1 = 9606; tax2 = 9606 }
{
    # Filter out single-chain matches: both query and target chains must contain a comma
    if (index($3, ",") == 0 || index($4, ",") == 0) next;

    split($3, qchains, ",");
    split($4, tchains, ",");

    # Strip the DI_<pdb>-assembly<n> suffix from the target accession so column 2
    # is the bare cluster id that matches cluster.intclu_rep_accession.
    cluster_id = $2;
    sub(/DI_.*/, "", cluster_id);

    print $1, cluster_id, qchains[1], qchains[2], tchains[1], tchains[2], $5, $6, tax1, tax2, $7, $8;
}' "${humanppi_aln}" > "${humanppi_out}.tmp"

awk -F"\t" 'BEGIN { OFS="\t" }
NR==FNR {split($2, name, "_"); di[$3]=name[1]"_"name[2]"_"name[3]"_"name[4]"_"name[5]"_"name[6]"_"name[7]; next} 
NR!=FNR && $0~/^Humanppi_/ {exit 0}
NR!=FNR {split($1, id, "_Humanppi"); $1="Humanppi_" di[substr(id[1], 3, length(id[1]))]; print $0}
' humanppi_dimer.lookup "${humanppi_out}.tmp" > "${humanppi_out}"
echo "humanPPI: $(wc -l < "${humanppi_out}") dimer matches written to ${humanppi_out}"
fi

# Remap humanppi_dimer index keys (numeric IDs) to lookup names so DbReader can search by accession.
# Keep backups of original numeric-key index files the first time.
humanppi_lookup=humanppi_dimer.lookup
humanppi_idx=humanppi_dimer.index
humanppi_ca_idx=humanppi_dimer_ca.index

remap_index_with_lookup() {
    idx_file="$1"
    lookup_file="$2"

    if [ ! -f "${idx_file}" ] || [ ! -f "${lookup_file}" ]; then
        echo "skip remap: missing ${idx_file} or ${lookup_file}"
        return 0
    fi

    if [ ! -f "${idx_file}.numeric.bk" ]; then
        cp "${idx_file}" "${idx_file}.numeric.bk"
    fi

    awk -F"\t" 'BEGIN { OFS="\t" }
    NR==FNR {
        # lookup: <numeric_id> <name> <file_id>
        name[$1] = $2;
        next;
    }
    {
        # index: <numeric_id> <offset> <length>
        if (!($1 in name)) {
            missing++;
            next;
        }
        print name[$1], $2, $3;
    }
    END {
        if (missing > 0) {
            printf("warning: %d keys in index had no lookup mapping\n", missing) > "/dev/stderr";
        }
    }' "${lookup_file}" "${idx_file}.numeric.bk" \
    | LC_ALL=C sort -t $'\t' -k1,1 > "${idx_file}.tmp"

    mv -f -- "${idx_file}.tmp" "${idx_file}"
    echo "remapped + sorted ${idx_file}"
}
if false; then
remap_index_with_lookup "${humanppi_idx}" "${humanppi_lookup}"
remap_index_with_lookup "${humanppi_ca_idx}" "${humanppi_lookup}"
fi
