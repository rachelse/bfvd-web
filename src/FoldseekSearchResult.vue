<template>
    <v-col cols="12">
    <panel class="query-panel d-flex fill-height" fill-height>
        <template v-slot:header>
            Entry selection
            <template v-if="$route.params.jobid">
                for <a :href="'https://search.foldseek.com/result/' + $route.params.jobid + '/0'" target="_blank" rel="noopener">{{ $route.params.jobid }}</a>
            </template>
        </template>
    
        <template v-slot:content>
            <v-data-table
                :headers="headers"
                :items="response"
                v-model:page="options.page"
                v-model:items-per-page="options.itemsPerPage"
                :server-items-length="total"
                :footer-props="{
                    'items-per-page-options': [10, 20, 50, 100, -1],
                }"
            >
                <template v-slot:item.structure="prop">
                    <div style="text-align: center;">
                        <router-link :to="{ name: 'cluster', params: { cluster: prop.item.rep_accession }}" target='_blank'>
                            <img :src="getImage(prop.item.rep_accession)" style="height:75px"/>
                        </router-link>
                    </div>
                </template>
    
                <template v-slot:item.rep_accession="prop">
                    <ExternalLinks :accession="prop.value">
                        <template v-slot:accession><router-link :to="{ name: 'cluster', params: { cluster: prop.value }}" target="_blank">{{ prop.value }}</router-link></template>
                    </ExternalLinks><br>
                    {{ prop.item.description }}
                </template>
    
                <template v-slot:item.avg_plddt="prop">
                    {{ prop.value.toFixed(2) }}
                </template>
    
    
                <template v-slot:item.rep_plddt="prop">
                    {{ prop.value.toFixed(2) }}
                </template>
    
                <template v-slot:header.lca_tax_id="{ column }">
                    <TaxonomyAutocomplete
                        v-model="options.tax_id"
                        :urlFunction="(_, b) => '/search/foldseek/' + b"
                        :disabled="taxAutocompleteDisabled"
                        :options="requestOptions"
                    ></TaxonomyAutocomplete>
                </template>
    
                <template v-slot:item.lca_tax_id="prop">
                    <TaxSpan :taxonomy="prop.value"></TaxSpan>
                </template>
    
                <template v-slot:header.is_dark="{ column }">
                    <v-menu
                        :close-on-content-click="false"
                        offset-y>
                        <template v-slot:activator="{ props }">
                            <v-btn v-bind="props" :variant="options.is_dark != null ? 'outlined' : 'plain'">
                                {{ column.title }}
                            </v-btn>
                        </template>
    
                        <v-card style="padding: 2em; width: 250px;">
                            <h3>Filter by</h3>
                            <v-chip-group column v-model="options.is_dark">
                                <IsDark isDark="0"></IsDark>
                                <IsDark isDark="1"></IsDark>
                            </v-chip-group>
                        </v-card>
                    </v-menu>
                </template>
    
                <template v-slot:item.is_dark="prop">
                    <IsDark :isDark="prop.value"></IsDark>
                </template>
    
                <template v-slot:header.avg_len="{ column }">
                    <v-menu
                        :close-on-content-click="false"
                        offset-y>
                        <template v-slot:activator="{ props }">
                            <v-btn v-bind="props" variant="plain">
                                {{ column.title }}
                            </v-btn>
                        </template>
                        <RangeSlider :range="options.avg_length_range"></RangeSlider>
                    </v-menu>
                </template>
    
                <template v-slot:header.avg_plddt="{ column }">
                    <v-menu
                        :close-on-content-click="false"
                        offset-y>
                        <template v-slot:activator="{ props }">
                            <v-btn v-bind="props" variant="plain">
                                {{ column.title }}
                            </v-btn>
                        </template>
                        <RangeSlider :range="options.avg_plddt_range"></RangeSlider>
                    </v-menu>
                </template>
    
                <template v-slot:header.n_mem="{ column }">
                    <v-menu
                        :close-on-content-click="false"
                        offset-y>
                        <template v-slot:activator="{ props }">
                            <v-btn v-bind="props" variant="plain">
                                {{ column.title }}
                            </v-btn>
                        </template>
                        <RangeSlider :range="options.n_mem_range"></RangeSlider>
                    </v-menu>
                </template>
    
                <template v-slot:header.rep_len="{ column }">
                    <v-menu
                        :close-on-content-click="false"
                        offset-y>
                        <template v-slot:activator="{ props }">
                            <v-btn v-bind="props" variant="plain">
                                {{ column.title }}
                            </v-btn>
                        </template>
                        <RangeSlider :range="options.rep_length_range"></RangeSlider>
                    </v-menu>
                </template>
    
                <template v-slot:header.rep_plddt="{ column }">
                    <v-menu
                        :close-on-content-click="false"
                        offset-y>
                        <template v-slot:activator="{ props }">
                            <v-btn v-bind="props" variant="plain">
                                {{ column.title }}
                            </v-btn>
                        </template>
                        <RangeSlider :range="options.rep_plddt_range"></RangeSlider>
                    </v-menu>
                </template>
    
            </v-data-table>
        </template>
    </panel>
    </v-col>
    </template>
    
    <script>
    import Panel from "./Panel.vue";
    import TaxSpan from "./TaxSpan.vue";
    import TaxonomyAutocomplete from "./TaxonomyAutocomplete.vue";
    import IsDark from './IsDark.vue';
    import RangeSlider from './RangeSlider.vue';
    import ExternalLinks from "./ExternalLinks.vue";
    import ImageMixin from "./ImageMixin";
    
    export default {
        name: "foldseeksearchresult",
        components: { 
            Panel,
            TaxSpan,
            TaxonomyAutocomplete,
            IsDark,
            RangeSlider,
            ExternalLinks
        },
        mixins: [ImageMixin],
        data() {
            return {
                response: [],
                total: null,
                page: null,
                headers: [
                    {
                        title: "Structure",
                        value: "structure",
                        sortable: false,
                        width: "10%",
                    },
                    {
                        title: "Accession",
                        value: "rep_accession",
                        sortable: false,
                    },
                    // {
                    //     text: "LCA rank",
                    //     value: "lca_tax_id.rank"
                    // },
                    {
                        title: "LCA",
                        value: "lca_tax_id",
                        sortable: false,
                    },
                    {
                        title: "Avg. length",
                        value: "avg_len",
                        sortable: false,
                    },
                    // {
                    //     text: "Avg. pLDDT",
                    //     value: "avg_plddt",
                    //     sortable: false,
                    // },
                    {
                        title: "Members",
                        value: "n_mem",
                        sortable: false,
                    },
                    {
                        title: "Singleton",
                        value: "is_dark",
                        sortable: false,
                    },
                    {
                        title: "Rep. pLDDT",
                        value: "rep_plddt",
                        sortable: false,
                    },
                    {
                        title: "Rep. length",
                        value: "rep_len",
                        sortable: false,
                    },
                ],
                options: {
                    page: 1,
                    itemsPerPage: 10,
                    avg_length_range: [0, Infinity],
                    avg_plddt_range: [0, Infinity],
                    rep_length_range: [0, Infinity],
                    rep_plddt_range: [0, Infinity],
                    n_mem_range: [0, Infinity],
                    tax_id: null,
                    is_dark: null,
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
                    "jobid": this.$route.params.jobid,
                };
                const obj = Object.assign({}, this.options, options);
                let copy = JSON.parse(JSON.stringify(obj));
                if (copy.tax_id) {
                    copy.tax_id = copy.tax_id.value;
                } else {
                    delete copy.tax_id;
                }
                if (copy.is_dark == null) {
                    delete copy.is_dark;
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
                if (!this.$route.params.jobid) {
                    return;
                }

                this.loading = true;
                this.$axios.get("/search/foldseek", this.requestOptions)
                    .then(response => {
                        this.response = response.data.result;
                        this.total = response.data.total;
                        this.fetchImages(this.response.map(m => m.rep_accession));
                        this.$emit('total', this.total);
                    })
                    .finally(() => {
                        this.loading = false;
                    });
            }
        }
    };
    </script>
    