#!/bin/bash

if false; then
awk -F"\t" 'NR==FNR {id[$2]=$0;next} ($1 in id) {print}' interfacedb/interfacedb_90_50_0.lookup <(awk -F"\t" '{print $2"DI_"$7"_"$8;print $2"DI_"$7"_"$9}' members_toy_long.tsv) > toy_lookup_keys.list
foldseek createsubdb toy_lookup_keys.list interfacedb/interfacedb_90_50_0 afdb --id-mode 1

awk -F"\t" '
BEGIN {OFS="\t"}
NR==FNR {
    db_key[$2]=$1; next
}
{
    split($1,ids,"_"); split($3,taxids,":");
    split($4,pdb_chain,"_"); split(pdb_chain[2],chains,":");
    split($5,uniprotids,":");

    refA=ids[2]"DI_"pdb_chain[1]"_"chains[1]
    refB=ids[2]"DI_"pdb_chain[1]"_"chains[2]
    if (refA in db_key==0) {
        print "Error: Key " refA " not found in database." > "/dev/stderr"
        exit 1
    } else if (refB in db_key==0) {
        print "Error: Key " refB " not found in database." > "/dev/stderr"
        exit 1
    } else {
        print ids[1], ids[2], ids[3], $2, taxids[1], taxids[2], pdb_chain[1], chains[1], chains[2], uniprotids[1], uniprotids[2], db_key[refA], db_key[refB]
    }
}' afdb.lookup members_toy_short.tsv > members_toy_long.tsv
fi
./build.sh toydb.sqlite3 members_toy_long.tsv clusters_toy.tsv


# awk -F"\t" '{split($2,pdb,"_"); split(pdb[1],di,"DI"); print di[1],pdb[2],pdb[3],$1,$3}' afdb_ca.lookup
