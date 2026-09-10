<template>
    <!-- entry.flag records how the structure was predicted.
         1: ColabFold-AF2, 2: ESMFold + ProteinTTT(MSA) -->
    <v-chip :color="flagColor" variant="outlined">
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
                return "ColabFold-AF2";
            } else if (this.flag == 2) {
                return "ESMFold+ProteinTTT";
            }
        },
        flagColor() {
            if (this.flag == 1) {
                return "#8FB5D6";
            } else if (this.flag == 2) {
                return "#9ED19F";
            }
        }
    }
}

</script>
