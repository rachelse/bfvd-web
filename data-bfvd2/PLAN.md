# BFVD v2 — webserver dataset plan

Branch `bfvd2-datasets`, off `bfvd2` at `d4de804`.

Scripts and this file are version-controlled. The build outputs are **not** — they live
in the main checkout at `/home/user2/bfvd-web/data-bfvd2/`, outside the worktree so
they survive it being removed:

| Path | Contents |
|---|---|
| `data-bfvd2/script/` | build scripts (tracked) |
| `data-bfvd2/out/` | **the staged dataset, 14 GB** — swap this into `data/` (§3.16) |
| `data-bfvd2/taxdump/` | NCBI dump the build read |
| `data-bfvd2/tmp/` | intermediate TSVs |
| `data-bfvd2/log/` | per-step build logs |

**All decisions are settled (§3).** §7 is the work order and current status; §8 is what
remains for you.

---

## 1. What the server reads

From `$DATA_PATH` at boot (`src/server/index.mjs:17-62`):

| Artifact | v1 keys | v2 keys |
|---|---|---|
| `ncbitaxonomy.json` | full NCBI | full NCBI |
| `afdb-clusters.sqlite3` | 4 tables | 5 tables (§4.2) |
| `afdb` + `.index` (AA seq) | 351,242 | 5,776,417 |
| `afdb_ca` + `.index` (+`.dbtype`) | 351,242 | 5,776,417 |
| `afdb_plddt` + `.index` | 351,241 | 5,776,417 |
| `afdb_desc` + `.index` | 3,248,874 | 5,776,417 |
| `ava_db` + `.index` | 345,393 | deferred (§8) |
| `warning_db` | absent | skipped (server treats as optional) |

Built size **14 GB**, plus ~80 GB once `ava_db` lands (v1: 1.7 GB total).

> **Every `.index` must be `LC_ALL=C`-sorted.** `dbreader.mjs` binary-searches it, so an
> unsorted index returns wrong records silently instead of erroring. `mkdb.awk` folds
> the sort in *and* aborts if its input is unsorted; `validate.sh` re-checks with
> `sort -c`.

## 2. v2 sources

| What | Where |
|---|---|
| Foldseek DB (final, ProteinTTT-merged) | `bfvd2/work/db/bfvd_v2_proteinttt{,_ca,_ss,_h}` — `.lookup` already has clean accessions |
| pLDDT / pTM / provenance | `bfvd2/proteinttt/bfvd2_final_release/bfvd2_proteinttt_integrated.tsv` |
| taxid + UniProt hosts | `bfvd2/data/bfvd2_uniprot_2025_03_1st-acc_taxid_taxname_host.tsv` |
| descriptions | `bfvd2/data/uniprot_2025_03_virus_bfvd2.tsv` (col 3) |
| lengths | `bfvd2/data/uniprot_2025_03_virus_1st-acc_len_…tsv` |
| sequence clusters (MMseqs2 30% id / 90% cov) | `bfvd2/work/cluster/bfvd_v2_seqclu.tsv` → 647,298 clusters |
| ICTV mapping + exemplar accessions | `bfvd2/analyses/09_ictv_taxonomy_mapping/results/` |
| ICTV host categories | `bfvd2/analyses/07_host_coverage/results/` |
| structures | `/home/user2/final_pdb/` → `/home/user2/bfvd2_pdb/`, `bfvd2/proteinttt/…` |
| all-vs-all | you're supplying it, deferred |

Tools: `foldseek`/`mmseqs` in the `bfvd-analysis` conda env; `sqlite3`, `gcc`, `gawk`,
`aria2c` on PATH; `node` at `~/.nvm/versions/node/v20.20.2`. `foldcomp`/`seqkit` not
needed (§3.6). Disk: 2.1 TB free.

**No v2 download URLs yet** — `bfvd.steineggerlab.workers.dev/bfvd_*.tar.gz` is the
previous release, so the build reads six absolute paths under `/home/user2/`. All are
passed as explicit arguments and checked before work starts, so a missing or moved
input fails immediately rather than halfway through a multi-hour run.

---

## 3. Decisions

**3.1 Entry-centric.** v1 had one page per UniRef30 cluster and members had no
structures. In v2 all 5,776,417 entries have structures, so every entry gets its own
page and the members panel lists its sequence-cluster co-members.

**3.2 Not UniRef — "sequence clusters".** v2's groups are BFVD's own MMseqs2
clustering. UI strings are already neutral; no "UniRef" appears in `src/`.

**3.3 Where the clustering is used:** exactly two places — the members panel, and the
per-cluster aggregates + members Sankey. Not search, not "Similar entries", not the
viewer; those come from the AVA and the taxonomy tree.

**3.4 `is_dark` → `is_singleton`.** Means `n_mem == 1`; the old name is debris from the
AFDB-clusters server. Rename spans 8 files (§5.1).

**3.5 `flag` = prediction provenance.** 1 = ColabFold-AF2 (5,735,893), 2 =
ESMFold+ProteinTTT (40,524), replacing the dead AFDB-clustering codes.

**3.6 pLDDT from PDB B-factors, not foldcomp.** Your discontinuity concern holds:
foldcomp rebuilds geometry from internal coordinates, so a chain break is where a
round-trip can shift residues, and the pLDDT string is positionally indexed. Direct
reading never reconstructs. The residual risk is covered by check 2 in §6.

**3.7 GO dropped.** Tables were never built for BFVD, so the endpoints were always
dead.

**3.8 No `ictv_species` — NCBI is equivalent.** My first comparison was wrong: it
compared NCBI *strain* names against ICTV *species* names. Resolving each taxid to its
species-rank ancestor first, NCBI and ICTV agree for **176,302 of 176,330 (100.0%)**;
only 28 differ. Most BFVD taxids are sub-species nodes (taxids 10246–10253 are all
*Vaccinia virus* strains that ICTV calls one species) and NCBI has adopted the ICTV
binomials at species rank — node 10245 already reads *Orthopoxvirus vaccinia*. So the
entry page reads species off the NCBI tree.

**`ictv_id` and `ictv_accession` are kept** for outbound ICTV / GenBank links (your
call — drop later if unused). **`ictv_host` is kept because it is not derivable from
NCBI** and is what lifts host coverage from 29.2% to 75.4%.

**3.9 Schema names:** `accession` / `len`, not `rep_accession` / `rep_len` — there is no
representative concept any more.

**3.10 Routes stay `/api/cluster/<acc>`** for now.

**3.11 Members-panel tooltip:** add *"Other BFVD entries in the same sequence cluster
(MMseqs2, 30% identity, 90% coverage)."*

**3.12 New build scripts, nothing reused.** Every v1 script untouched so v1 stays
reproducible.

**3.13 No cap on AVA hits** for now — all ~3.8 billion are kept, so `ava_db` will be
roughly 80 GB and the deployment ~110 GB. Revisit if that proves unwieldy; capping to
the top 100 hits per query would cut it to ~12 GB without affecting any current page.

**3.14 Shell + gawk, no Python.** The pipeline is `build_tables.sh` + `load_db.sh` +
`mkdb.awk`, matching v1's convention. gawk holds the 5.8M-key join tables in memory
(~5 GB of the 105 GB available); `cluster.tsv` is produced from `entry.tsv` sorted by
`cluster_id`, so only one cluster is resident at a time while its LCA is computed.

**3.15 Layout:** everything under `data-bfvd2/`, a sibling of v1's `data-bfvd/`, so
`data/` holds only the live dataset. Only `script/` and this file are tracked in git.

**3.16 Swapping `out/` into `data/` is yours,** not part of this run. The build stops
after validation.

---

## 4. Build

Files in `data-bfvd2/script/`:

| Script | Does |
|---|---|
| `relink_final_pdb.sh` | repair the structure symlink farm (§4.4) |
| `make_seq_dbs.sh` | `afdb`, `afdb_ca` — re-key the Foldseek DB |
| `make_plddt.sh` | `afdb_plddt` — per-residue pLDDT from B-factors |
| `build_tables.sh` | the five import TSVs (joins, cluster aggregates, LCA, ICTV, hosts, taxonomy closure) |
| `load_db.sh` | schema + import + indices |
| `mkdb.awk` | TSV → DbReader blob + sorted index (shared) |
| `validate.sh` | the §6 checklist, as an executable gate |
| `schema.sql` | the schema, in one place |
| `extract_plddt.c` | fresh copy of v1's B-factor reader |

**4.1 `ncbitaxonomy.json`** — serialized from a fresh 2026 taxdump (kept in
`data-bfvd2/taxdump/`). The server regenerates it on boot from `.dmp` files in the
`DATA_PATH` root if the JSON is absent (`ncbitaxonomy.mjs:94-98`), but shipping the
JSON avoids that. A current dump is what makes §3.8 hold.

**4.2 SQLite** — `build_tables.sh` writes five TSVs, `load_db.sh` imports them and
creates the indices *after* the import (far faster at this size):

```sql
entry(accession PK, len, plddt, tax_id, flag, cluster_id)        -- 5,776,417
cluster(cluster_id PK, n_mem, avg_len, avg_plddt, is_singleton, lca_tax_id) -- 647,298
ictv(tax_id PK, ictv_id, ictv_accession, ictv_host, mapping_step)  -- 208,513
taxonomy_host(accession, tax_id)                                 -- 2,406,200
taxonomy_lineage(parent, child)                                  -- 3,157,719
```

`cluster_id` sits on `entry`, so members are one query with no self-referential lookup.
`lca_tax_id` is the LCA of the cluster's member taxids over the NCBI tree.

Every absent ICTV value is the literal string `NA`, never NULL or `''` (upstream writes
`N/A`; the build normalizes). UniProt hosts stay accession-keyed rather than folded into
`ictv`: **158 of 208,513 taxids carry more than one distinct host value**, so keying by
taxid would silently drop information. `ictv_host` is a coarse category
(`vertebrates`), so it is kept separate from the specific organisms in `taxonomy_host`;
the page shows UniProt hosts when present, else the category, else `NA`.

**4.3 `afdb`, `afdb_ca`** — the Foldseek blobs are reused byte-for-byte; only the index
is rewritten from numeric key to accession via `.lookup`, then sorted (the remap
destroys key order).

**4.4 Structure farm repair** — `/home/user2/final_pdb/` had the right shape (3,001
shards, `ACC.pdb` names) but its AF2 links pointed at `/home/user2/bfvd2/bfvd2_pdb/`,
which moved to `/home/user2/bfvd2_pdb/`. Non-destructive relink: nothing copied, moved
or deleted, and a link is only rewritten once its new target is confirmed to exist.

**4.5 `afdb_plddt`** — `extract_plddt` per shard, 12-way parallel, then strip `.pdb`,
sort, `mkdb.awk`.

**4.6 `afdb_desc`** — UniProt col 1 + col 3, sorted, through `mkdb.awk`.

**4.7 `ava_db`** — not built yet (§8). 464 GB at ~130.6 bytes/row is ~3.8 billion
hits; keeping all of them (§3.13) puts `ava_db` near **80 GB**.

Input is `query<TAB>target<TAB>evalue` with the `_unrelaxed_...` suffix, stripped as
for the cluster file. The server expects (`index.mjs:493,690`) one `target evalue\n`
line per hit, **space-separated** — a tab breaks it silently — with the record
NUL-terminated; self-hits are filtered server-side.

The 464 GB never needs sorting: the index maps key → (offset, size), so blob records
may sit in any order and only the 5.78 M-line index must be sorted. That makes this one
streaming pass plus a ~145 MB sort rather than a 464 GB external sort needing ~1 TB of
scratch. `mkdb.awk` needs a "grouped but unsorted" mode for it.

---

## 5. Code changes

**5.1 `is_dark` → `is_singleton` — done.** 8 files: `IsDark.vue` → `IsSingleton.vue` (+ prop
`isDark`), `LCASearchResult.vue` (11 refs), `FoldseekSearchResult.vue` (11),
`Cluster.vue:107`, `Similars.vue:152`, `index.mjs` (LCA + Foldseek endpoints),
`schema.sql`. `GoSearchResult.vue` is deleted anyway. Changes the query param
`?is_dark=` → `?is_singleton=`, so bookmarked search links stop filtering.
`Fragment.vue` gets rewritten in the same pass for the new `flag` values, which also
lets `Members.vue`'s commented-out flag filter be re-enabled.

**5.2 Remove GO — done.** Deleted `GoAutocomplete.vue`, `GoSearchResult.vue`; drop imports and
the already-commented tab from `Search.vue`; delete two endpoints from `index.mjs`.

**5.3 Entry-centric server — done.** 10 query sites in `index.mjs`. Pattern: `cluster` becomes
`entry`, and members go from `WHERE rep_accession = ?` to
`WHERE cluster_id = (SELECT cluster_id FROM entry WHERE accession = ?) AND accession != ?`.
One bug fixes itself: the member FASTA export (`:644`) is broken in v1 because `afdb`
held only representatives; in v2 every entry has a sequence.

**5.4 Entry page** — the API now returns `species` (resolved from the NCBI lineage,
§3.8), `ictv` (`id`, `accessions[]`, `host_category`, `mapping_step`, with `'NA'`
normalized to `null`) and `host_source` (`uniprot` | `ictv` | `null`). Still to do:
render them in `Cluster.vue`, plus the §3.11 members tooltip.

---

## 6. Validation (`validate.sh`, hard gate before any swap)

1. All four `.index` files have exactly 5,776,417 lines and identical key sets.
2. `len(plddt_string) == len(sequence)` per entry — `extract_plddt` emits one digit per
   CA found, so missing residues would silently mis-colour the viewer. Cross-check
   mismatches against the `unk` (X-residue) column.
3. `LC_ALL=C sort -c` on every `.index`.
4. `max(offset+size) == filesize` per blob.
5. Referential integrity; `SUM(n_mem) == 5,776,417`; `COUNT(cluster) == 647,298`.
6. `flag` ∈ {1: 5,735,893, 2: 40,524}; `is_singleton == (n_mem == 1)`.
7. No ICTV column NULL or `''`; no surviving `N/A`; every `entry.tax_id` has an
   `ictv` row.
8. Every `tax_id` / `lca_tax_id` resolves in `nodes.dmp`; unresolved ones are reported,
   not failed — obsolete taxids legitimately occur.

An end-to-end smoke test (boot the server against `out/`, exercise the entry, members,
similars and structure endpoints, measure boot time and RSS) is **not** part of this
script: it cannot run until the entry-centric server changes land. See §7.

---

## 7. Work order and status

| Step | Cost | Status |
|------|------|--------|
| 1. Fresh taxdump | minutes | **done** — 2026 dump, 3,006,303 nodes |
| 2. Repair structure symlink farm | 4 min | **done** — 5,735,893 AF2 relinked, 40,524 ProteinTTT untouched, 0 dangling |
| 3. `afdb`, `afdb_ca` re-key | 2 min | **done** — 5,776,417 keys each |
| 4. `afdb_desc` | 1 min | **done** — 5,776,417 keys |
| 5. Five import TSVs (`build_tables.sh`) | 2 min | **done** — counts in §4.2, zero missing metadata |
| 6. `afdb_plddt` extraction | 11 min | **done** — 5,776,417 records, length parity exact |
| 7. Load SQLite (`load_db.sh`) | 1 min | **done** — 814 MB, all five tables at expected counts |
| 8. `ncbitaxonomy.json` | 1 min | **done** — 223 MB |
| 9. `validate.sh` | 3 min | **done** — **ALL CHECKS PASSED** (§6) |
| 10. `ava_db` | — | blocked: file still copying (§8) |
| 11a. Code: `is_singleton` rename + `flag` (§5.1) | — | **done** — frontend builds clean, no `is_dark` left in `src/` |
| 11b. Code: remove GO (§5.2) | — | **done** — endpoints, components, route and dead helper all gone |
| 12a. Code: entry-centric server (§5.3) | — | **done** — no v1 table references remain |
| 12b. Code: entry page UI (§5.4) | — | server now returns `species`, `ictv` and `host_source`; the Vue side is not wired up yet |
| 13. Swap `out/` → `data/` | — | **yours** (§3.16) |

**Staged dataset: `/home/user2/bfvd-web/data-bfvd2/out/`, 14 GB.** `afdb`, `afdb_ca`, `afdb_plddt`,
`afdb_desc` (+ indices and dbtypes), `afdb-clusters.sqlite3`, `ncbitaxonomy.json`.

Two cross-checks worth recording, because each caught something a count alone would not:

- The relink split, 5,735,893 + 40,524 = 5,776,417, matches the ColabFold/ProteinTTT
  provenance counts exactly — independent confirmation the farm is the correct final
  structure set.
- `afdb` and `afdb_plddt` came out **byte-identical in size** (1,604,487,004 each) and
  every entry's record size matches, so there is exactly one pLDDT digit per residue
  across all 5,776,417 entries. That is the §3.6 discontinuity risk closed with a full
  check rather than a sample.

**Known, benign:** 64 UniProt taxids are absent from the 2026 NCBI dump (obsolete or
withdrawn). The server already guards this with `tree.nodeExists()`, so they render as
unknown rather than erroring.

**No smoke test yet, deliberately.** The staged DB uses the entry-centric schema, which
the current server cannot read — booting it would fail on `rep_accession` regardless of
data quality. The smoke test belongs after step 12.

Diffing the shell rewrite against the Python prototype it replaced (§3.14) caught
three bugs that would otherwise have shipped silently:
CRLF line endings in the ICTV file (Python's universal newlines hid a trailing `\r`
that made `"N/A\r" != "N/A"`), `split($0, a, "\t|\t")` being read as the *regex*
"tab or tab" so every parent taxid became `"|"`, and `merged.dmp`'s two-field lines
leaving a trailing `"\t|"` on the value. `entry.tsv` is byte-identical between the two
implementations; the rest now match on every count.

Note: my first worktree was auto-created off `origin/foldseek-multimer`, which does not
contain your Vue 3 / Mol* work. The `is_dark` and GO footprints differ between
branches, so §5 was re-verified against `bfvd2`.

---

## 8. Open / needs you

**The AVA file — one question.** Does it cover all 5,776,417 entries, or only the
647,298 cluster representatives? That decides whether "Similar entries" appears on
every page or needs a fallback on non-representative ones (most naturally: show the
representative's hits, labelled as such). I can measure it myself once the copy
finishes — it was still growing at 01:46 — but if you know, that saves a pass over
464 GB.

Everything else is settled; §7 shows what is built and what is left to run.
