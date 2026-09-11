<template>
    <v-chip :color="chipColor" variant="outlined">
        {{ chipText }}
    </v-chip>
</template>

<script>

export default {
    name: "IsSingleton",
    props: ["isSingleton"],
    computed: {
        chipText() {
            if (this.isSingleton == 0) {
                return "Non-singleton";
            } else if (this.isSingleton == 1) {
                return "Singleton";
            }
        },
        chipColor() {
            if (this.isSingleton == 0) {
                return "#8FB5D6";
            } else if (this.isSingleton == 1) {
                return "#FFC8C1";
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
