#!/bin/bash

./build.sh afdb.sqlite3 members-intrep_clurep.tsv clusters.tsv


# awk -F"\t" '{split($2,pdb,"_"); split(pdb[1],di,"DI"); print di[1],pdb[2],pdb[3],$1,$3}' afdb_ca.lookup
