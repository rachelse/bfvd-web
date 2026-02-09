<template>
    <div class="d-inline">
        <template v-if="isLink">
            <a :href="linkUrl" target="_blank" rel="noopener" class="custom-link-nohighlight">
                <slot v-if="$slots['accession']" name="accession"></slot>
                <template v-else>{{ accession }}</template>
            </a>
        </template>
        <v-menu v-else
            :close-on-content-click="false">
            <template v-slot:activator="{ on }">

                <span class="d-inline-flex align-center">
                <slot v-if="$slots['accession']" name="accession"></slot>
                <template v-else>{{ accession }}</template>&nbsp;<v-btn v-on="on" plain text small icon>
                    <v-icon small>
                        {{ $MDI.OpenInNew }}
                    </v-icon>
                </v-btn>
                </span>
            </template>
            <v-list v-if="reference === 'UniProt'">
                <v-list-item :href="'https://www.uniprot.org/uniprotkb/' + accession" target="_blank" rel="noopener">
                    <v-list-item-content>
                        <v-list-item-title>UniProt</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
                <v-list-item :href="'https://uniprot3d.org/atlas/AFDB90v4/#' + accession" target="_blank" rel="noopener">
                    <v-list-item-content>
                        <v-list-item-title>UniProt3D Atlas</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
            </v-list>
            <v-list v-else-if="reference === 'PDB'">
                <v-list-item :href="'https://www.rcsb.org/structure/' + accession" target="_blank" rel="noopener">
                    <v-list-item-content>
                        <v-list-item-title>PDB</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
            </v-list>
        </v-menu>
    </div>
</template>

<script>
export default {
    name: "externallinks",
    props: {
        accession: {
            type: String,
            required: true,
        },
        reference: {
            type: String,
            required: false,
            default: "UniProt",
        },
        simple: {
            type: Boolean,
            required: false,
            default: false,
        }
    },
    computed: {
        isLink() {
            return this.simple;
        },
        linkUrl() {
            if (this.reference === "UniProt") {
                return "https://www.uniprot.org/uniprotkb/" + this.accession;
            } else if (this.reference === "PDB") {
                return "https://www.rcsb.org/structure/" + this.accession;
            }
        }
    }
};
</script>
