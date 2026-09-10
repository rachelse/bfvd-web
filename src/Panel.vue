<template>
    <div :class="['panel-root', elevation != null ? 'elevation-' + elevation : null ]">
        <v-toolbar
            v-if="!!$slots['header'] || !!header"
            density="compact"
            theme="dark"
            class="relative glassmorphism-50 border border-white/15 shadow-[0_4px_16px_rgba(0,0,0,0.1)]"
        >
            <v-btn v-if="collapsible" icon variant="plain"  @click="isCollapsed = !isCollapsed" :aria-expanded="isCollapsed ? 'false' : 'true'" :aria-controls="uuid">
                <v-icon v-if="isCollapsed">
                    {{ $MDI.PlusBox }}
                </v-icon>
                <v-icon v-else>
                    {{ $MDI.MinusBox }}
                </v-icon>
            </v-btn>
            <v-toolbar-title class="text-h6 align-end">
                <slot v-if="$slots['header']" name="header"></slot>
                <template v-else>{{ header }}</template>
            </v-toolbar-title>
            <v-spacer></v-spacer>
            <slot name="toolbar-extra"></slot>
        </v-toolbar>
        <v-card rounded="0" :class="['panel', { 'd-flex' : flex }, { 'force-fill-height' : fillHeight }]" v-if="!isCollapsed" :id="uuid">
            <v-card-text v-if="$slots['desc']" class="subheading justify">
                <slot name="desc"></slot>
            </v-card-text>
            <v-card-text v-if="$slots['content']" :class="['panel-content', 'justify', { 'd-flex' : flex }]">
                <slot name="content"></slot>
            </v-card-text>
        </v-card>
    </div>
</template>

<script>
let uuid = 0;
export default {
    name: 'panel',
    props: { 
        header : { default: '', type: String }, 
        'fillHeight' : { default: false, type: Boolean }, 
        'collapsible' : { default: false, type: Boolean },
        'collapsed' : { default: false, type: Boolean },
        'flex' : { default: true, type: Boolean },
        'elevation' : { default: null, type: Number }
    },
    data() {
        return {
            isCollapsed: this.collapsed,
        }
    },
    beforeCreate() {
        this.uuid = 'panel-' + uuid.toString();
        uuid += 1;
    },
}
</script>

<style scoped>
.panel-root {
    height: 100%;
    display: flex;
    /* A colorful strip sized to just the header's height, sitting behind
       the translucent toolbar - backdrop-filter has nothing to blur
       without something visually rich behind it, and a flat page/card
       background blurs into itself, i.e. no visible effect at all. */
    background: linear-gradient(120deg, #30e940 0%, #1e88e5 55%, #ffc107 100%);
    background-size: 100% 64px;
    background-repeat: no-repeat;
    background-position: top left;
}

.panel-root, .panel-content {
    flex-direction: column;
}

.panel-content {
    flex: 1 1 auto;
    min-height: 0;
}

.panel-root header, .panel-content {
    contain: content;
}

.panel-root nav {
    flex: 0;
}

.panel-root .force-fill-height {
    display: flex;
    flex: 1 1 auto;
    min-height: 0;
}

/* Blur/saturate/border/shadow for the glass toolbar are Tailwind utility
   classes on the element itself (see Panel's template) - only the
   theme-dependent gradient tint stays here, since it needs to key off
   Vuetify's .v-theme--light/.v-theme--dark ancestor class, which Tailwind
   has no built-in variant for. */
.v-theme--light .panel-root >>> .v-toolbar {
    background:
        linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.05) 60%),
        rgba(30, 41, 59, 0.4);
}

.v-theme--dark .panel-root >>> .v-toolbar {
    background:
        linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.02) 60%),
        rgba(15, 23, 42, 0.25);
}

.panel-root >>> .text-h6 {
    margin-bottom: -5px;
}

.panel-root >>> .v-toolbar-title.text-h6 {
    flex: 0 1 auto;
}

.panel-root >>> .v-toolbar-title.text-h6:first-child {
    margin-inline-start: 20px;
}

.panel-root >>> .v-toolbar-title.text-h6:not(:first-child) {
    margin-inline-start: 2px;
}

.panel-root >>> .v-toolbar-title.text-h6 .v-toolbar-title__placeholder {
    overflow: visible;
    white-space: normal;
    text-overflow: unset;
}

.panel-root >>> .text-h6 i.v-icon {
    font-size: 1em;
    vertical-align: bottom;
}
</style>