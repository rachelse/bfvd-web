<template>
    <div class="structure-panel">
        <div
            class="structure-wrapper"
            ref="structurepanel"
            :class="{ hovered: hovered || isFullscreen }"
            @mouseover="hovered = true" @mouseleave="hovered = false"
            >
            <v-tooltip open-delay="300" bottom attach=".structure-wrapper" background-color="transparent">
                <template v-slot:activator="{ on }">
                    <v-icon v-if="toolbar" :light="isFullscreen" v-on="on" class="help">{{ $MDI.HelpCircleOutline }}</v-icon>
                </template>
                <span>
                    <dl style="text-align: center;">
                        <dt>
<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2" viewBox="0 0 32 32">
<title>Left click</title>
<path d="M25.6 5.8a5 5 0 0 0-5-4.8h-9.1a5 5 0 0 0-5.1 4.8v20.4a5 5 0 0 0 5 4.8h9.1a5 5 0 0 0 5.1-4.8V5.8Zm-1 9.5v10.9a4 4 0 0 1-4 3.8h-9.1a4 4 0 0 1-4-3.8V15.3h17ZM15.5 2v12.3h-8V5.8a4 4 0 0 1 4-3.8h4Zm1 0h4a4 4 0 0 1 4 3.8v8.5h-8V2Z"/>
<path id="left" d="M15.5 2v12.3h-8V5.8a4 4 0 0 1 4-3.8h4Z" style="fill:red"/>
<path id="middle-inactive" d="M14.6 4h2.8v8h-2.8z"/>
</svg>
                        </dt>
                        <dd>
                            Rotate
                        </dd>
                        <dt>
<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2" viewBox="0 0 32 32">
<title>Right click</title>
<path d="M25.6 5.8a5 5 0 0 0-5-4.8h-9.1a5 5 0 0 0-5.1 4.8v20.4a5 5 0 0 0 5 4.8h9.1a5 5 0 0 0 5.1-4.8V5.8Zm-1 9.5v10.9a4 4 0 0 1-4 3.8h-9.1a4 4 0 0 1-4-3.8V15.3h17ZM15.5 2v12.3h-8V5.8a4 4 0 0 1 4-3.8h4Zm1 0h4a4 4 0 0 1 4 3.8v8.5h-8V2Z"/>
<path id="right" d="M16.5 2h4a4 4 0 0 1 4 3.8v8.5h-8V2Z" style="fill:red"/>
<path id="middle-inactive" d="M14.6 4h2.8v8h-2.8z"/>
</svg>
                        </dt>
                        <dd>
                            Pan
                        </dd>
                        <dt>
<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2" viewBox="0 0 32 32">
<title>Scroll wheel</title>
<path d="M25.6 5.8a5 5 0 0 0-5-4.8h-9.1a5 5 0 0 0-5.1 4.8v20.4a5 5 0 0 0 5 4.8h9.1a5 5 0 0 0 5.1-4.8V5.8Zm-1 9.5v10.9a4 4 0 0 1-4 3.8h-9.1a4 4 0 0 1-4-3.8V15.3h17ZM15.5 2v12.3h-8V5.8a4 4 0 0 1 4-3.8h4Zm1 0h4a4 4 0 0 1 4 3.8v8.5h-8V2Z"/>
<path id="middle-active" d="M14.6 4h2.8v8h-2.8z" style="fill:red"/>
</svg>
                        </dt>
                        <dd>
                            Zoom
                        </dd>
                    </dl>
                </span>
            </v-tooltip>
            <div class="toolbar-panel" v-if="toolbar">
                <v-item-group class="v-btn-toggle" :light="isFullscreen">
                <v-btn
                    v-bind="tbButtonBindings"
                    v-on:click="makePdb()"
                    title="Save PDB"
                >
                    <v-icon v-bind="tbIconBindings">M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h14Zm0 8v-.8c0-.7-.6-1.2-1.3-1.2h-2.4v6h2.4c.7 0 1.2-.5 1.2-1.2v-1c0-.4-.4-.8-.9-.8.5 0 1-.4 1-1Zm-9.7.5v-1c0-.8-.7-1.5-1.5-1.5H5.3v6h1.5v-2h1c.8 0 1.5-.7 1.5-1.5Zm5 2v-3c0-.8-.7-1.5-1.5-1.5h-2.5v6h2.5c.8 0 1.5-.7 1.5-1.5Zm3.4.3h-1.2v-1.2h1.2v1.2Zm-5.9-3.3v3h1v-3h-1Zm-5 0v1h1v-1h-1Zm11 .9h-1.3v-1.2h1.2v1.2Z</v-icon>
                    <span v-if="isFullscreen">&nbsp;Save PDB</span>
                </v-btn>
                <v-btn
                    v-bind="tbButtonBindings"
                    v-on:click="makeImage()"
                    title="Save image"
                >
                    <v-icon v-bind="tbIconBindings">M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3M9 11.5C9 12.3 8.3 13 7.5 13H6.5V15H5V9H7.5C8.3 9 9 9.7 9 10.5V11.5M14 15H12.5L11.5 12.5V15H10V9H11.5L12.5 11.5V9H14V15M19 10.5H16.5V13.5H17.5V12H19V13.7C19 14.4 18.5 15 17.7 15H16.4C15.6 15 15.1 14.3 15.1 13.7V10.4C15 9.7 15.5 9 16.3 9H17.6C18.4 9 18.9 9.7 18.9 10.3V10.5H19M6.5 10.5H7.5V11.5H6.5V10.5Z</v-icon>
                    <span v-if="isFullscreen">&nbsp;Save image</span>
                </v-btn>
                <v-btn
                    v-bind="tbButtonBindings"
                    v-on:click="resetView()"
                    title="Reset the view to the original position and zoom level"
                >
                    <v-icon v-bind="tbIconBindings">{{ $MDI.Restore }}</v-icon>
                    <span v-if="isFullscreen">&nbsp;Reset view</span>
                </v-btn>
                <v-btn v-bind="tbButtonBindings"
                    v-on:click="toggleFullscreen()"
                    title="Enter fullscreen mode - press ESC to exit"
                >
                    <v-icon v-bind="tbIconBindings">{{ $MDI.Fullscreen }}</v-icon>
                    <span v-if="isFullscreen">&nbsp;Fullscreen</span>
                </v-btn>
                </v-item-group>
            </div>
            <div class="structure-viewer" ref="viewport"></div>
        </div>
        <template v-if="second">
            <span v-if="secondComponent == null">Superposition loading</span>
            <template v-else>
                <span style="color:#FFC107">{{ second }}</span> superposed on representative <span style="color:#1E88E5">{{ cluster }}</span>
                <template v-if="tmOutput">
                    <br>
                    <span><strong>TM-score:</strong>&nbsp; {{ tmOutput.tmScore.toFixed(2) }}</span>&nbsp;
                    <span><strong>RMSD:</strong>&nbsp; {{ tmOutput.rmsd.toFixed(2) }}&ThinSpace;Å</span>
                </template>
            </template>
        </template>
    </div>
</template>

<script>
import { createPluginUI } from 'molstar/lib/mol-plugin-ui/index.js';
import { renderReact18 } from 'molstar/lib/mol-plugin-ui/react18.js';
import { DefaultPluginUISpec } from 'molstar/lib/mol-plugin-ui/spec.js';
import { StateTransforms } from 'molstar/lib/mol-state/transform.js';
import { Mat4 } from 'molstar/lib/mol-math/linear-algebra.js';
import { Color } from 'molstar/lib/mol-util/color/index.js';

import Panel from './Panel.vue';
import { pulchra } from 'pulchra-wasm';

// TM-align worker setup stays same
const worker = new Worker(new URL('./tmalign-worker.js', import.meta.url));
const tmalign = function(pdb1, pdb2) {
    return new Promise((resolve, reject) => {
        worker.onmessage = (e) => resolve(e.data);
        worker.onerror = (e) => reject(e);
        worker.postMessage({ pdb1, pdb2 });
    });
};

const oneToThree = {
  "A":"ALA", "R":"ARG", "N":"ASN", "D":"ASP",
  "C":"CYS", "E":"GLU", "Q":"GLN", "G":"GLY",
  "H":"HIS", "I":"ILE", "L":"LEU", "K":"LYS",
  "M":"MET", "F":"PHE", "P":"PRO", "S":"SER",
  "T":"THR", "W":"TRP", "Y":"TYR", "V":"VAL",
  "U":"SEC", "O":"PHL", "X":"XAA"
};

// function mockPDB(ca, seq, chain = 'A') {
//     const chainLength = ca.length / 3;
//     const pdb = [];
//     let j = 0;
//     for (let i = 0; i < ca.length; i+=3, j++) {
//         const line = 'ATOM  '
//             + (j+1).toString().padStart(5)
//             + '  CA  ' + oneToThree[seq != "" && (ca.length/3) == seq.length ? seq[i/3] : 'A'] + ' ' + chain
//             + (j+1).toString().padStart(4)
//             + '    '
//             + ca[0 * chainLength + j].toFixed(3).padStart(8)
//             + ca[1 * chainLength + j].toFixed(3).padStart(8)
//             + ca[2 * chainLength + j].toFixed(3).padStart(8)
//             + '  1.00  0.00           C  ';
//         pdb.push(line);
//     }
//     return pdb.join('\n');
// }
function mockPDB(ca, seq, chain = 'A') {
    const chainLength = ca.length / 3;
    const pdb = [];
    let j = 0;
    for (let i = 0; i < ca.length; i += 3, j++) {
        // Force conversion to Number to prevent .toFixed error
        const x = Number(ca[0 * chainLength + j]);
        const y = Number(ca[1 * chainLength + j]);
        const z = Number(ca[2 * chainLength + j]);

        const line = 'ATOM  '
            + (j + 1).toString().padStart(5)
            + '  CA  ' + (oneToThree[seq != "" && (ca.length / 3) == seq.length ? seq[i / 3] : 'A'] || 'ALA') + ' ' + chain
            + (j + 1).toString().padStart(4)
            + '    '
            + x.toFixed(3).padStart(8) // Now safe to call .toFixed
            + y.toFixed(3).padStart(8)
            + z.toFixed(3).padStart(8)
            + '  1.00  0.00           C  ';
        pdb.push(line);
    }
    return pdb.join('\n');
}

export default {
    components: { Panel },
    data: () => ({
        plugin: null, // Molstar Context
        component: null, // Primary Structure
        secondComponent: null, // Superposed Structure
        tmOutput: null,
        'isFullscreen': false,
        'hovered': false,
    }),
    props: {
        'cluster': { type: String, required: true },
        'second': { type: String, required: true },
        'chain1_id': { type: Number, required: true },
        'chain2_id': { type: Number, required: true },
        'toolbar': { type: Boolean, default: true },
        'bgColorLight': { type: String, default: "0xffffff" },
        'bgColorDark': { type: String, default: "0xeeeeee" },
    },
    methods: {
        async initMolstar() {
            const bgColor = this.$vuetify.theme.dark ? this.bgColorDark : this.bgColorLight;
            const colorNum = Color(bgColor);
            const spec = {
                ...DefaultPluginUISpec(),
                layout: {
                    initial: {
                        showControls: false,
                        regionState: { right: 'hidden', top: 'hidden', left: 'hidden', bottom: 'hidden' }
                    }
                },
                canvas3d: {
                    renderer: { backgroundColor: colorNum },
                }
            };

            this.plugin = await createPluginUI({
                target: this.$refs.viewport,
                spec,
                render: renderReact18
            });
        },

        async loadPdbData(pdbString, colorHex = null) {
            const data = await this.plugin.builders.data.rawData({ data: pdbString });
            const trajectory = await this.plugin.builders.structure.parseTrajectory(data, 'pdb');
            // const model = await this.plugin.builders.structure.;
            // console.log(model)
            // const model = await this.plugin.builders.structure.addModel(trajectory);
            // const structure = await this.plugin.builders.structure.addStructure(model);

            // const colorProp = colorHex ? { name: 'uniform', params: { value: Color(parseInt(colorHex.replace('#', ''), 16)) } } : { name: 'chain-id' };

            // const representation = await this.plugin.builders.structure.representation.addRepresentation(structure, {
            //     type: 'cartoon',
            //     color: colorProp.name,
            //     colorParams: colorProp.params
            // });

            // return { structure, representation };
            return await this.plugin.builders.structure.hierarchy.applyPreset(trajectory, "default");
        },

        resetView() {
            this.plugin?.managers.camera.reset();
            // TODO: also reset selections
        },

        async makeImage() { //FIXME: not working
            const data = await this.plugin.helpers.viewportScreenshot.getByteData({ transparent: true, multiply: 2 });
            const blob = new Blob([data], { type: 'image/png' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${this.cluster}.png`;
            a.click();
        },

        async toggleFullscreen() {
            if (!this.plugin) return;
            const element = this.$refs.structurepanel;
            
            if (!document.fullscreenElement) {
                if (element.requestFullscreen) {
                    await element.requestFullscreen();
                } else if (element.webkitRequestFullscreen) {
                    await element.webkitRequestFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                }
            }
        },

        async fetchStructure(accession) {
            const response = await this.$axios.get("/structure/" + accession);
            const pdb = await pulchra(mockPDB(response.data.coordinates, response.data.seq, 'A'));
            return await this.loadPdbData(pdb);
        },

        async fetchDimerStructure(id1, id2) {
            const [r1, r2] = await Promise.all([
                this.$axios.get("/structure/" + id1),
                this.$axios.get("/structure/" + id2)
            ]);
            const pdb1 = await pulchra(mockPDB(r1.data.coordinates, r1.data.seq, 'A'));
            const pdb2 = await pulchra(mockPDB(r2.data.coordinates, r2.data.seq, 'B'));
            
            // In Molstar, we load them as one "Combined" PDB or two separate components.
            // For simplicity, we load the concatenated ATOM records.
            const combined = pdb1.split('END')[0] + '\n' + pdb2.split('END')[0];
            return await this.loadPdbData(combined);
        }
    },
    computed: {
        tbIconBindings: function() {
            return (this.isFullscreen) ? { 'right': true } : {}
        },
        tbButtonBindings: function() {
            return (this.isFullscreen) ? {
                'small': false,
                'style': 'margin-bottom: 15px;',
            } : {
                'small': true,
                'style': ''
            }
        },
    },
    watch: {
        'cluster': {
            async handler(val) {
                if (!val || !this.plugin) return;
                await this.plugin.clear();
                this.component = await this.fetchDimerStructure(this.chain1_id, this.chain2_id);
                this.resetView();
            },
            immediate: false
        },
        'second': {
            async handler(val) {
                if (!val || val === "" || !this.plugin) return;
                const response = await this.$axios.get("/chainid/" + val);
                if (!response || !response.data) return;

                const secondData = await this.fetchDimerStructure(response.data.chain1_id, response.data.chain2_id);
                this.secondComponent = secondData;

                // Here you would integrate your transformStructure logic
                // Molstar uses Mat4.fromArray for rotation/translation matrices
                // this.plugin.builders.structure.transform(this.secondComponent.structure, matrix);
                
                this.resetView();
            }
        }
    },
    async mounted() {
        await this.initMolstar();
        
        const fullscreenHandler = () => {
            this.isFullscreen = !!document.fullscreenElement;
            if (this.plugin) {
                this.plugin.canvas3d.handleResize();
                this.plugin.managers.camera.reset();
            }
        };

        document.addEventListener('fullscreenchange', fullscreenHandler);
        document.addEventListener('webkitfullscreenchange', fullscreenHandler);

        if (this.cluster) this.fetchDimerStructure(this.chain1_id, this.chain2_id);

        this._fullscreenHandler = fullscreenHandler;
    },
    beforeDestroy() {
        document.removeEventListener('fullscreenchange', this._fullscreenHandler);
        document.removeEventListener('webkitfullscreenchange', this._fullscreenHandler);
        this.plugin?.dispose();
    }
}
</script>

<style scoped>
@import '~molstar/lib/mol-plugin-ui/skin/light.scss';

.structure-wrapper {
    margin: 0 auto;
    position: relative;
    height: 300px;
    width: 100%;
}

.theme--dark .structure-wrapper .v-tooltip__content {
    background: rgba(97, 97, 97, 0.3);
}

.structure-viewer {
    width: 100%;
    height: 100%;
}

.structure-viewer canvas {
    border-radius: 2px;
}

.structure-panel {
    position: relative;
}

.hovered .toolbar-panel {
    display: inline-flex;
}
.toolbar-panel {
    display: none;
    flex-direction: row;
    position: absolute;
    justify-content: center;
    width: 100%;
    bottom: 0;
    z-index: 1;
    left: 0;
}
.structure-wrapper.hovered >>> .help {
    display: inline-flex;
}
.structure-wrapper >>> .help {
    display: none;
    position: absolute;
    z-index: 999;
    right:0;
}
</style>
