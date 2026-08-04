<template>
<Panel style="margin-top: 1em;" collapsible>
    <template v-slot:header>
        Cluster members
    </template>

    <template v-slot:toolbar-extra>
        <v-btn plain :href="`${$axios.defaults.baseURL}/cluster/${$route.params.cluster}/members?format=summary&${requestOptions.params.toString()}`" target="_blank">
            <v-icon class="mr-1">{{ $MDI.Export }}</v-icon>
            Export
        </v-btn>
    </template>
        
<template v-slot:content v-if="$route.params.cluster">
    <Sankey :cluster="cluster" type="members" @select="sankeySelect"></Sankey>
    <v-data-table
        :headers="headers"
        :items="members"
        :options.sync="options"
        :server-items-length="totalMembers"
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
        <template v-slot:item.flag="prop">
            <ClusterLevel :flag="prop.value"></ClusterLevel>
        </template>
        <template v-slot:header.flag="{ header }">
            <v-menu
                :close-on-content-click="false"
                offset-y>
                <template v-slot:activator="{ on }">
                    <v-btn v-on="on" :outlined="options.flagFilter != null">
                        {{ header.text }}&nbsp;
                        <v-tooltip top>
                            <template v-slot:activator="{ on }">
                                <span v-on="on">
                                    <v-icon v-on="on">{{ $MDI.HelpCircleOutline }}</v-icon>
                                </span>
                            </template>
                            <span>
                                <img width="600" src="./assets/cluster_step.jpg"><br>
                                <!-- TODO -->
                                Member: TODO <br>
                                Dimer Representative: TODO <br>
                                Interface Representative: TODO <br>
                                <!-- AFDB/Foldseek: Clustered with structural similarity<br> -->
                                <!-- AFDB50/Mmseqs: Clustered at sequence identity 50%<br> -->
                                <!-- Fragment: Removed fragments among AFDB50<br> -->
                                <!-- Singleton: Removed singletons after fragment removal -->
                            </span>
                        </v-tooltip>
                    </v-btn>
                </template>

                <v-card style="padding: 2em; width: 250px;">
                    <h3>Filter by</h3>
                    <v-chip-group column v-model="options.flagFilter">
                        <ClusterLevel :flag="1"></ClusterLevel>
                        <ClusterLevel :flag="2"></ClusterLevel>
                        <ClusterLevel :flag="3"></ClusterLevel>
                    </v-chip-group>
                </v-card>
            </v-menu>
        </template>
        <template v-slot:header.tax_id="{ header }">
                <TaxonomyAutocomplete
                    :cluster="cluster"
                    v-model="options.tax_id"
                    :urlFunction="(a, b) => '/cluster/' + a + '/members/taxonomy/' + b"
                    :options="requestOptions"
                    :disabled="taxAutocompleteDisabled">
                </TaxonomyAutocomplete>
        </template>
        <template v-slot:item.tax_id="prop">
            <div class="text-caption" v-if="prop.item.tax_id1 && prop.item.tax_id1.name"><TaxSpan :taxonomy="prop.item.tax_id1"></TaxSpan></div>
            <div class="text-caption" v-else>N/A</div>
            <div class="text-caption" v-if="prop.item.tax_id2 && prop.item.tax_id2.name"><TaxSpan :taxonomy="prop.item.tax_id2"></TaxSpan></div>
            <div class="text-caption" v-else>N/A</div>
        </template>

        <template v-slot:item.actions="{ item }">
            <!-- <v-chip title="Search with Foldseek" :href="'http://localhost:8082/interface?accession=' + item.pdb_id + '&source=PDB'" target="_blank"> -->
            <v-chip title="Search with Foldseek" :href="'https://search-dev.foldseek.com/interface?accession=' + item.pdb_id + '&source=PDB'" target="_blank">
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
import ClusterLevel from "./ClusterLevel.vue";
import Sankey from './Sankey.vue';
import ImageMixin from './ImageMixin';
import Panel from "./Panel.vue";

export default {
    name: "members",
    components: {
        Panel,
        TaxSpan,
        StructureViewer,
        ExternalLinks,
        TaxonomyAutocomplete,
        ClusterLevel,
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
                    text: "Chain",
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
                    text: "Taxonomy",
                    value: "tax_id",
                    sortable: false,
                    width: "40%",
                },
                {
                    text: "Cluster-level",
                    value: "flag",
                    sortable: false,
                    width: "5%",
                },
                {
                    text: 'Actions',
                    value: 'actions',
                    sortable: false,
                    width: "5%",
                },
            ],
            members: [],
            totalMembers: 0,
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
            const cluster = this.$route.params.cluster;
            if (!cluster) {
                return;
            }

            this.$axios.get("/cluster/" + cluster + "/members", this.requestOptions)
                .then(response => {
                    this.members = response.data.result;
                    this.totalMembers = response.data.total;
                    this.fetchImages(this.members.map(m => m.accession));
                })
                .catch(() => {})
                .finally(() => {
                    this.loading = false;
                });
        },
    }
}

</script>