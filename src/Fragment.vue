<template>
    <!-- cluFlag 1: clustered in AFDB50, 2: clustered in AFDB clusters, 3: removed (fragments in Foldseek clusters), 4: removed (singletons in Foldseek clusters) -->
    <v-chip :color="flagColor" outlined>
        {{ flagText }}
    </v-chip>
</template>

<script>
import { colors } from 'vuetify/lib';
import * as Colors from './Colors.js';

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
                return Colors.lightgreen.code;
            } else if (this.flag == 2) {
                return Colors.purple.code;
            } else if (this.flag == 3) {
                return Colors.skyblue.code;
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