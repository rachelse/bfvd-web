#!/bin/bash
# Re-key the v2 Foldseek DB into the DbReader layout the webserver expects.
#
# The Foldseek blobs are reused byte-for-byte; only the index is rewritten, from
# numeric key to UniProt accession via .lookup. That remap destroys key order, so the
# LC_ALL=C sort afterwards is mandatory -- dbreader.mjs binary-searches the index and
# an unsorted one returns wrong records silently.
#
# Usage: make_seq_dbs.sh <foldseek-db-prefix> <out-dir>
set -euo pipefail

SRC="${1:?foldseek db prefix}"
OUT="${2:?out dir}"
mkdir -p "$OUT"

for f in "$SRC" "$SRC.index" "$SRC.lookup" "${SRC}_ca" "${SRC}_ca.index"; do
    [ -f "$f" ] || { echo "missing input: $f" >&2; exit 1; }
done

echo "copying sequence blob ..."
cp -f -- "$SRC" "$OUT/afdb"
echo "copying Ca blob ..."
cp -f -- "${SRC}_ca" "$OUT/afdb_ca"
cp -f -- "${SRC}_ca.dbtype" "$OUT/afdb_ca.dbtype"

remap () {  # <src-index> <dst-index>
    awk 'NR == FNR { f[$1] = $2; next } $1 in f { print f[$1]"\t"$2"\t"$3 }' \
        "$SRC.lookup" "$1" | LC_ALL=C sort -k1,1 > "$2"
}

echo "re-keying afdb.index ..."
remap "$SRC.index" "$OUT/afdb.index"
echo "re-keying afdb_ca.index ..."
remap "${SRC}_ca.index" "$OUT/afdb_ca.index"

# v1 shipped an afdb.dbtype of 0x00000000; dbreader.mjs never reads it, but keep parity.
printf '\0\0\0\0' > "$OUT/afdb.dbtype"

echo "afdb.index    $(wc -l < "$OUT/afdb.index")"
echo "afdb_ca.index $(wc -l < "$OUT/afdb_ca.index")"
