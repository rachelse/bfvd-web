#!/bin/bash
# Repair the /home/user2/final_pdb symlink farm after bfvd2_pdb moved out of bfvd2/.
#
# Non-destructive: only re-points symlinks whose target carries the stale prefix, at
# the same files in their new location. No PDB is copied, moved or deleted. Links that
# point elsewhere (the ProteinTTT replacements) are left alone.
#
# Usage: relink_final_pdb.sh [FARM] [--dry-run]
set -euo pipefail

FARM="/home/user2/final_pdb"
DRY=0
for a in "$@"; do
    case "$a" in
        --dry-run) DRY=1 ;;
        -*)        echo "unknown option: $a" >&2; exit 1 ;;
        *)         FARM="$a" ;;
    esac
done

OLD="/home/user2/bfvd2/bfvd2_pdb"
NEW="/home/user2/bfvd2_pdb"

[ -d "$FARM" ] || { echo "no symlink farm at $FARM" >&2; exit 1; }
[ -d "$NEW" ]  || { echo "no AF2 directory at $NEW" >&2; exit 1; }

echo "relinking ${OLD} -> ${NEW} under ${FARM}"
[ "$DRY" -eq 1 ] && echo "(dry run)"

# One `ln` per link would fork 5.8M times; batch through xargs instead.
find "$FARM" -type l -lname "${OLD}/*" -printf '%p\t%l\n' \
  | gawk -F'\t' -v old="$OLD" -v new="$NEW" -v dry="$DRY" '
        {
            tgt = $2
            sub("^" old, new, tgt)
            if (dry) { n++; next }
            printf "%s\0%s\0", tgt, $1
            n++
        }
        END { printf("  %d stale links\n", n+0) > "/dev/stderr" }' \
  | { [ "$DRY" -eq 1 ] && cat > /dev/null || xargs -0 -n2 -P8 ln -sfn; }

echo "verifying ..."
dangling=$(find "$FARM" -xtype l | wc -l)
total=$(find "$FARM" -name '*.pdb' | wc -l)
echo "  dangling symlinks : $dangling"
echo "  total .pdb links  : $total"
if [ "$DRY" -eq 0 ] && [ "$dangling" -ne 0 ]; then
    echo "FAIL: symlinks still dangling" >&2
    exit 1
fi
echo "OK"
