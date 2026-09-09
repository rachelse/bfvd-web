<template>
    <div :class="['panel-root', elevation != null ? 'elevation-' + elevation : null ]">
        <v-toolbar v-if="!!$slots['header'] || !!header" density="compact" theme="dark">
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

.panel-root >>> .v-toolbar {
    background-repeat: repeat;
}

.v-theme--light .panel-root >>> .v-toolbar {
    background: url('./assets/spiration-dark.png');
    
}

.v-theme--dark .panel-root >>> .v-toolbar {
    background: url('./assets/spiration-darker.png');
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