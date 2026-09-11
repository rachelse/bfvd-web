#!/usr/bin/env -S gawk -f
# (env needs -S to split the shebang args; v1's data/db.awk omits it and cannot
#  actually be executed directly, only via `gawk -f`.)
#
# TSV -> DbReader blob + index, for src/server/dbreader.mjs.
#
# Input : key <TAB> value, ONE line per record, pre-sorted by key (LC_ALL=C).
#         Consecutive lines sharing a key are concatenated, each terminated by \n.
# Output: <outfile>        records, each NUL-terminated
#         <outfile>.index  key <TAB> offset <TAB> size, in input order
#
# Differs from v1's data/db.awk:
#   - no hardcoded default output name; `outfile` is required
#   - fails loudly if the input is not sorted, instead of silently producing an
#     index that dbreader.mjs cannot binary-search
#
# Usage: mkdb.awk -v outfile=out/afdb_desc input.tsv

BEGIN {
    FS = "\t";
    if (length(outfile) == 0) {
        print "mkdb.awk: -v outfile=... is required" > "/dev/stderr";
        exit 1;
    }
    outindex = outfile ".index";
    printf("") > outfile;
    printf("") > outindex;
    last = "";
    data = "";
    offset = 0;
    have = 0;
}

function flush(    size) {
    printf "%s%c", data, 0 >> outfile;
    size = length(data) + 1;
    print last "\t" offset "\t" size >> outindex;
    offset += size;
}

{
    key = $1;
    $1 = "";
    val = substr($0, 2);

    if (have && key == last) {
        data = data val "\n";
        next;
    }

    if (have) {
        if (key < last) {
            printf("mkdb.awk: input not sorted at line %d: %s after %s\n", NR, key, last) > "/dev/stderr";
            exit 1;
        }
        flush();
    }

    last = key;
    data = val "\n";
    have = 1;
}

END {
    if (have) flush();
    close(outfile);
    close(outindex);
}
