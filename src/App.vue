<template>
    <v-app id="app">
        <navigation />
        <v-main>
            <router-view></router-view>
        </v-main>
    </v-app>
</template>

<script>
import Navigation from './Navigation.vue';

export default {
    components: { Navigation },
}
</script>

<style>
/* Vuetify 2 styled bare <a> to the theme primary through --v-anchor-base; Vuetify 3
   dropped that rule entirely, so links fell back to the browser defaults -- #0000EE
   blue, and #551A8B purple once visited, which is why link colours varied across the
   page. Restore a single themed colour, visited included. */
a {
    color: rgb(var(--v-theme-primary));
    text-decoration: none;
}

a:visited {
    color: rgb(var(--v-theme-primary));
}

a:hover {
    text-decoration: underline;
}

/* Vuetify's own link-like components already colour themselves. */
.v-btn a,
.v-list-item a,
.v-chip a {
    color: inherit;
}
</style>
