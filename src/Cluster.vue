<template>
<v-container fluid class="pa-4">
    <v-row align="stretch" mb-0 dense>
        <v-col cols="12" md="8">
            <panel>
                <template v-slot:header v-if="response">
                    Cluster: {{ response ? response.intclu_rep_accession : "Loading..." }}
                </template>

                <template v-if="response && response.warning == true" v-slot:toolbar-extra>
                    <v-chip color="error">Warning</v-chip>
                </template>

                <template v-slot:content v-if="response">
                    <h3 style="margin-top:1em">
                        Cluster summary
                        <v-tooltip top>
                            <template v-slot:activator="{ on }">
                                <span v-on="on"><v-icon v-on="on">{{ $MDI.HelpCircleOutline }}</v-icon></span>
                            </template>
                            <span>TODO</span>
                        </v-tooltip>
                    </h3>
                    
                    <dl class="dl-2">
                        <div style="grid-area: 1/1/2/2">
                        <dt>Number of members</dt>
                        <dd>{{ response.n_mem }}</dd>
                        </div>

                        <div style="grid-area: 1/2/2/3">
                        <dt class="mb-0 d-flex align-center">
                            <span>Interaction Orderedness&nbsp;</span>
                            <v-tooltip top>
                                <template v-slot:activator="{ on }">
                                    <span v-on="on"><v-icon small v-on="on">{{ $MDI.HelpCircleOutline }}</v-icon></span>
                                </template>
                                <span>Order and disorder categories are based on IUPred2A predictions for interface residues in the unbound state</span>
                            </v-tooltip>
                        </dt>
                        <dd class="mt-0 dd-tight"><svg ref="barOrderDisorder" class="chart"></svg></dd>
                        </div>

                        <div style="grid-area: 2/2/3/3">
                        <dt class="mb-0">Interface Secondary Structure Composition</dt>
                        <dd class="mt-0 dd-tight"><svg ref="barSS" class="chart"></svg></dd>
                        </div>

                        <div style=" grid-area: 2/1/3/2;">
                        <dt>
                            Lowest common ancestor and lineage<v-btn plain text small icon @click="showLineage = !showLineage"><v-icon small>{{ showLineage ? $MDI.ChevronLeft : $MDI.ChevronRight }}</v-icon></v-btn>
                        </dt>
                        <dd v-if="response.lineage == null"> N/A </dd>
                        <dd v-else-if="!showLineage">
                            {{ response.lineage[0].name }}                            
                        </dd>
                        <dd v-else>
                            <span v-for="(taxonomy, index) in response.lineage" :key="taxonomy.id"><TaxSpan :taxonomy="taxonomy"></TaxSpan><template v-if="index < (response.lineage.length -1)"> &#187;&nbsp;</template></span>
                        </dd>
                        </div>
                    </dl>
                    <v-divider style="margin-top:0.5em"></v-divider>

                    <div class="d-flex align-center justify-space-between mb-0">
                        <!-- <h3 class="mb-0 mt-0">Representative Summary</h3> -->
                        <h3>Representative: <ExternalLinks :accession="response.pdb_id.toUpperCase()" reference="PDB" /></h3>
                    </div>
                    <p class="mb-1 mt-0 text-body-2">
                        {{ response.description }}<br>
                        {{ response.protein1_status == true ? "Protein" : "Peptide" }}-{{ response.protein2_status == true ? "Protein" : "Peptide" }} |
                        {{ response.iftype1 == 2 ? "Ordered" : (response.iftype1 == 1 ? "Disordered" : "Unannotated") }}-{{ response.iftype2 == 2 ? "Ordered" : (response.iftype2 == 1 ? "Disordered" : "Unannotated") }} Interaction
                    </p>

                    <v-simple-table dense class="representative-table">
                        <template v-slot:default>
                            <thead>
                                <tr>
                                    <th class="text-left">Chain</th>
                                    <th class="text-left">UniProt</th>
                                    <th class="text-left">Taxonomy <v-btn plain text small icon @click="showTaxonomy = !showTaxonomy"><v-icon small>{{ showTaxonomy ? $MDI.ChevronLeft : $MDI.ChevronRight }}</v-icon></v-btn></th>
                                    <th class="text-left">Gene Name</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr class="row-a">
                                    <td>{{ response.chain1 }}</td>
                                    <td v-if="response.uniprot_id1  !== null"><ExternalLinks :accession="response.uniprot_id1" /></td>
                                    <td v-else>N/A</td>
                                    <td>
                                        <dd v-if="response.tax_id1 == null">N/A</dd>
                                        <dd v-else-if="!showTaxonomy">{{ response.tax_id1.name }}</dd>
                                        <dd v-else>
                                            <span v-for="(taxonomy, index) in response.rep_lineage1"><TaxSpan :taxonomy="taxonomy" :key="taxonomy.id"></TaxSpan><template v-if="index < (response.rep_lineage1.length -1)"> &#187;&nbsp;</template></span>
                                        </dd>
                                    </td>
                                    <td style="max-width: 150px;" :title="response.gene_name1 || 'N/A'">
                                        {{ response.gene_name1 || 'N/A' }}
                                    </td>
                                </tr>
                                <tr class="row-b">
                                    <td>{{ response.chain2 }}</td>
                                    <td v-if="response.uniprot_id2 !== null"><ExternalLinks :accession="response.uniprot_id2" /></td>
                                    <td v-else>N/A</td>
                                    <td>
                                        <dd v-if="response.tax_id2 == null">N/A</dd>
                                        <dd v-else-if="!showTaxonomy">{{ response.tax_id2.name }}</dd>
                                        <dd v-else>
                                            <span v-for="(taxonomy, index) in response.rep_lineage2" :key="taxonomy.id"><TaxSpan :taxonomy="taxonomy"></TaxSpan><template v-if="index < (response.rep_lineage2.length -1)"> &#187;&nbsp;</template></span>
                                        </dd>
                                    </td>
                                    <td style="max-width: 150px;" :title="response.gene_name2 || 'N/A'">
                                        {{ response.gene_name2 || 'N/A' }}
                                    </td>
                                </tr>
                            </tbody>
                        </template>
                    </v-simple-table>
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
        </v-col>
        
        <v-col cols="12" md="4">
            <Panel class="repr-structure">
                <template v-slot:header>
                    Representative structure
                </template>
                <template v-slot:content v-if="response">
                    <StructureViewer v-if="$route.params.cluster" :cluster="$route.params.cluster" :second="second" bgColorDark="#2e2e2e" @reset="second = ''"></StructureViewer>
                </template>
            </Panel>
        </v-col>
    </v-row>

    <v-row class="mt-0">
        <v-col cols="12">
            <Members :cluster="$route.params.cluster" @select="(accession) => second = accession"></Members>
        </v-col>
    </v-row>

    <v-flex xs12>
        <Similars :cluster="$route.params.cluster" @select="(accession) => second = accession"></Similars>
    </v-flex>
</v-container>
</template>

<script>
import Panel from "./Panel.vue";
import StructureViewer from "./StructureViewer.vue";
import Members from "./Members.vue";
import TaxSpan from "./TaxSpan.vue";
import ExternalLinks from "./ExternalLinks.vue";
import Similars from "./Similars.vue";
import { drawStackedBar } from './Utils.js';
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
            showLineage: false,
            showTaxonomy: false,
        }
    },
    mounted() {
        this.fetchData();
        window.addEventListener('resize', this.redrawCharts);
    },
    watch: {
        response: {
            immediate: true,
            handler() {
                this.$nextTick(() => {
                if (!this.response) return;

                drawStackedBar(this.$refs.barOrderDisorder, [
                    { label: 'Disorder-Disorder', value: this.response.ord_disdis_pct },
                    { label: 'Order-Disorder',   value: this.response.ord_disord_pct },
                    { label: 'Order-Order',      value: this.response.ord_ordord_pct },
                    { label: 'Unannotated',          value: this.response.ord_unanno_pct },
                ], { isFraction: true });
                drawStackedBar(this.$refs.barSS, [
                    { label: 'Mixed α/β',   value: this.response.ss_mixedaB_pct },
                    { label: 'Mostly α',    value: this.response.ss_mostlya_pct },
                    { label: 'Only α/β',    value: this.response.ss_onlyaB_pct },
                    { label: 'Other',       value: this.response.ss_other_pct },
                ], { isFraction: true });
                });
            }
        },
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
        },
        redrawCharts() {
            if (!this.response) return;
            drawStackedBar(this.$refs.barOrderDisorder, [
                { label: 'Disorder-Disorder', value: this.response.ord_disdis_pct },
                { label: 'Order-Disorder',   value: this.response.ord_disord_pct },
                { label: 'Order-Order',      value: this.response.ord_ordord_pct },
                { label: 'Unannotated',          value: this.response.ord_unanno_pct },
            ], { isFraction: true });
            drawStackedBar(this.$refs.barSS, [
                { label: 'Mixed α/β',   value: this.response.ss_mixedaB_pct },
                { label: 'Mostly α',    value: this.response.ss_mostlya_pct },
                { label: 'Only α/β',    value: this.response.ss_onlyaB_pct },
                { label: 'Other',       value: this.response.ss_other_pct },
            ], { isFraction: true });
        }
    }
}

</script>

<style scoped>
dl {
  display: grid;
  padding-top: 0rem;
  padding-bottom: 0rem;
  grid-gap: 0rem;
}

.chart {
    display: block;
    margin-top: 0;
    width: 100%;
    height: 60px;   /* keep height fixed */
}

.dl-2 {
  display: grid;
  grid-template-columns: minmax(0, 0.6fr) minmax(0, 1fr);
  grid-template-rows: max-content max-content;
  grid-auto-rows: max-content;
  row-gap: 0rem;
  column-gap: 0rem;
  margin: 0;
  padding: 0;
}

dt {
    font-weight: bold;
}

.dd-tight {
  margin-left: 0 !important;  /* remove default dd indent */
  margin-top: 0 !important;
}

.dd-tight svg {
  display: block;
}
.representative-table >>> tr.row-a:hover > td {
  background-color: rgba(127, 42, 97, 0.18) !important;
}

.representative-table >>> tr.row-b:hover > td {
  background-color: rgba(136, 211, 229, 0.18) !important;
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
