<template>
    <v-container fluid class="px-0 py-0" id="search-container">
        <v-row class="ma-0">
            <v-col cols="12" class="pa-0">
                <v-parallax
                    :height="windowHeight"
                    :src="require('./assets/BFVD-bg.png')"
                >
                    <v-theme-provider theme="dark" with-background style="background: transparent;">
                    <v-row
                        align="center"
                        justify="center"
                        class="marv-bg-fg"
                    >
                        <v-col
                            class="text-center pt-8"
                            cols="12"
                        >
                            <h1 class="text-h4 font-weight-thin mb-4">
                                BFVD
                            </h1>
                            <h4 class="subheading">
                                The missing viral bits of the <a href="https://alphafold.ebi.ac.uk" target="_blank" rel="noopener">AlphaFold database</a>
                            </h4>
                            
                            <br>
                             
                            <v-tabs
                                class="search-select"
                                slider-size="1"
                                v-model="tab"
                                centered
                                background-color="transparent"
                            >
                                <v-tab>UniProt</v-tab>
                                <!-- <v-tab>Gene Ontology</v-tab> -->
                                <v-tab>Taxonomy</v-tab>
                                <v-tab>Structure</v-tab>
                            </v-tabs>
                            <v-tabs-window v-model="tab" style="padding: 1em;">
                                <v-tabs-window-item>
                                    <v-text-field
                                        variant="outlined"
                                        label="UniProt accession"
                                        style="max-width: 400px; margin: 0 auto;"
                                        v-model="query"
                                        :append-icon="inSearch ? $MDI.ProgressWrench : $MDI.Magnify"
                                        :disabled="inSearch"
                                        @click:append="search"
                                        @keyup.enter="search"
                                        @change="selectedExample = null"
                                        @keydown="error = null"
                                        :error="error != null"
                                        :error-messages="error ? error : []"
                                        >
                                    </v-text-field>
                                    
                                    <h2 class="text-h6 mb-2">
                                        Examples
                                    </h2>
                                    <v-chip-group
                                        column
                                        v-model="selectedExample"
                                        style="max-width: 400px; margin: 0 auto; "
                                    >
                                        <v-chip v-for="(item, index) in examples" :key="item.id" :value="index"
                                            variant="outlined" v-on:click="query=item.id" >
                                            <b>{{ item.id }}</b> &emsp; {{ item.desc }}
                                        </v-chip>
                                    </v-chip-group>
                                </v-tabs-window-item>
                                <!-- <v-tabs-window-item>
                                    <GoAutocomplete
                                        :append-icon="inSearch ? $MDI.ProgressWrench : $MDI.Magnify"
                                        v-model="queryGo"
                                        :disabled="inSearch"
                                        @click:append="searchGo"
                                        @keyup.enter="searchGo"
                                        @change="selectedExample = null"
                                        @keydown="error = null"
                                        :error="error != null"
                                        :error-messages="error ? error : []"
                                        ></GoAutocomplete>

                                    <v-radio-group 
                                        style="
                                            max-width: 400px;
                                            margin: 0 auto;
                                            "
                                        v-model="goSearchType"
                                        inline>
                                        <v-radio name="goSearchType" label="Include lower GO lineage" value="lower"></v-radio>
                                        <v-radio name="goSearchType" label="Exact GO term" value="exact"></v-radio>
                                    </v-radio-group>
                                </v-tabs-window-item> -->
                                <v-tabs-window-item>
                                    <TaxonomyNcbiSearch
                                        :append-icon="inSearch ? $MDI.ProgressWrench : $MDI.Magnify"
                                        @click:append="searchLCA"
                                        @update:model-value="searchLCA"
                                        @keyup.enter="searchLCA"
                                        v-model="queryLCA"
                                    ></TaxonomyNcbiSearch>
                                    <v-radio-group 
                                        style="
                                            max-width: 400px;
                                            margin: 0 auto;
                                            "
                                        v-model="lcaSearchType"
                                        inline>
                                        <v-radio name="lcaSearchType" label="Include lower LCA lineage" value="lower"></v-radio>
                                        <v-radio name="lcaSearchType" label="Exact LCA identifier" value="exact"></v-radio>
                                    </v-radio-group>
                                </v-tabs-window-item>
                                <v-tabs-window-item>
                                    <FoldseekSearchButton @response="searchFoldseek($event)"></FoldseekSearchButton>
                                </v-tabs-window-item>
                            </v-tabs-window>
                        </v-col>
                    </v-row>
                    </v-theme-provider>
                </v-parallax>
            </v-col>
            <!-- <GoSearchResult v-if="tab == 1" @total="small = $event > 0; inSearch = false;"></GoSearchResult> -->
            <!-- <LCASearchResult v-else-if="tab == 2" @total="small = $event > 0; inSearch = false;"></LCASearchResult> -->
            <!-- <FoldseekSearchResult v-else-if="tab == 3" @total="small = $event > 0; inSearch = false;"></FoldseekSearchResult> -->
            <LCASearchResult v-if="tab == 1" @total="small = $event > 0; inSearch = false;"></LCASearchResult>
            <FoldseekSearchResult v-else-if="tab == 2" @total="small = $event > 0; inSearch = false;"></FoldseekSearchResult>
            <v-col>
                <v-card rounded="0">
                    <v-col>
                    <v-card-title primary-title class="pb-0 mb-0">
                        <div class="text-h5 mb-0">Reference</div>
                    </v-card-title>
                    <v-card-title primary-title class="pt-0 mt-0">
                        
                        <p class="text-subtitle-1 mb-0" style="word-break: break-word;">
                            Kim&nbsp;R, Levy&nbsp;Karin&nbsp;E, Mirdita&nbsp;M, Steinegger&nbsp;M.
                            <a href="https://academic.oup.com/nar/advance-article/doi/10.1093/nar/gkae1119/7906834" target="_blank" rel="noopener">BFVD - a large repository of predicted viral protein structures.</a>
                            Nucleic Acids Research,&nbsp;gkae1119,&nbsp;2024.
                        </p>
                    </v-card-title>
                    </v-col>
                </v-card>

                <!-- <p class="text-subtitle-1 mb-0 collab">
                    AFDB Clusters is a collaboration between
                    <a href="https://en.snu.ac.kr/">Seoul National University</a>, the
                    <a href="https://www.ebi.ac.uk/">European Bioinformatics Institute</a>, <br>and the
                    <a href="https://www.sib.swiss/">Swiss Institute of Bioinformatics</a>.
                </p>
                <div style="text-align: center; padding-top: 12px; padding-bottom: 40px;">
                    <a style="margin: 12px" rel="external noopener" target="_blank" href="https://en.snu.ac.kr/" height="128">
                        <img class="logos" src="./assets/snu_logo_opt.svg" height="64"/>
                    </a>
                    <a style="margin: 12px" rel="external noopener" target="_blank" href="https://www.ebi.ac.uk/" height="128">
                        <img class="logos" src="./assets/embl_logo.svg" height="64"/>
                    </a>
                    <a style="margin: 12px" rel="external noopener" target="_blank" href="https://www.sib.swiss/" height="128">
                        <img class="logos" src="./assets/logo_sib.svg" height="64"/>
                    </a>
                </div> -->
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
import Panel from "./Panel.vue";
import GoAutocomplete from "./GoAutocomplete.vue";
import GoSearchResult from "./GoSearchResult.vue";
import FoldseekSearchButton from "./FoldseekSearchButton.vue";
import TaxonomyNcbiSearch from "./TaxonomyNcbiSearch.vue";
import LCASearchResult from "./LCASearchResult.vue";
import FoldseekSearchResult from "./FoldseekSearchResult.vue";

export default {
    name: "search",
    components: { 
        Panel,
        GoAutocomplete,
        GoSearchResult,
        TaxonomyNcbiSearch,
        LCASearchResult,
        FoldseekSearchButton,
        FoldseekSearchResult,
    },
    data() {
        return {
            tab: 0,
            query: "A0A2Z4HFS2",
            selectedExample: 1,
            examples: [
                {id:'A0A2Z4HFS2', desc:'Spike Glycoprotein'},
                {id:'P21405', desc:'Replicase polyprotein P2AB'},
                {id:'A0A0R5U5Y9', desc:'Hemagglutinin'},
            ],
            queryGo: { text: "immune response", value: "GO:0006955" },
            goSearchType: "lower",
            queryLCA: { text: "Tobacco mosaic virus", value: "12242", common_name: "Tobacco mosaic virus" },
            lcaSearchType: "lower",
            inSearch: false,
            response: null,
            small: false,
            error: null,
            viewportHeight: window.innerHeight,
        };
    },
    computed: {
        windowHeight() {
            if (this.small && !this.tab == 0) {
                return 500;
            }
            return Math.max(Math.min(860, (this.viewportHeight - 48) * 0.8), 650);
        },
    },
    mounted() {
        this.setTab();
        this.handleViewportResize = () => { this.viewportHeight = window.innerHeight; };
        window.addEventListener('resize', this.handleViewportResize);
    },
    beforeUnmount() {
        window.removeEventListener('resize', this.handleViewportResize);
    },
    watch : {
        '$route': function(to, from) {
            if (from.path != to.path) {
                this.setTab();
            }
        }
    },
    methods: {
        log(value) {
            console.log(value);
        },
        setTab() {
            if (this.$route.params.go) {
                this.tab = 1;
                this.queryGo = { text: "" + this.$route.params.go, value: this.$route.params.go};
                this.goSearchType = this.$route.params.type;
            } else if (this.$route.params.taxid) {
                // this.tab = 2;
                this.tab = 1;
                this.queryLCA = {text: "" + this.$route.params.taxid, value: this.$route.params.taxid};
                this.lcaSearchType = this.$route.params.type;
            } else if (this.$route.params.jobid) {
                // this.tab = 3;
                this.tab = 2;
            } else {
                this.tab = 0;
            }
        },
        search() {
            this.inSearch = true;
            this.error = null;
            this.$axios.get("/" + this.query)
                .then(response => {
                    this.$router.push({ name: 'cluster', params: { cluster: response.data[0].rep_accession } })
                })
                .catch((err) => {
                    if (err.response && err.response.data && err.response.data.error) {
                        this.error = err.response.data.error;
                    } else {
                        this.error = "Unknown error";
                    }
                })
                .finally(() => {
                    this.inSearch = false;
                });
        },
        searchGo() {
            if (!this.queryGo) {
                return;
            }
            this.inSearch = true;
            this.error = null;
            this.$router.push({
                name: "go",
                params: { go: this.queryGo.value, type: this.goSearchType }
            })
            .catch((error) => {
                if (error && error.name == "NavigationDuplicated") {
                    this.inSearch = false;
                }
            });
        },
        searchLCA() {
            if (!this.queryLCA) {
                return;
            }
            this.inSearch = true;
            this.error = null;
            this.$router.push({
                name: "lca",
                params: { taxid: this.queryLCA.value, type: this.lcaSearchType }
            })
            .catch((error) => {
                if (error && error.name == "NavigationDuplicated") {
                    this.inSearch = false;
                }
            });
        },
        searchFoldseek(jobid) {
            this.inSearch = true;
            this.error = null;
            this.$router.push({
                name: "foldseek",
                params: { jobid: jobid }
            })
            .catch((error) => {
                if (error && error.name == "NavigationDuplicated") {
                    this.inSearch = false;
                }
            });
        }
    }
};
</script>

<style scoped>
#search-container {
    padding:0px;
}
.search-component >>> .v-input--checkbox {
    margin-top: 0px;
}

.search-component >>> .input-group label {
    font-size: 16px;
}

.search-component >>> .v-text-field {
    margin-top: 0px;
    padding-top: 0px;
    margin-bottom: 8px;
}

code {
    font-size: 0.8em;
}

.v-theme--dark .v-input label {
    color: #FFFFFFB3;
}

.v-theme--light .v-input label {
    color: #00000099;
}

#search-container >>> .v-slide-group__content {
    justify-content: center;
}

.search-select >>> .v-tabs-bar {
    height: 36px;
}

.search-select >>> .v-tab {
    text-transform: none;
    padding: 0 24px
}
.v-tabs-window {
    background-color: transparent !important;
}

.v-parallax {
    transition: height 0.25s;
}

.marv-bg-fg {
    background: url('./assets/bg-fg.png');
    background-size: 100% 100%;
    background-repeat: no-repeat;
    background-attachment: fixed;
    background-position: center center;
}

.logos {
    padding: 4px;
    filter: grayscale(100%);
}

.collab {
    text-align: center;
    padding-top: 40px;
    font-weight: lighter;
    line-height: 1.2;
}

.collab a { 
    text-decoration: none;
    font-weight: 400;
    color: #999;
}

@media (prefers-color-scheme: dark) {
    .logos {
        /* padding: 8px; */
        /* filter: brightness(0) invert(1); */
        filter: grayscale(100%) invert();
        /* background-color: #ddd; */
        /* border-radius: 4px; */
    }

    .collab {
        color: #999;
    }
}

</style>
