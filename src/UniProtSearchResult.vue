<template>
<v-flex xs12>
<panel class="query-panel d-flex fill-height" fill-height>
    <template v-slot:header>
        Cluster selection
    </template>

    <template v-slot:content>
        <v-data-table
            :headers="headers"
            :items="response"
            :options.sync="options"
            :server-items-length="total"
            :footer-props="{
                'items-per-page-options': [10, 20, 50, 100, -1],
            }"
        >
            <template v-slot:item.structure="prop">
                <div style="text-align: left;">
                    <router-link :to="{ name: 'cluster', params: { cluster: prop.item.intclu_rep_accession }}" > <!-- target='_blank' -->
                        {{ prop.item.intclu_rep_accession }}
                        <!-- <img :src="getImage(prop.item.intclu_rep_accession)" style="height:75px"/> -->
                    </router-link>
                </div>
            </template>
            <template v-slot:item.pdb_id="prop">
                <div class="align-left">
                    <ExternalLinks :accession="prop.value.toUpperCase()" reference="PDB" simple>
                        <!-- <router-link v-slot:accession :to="{ name: 'cluster', params: { cluster: prop.item.intclu_rep_accession }}" target='_blank'>{{ prop.item.intclu_rep_accession }}</router-link> -->
                    </ExternalLinks><br>
                    {{ prop.item.description  }}
                </div>
            </template>
            <template v-slot:item.chains="prop">
                <span>{{prop.item.chain1}}</span><br><span>{{prop.item.chain2}}</span>
            </template>
            <template v-slot:item.uniprot_id="prop">
                <div class="align-left">
                    <span v-if="prop.item.uniprot_id1">
                        <ExternalLinks :accession="prop.item.uniprot_id1" reference="UniProt" simple></ExternalLinks>
                    </span>
                    <span v-else>N/A&nbsp;</span>
                    <br>
                    <span v-if="prop.item.uniprot_id2">
                        <ExternalLinks :accession="prop.item.uniprot_id2" reference="UniProt" simple></ExternalLinks>
                    </span>
                    <span v-else>N/A&nbsp;</span>
                </div>
            </template>


            /*FIXME: this is currently not working*/
            <template v-slot:header.lca_tax_id="{ header }"> 
                <TaxonomyAutocomplete
                    v-model="options.tax_id"
                    :urlFunction="(_, b) => '/search/uniprot/' + b"
                    :disabled="taxAutocompleteDisabled"
                    :options="requestOptions"
                ></TaxonomyAutocomplete>
            </template>

            <template v-slot:item.lca_tax_id="prop">
                <TaxSpan :taxonomy="prop.value"></TaxSpan>
            </template>

            <template v-slot:header.n_mem="{ header }">
                <v-menu
                    :close-on-content-click="false"
                    offset-y>
                    <template v-slot:activator="{ on }">
                        <v-btn v-on="on" plain>
                            {{ header.text }}
                        </v-btn>
                    </template>
                    <RangeSlider :range="options.n_mem_range"></RangeSlider>
                </v-menu>
            </template>

        </v-data-table>
    </template>
</panel>
</v-flex>
</template>

<script>
import Panel from "./Panel.vue";
import TaxSpan from "./TaxSpan.vue";
import TaxonomyAutocomplete from "./TaxonomyAutocomplete.vue";
import RangeSlider from './RangeSlider.vue';
import ExternalLinks from "./ExternalLinks.vue";
import ImageMixin from "./ImageMixin";

export default {
    name: "uniprotsearchresult",
    components: { 
        Panel,
        TaxSpan,
        TaxonomyAutocomplete,
        // IsDark,
        RangeSlider,
        ExternalLinks
    },
    // mixins: [ImageMixin],
    data() {
        return {
            response: [],
            total: null,
            page: null,
            headers: [
                {
                    // text: "Structure",
                    text: "Cluster Rep.",
                    value: "structure",
                    sortable: false,
                    width: "10%",
                },
                {
                    text: "PDB ID",
                    value: "pdb_id",
                    sortable: false,
                },
                {
                    text: "Chains",
                    value: "chains",
                    sortable: false,
                    width: "10%",
                },
                {
                    text: "UniProt",
                    value: "uniprot_id",
                    sortable: false,
                },
                // {
                //     text: "Interface Cluster ID",
                //     value: "intclu_rep_accession",
                //     sortable: false,
                // },
                {
                    text: "LCA",
                    value: "lca_tax_id",
                    sortable: false,
                },
                {
                    text: "Members",
                    value: "n_mem",
                    sortable: false,
                },

            ],
            options: {
                n_mem_range: [0, Infinity],
                tax_id: null,
            },
            taxAutocompleteDisabled: false,
            range: [5, 5],
        };
    },
    mounted() {
        this.fetchData();
    },
    watch : {
        options: {
            handler () {
                this.fetchData()
            },
            deep: true,
        },
        '$route': function(to, from) {
            if (from.path != to.path) {
                this.fetchData();
            }
        }
    },
    computed: {
        requestOptions() {
            const options = {
                "query_UniProt": this.$route.params.accession,
                "search_type": "uniprot",
            };
            const obj = Object.assign({}, this.options, options);
            let copy = JSON.parse(JSON.stringify(obj));
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
        log(value) {
            console.log(value);
        },
        fetchData () {
            if (!this.$route.params.accession) {
                return;
            }

            this.loading = true;
            this.$axios.get("/search/uniprot", this.requestOptions)
                .then(response => {
                    this.response = response.data.result;
                    this.total = response.data.total;
                    // this.fetchImages(this.response.map(m => m.intclu_rep_accession));
                    this.$emit('total', this.total);
                })
                .finally(() => {
                    this.loading = false;
                });
        }
    }
};
</script>
