<template>
<Panel style="margin-top: 1em;" collapsible>
    <template v-slot:header>
        Similar Interfaces
    </template>

    <template v-slot:toolbar-extra>
        <v-btn plain :href="`${$axios.defaults.baseURL}/cluster/${$route.params.cluster}/similars?format=summary&${requestOptions.params.toString()}`" target="_blank">
            <v-icon class="mr-1">{{ $MDI.Export }}</v-icon>
            Export
        </v-btn>
    </template>
    <template v-slot:content v-if="$route.params.cluster">
    <v-data-table
        :headers="headers"
        :items="entries"
        :options.sync="options"
        :server-items-length="totalEntries"
        :loading="loading"
        :footer-props="{
            'items-per-page-options': [10, 20, 50, 100, -1],
        }"
    >
        <template v-slot:item.accession="prop">
            <ExternalLinks :accession="prop.item.pdb_id.toUpperCase()" reference="PDB" simple></ExternalLinks><br>
            <span
                class="caption text--darken-1"
                :title="prop.item.description || ''"
                style="display: inline-block; max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; vertical-align: bottom;"
            >{{ prop.item.description }}</span>
        </template>
        <template v-slot:item.chains="prop">
            <div>{{ prop.item.chain1 }}</div>
            <div>{{ prop.item.chain2 }}</div>
        </template>
        <template v-slot:item.uniprot="prop">
            <div>
                <span v-if ="prop.item.uniprot_id1 !== null"><ExternalLinks :accession="prop.item.uniprot_id1" simple></ExternalLinks></span>
                <span v-else>N/A</span>
            </div>
            <div>
                <span v-if ="prop.item.uniprot_id2 !== null"><ExternalLinks :accession="prop.item.uniprot_id2" simple></ExternalLinks></span>
                <span v-else>N/A</span>
            </div>
        </template>
        <template v-slot:header.structure="{ header }">
            {{ header.text }}
            <v-tooltip top>
                <template v-slot:activator="{ on }">
                    <span v-on="on">
                        <v-icon v-on="on">{{ $MDI.HelpCircleOutline }}</v-icon>
                    </span>
                </template>
                <span>
                   Click on a structure to superpose its interface on to the cluster representative in the structure viewer
                </span>
            </v-tooltip>
        </template>
        <template v-slot:item.structure="prop">
            <div v-ripple="{ class: `primary--text` }" style="text-align: center; cursor: pointer;" @click="$emit('select', prop.item.accession)">
                <img :src="getImage(prop.item.accession)" style="height:75px"/>
            </div>
        </template>

        <template v-slot:header.lca_tax_id="{ header }">
                <TaxonomyAutocomplete
                    :cluster="cluster"
                    v-model="options.tax_id"
                    :urlFunction="(a, b) => '/cluster/' + a + '/similars/taxonomy/' + b"
                    :options="requestOptions"
                    :disabled="taxAutocompleteDisabled">
                </TaxonomyAutocomplete>
        </template>
        <template v-slot:item.lca_tax_id="prop">
            <div v-if="prop.item.lca_tax_id && prop.item.lca_tax_id.name"><TaxSpan :taxonomy="prop.item.lca_tax_id"></TaxSpan></div>
            <div v-else>N/A</div>
        </template>

        <template v-slot:item.qtm="prop">
            {{ prop.item.qtm.toFixed(3) }}
        </template>
        <template v-slot:item.qchaintm="prop">
            <div>{{ prop.item.qchaintm[0].toFixed(3) }}</div>
            <div>{{ prop.item.qchaintm[1].toFixed(3) }}</div>
        </template>
        <template v-slot:item.intlddt="prop">
            {{ prop.item.intlddt.toFixed(3) }}
        </template>

        <template v-slot:item.actions="{ item }">
            <v-chip title="Search with Foldseek" :href="'https://search-dev.foldseek.com/interface?accession=' + item.pdb_id + '&source=PDB'" target="_blank">
                <!-- TODO: we cannot source it from external database -->
            <!-- <v-chip title="Search with Foldseek" :href="'http://localhost:8082/interface?accession=' + item.pdb_id + '&source=PDB'" target="_blank"> -->
                <v-img :src="require('./assets/marv-foldseek-small.png')" max-width="16"></v-img>
            </v-chip>
        </template>
    </v-data-table>
</template>
</Panel>
</template>

<script>
import TaxSpan from "./TaxSpan.vue";
import StructureViewer from "./StructureViewer.vue";
import ExternalLinks from "./ExternalLinks.vue";
import TaxonomyAutocomplete from "./TaxonomyAutocomplete.vue";
import Sankey from "./Sankey.vue";
import ImageMixin from './ImageMixin';
import Panel from "./Panel.vue";

export default {
    name: "Similars",
    components: {
        Panel,
        TaxSpan,
        StructureViewer,
        ExternalLinks,
        TaxonomyAutocomplete,
        Sankey,
    },
    props: ["cluster"],
    mixins: [ImageMixin],
    data() {
        return {
            headers: [
                {
                    text: "Structure",
                    value: "structure",
                    sortable: false,
                    width: "10%",
                },
                {
                    text: "PDB ID",
                    value: "accession",
                    sortable: false,
                    width: "20%",
                },
                {
                    text: "Chains",
                    value: "chains",
                    sortable: false,
                    width: "5%",
                },
                {
                    text: "UniProt ID",
                    value: "uniprot",
                    sortable: false,
                    width: "15%",
                },
                {
                    text: "Lowest common ancestor",
                    value: "lca_tax_id",
                    sortable: false,
                    width: "20%",
                },
                {
                    text: "TM-score",
                    value: "qtm",
                    sortable: true,
                    width: "10%",
                },
                {
                    text: "Chain TM-score",
                    value: "qchaintm",
                    sortable: false,
                    width: "10%",
                },
                {
                    text: "Interface LDDT",
                    value: "intlddt",
                    sortable: true,
                    width: "10%",
                },
                { text: 'Actions', value: 'actions', sortable: false },
            ],
            entries: [],
            totalEntries: 0,
            loading: false,
            options: {
                tax_id: null,
            },
            taxAutocompleteDisabled: false,
        }
    },
    watch: {
        options: {
            handler () {
                this.fetchData()
            },
            deep: true,
        },
        cluster() {
            this.fetchData();
        }
    },
    computed: {
        requestOptions() {
            let copy = JSON.parse(JSON.stringify(this.options));
            if (copy.tax_id) {
                copy.tax_id = copy.tax_id.value;
            } else {
                delete copy.tax_id;
            }
            const params = new URLSearchParams(copy);
            params.sort();
            return { params };
        },
    },
    methods: {
        sankeySelect(value) {
            if (value == null) {
                this.options.tax_id = null;
                this.taxAutocompleteDisabled = false;
            } else {
               this.options.tax_id = { value: value.id, text: value.name };
               this.taxAutocompleteDisabled = true;
            }
            // this.fetchData()
        },
        log(value) {
            console.log(value);
            return value;
        },
        fetchData() {
            this.loading = true;
            const cluster = this.cluster;
            if (!cluster) {
                return;
            }

            this.$axios.get("/cluster/" + cluster + "/similars", this.requestOptions)
                .then(response => {
                    this.entries = response.data.similars;
                    this.totalEntries = response.data.total;
                    this.fetchImages(this.entries.map(m => m.intclu_rep_accession));
                })
                .catch(() => {})
                .finally(() => {
                    this.loading = false;
                })
        }
    }
}

</script>