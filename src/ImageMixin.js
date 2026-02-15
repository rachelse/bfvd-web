export default {
    data() {
        return {
            images: [],
        }
    },
    methods: {
        getImage(acession) {
            const image = this.images.find(image => image.accession === acession);
            if (image) {
                return image.url;
            }
            return "";
        },
        async fetchImages(accessions) {
            for (let i = 0; i < this.images.length; i++) {
                URL.revokeObjectURL(this.images[i].url);
            }
            this.images = [];
            for (let i = 0; i < accessions.length; i++) {
                const res = await this.$axios.get("/chainid/" + accessions[i]);
                const str1 = await this.$axios.get("/structure/" + res.data.chain1_id);
                const str2 = await this.$axios.get("/structure/" + res.data.chain2_id);
                this.$molstarService.makeImage(str1.data.seq, str1.data.coordinates, str2.data.seq, str2.data.coordinates)
                    .then((image) => {
                        this.images.push({ accession: accessions[i], url: URL.createObjectURL(image) });
                    })
                    .catch(e => {
                        console.log(e);
                    });
            }
        }
    }
}
