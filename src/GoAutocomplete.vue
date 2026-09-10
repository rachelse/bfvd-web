<template>
    <v-tooltip open-delay="300" top>
        <template v-slot:activator="{ props }">
            <v-autocomplete
                variant="outlined"
                :model-value="modelValue"
                item-title="text"
                item-value="value"
                label="GO Term"
                placeholder="Start typing to search GO terms"
                hide-no-data
                no-filter
                :items="items"
                :loading="isLoading"
                v-model:search="search"
                style="max-width: 400px; margin: 0 auto;"
                @update:model-value="change"
                return-object
                auto-select-first
                :allow-overflow="false"
                theme="dark"
                v-bind="{ ...$attrs, ...props }"
            >
                <template v-slot:item="{ item }">
                    {{ item.raw.text }} ({{ item.raw.value }})
                </template>
            </v-autocomplete>
        </template>
        <span>Search for Gene Ontology (GO) terms</span>
    </v-tooltip>
  </template>
  
  <script>
  import { debounce } from './lib/debounce';
  
  export default {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    data() {
        return {
            items: [],
            isLoading: false,
            search: null,
        }
    },
    mounted() {
        this.items = [ this.modelValue ];
    },
    watch: {
        modelValue(val) {
            this.items = [ val ];
        },
        search (val) {
            val && val.length > 2 && val !== this.modelValue && this.queryGOSelections(val)
        },
    },
    methods: {
        change(goTerm) {
          this.$emit('update:modelValue', goTerm);
        },
        queryGOSelections: debounce(function (term) {
            this.isLoading = true;
            this.$axios.get("/autocomplete/go/" + encodeURIComponent(term))
                .then(response => {
                    if (response.status == 200 && response.data.hasOwnProperty("result")) {
                        this.items = response.data.result.map((el) => {
                            return { text: el.go_name, value: el.go_id }
                        });
                    }
                }).finally(() => { this.isLoading = false; });
        }, 300, false)
    },
  }
  </script>
  