<template>
    <v-autocomplete
        :disabled="disabled"
        :allow-overflow="false"
        :items="items"
        :loading="isLoading"
        v-model:search="search"
        :model-value="modelValue"
        item-title="text"
        item-value="value"
        @update:model-value="change"
        placeholder="Taxonomic filter"
        hide-no-data
        return-object
        auto-select-first
        clearable
    >
        <template v-slot:item="{ item }">
                {{ item.raw?.text }} ({{ item.raw?.rank }})
        </template>
    </v-autocomplete>
</template>

<script>
import { debounce } from './lib/debounce';

export default {
    props: [
        'modelValue', 'cluster', 'urlFunction', 'disabled', 'options',
    ],
    emits: ['update:modelValue'],
    data() {
        return {
            items: [],
            isLoading: false,
            search: null,
        }
    },
    mounted() {
        this.items = this.modelValue ? [ this.modelValue ] : [];
    },
    watch: {
        modelValue(val) {
            this.items = val ? [ val ] : [];
        },
        search(val) {
            if (val && val.length > 2 && val !== this.modelValue) {
                this.querySelections(val)
            }
        },
    },
    methods: {
        log(value) {
            console.log(value);
            return value;
        },
        change(taxId) {
            this.$emit('update:modelValue', taxId);
        },
        querySelections: debounce(function (name) {
            this.loading = true;
            const url = this.urlFunction(encodeURIComponent(this.cluster), encodeURIComponent(name));
            this.$axios.get(url, this.options)
                .then(response => {
                    this.items = response.data.map(item => {
                        return { 
                            text: item.name, 
                            value: item.id,
                            rank: item.rank,
                        }
                    });
                }).finally(() => { this.loading = false; });
        }, 500, false)
    },
}
</script>

<style>
</style>
