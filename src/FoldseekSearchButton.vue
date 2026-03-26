<template>
    <div>
    <FileButton
        label="Upload PDB File"
        @upload="upload"
        :disabled="inSearch"
        :loading="inSearch"
        x-large
        :color="this.error ? 'error' : 'primary'"
        accept=".pdb,.mmcif,.cif,.mcif,chemical/x-pdb,chemical/x-cif,chemical/x-mmcif"
        v-bind="$attrs"
    >
    </FileButton>
    <div v-if="error" style="margin-top: 12px; color: #f44336; ">
        {{ error }}
    </div>
    <div v-if="inSearch && selectedChains" style="margin-top: 12px;">
       Searching similar interfaces for Chain {{ selectedChains[0] }} and {{ selectedChains[1] }}
    </div>
    <div v-if="showChainSelection" style="margin-top: 12px; padding: 12px; border: 1px solid #e0e0e0; border-radius: 4px; background-color: transparent; width: fit-content; margin-left: auto; margin-right: auto;">
        <div style="margin-bottom: 8px; ">Select Chain Pair for Interface Search</div>
        <div style="display: flex; flex-wrap: wrap; gap: 8px; width: fit-content; max-width: 300px; max-height: 100px; overflow-y: auto;">
            <button 
                v-for="pair in availableChainPairs" 
                :key="`${pair[0]}-${pair[1]}`"
                @click="selectedChainPair = selectedChainPair === `${pair[0]},${pair[1]}` ? '' : `${pair[0]},${pair[1]}`"
                :style="{
                    padding: '6px 6px',
                    backgroundColor: selectedChainPair === `${pair[0]},${pair[1]}` ? '#1976D2' : '#e0e0e0',
                    color: selectedChainPair === `${pair[0]},${pair[1]}` ? 'white' : '#333',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: selectedChainPair === `${pair[0]},${pair[1]}` ? 'bold' : 'normal'
                }"
            >
                {{ pair[0] }}-{{ pair[1] }}
            </button>
        </div>
        <button 
            @click="confirmChainPair" 
            :disabled="!selectedChainPair" 
            style="margin-top: 12px; padding: 8px 16px; background-color: #1976D2; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; width: 100%;"
            :style="{opacity: selectedChainPair ? 1 : 0.5}"
        >
            Search
        </button>
    </div>
    </div>
</template>

<script>
import FileButton from "./FileButton.vue";

function convertToQueryUrl(obj) {
    var params = new URLSearchParams(obj);
    var entries = Object.entries(obj);
    for (var entry in entries) {
        var key = entries[entry][0];
        var value = entries[entry][1];
        if (Array.isArray(value)) {
            params.delete(key);
            value.forEach(function (v) {
                return params.append(key + '[]', v);
            });
        }
    }
    return params.toString();
}

function extractChainInfo(pdbContent) {
    const lines = pdbContent.split('\n');
    let inFirstModel = false;
    const chainAtoms = {};
    const chainOrder = [];

    for (const line of lines) {
        if (line.startsWith('MODEL')) {
            if (inFirstModel) break;
            inFirstModel = true;
            continue;
        }

        if (line.startsWith('ATOM')) {
            const currentChainId = line.substring(21, 22).trim();
            if (!chainAtoms[currentChainId]) {
                chainAtoms[currentChainId] = [];
                chainOrder.push(currentChainId);
            }
            chainAtoms[currentChainId].push(line);
        }
    }

    return {
        chains: chainOrder,
        atomsByChain: chainAtoms
    };
}

function getSortKey(chain) {
    const isAlpha = /[A-Za-z]/.test(chain);
    return [isAlpha ? 0 : 1, chain];
}

function extractAtomRecords(chainAtoms, chain1, chain2) {
    const atoms = [];
    if (chainAtoms[chain1]) {
        atoms.push(...chainAtoms[chain1]);
    }
    if (chainAtoms[chain2]) {
        atoms.push(...chainAtoms[chain2]);
    }
    return atoms.join('\n');
}

export default {
    name: "search",
    components: { 
        FileButton,
    },
    data() {
        return {
            inSearch: false,
            response: [],
            error: null,
            showChainSelection: false,
            availableChainPairs: [],
            selectedChainPair: '',
            chainAtomsByChain: {},
            pdbContent: null,
            selectedChains: null
        };
    },
    methods: {
        log(value) {
            console.log(value);
        },
        generateChainPairs(chains) {
            const pairs = [];
            for (let i = 0; i < chains.length; i++) {
                for (let j = i + 1; j < chains.length; j++) {
                    pairs.push([chains[i], chains[j]]);
                }
            }
            return pairs.sort((a, b) => {
                const keyA = [...getSortKey(a[0]), getSortKey(a[1])];
                const keyB = [...getSortKey(b[0]), getSortKey(b[1])];
                return keyA < keyB ? -1 : keyA > keyB ? 1 : 0;
            });
        },
        confirmChainPair() {
            if (!this.selectedChainPair) return;
            const [chain1, chain2] = this.selectedChainPair.split(',');
            this.showChainSelection = false;
            this.submitSearch(chain1, chain2);
        },
        submitSearch(chain1, chain2) {
            this.inSearch = true;
            this.error = null;
            this.selectedChains = [chain1, chain2];
            
            const atomRecordsString = extractAtomRecords(this.chainAtomsByChain, chain1, chain2);
            new Promise((resolve, reject) => {
                this.$axios.post('https://search-dev.foldseek.com/api/ticket', convertToQueryUrl({
                // this.$axios.post('http://localhost:8081/api/ticket', convertToQueryUrl({
                    q: atomRecordsString,
                    database: ["pdb_intclurep"],
                    mode: "interface-3diaa"
                }), {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                })
                .then(result => {
                    let job = result.data;
                    if (!job || !job.id) {
                        reject(new Error("Invalid response from server: no job ID received"));
                        return;
                    }
                    const checkJobStatus = () => {
                        this.$axios.get('https://search-dev.foldseek.com/api/ticket/' + job.id)
                        // this.$axios.get('http://localhost:8081/api/ticket/' + job.id)
                            .then(result => {
                                job = result.data;
                                if (job.status === 'PENDING' || job.status === 'RUNNING') {
                                    setTimeout(checkJobStatus, 1000);
                                } else if (job.status === 'COMPLETE') {
                                    console.log("Search completed for job:", job.id);
                                    resolve(job.id);
                                } else if (job.status === 'FAILED' || job.status === 'ERROR') {
                                    reject(new Error(job.error || "Search failed"));
                                } else {
                                    reject(new Error("Unknown job status: " + job.status));
                                }
                            })
                            .catch(error => {
                                console.error("Error checking job status:", error);
                                reject(error);
                            });
                    };
                    checkJobStatus();
                })
                .catch(error => {
                    console.error("Error submitting search:", error);
                    reject(error)
                })
            })
            .then((jobid) => {
                this.$emit('response', jobid);
            })
            .catch((err) => {
                if (err.response && err.response.data && err.response.data.error) {
                    this.error = err.response.data.error;
                } else if (err.message) {
                    this.error = err.message;
                } else {
                    console.error(err);
                    this.error = "Unknown error";
                }
            })
            .finally(() => {
                this.inSearch = false;
            });
        },
        upload(files) {
            var reader = new FileReader();
            reader.onload = e => {
                this.error = null;
                const chainInfo = extractChainInfo(e.target.result);
                const chains = chainInfo.chains;
                
                if (chains.length < 2) {
                    this.error = "Interface search requires at least two chains but only " + chains.length + " found.";
                    this.showChainSelection = false;
                    return;
                }
                
                this.chainAtomsByChain = chainInfo.atomsByChain;
                this.pdbContent = e.target.result;
                
                if (chains.length === 2) {
                    // Automatically search with the two chains
                    this.submitSearch(chains[0], chains[1]);
                } else {
                    // Show chain selection UI
                    this.availableChainPairs = this.generateChainPairs(chains);
                    this.showChainSelection = true;
                }
            };
            reader.readAsText(files[0]);
        },
    }
};
</script>