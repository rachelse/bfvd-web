<template>
    <!-- cluFlag 1: clustered in AFDB50, 2: clustered in AFDB clusters, 3: removed (fragments in Foldseek clusters), 4: removed (singletons in Foldseek clusters) -->
    <v-chip :color="flagColor" outlined>
        {{ flagText }}
    </v-chip>
</template>

<script>

export default {
    name: "Fragment",
    props: ["flag"],
    computed: {
        flagText() {
            if (this.flag == 1) {
                return "Member";
            } else if (this.flag == 2) {
                return "Dimer Rep.";
            } else if (this.flag == 3) {
                return "Interface Rep.";
            }
        },
        flagColor() {
            if (this.flag == 1) {
                return "#9ED19F";
            } else if (this.flag == 2) {
                return "#7f2a61";
            } else if (this.flag == 3) {
                return "#88d3e5";
            }
        }
    }
}

</script>

<style scoped>
.v-chip-group .v-chip--active {
    font-weight: bold;
    border-width: 2px;
}
</style>