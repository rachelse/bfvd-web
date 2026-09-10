import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import axios from 'axios';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { existsSync } from 'fs';

import DbReader from './dbreader.mjs';
import read from './compressed_ca.mjs';
import { serializeTree, unserializeTree, idx_to_rank } from './ncbitaxonomy.mjs';
import FileCache from './filecache.mjs';
import { convertToQueryUrl } from './utils.mjs';

const dataPath =  process.env.DATA_PATH || './data';
const cachePath = process.env.CACHE_PATH || './data/cache';
const port = process.env.EXPRESS_PORT || 3000;
const host = process.env.EXPRESS_HOST || '127.0.0.1';

console.time();
console.log('Loading taxonomy...')
if (!existsSync(dataPath + '/ncbitaxonomy.json')) {
    await serializeTree(dataPath, dataPath + '/ncbitaxonomy.json');
}
const tree = unserializeTree(dataPath + '/ncbitaxonomy.json');
console.timeLog();

console.log('Loading SQL...')
const sql = await open({
    filename: dataPath + '/afdb-clusters.sqlite3',
    driver: sqlite3.Database,
    mode: sqlite3.OPEN_READONLY,
})
console.timeLog();

console.log('Loading Databases...')
const checkpoints = [];
const aaDb = new DbReader();
checkpoints.push(aaDb.make(dataPath + '/afdb', dataPath + '/afdb.index'));

const caDb = new DbReader();
checkpoints.push(caDb.make(dataPath + '/afdb_ca', dataPath + '/afdb_ca.index'));

const plddtDB = new DbReader();
checkpoints.push(plddtDB.make(dataPath + '/afdb_plddt', dataPath + '/afdb_plddt.index'));

const descDB = new DbReader();
checkpoints.push(descDB.make(dataPath + '/afdb_desc', dataPath + '/afdb_desc.index'));

// Optional, like warning_db below: the v2 all-vs-all is not built yet, and the server
// is useful without it -- "Similar entries" simply comes back empty.
let avaDb = null;
if (existsSync(dataPath + '/ava_db')) {
    avaDb = new DbReader();
    checkpoints.push(avaDb.make(dataPath + '/ava_db', dataPath + '/ava_db.index'));
} else {
    console.log('No ava_db found; "Similar entries" will be empty.');
}

let warnDB = null;
if (existsSync(dataPath + '/warning_db')) {
    warnDB = new DbReader();
    checkpoints.push(warnDB.make(dataPath + '/warning_db', dataPath + '/warning_db.index'));
}

await Promise.all(checkpoints);
console.timeLog();

function getDescription(accession) {
    let descId = descDB.id(accession);
    if (descId.found == false) {
        return "";
    } else {
        return descDB.data(descId.value).toString('utf8');
    }
}

// BFVD v2 is entry-centric: every entry has its own structure and its own page, and
// `cluster` only groups entries by sequence clustering (30% id / 90% cov) to drive the
// members panel. The API keeps v1's rep_* field names so the frontend is unchanged --
// same reasoning as keeping the /api/cluster/ routes -- so the entry's own columns are
// aliased here rather than renamed everywhere.
const ENTRY_COLS = `
    e.accession  AS rep_accession,
    e.len        AS rep_len,
    e.plddt      AS rep_plddt,
    e.tax_id     AS tax_id,
    e.flag       AS flag,
    e.cluster_id AS cluster_id,
    c.n_mem, c.avg_len, c.avg_plddt, c.is_singleton, c.lca_tax_id`;

const ENTRY_FROM = `FROM entry AS e JOIN cluster AS c ON e.cluster_id = c.cluster_id`;

const app = express();
app.use(cors());
app.use(express.text({
    limit: '50mb',
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    const period = 60 * 60 * 24;
    if (req.method == 'GET') {
        res.set('Cache-Control', `public, max-age=${period}`);
    }
    next();
});

const fileCache = new FileCache(cachePath);

function finalizeResult(result, req, res) {
    const is_tax_filter = req.query.tax_id != undefined;
    const taxonomy_suggest = req.params.taxonomy;

    if (typeof(taxonomy_suggest) != "undefined") {
        let suggestions = {};
        let count = 0;
        result.forEach((x) => {
            if (tree.nodeExists(x.lca_tax_id) == false) {
                return;
            }
            let node = tree.getNode(x.lca_tax_id);
            while (node.id != 1) {
                if (node.id in suggestions || count >= 10) {
                    break;
                }
                if (node.name.toLowerCase().includes(taxonomy_suggest.toLowerCase())) {
                    suggestions[node.id] = node;
                    count++;
                }
                node = tree.getNode(node.parent);
            }
        });
        res.send(Object.values(suggestions));
        return;
    }

    if (is_tax_filter) {
        result.forEach(x => { 
            if (x.lca_tax_id) {
                x.lca_tax_id = tree.nodeExists(x.lca_tax_id) ? tree.getNode(x.lca_tax_id) : null;
            }
        })
        result = result.filter((x) => {
            if (x.lca_tax_id == null) {
                return false;
            }
            if (tree.nodeExists(x.lca_tax_id.id) == false) {
                return false;
            }
            let currNode = tree.getNode(x.lca_tax_id.id);
            while (currNode.id != 1) {
                if (currNode.id == req.query.tax_id) {
                    return true;
                }
                currNode = tree.getNode(currNode.parent);
            }
    
            return false;
        });
    }
    
    const total = result.length;
    if (result && result.length > 0) {
        result = result.slice((req.query.page - 1) * req.query.itemsPerPage, req.query.page * req.query.itemsPerPage);
    }
    result.forEach((x) => {
        x.description = getDescription(x.rep_accession);
        if (!is_tax_filter) {
            if (x.lca_tax_id) {
                x.lca_tax_id = tree.nodeExists(x.lca_tax_id) ? tree.getNode(x.lca_tax_id) : null;
            }
        }
    });

    res.send({ total: total, result : result });
    return;
}


app.get('/api/search/lca/:taxonomy?', async (req, res) => {
    const taxid = req.query.taxid;
    const lca_search_type = req.query.type;

    const is_singleton = req.query.is_singleton;
    let filter_params = [];
    for (let i of ['avg_length_range', 'avg_plddt_range', 'n_mem_range', 'rep_length_range', 'rep_plddt_range']) {
        if (typeof(req.query[i]) == "undefined") {
            filter_params.push('0');
            filter_params.push('INF');
        } else {
            const split = req.query[i].split(',');
            filter_params.push(split[0] ?? '0');
            filter_params.push(split[1] ?? 'INF');
        }
    }

    let queries_where = [];
    if (lca_search_type === 'exact') {
        queries_where.push("c.lca_tax_id = ?")
    } else {
        queries_where.push("c.lca_tax_id in (SELECT child FROM taxonomy_lineage as tl WHERE tl.parent = ?)");
    }
    queries_where.push(`c.avg_len >= ? AND c.avg_len <= ?`);
    queries_where.push(`c.avg_plddt >= ? AND c.avg_plddt <= ?`);
    queries_where.push(`c.n_mem >= ? AND c.n_mem <= ?`);
    queries_where.push(`e.len >= ? AND e.len <= ?`);
    queries_where.push(`e.plddt >= ? AND e.plddt <= ?`);
    if (is_singleton != undefined) {
        queries_where.push(`c.is_singleton == ?`);
        filter_params.push(is_singleton)
    }

    let result = await sql.all(`
    SELECT DISTINCT ${ENTRY_COLS}
        ${ENTRY_FROM}
        WHERE ${queries_where.join(" AND ")}
    `, taxid, ...filter_params);

    return finalizeResult(result, req, res);
});

app.get('/api/search/foldseek/:taxonomy?', async (req, res) => {
    const jobid = encodeURIComponent(req.query.jobid);

    let results = [];
    if (fileCache.contains(jobid)) {
        results = JSON.parse(fileCache.get(jobid));
        
    } else {
        let result = await axios.get('https://search.foldseek.com/api/result/' + jobid + '/0', {
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
        });

        const aln = result.data;
        for (let i = 0; i < aln.results.length; i++) {
            let result = aln.results[i];
            if (!result.alignments || !result.alignments[0]) {
                continue;
            }
            
            for (let j = 0; j < result.alignments[0].length; j++) {
                const target = result.alignments[0][j].target;
                
                let accession = "";
                try {
                    // accession = target.match(/AF-(.*)-F\d+-model/)[1];
                    accession = target.match(/([^_]+)_/)[1];
                } catch (e) {
                    console.log("error retrieving accession: ", target);
                    accession = "error-retrieving-accession";
                }
                if (result.alignments[0][j].prob < 0.95) {
                    continue;
                }
                results.push({
                    accession: accession,
                    eval: result.alignments[0][j].eval,
                    score: result.alignments[0][j].score,
                    seqId: result.alignments[0][j].seqId,
                    prob: result.alignments[0][j].prob,
                });
            }
        }
        
        fileCache.add(jobid, JSON.stringify(results));
    }

    const is_singleton = req.query.is_singleton;
    let filter_params = [];
    for (let i of ['avg_length_range', 'avg_plddt_range', 'n_mem_range', 'rep_length_range', 'rep_plddt_range']) {
        if (typeof(req.query[i]) == "undefined") {
            filter_params.push('0');
            filter_params.push('INF');
        } else {
            const split = req.query[i].split(',');
            filter_params.push(split[0] ?? '0');
            filter_params.push(split[1] ?? 'INF');
        }
    }

    let queries_where = [];
    queries_where.push(`c.avg_len >= ? AND c.avg_len <= ?`);
    queries_where.push(`c.avg_plddt >= ? AND c.avg_plddt <= ?`);
    queries_where.push(`c.n_mem >= ? AND c.n_mem <= ?`);
    queries_where.push(`e.len >= ? AND e.len <= ?`);
    queries_where.push(`e.plddt >= ? AND e.plddt <= ?`);
    if (is_singleton != undefined) {
        queries_where.push(`c.is_singleton == ?`);
        filter_params.push(is_singleton ? '1' : '0')
    }

    const accessions = results.map(r => r.accession);
    let result = await sql.all(`
        SELECT DISTINCT ${ENTRY_COLS}
            ${ENTRY_FROM}
            WHERE e.accession IN (${accessions.map(() => '?').join(',')})
              AND ${queries_where.join(" AND ")}
            `, ...accessions, ...filter_params);

    return finalizeResult(result, req, res);
});

app.get('/api/:query', async (req, res) => {
    let result = await sql.get(`SELECT ${ENTRY_COLS} ${ENTRY_FROM} WHERE e.accession = ?`, req.params.query);
    if (!result || result.lca_tax_id == null) {
        res.status(404).send({ error: "No cluster found" });
        return;
    }
    result.lca_tax_id = tree.nodeExists(result.lca_tax_id) ? tree.getNode(result.lca_tax_id) : null;
    res.send([ result ]);
});

app.get('/api/cluster/:cluster/annotations', async (req, res) => {
    const cluster = req.params.cluster;

    function color_designation(high_color, low_color, annotations) {
        let highest_hit = 0;
        let hit_portion = 0;
        let rgb = {};

        for (const ele of annotations) {
            if (highest_hit < ele.hit) {
                highest_hit = ele.hit;
            }
        }

        for (const ele of annotations) {
            hit_portion = ele.hit / highest_hit;

            rgb = {
                r: (high_color.r - low_color.r) * hit_portion + low_color.r,
                g: (high_color.g - low_color.g) * hit_portion + low_color.g,
                b: (high_color.b - low_color.b) * hit_portion + low_color.b,
            }

            ele['color'] = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
        }
    }
    
    let pfams = [
        {id:0, pfam: 'PF00931', hit: 34},
        {id:1, pfam: 'PF01582', hit: 6}
    ]

    color_designation(
        {r: 25, g: 118, b: 210},
        {r: 25, g: 25, b: 25},
        pfams
    )
    
    let result = {
        pfams: pfams
    };

    res.send({result: result});
});


function makeSankey(result) {
    let nodes = {};
    let links = {};
    const allowedRanks = [28, 27, 24, 12, 8, 4];
    result.forEach((x) => {
        if (tree.nodeExists(x.tax_id) == false) {
            return;
        }
        let node = tree.getNode(x.tax_id, true);
        while (node.id != 1) {
            let currentNode = node;
            // skip all ranks except superkingdom, phylum, class, order, family, genus
            while (!allowedRanks.includes(currentNode.rank)) {
                currentNode = tree.getNode(currentNode.parent, true);
                if (currentNode.id == 1) {
                    break;
                }
            }

            let parentNode = tree.getNode(currentNode.parent, true);
            while (!allowedRanks.includes(parentNode.rank)) {
                parentNode = tree.getNode(parentNode.parent, true);
                if (parentNode.id == 1) {
                    break;
                }
            }

            if (!(currentNode.id in nodes)) {
                nodes[currentNode.id] = {
                    id: currentNode.id,
                    name: currentNode.name,
                    rank: idx_to_rank[currentNode.rank],
                };
            }

            if (!(parentNode.id in nodes)) {
                nodes[parentNode.id] = {
                    id: parentNode.id,
                    name: parentNode.name,
                    rank: idx_to_rank[parentNode.rank],
                };
            }

            node = parentNode;
            if (currentNode.id == 1 || parentNode.id == 1) {
                break;
            }

            const linkKey = `${currentNode.id}-${parentNode.id}`;
            if (!(linkKey in links)) {
                links[linkKey] = {
                    source: parentNode.id,
                    target: currentNode.id,
                    value: 1,
                    rank: idx_to_rank[parentNode.rank],
                    name: parentNode.name,
                }
            } else {
                links[linkKey].value += 1;
            }
        }
    });
    // nodes['root'] = { id : 'root' };
    return { nodes : Object.values(nodes), links : Object.values(links) };
}

app.get('/api/cluster/:cluster/sankey-members', async (req, res) => {
    const cluster = req.params.cluster;
    let result = await sql.all(`
    SELECT tax_id
        FROM entry
        WHERE cluster_id = (SELECT cluster_id FROM entry WHERE accession = ?);
    `, cluster);
    res.send({result: makeSankey(result)});
});

app.get('/api/cluster/:cluster/sankey-similars', async (req, res) => {
    const cluster = req.params.cluster;
    if (avaDb == null) {
        res.send([]);
        return;
    }
    const avaKey = avaDb.id(cluster);
    if (avaKey.found == false) {
        res.send([]);
        return;
    }
    const ava = avaDb.data(avaKey.value).toString('ascii');
    let ids_evalue = ava.split('\n').map((x) => x.split(' '));
    ids_evalue.splice(-1);
    const accessions = ids_evalue.map((x) => x[0]).filter((x) => x != cluster);
    let result = await sql.all(`
    SELECT DISTINCT tax_id
        FROM entry
        WHERE accession IN (${accessions.map(() => "?").join(",")});
    `, accessions);
    res.send({result: makeSankey(result)});
});

app.get('/api/cluster/:cluster', async (req, res) => {
    let result = await sql.get(`SELECT ${ENTRY_COLS} ${ENTRY_FROM} WHERE e.accession = ?`, req.params.cluster);
    if (!result) {
        res.status(404).send({ error: "No cluster found" });
        return;
    }
    result.lca_tax_id = tree.nodeExists(result.lca_tax_id) ? tree.getNode(result.lca_tax_id) : null;
    if (result.lca_tax_id != null) {
        result.lineage = tree.nodeExists(result.lca_tax_id.id) ? tree.lineage(result.lca_tax_id) : null;
    } else {
        result.lineage = [{ id: 0, rank: "unknown", name: "unknown" }];
    }
    result.tax_id = tree.nodeExists(result.tax_id) ? tree.getNode(result.tax_id) : null;
    if (result.tax_id != null) {
        result.rep_lineage = tree.nodeExists(result.tax_id.id) ? tree.lineage(result.tax_id) : null;
    } else {
        result.rep_lineage = [{ id: 0, rank: "unknown", name: "unknown" }];
    }
    result.description = getDescription(result.rep_accession);
    if (warnDB) {
        const warnKey = warnDB.id(result.rep_accession);
        result.warning = warnKey.found;
    } else {
        result.warning = false;
    }
    // Species comes off the NCBI tree rather than a stored ICTV name: resolved to its
    // species-rank ancestor, the NCBI scientific name equals the ICTV species for
    // 176,302 of 176,330 mapped taxids, so storing both would only add a way to disagree.
    result.species = null;
    if (result.rep_lineage) {
        const species = result.rep_lineage.find((x) => x.rank === "species");
        if (species) {
            result.species = species;
        }
    }

    // ICTV identity for outbound links. Absent values are the literal 'NA' rather than
    // NULL, so normalize them away before they reach the UI.
    const ictv = await sql.get("SELECT ictv_id, ictv_accession, ictv_host, mapping_step FROM ictv WHERE tax_id = ?", String(result.tax_id ? result.tax_id.id : ''));
    const notNA = (v) => (v && v !== 'NA') ? v : null;
    result.ictv = ictv ? {
        id: notNA(ictv.ictv_id),
        accessions: notNA(ictv.ictv_accession) ? ictv.ictv_accession.split(';') : [],
        host_category: notNA(ictv.ictv_host),
        mapping_step: notNA(ictv.mapping_step),
    } : { id: null, accessions: [], host_category: null, mapping_step: null };

    // UniProt gives a specific host organism with a taxid; ICTV only a coarse category.
    // They are different granularities, so they are never merged -- prefer UniProt, fall
    // back to the ICTV category, and let the UI say "NA" when neither exists.
    let hosts = await sql.all("SELECT tax_id FROM taxonomy_host WHERE accession = ?", req.params.cluster);
    result.hosts = [];
    if (hosts) {
        for (let i = 0; i < hosts.length; i++) {
            let taxid = hosts[i].tax_id - 0;
            if (tree.nodeExists(taxid)) {
                result.hosts.push(tree.getNode(taxid))
            }
        }
    }
    result.host_source = result.hosts.length > 0
        ? 'uniprot'
        : (result.ictv.host_category ? 'ictv' : null);

    res.send(result);
});

function processAndWriteInChunks(data, chunkSize, processingFunc, writeFunc) {
    let index = 0;
    while (index < data.length) {
        const chunk = data.slice(index, index + chunkSize);
        const processedChunk = processingFunc(chunk);
        writeFunc(processedChunk);
        index += chunkSize;
    }
}

app.get('/api/cluster/:cluster/members', async (req, res) => {
    let flagFilter = '';
    let args = [ req.params.cluster ];
    if (req.query.flagFilter != null) {
        flagFilter = 'AND flag = ?';
        args.push((req.query.flagFilter | 0) + 1);
    }

    let paginate = !req.query.format;

    let result;
    let total = 0;
    if (req.query.tax_id) {
        result = await sql.all(`
        SELECT accession, tax_id, flag
            FROM entry
            WHERE cluster_id = (SELECT cluster_id FROM entry WHERE accession = ?) ${flagFilter}
            ORDER BY rowid;
        `, ...args);
        
        result = result.filter((x) => {
            if (tree.nodeExists(x.tax_id) == false) {
                return false;
            }
            x.tax_id = tree.getNode(x.tax_id);
            let currNode = x.tax_id;
            while (currNode.id != 1) {
                if (currNode.id == req.query.tax_id) {
                    return true;
                }
                currNode = tree.getNode(currNode.parent);
            }
            return false;
        });
        
        if (paginate) {
            total = result.length;
            if (result && result.length > 0) {
                result = result.slice((req.query.page - 1) * req.query.itemsPerPage, req.query.page * req.query.itemsPerPage);
            }
        }
        result.forEach((x) => { x.description = getDescription(x.accession) });
    } else {
        let paginate_query = "";
        if (paginate) {
            total = await sql.get(`SELECT COUNT(accession) as total FROM entry WHERE cluster_id = (SELECT cluster_id FROM entry WHERE accession = ?) ${flagFilter}`, ...args);
            total = total.total;
            args.push((req.query.itemsPerPage) | 0);
            args.push(((req.query.page - 1) * req.query.itemsPerPage) | 0);
            paginate_query = "LIMIT ? OFFSET ?";
        }
        result = await sql.all(`
        SELECT accession, tax_id, flag
            FROM entry
            WHERE cluster_id = (SELECT cluster_id FROM entry WHERE accession = ?) ${flagFilter}
            ORDER BY rowid
            ${paginate_query};
        `, ...args);
        result.forEach((x) => {
            x.tax_id = tree.nodeExists(x.tax_id) ? tree.getNode(x.tax_id) : null;
            x.description = getDescription(x.accession);
        });
    }

    if (!req.query.format) {
        res.send({ total: total, result : result });
        return;
    }

    const safeCluster = req.params.cluster.replace(/[^a-zA-Z0-9]/g, '');
    switch(req.query.format) {
        case 'accessions':
            res.setHeader('Content-Disposition', `attachment; filename=member-accessions-${safeCluster}.txt`);
            res.setHeader('Content-Type', 'text/plain');
            res.charset = 'UTF-8';
            processAndWriteInChunks(result, 10000,
                chunk => chunk.map(member => member.accession).join('\n'),
                chunk => res.write(chunk));
            res.end();
            break;

        case 'fasta':
            res.setHeader('Content-Disposition', `attachment; filename=member-sequences-${safeCluster}.fasta`);
            res.setHeader('Content-Type', 'text/plain');
            res.charset = 'UTF-8';

            processAndWriteInChunks(result, 10000,
                chunk => chunk.map(member => `>${member.accession} ${member.description.trimEnd()} OX=${member.tax_id ? member.tax_id.id : '0'} OS=${member.tax_id ? member.tax_id.name : 'unknown'} Flag=${member.flag}\n${aaDb.data(aaDb.id(member.accession).value).toString('ascii')}`).join(''),
                chunk => res.write(chunk));

            res.end();
            break;
        
        default:
            res.status(400).send({ error: 'Unsupported format!' });
            break;
    }
});

app.get('/api/cluster/:cluster/members/taxonomy/:suggest', async (req, res) => {
    let result = await sql.all(`
        SELECT tax_id
            FROM entry
            WHERE cluster_id = (SELECT cluster_id FROM entry WHERE accession = ?);
        `, req.params.cluster); 
    let suggestions = {};
    let count = 0;
    
    result.forEach((x) => {
        if (tree.nodeExists(x.tax_id) == false) {
            return;
        }
        let node = tree.getNode(x.tax_id);
        while (node.id != 1) {
            if (node.id in suggestions || count >= 10) {
                break;
            }
            if (node.name.toLowerCase().includes(req.params.suggest.toLowerCase())) {
                suggestions[node.id] = node;
                count++;
            }
            node = tree.getNode(node.parent);
        }
    });
    res.send(Object.values(suggestions));
});

app.get('/api/cluster/:cluster/similars', async (req, res) => {
    const cluster = req.params.cluster;
    if (avaDb == null) {
        res.send([]);
        return;
    }
    const avaKey = avaDb.id(cluster);
    if (avaKey.found == false) {
        res.send([]);
        return;
    }
    const ava = avaDb.data(avaKey.value).toString('ascii');
    let ids_evalue = ava.split('\n').map((x) => x.split(' '));
    ids_evalue.splice(-1);
    let map = new Map(ids_evalue);
    const accessions = ids_evalue.map((x) => x[0]);
    let result = await sql.all(`
    SELECT *
        ${ENTRY_FROM}
        WHERE e.accession IN (${accessions.map(() => "?").join(",")});
    `, accessions);
    result.forEach((x) => {
        x.evalue = map.get(x.rep_accession);
        x.lca_tax_id = tree.nodeExists(x.lca_tax_id) ? tree.getNode(x.lca_tax_id) : null;
    });
    // console.log(result)
    if (req.query.tax_id) {
        result = result.filter((x) => {
            let currNode = x.lca_tax_id;
            if (currNode == null) {
                return false;
            }
            while (currNode.id != 1) {
                if (currNode.id == req.query.tax_id) {
                    return true;
                }
                currNode = tree.getNode(currNode.parent);
            }
            return false;
        });
    }

    if (!req.query.format) {
        let sortBy = req.query.sortBy;
        let sortDesc = req.query.sortDesc.toLowerCase() === "true";
        if (sortBy == "") {
            sortBy = "evalue";
            sortDesc = false;
        }

        const identity = (x) => x;
        let castFun = identity;
        if (sortBy == 'evalue') {
            castFun = parseFloat;
        }
        let sorted = result.sort((a, b) => {
            const sortA = castFun(a[sortBy]);
            const sortB = castFun(b[sortBy]);
            
            if (sortDesc) {
                if (sortA < sortB) return 1;
                if (sortA > sortB) return -1;
                return 0;
            } else {
                if (sortA < sortB) return -1;
                if (sortA > sortB) return 1;
                return 0;
            }
        })
        sorted = sorted.filter((x) => x.rep_accession != cluster);
        const total = sorted.length;
        sorted = sorted.slice((req.query.page - 1) * req.query.itemsPerPage, req.query.page * req.query.itemsPerPage);
        sorted.forEach((x) => { x.description = getDescription(x.rep_accession) });
        res.send({ total: total, similars: sorted });
        return;
    } else {
        result.forEach((x) => { x.description = getDescription(x.rep_accession) });
    }

    const safeCluster = req.params.cluster.replace(/[^a-zA-Z0-9]/g, '');
    switch(req.query.format) {
        case 'accessions':
            res.setHeader('Content-Disposition', `attachment; filename=similar-accessions-${safeCluster}.txt`);
            res.setHeader('Content-Type', 'text/plain');
            res.charset = 'UTF-8';
            processAndWriteInChunks(result, 10000,
                chunk => chunk.map(similar => similar.rep_accession).join('\n'),
                chunk => res.write(chunk));
            res.end();
            break;

        case 'fasta':
            res.setHeader('Content-Disposition', `attachment; filename=similar-sequences-${safeCluster}.fasta`);
            res.setHeader('Content-Type', 'text/plain');
            res.charset = 'UTF-8';

            processAndWriteInChunks(result, 10000,
                chunk => chunk.map(similar => `>${similar.rep_accession} ${similar.description.trimEnd()} OX=${similar.lca_tax_id ? similar.lca_tax_id.id : '0'} OS=${similar.lca_tax_id ? similar.lca_tax_id.name : 'unknown'} Eval=${similar.evalue}\n${aaDb.data(aaDb.id(similar.rep_accession).value).toString('ascii')}`).join(''),
                chunk => res.write(chunk));

            res.end();
            break;
        
        default:
            res.status(400).send({ error: 'Unsupported format!' });
            break;
    }
});

app.get('/api/cluster/:cluster/similars/taxonomy/:suggest', async (req, res) => {
    const cluster = req.params.cluster;
    if (avaDb == null) {
        res.send([]);
        return;
    }
    const avaKey = avaDb.id(cluster);
    if (avaKey.found == false) {
        res.send([]);
        return;
    }
    const ava = avaDb.data(avaKey.value).toString('ascii');
    let ids_evalue = ava.split('\n').map((x) => x.split(' '));
    ids_evalue.splice(-1);
    const accessions = ids_evalue.map((x) => x[0]);
    let result = await sql.all(`
    SELECT *
        ${ENTRY_FROM}
        WHERE e.accession IN (${accessions.map(() => "?").join(",")});
    `, accessions);
    let suggestions = {};
    let count = 0;
    result.forEach((x) => {
        if (tree.nodeExists(x.lca_tax_id) == false) {
            return;
        }
        let node = tree.getNode(x.lca_tax_id);
        while (node.id != 1) {
            if (node.id in suggestions || count >= 10) {
                break;
            }
            if (node.name.toLowerCase().includes(req.params.suggest.toLowerCase())) {
                suggestions[node.id] = node;
                count++;
            }
            node = tree.getNode(node.parent);
        }
    });
    res.send(Object.values(suggestions));
});


app.get('/api/structure/:structure', async (req, res) => {
    const structure = req.params.structure;
    const aaKey = aaDb.id(structure);
    if (aaKey.found == false) {
        throw Error(`${structure} not found in aa db`);
    }
    const aaLength = aaDb.length(aaKey.value) - 2;

    const key = caDb.id(structure);
    if (key.found == false) {
        throw Error(`${structure} not found in ca db`);
    }

    const plddtKey = plddtDB.id(structure);
    if (plddtKey.found == false) {
        throw Error(`${structure} not found in plddt db`);
    }
    const plddt = plddtDB.data(plddtKey.value).toString('ascii');

    const size = caDb.length(key.value);
    const aa = aaDb.data(aaKey.value).toString('ascii');
    const ca = caDb.data(key.value);
    const result = Array.from(read(ca, aaLength, size)).map((x) => x.toFixed(3));
    res.send({ seq: aa, coordinates: result, plddt: plddt });
});

app.use((err, req, res, next) => {
    console.log(err);
    res.status(500);
    res.removeHeader('Cache-Control');
    res.send({ error: err.response && err.response.data ? err.response.data : err.message });
});

app.listen(port, host, () => {
    console.log(`AFDB-clusters server listening on port ${host}:${port}`)
});
