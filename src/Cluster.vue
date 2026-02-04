<template>

<v-row style="margin:1em;">
    <v-flex xs12 md8>
    <panel>
        <template slot="header" v-if="response">
            Cluster: {{ response ? response.intclu_rep_accession : "Loading..." }}
        </template>

        <template v-if="response && response.warning == true" slot="toolbar-extra">
            <v-chip color="error">Warning</v-chip>
        </template>

        <template slot="content" v-if="response">
            <div>
            <h3>
                Representative PDB:
                <ExternalLinks :accession="response.pdb_id.toUpperCase()" reference="PDB"></ExternalLinks>
            </h3>
            </div>
            <div class="d-flex">
                <div class="flex-grow-1" style="width: 50%">
                    <h4 style="margin-top:0.5em" align="center">
                        Chain {{ response.chain1 }}
                    </h4>
                    <dl class="dl-2">
                        <div>
                        <dt>UniProt Accession</dt>
                        <dd>
                            <ExternalLinks :accession="response.uniprot_id1"></ExternalLinks><br>
                            {{ response.description }}
                        </dd>
                        </div>
                        <div>
                        <dt>
                            Taxonomy
                            <v-btn icon x-small @click="showLineage1 = !showLineage1">
                                <v-icon>{{ showLineage1 ? $MDI.ChevronLeft : $MDI.ChevronRight }}</v-icon>
                            </v-btn>
                        </dt>
                        <dd>
                            <div v-if="showLineage1 === false">
                                {{ response.tax_id1.name }}
                            </div>
                            <div v-else>
                                <span v-for="(taxonomy, index) in response.rep_lineage1" :key="taxonomy.id"><TaxSpan :taxonomy="taxonomy"></TaxSpan><template v-if="index < (response.rep_lineage1.length -1)"> &#187;&nbsp;</template></span>
                            </div>
                        </dd>
                        </div>
                    </dl>
                </div>

                <v-divider vertical class="mx-3"></v-divider>

                <div class="flex-grow-1" style="width: 50%">
                    <h4 style="margin-top:0.5em" align="center">
                        Chain {{ response.chain2 }}
                    </h4>
                    
                    <dl class="dl-2">
                    <div>
                        <dt>UniProt Accession</dt>
                        <dd>
                            <ExternalLinks :accession="response.uniprot_id2"></ExternalLinks><br>
                            {{ response.description }}
                        </dd>
                    </div>
                    <div>
                        <dt>
                            Taxonomy
                            <v-btn icon x-small @click="showLineage2 = !showLineage2">
                                <v-icon>{{ showLineage2 ? $MDI.ChevronLeft : $MDI.ChevronRight }}</v-icon>
                            </v-btn>
                        </dt>
                        <dd>
                            <div v-if="showLineage2 === false">
                                {{ response.tax_id2.name }}
                            </div>
                            <div v-else>
                                <span v-for="(taxonomy, index) in response.rep_lineage2" :key="taxonomy.id"><TaxSpan :taxonomy="taxonomy"></TaxSpan><template v-if="index < (response.rep_lineage2.length -1)"> &#187;&nbsp;</template></span>
                            </div>
                        </dd>
                    </div>
                    </dl>
                </div>

            </div>
                <v-divider  style="margin-top:0.5em"></v-divider>
                <h3 style="margin-top:1em">
                    Cluster summary
                    <v-tooltip top>
                        <template v-slot:activator="{ on }">
                            <span v-on="on">
                                <v-icon v-on="on">{{ $MDI.HelpCircleOutline }}</v-icon>
                            </span>
                        </template>
                        <span>
                            TODO
                        </span>
                    </v-tooltip>
                </h3>
                <dl class="dl-4">
                <div>
                <dt>
                    Number of members
                </dt>
                <dd>
                    {{ response.n_mem }}
                </dd>
                </div>
                <div>
                <dt>
                    Average length
                </dt>
                <dd>
                    {{ response.avg_len.toFixed(2) }} aa
                </dd>
                </div>
                <div style=" grid-area: 2 / 1 / 3 / 5;">
                <dt>
                    Lowest common ancestor and lineage
                </dt>
                <dd>
                    <template v-for="(taxonomy, index) in response.lineage" ><TaxSpan :taxonomy="taxonomy" :key="taxonomy.id"></TaxSpan><template v-if="index < (response.lineage.length -1)"> &#187;&nbsp;</template></template>
                </dd>
                </div>
                </dl>
            <template v-if="response && response.warning == true">
                <v-divider  style="margin-top:0.5em"></v-divider>
                <h3 style="margin-top:1em; color: #F44336; text-decoration: underline;">
                    Warning!
                </h3>
                <p>
                    This cluster was wrongly merged with another cluster. We are working on a fix.
                </p>
            </template>
        </template>
    </panel>
    </v-flex>
    <v-flex xs12 md4>
    <Panel class="repr-structure">
        <template slot="header">
            Representative structure
        </template>
        <template slot="content" v-if="response">
            <StructureViewer v-if="$route.params.cluster" :cluster="$route.params.cluster" :second="second" :chain1_id="response.chain1_id" :chain2_id="response.chain2_id" bgColorDark="#2e2e2e" @reset="second = ''"></StructureViewer>
        </template>
    </Panel>
    </v-flex>

    <v-flex xs12>
        <Members :cluster="$route.params.cluster" @select="(accession) => second = accession"></Members>
    </v-flex>

    <!-- <v-flex xs12>
        <Similars :cluster="$route.params.cluster" @select="(accession) => second = accession"></Similars>
    </v-flex> -->
</v-row>
</template>

<script>
import Panel from "./Panel.vue";
import StructureViewer from "./StructureViewer.vue";
import Members from "./Members.vue";
import TaxSpan from "./TaxSpan.vue";
import ExternalLinks from "./ExternalLinks.vue";
import Similars from "./Similars.vue";
// import Annotations from "./Annotations.vue";

export default {
    name: "cluster",
    components: {
    Panel,
    StructureViewer,
    Members,
    TaxSpan,
    ExternalLinks,
    Similars,
    // Annotations,
},
    data() {
        return {
            cluster: null,
            response: null,
            fetching: false,
            second: "",
            showLineage1: false,
            showLineage2: false,
        }
    },
    mounted() {
        this.fetchData();
    },
    watch: {
        $route(to, from) {
            if (to.params.cluster === from.params.cluster) {
                return;
            }

            this.fetchData();
        }
    },
    methods: {
        log(value) {
            console.log(value);
        },
        fetchData() {
            this.fetching = true;
            this.cluster = this.$route.params.cluster;
            if (!this.cluster) {
                return;
            }

            this.$axios.get("/cluster/" + this.$route.params.cluster)
                .then(response => {
                    this.response = response.data;
                    console.log(this.response)
                })
                .catch((result) => {
                    if (!result || !result.response || result.response.status != 404) {
                        return;
                    }
                    this.$axios.get("/" + this.$route.params.cluster)
                        .then(response => {
                            this.$router.replace({ name: "cluster", params: { cluster: response.data[0].rep_accession } });
                        })
                        .catch(() => {});
                })
                .finally(() => {
                    this.fetching = false;
                });
        }
    }
}

</script>

<style scoped>
dl {
  display: grid;
  padding-top: .25em;
  padding-bottom: 1em;
  grid-gap: 1em;
}
.dl-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.dl-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.dl-4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

dt {
    font-weight: bold;
}

@media screen and (min-width: 961px) {
    .repr-structure {
        margin-left: 1em;
    }
}

@media screen and (max-width: 960px) {
    .repr-structure {
        margin-top: 1em;
    }
}
</style>
