<template>
    <v-tooltip open-delay="300" top>
        <template v-slot:activator="{ props }">
            <v-autocomplete
                variant="outlined"
                :model-value="modelValue"
                item-title="text"
                item-value="value"
                label="Taxonomic name"
                placeholder="Start typing scientific name to search"
                hide-no-data
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
                <template v-slot:item="{ item, props }">
                    <v-list-item v-bind="props" :title="item.raw?.text" :subtitle="item.raw?.common_name"></v-list-item>
                </template>
            </v-autocomplete>
        </template>
        <span>Restrict results to taxonomic clade</span>
    </v-tooltip>
</template>

<script>
import { create } from 'axios';
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
      this.items = this.modelValue ? [ this.modelValue ] : [];
  },
  watch: {
      modelValue(val) {
          this.items = val ? [ val ] : [];
      },
      search (val) {
          val && val.length > 2 && val !== this.modelValue && this.querySelections(val)
      },
  },
  methods: {
      change(taxId) {
        this.$emit('update:modelValue', taxId);
      },
      querySelections: debounce(function (name) {
          this.loading = true;
          // make a new axios instance to not leak the electron access token
          const axios = create();
          axios.get("https://api.ncbi.nlm.nih.gov/datasets/v2alpha/taxonomy/taxon_suggest/" + encodeURIComponent(name) + "?tax_rank_filter=higher_taxon")
              .then(response => {
                  if (response.status == 200 && response.data.hasOwnProperty("sci_name_and_ids")) {
                      this.items = response.data.sci_name_and_ids.map((el) => {
                          return { text: el.sci_name, value: el.tax_id, common_name: el.common_name }
                      });
                  }
              }).finally(() => { this.loading = false; });
      }, 500, false)
  },
}
</script>

<style>
</style>