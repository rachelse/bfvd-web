<template>
<Panel style="margin-top: 1em;" collapsible>
    <template v-slot:header>
        Similar Predicted Interfaces
    </template>

    <template v-slot:toolbar-extra>
        <v-btn plain :href="`${$axios.defaults.baseURL}/cluster/${$route.params.cluster}/similar-predictions?format=summary`" target="_blank">
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
            <!-- Structure thumbnail with click to superpose -->
            <template v-slot:header.structure="{ header }">
                {{ header.text }}
                <v-tooltip top>
                    <template v-slot:activator="{ on }">
                        <span v-on="on">
                            <v-icon v-on="on">{{ $MDI.HelpCircleOutline }}</v-icon>
                        </span>
                    </template>
                    <span>Click on a structure to superpose its interface on to the cluster representative in the structure viewer</span>
                </v-tooltip>
            </template>
            <template v-slot:item.structure="prop">
                <div
                    v-ripple="{ class: `primary--text` }"
                    style="text-align: center; cursor: pointer;"
                    @click="$emit('select', prop.item.accession)"
                >
                    <img :src="getImage(prop.item.accession)" style="height:75px"/>
                </div>
            </template>

            <!-- Accession: source DB ID + description -->
            <template v-slot:item.accession="prop">
                <span>{{ prop.item.accession }}</span><br>
                <span
                    class="caption text--darken-1"
                    :title="prop.item.description || ''"
                    style="display: inline-block; max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; vertical-align: bottom;"
                >{{ prop.item.description }}</span>
            </template>

            <!-- UniProt IDs per chain -->
            <template v-slot:item.uniprot="prop">
                <div>
                    <ExternalLinks v-if="prop.item.uniprot_id1" :accession="prop.item.uniprot_id1" simple></ExternalLinks>
                    <span v-else>N/A</span>
                </div>
                <div>
                    <ExternalLinks v-if="prop.item.uniprot_id2" :accession="prop.item.uniprot_id2" simple></ExternalLinks>
                    <span v-else>N/A</span>
                </div>
            </template>

            <!-- Taxonomy -->
            <template v-slot:item.tax_id="prop">
                <div v-if="prop.item.tax_id1 && prop.item.tax_id1.name"><TaxSpan :taxonomy="prop.item.tax_id1"></TaxSpan></div>
                <div v-else>N/A</div>
                <div v-if="prop.item.tax_id2 && prop.item.tax_id2.name"><TaxSpan :taxonomy="prop.item.tax_id2"></TaxSpan></div>
                <div v-else>N/A</div>
            </template>

            <!-- Alignment scores -->
            <template v-slot:item.tm_score="prop">
                {{ prop.item.tm_score != null ? prop.item.tm_score.toFixed(3) : 'N/A' }}
            </template>

            <!-- Source badge (styled like ClusterLevel: outlined colored chip) -->
            <template v-slot:item.source="prop">
                <v-chip
                    v-if="prop.item.source === 'HumanPPI' && prop.item.uniprot_id1 && prop.item.uniprot_id2"
                    :color="sourceColor(prop.item.source)"
                    outlined
                    :href="`http://prodata.swmed.edu/humanPPI/results/${prop.item.uniprot_id1}_${prop.item.uniprot_id2}`"
                    target="_blank"
                    rel="noopener"
                >{{ prop.item.source }}</v-chip>
                <v-chip v-else :color="sourceColor(prop.item.source)" outlined>{{ prop.item.source }}</v-chip>
            </template>
        </v-data-table>
    </template>
</Panel>
</template>

<script>
import TaxSpan from "./TaxSpan.vue";
import ExternalLinks from "./ExternalLinks.vue";
import ImageMixin from './ImageMixin';
import Panel from "./Panel.vue";
import * as Colors from './Colors.js';

export default {
    name: "SimilarPredictions",
    components: {
        Panel,
        TaxSpan,
        ExternalLinks,
    },
    props: ["cluster"],
    mixins: [ImageMixin],
    data() {
        return {
            headers: [
                { text: "Structure",    value: "structure", sortable: false, width: "10%" },
                { text: "Accession",    value: "accession", sortable: false, width: "25%" },
                { text: "UniProt ID",   value: "uniprot",   sortable: false, width: "15%" },
                { text: "Taxonomy",     value: "tax_id",    sortable: false, width: "15%" },
                { text: "Interface TM-score", value: "tm_score",  sortable: true,  width: "15%" },
                { text: "Source",       value: "source",    sortable: false, width: "10%" },
            ],
            entries: [],
            totalEntries: 0,
            loading: false,
            options: {},
        };
    },
    watch: {
        options: {
            handler() { this.fetchData(); },
            deep: true,
        },
        cluster() { this.fetchData(); },
    },
    methods: {
        sourceColor(source) {
            // Distinct outlined color per prediction source (extend as new
            // sources are added). Falls back to grey for unknown sources.
            const map = {
                HumanPPI: Colors.terracotta.code,
            };
            return map[source] || 'grey';
        },
        async fetchImages(accessions) {
            // Override ImageMixin.fetchImages for predicted dimers:
            // the chain ids are derivable as <accession>_A and <accession>_B,
            // so no /chainid lookup is needed.
            for (let i = 0; i < this.images.length; i++) {
                URL.revokeObjectURL(this.images[i].url);
            }
            this.images = [];
            for (const accession of accessions) {
                try {
                    const str1 = await this.$axios.get('/structure-predicted/' + accession + '_A');
                    const str2 = await this.$axios.get('/structure-predicted/' + accession + '_B');
                    const image = await this.$molstarService.makeImage(
                        str1.data.seq, str1.data.coordinates,
                        str2.data.seq, str2.data.coordinates,
                    );
                    this.images.push({ accession, url: URL.createObjectURL(image) });
                } catch (e) {
                    console.log('thumbnail failed for', accession, e);
                }
            }
        },
        fetchData() {
            if (!this.$route.params.cluster) return;
            this.loading = true;

            const { page = 1, itemsPerPage = 10, sortBy = [], sortDesc = [] } = this.options;
            const params = new URLSearchParams({
                page,
                limit: itemsPerPage,
                ...(sortBy[0] ? { sort: sortBy[0], order: sortDesc[0] ? 'desc' : 'asc' } : {}),
            });

            this.$axios.get(`/cluster/${this.$route.params.cluster}/similar-predictions?${params}`)
                .then(response => {
                    this.entries = response.data.result;
                    this.totalEntries = response.data.total;
                    this.fetchImages(this.entries.map(e => e.accession));
                })
                .catch(() => {})
                .finally(() => { this.loading = false; });
        },
    },
};
</script>
