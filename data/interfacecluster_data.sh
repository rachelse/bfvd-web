ava_file=intclu_ava-qid_tid_qtm_ttm_qcov_tcov_qchaintm_tchaintm_intlddt.tsv

if false; then
# ./build.sh interfaceclusterdb.sqlite3 members-intrep_memrep.tsv clusters.tsv
# ./build.sh interfaceclusterdb.sqlite3 members.tsv clusters.tsv
./build_taxonomy.sh interfaceclusterdb.sqlite3 taxonomy-parent_child.tsv

awk -F"\t" 'BEGIN {OFS="\t"}
NR==FNR{cid[$7"_"$8","$9]=$3;next}
{
    split($1,query,"_"); split($2, target,"_"); split($3, c1, ","); split($4, c2, ",");
    q1=query[3]"_"$3; q2=query[3]"_"c1[2]","c1[1]; t1=target[3]"_"$4; t2=target[3]"_"c2[2]","c2[1];
    if(q1 in cid) q=q1; else q=q2;
    if(t1 in cid) t=t1; else t=t2;
    if (q in cid && t in cid && q!=t ) {
        # $5: qtm, $6: ttm, $7: u mat $8: t mat, 
        # $9: qcov, $10: tcov, $11: qchaintm, $12: tchaintm, $13: intlddt
        print cid[q], cid[t], $5, $6, $9, $10, $11, $12, $13
    }
}
' members-intrep_memrep.tsv intclu-ava_report > "${ava_file}"

../../MMseqs2-App/resources/mac/foldseek tsv2db ${ava_file} ava_db
LC_ALL=C sort -k1,1 "ava_db.index" > "ava_db.index_sort"
mv -f -- "ava_db.index_sort" "ava_db.index"
fi