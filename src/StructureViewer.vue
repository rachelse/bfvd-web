<template>
    <div class="structure-panel">
        <div
            class="structure-wrapper"
            ref="structurepanel"
            :class="{ hovered: hovered || isFullscreen }"
            @mouseover="hovered = true" @mouseleave="hovered = false"
            >
            <v-tooltip open-delay="300" bottom :attach="attachTarget" background-color="transparent">
                <template v-slot:activator="{ props }">
                    <v-icon v-if="toolbar" :theme="isFullscreen ? 'light' : undefined" v-bind="props" class="help">{{ $MDI.HelpCircleOutline }}</v-icon>
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
                <v-item-group class="v-btn-toggle" :theme="isFullscreen ? 'light' : undefined">
                <v-btn
                    v-if="secondComponent"
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
        <div class="structure-caption" v-if="second">
            <span v-if="secondComponent == null">Superposition loading</span>
            <template v-else>
                <span style="color:#FFC107">{{ second }}</span> superposed on <span style="color:#1E88E5">{{ cluster }}</span>
                <template v-if="tmOutput">
                    <br>
                    <span><strong>TM-score:</strong>&nbsp; {{ tmOutput.tmScore.toFixed(2) }}</span>&nbsp;
                    <span><strong>RMSD:</strong>&nbsp; {{ tmOutput.rmsd.toFixed(2) }}&ThinSpace;Å</span>
                </template>
            </template>
        </div>
    </div>
</template>

<script>
import { markRaw } from 'vue';
import { createPluginUI } from 'molstar/lib/mol-plugin-ui/index.js';
import { renderReact18 } from 'molstar/lib/mol-plugin-ui/react18.js';
import { DefaultPluginUISpec } from 'molstar/lib/mol-plugin-ui/spec.js';
import { StructureElement, StructureProperties as SP, Unit } from 'molstar/lib/mol-model/structure';
import { StateTransforms } from 'molstar/lib/mol-plugin-state/transforms';
import { Mat4 } from 'molstar/lib/mol-math/linear-algebra.js';
import { PluginSpec } from 'molstar/lib/mol-plugin/spec.js';
import { MAQualityAssessment } from 'molstar/lib/extensions/model-archive/quality-assessment/behavior.js';
import { PluginConfig } from 'molstar/lib/mol-plugin/config.js';
import { Color } from 'molstar/lib/mol-util/color/color.js';
import { BfvdPlddtColorThemeProvider, plddtBinToScore } from './BfvdPlddtColorTheme.mjs';
import Panel from './Panel.vue';
import { pulchra } from 'pulchra-wasm';

// Converts a CSS color (named "white"/"black", #rgb/#rrggbb hex, or
// rgb()/rgba()) into the packed-integer Color Mol* expects.
function cssColorToMolstarColor(css) {
    if (css === 'white') return Color(0xffffff);
    if (css === 'black') return Color(0x000000);
    const rgb = css.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
    if (rgb) {
        return Color.fromRgb(+rgb[1], +rgb[2], +rgb[3]);
    }
    let hex = css.startsWith('#') ? css.slice(1) : css;
    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
    }
    return Color(parseInt(hex, 16));
}

// The canvas is opaque (see initMolstar), so its background must match the
// surrounding panel's actual rendered color exactly or a visible seam shows
// where the two meet. Walk up the DOM for the real color instead of
// guessing; bgColorLight/bgColorDark are only a fallback if none is found.
function detectBackgroundColor(el, fallback) {
    for (let node = el; node; node = node.parentElement) {
        const bg = getComputedStyle(node).backgroundColor;
        if (bg && bg !== 'transparent' && !/^rgba\([^)]*,\s*0\s*\)$/.test(bg)) {
            return bg;
        }
    }
    return fallback;
}

// Suppresses Mol*'s own floating viewport/selection controls (camera reset,
// screenshot, settings, selection-mode icons, ...) - we only want our own
// toolbar buttons overlaid on the structure.
function EmptyControls() {
    return null;
}

const worker = new Worker(new URL('./tmalign-worker.js', import.meta.url));
const tmalign = function(pdb1, pdb2) {
    return new Promise((resolve, reject) => {
        worker.onmessage = function(e) {
            resolve(e.data);
        };
        worker.onerror = function(e) {
            reject(e);
        };
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

/**
 * Create a mock PDB from Ca data
 * Follows the spacing spec from https://www.wwpdb.org/documentation/file-format-content/format33/sect9.html#ATOM
 * pLDDT (a string of single-digit 0-9 confidence bins, one per residue) is baked
 * into the B-factor column, rescaled to a 0-100 range so it lines up with
 * Mol*'s built-in pLDDT-confidence color theme thresholds (<=50/<=70/<=90/>90).
 */
function mockPDB(ca, seq, plddt) {
    const chainLength = ca.length / 3;
    const pdb = new Array()
    let j = 0;
    for (let i = 0; i < ca.length; i+=3, j++) {
        const bfactor = plddt ? ((+(plddt[j])) + 0.5) * 10 : 100;
        const line = 'ATOM  '
            + j.toString().padStart(5)
            + '  CA  ' + oneToThree[seq != "" && (ca.length/3) == (seq.length - 1) ? seq[i/3] : 'A'] + ' A'
            + j.toString().padStart(4)
            + '    '
            + ca[0 * chainLength + j].toString().padStart(8)
            + ca[1 * chainLength + j].toString().padStart(8)
            + ca[2 * chainLength + j].toString().padStart(8)
            + '  1.00'
            + bfactor.toFixed(2).padStart(6)
            + '           C  ';
        pdb.push(line);

    }
    return pdb.join('\n')
}

// pulchra's full-atom reconstruction re-emits ATOM lines without the
// occupancy/B-factor columns at all. Mol* then reads occupancy as unset
// (not 1.0), which makes its default hover label show a meaningless
// "[occupancy ...]" suffix. Pad every atom line with an explicit,
// valid occupancy so that never shows - pLDDT is shown via our own hover
// label provider instead (see initMolstar).
function padPdbFields(pdb) {
    return pdb.split('\n').map(line => {
        if (!line.startsWith('ATOM') && !line.startsWith('HETATM')) return line;
        return line.padEnd(54) + '  1.00  0.00';
    }).join('\n');
}

// Serialize a Mol* Structure back into PDB ATOM lines (Mol* has no direct
// equivalent of NGL's PdbWriter for an arbitrary in-memory structure).
function generatePdbAtoms(structureData) {
    if (!structureData) return '';
    const l = StructureElement.Location.create(structureData);
    const atomLines = [];

    for (const unit of structureData.units) {
        const elements = unit.elements;
        l.unit = unit;

        for (let j = 0; j < elements.length; j++) {
            l.element = elements[j];

            const atomSerial = SP.atom.id(l).toString().padStart(5, ' ');
            const rawAtomName = SP.atom.label_atom_id(l);
            const atomName = rawAtomName.length < 4
                ? ` ${rawAtomName}`.padEnd(4, ' ')
                : rawAtomName.substring(0, 4);
            const resName = SP.residue.label_comp_id(l).padStart(3, ' ').substring(0, 3);
            let chainId = SP.chain.auth_asym_id(l) || SP.chain.label_asym_id(l) || 'A';
            chainId = chainId.padStart(1, ' ').substring(0, 1);
            const resSeq = SP.residue.label_seq_id(l).toString().padStart(4, ' ');
            const x = SP.atom.x(l).toFixed(3).padStart(8, ' ');
            const y = SP.atom.y(l).toFixed(3).padStart(8, ' ');
            const z = SP.atom.z(l).toFixed(3).padStart(8, ' ');
            const elementSymbol = SP.atom.type_symbol(l).padStart(2, ' ');

            const line = `ATOM  ${atomSerial} ${atomName} ${resName} ${chainId}${resSeq}    ${x}${y}${z}  1.00  0.00           ${elementSymbol}  `;
            atomLines.push(line);
        }
    }
    return atomLines.join('\n');
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

async function deleteTaggedState(plugin, tags) {
    const allCells = Array.from(plugin.state.data.cells.values());
    const cellsToDelete = allCells.filter(cell => {
        const cellTags = cell.transform?.tags;
        return Array.isArray(cellTags) && tags.some(tag => cellTags.includes(tag));
    });
    if (!cellsToDelete.length) return;
    const update = plugin.build();
    for (const cell of cellsToDelete) {
        update.delete(cell.transform.ref);
    }
    await update.commit();
}

export default {
    components: { Panel },
    data: () => ({
        plugin: null,
        component: null,
        secondComponent: null,
        tmOutput: null,
        'isFullscreen': false,
        'hovered': false,
        plddt: null,
    }),
    props: {
        'cluster': { type: String, required: true },
        'second': { type: String, required: true },
        'toolbar': { type: Boolean, default: true },
        'bgColorLight': { type: String, default: "white" },
        'bgColorDark': { type: String, default: "#eee" },
    },
    methods: {
        handleResize() {
            if (!this.plugin) return
            this.plugin.canvas3d?.handleResize()
        },
        async toggleFullscreen() {
            const element = this.$refs.structurepanel;
            if (!document.fullscreenElement) {
                if (element.requestFullscreen) {
                    await element.requestFullscreen();
                } else if (element.webkitRequestFullscreen) {
                    await element.webkitRequestFullscreen();
                }
            } else if (document.exitFullscreen) {
                await document.exitFullscreen();
            }
        },
        async resetView() {
            if (!this.plugin) return
            if (this.secondComponent) {
                await this.plugin.build().delete(this.secondComponent).commit();
                this.secondComponent = null;
                await deleteTaggedState(this.plugin, ['main-repr']);
                await this.plugin.builders.structure.representation.addRepresentation(this.component, {
                    type: 'cartoon',
                    color: 'bfvd-plddt',
                    colorParams: { plddt: this.plddt },
                }, { tag: 'main-repr' });
                this.$emit('reset', null);
            }
            this.plugin.managers.camera.reset();
        },
        async makeImage() {
            if (!this.plugin) return
            const helper = this.plugin.helpers.viewportScreenshot;
            helper.behaviors.values.next({
                ...helper.values,
                transparent: true,
                format: { name: 'png', params: {} },
            });
            try {
                await helper.download(`${this.cluster}.png`);
            } catch (e) {
                console.error("Error downloading image:", e);
            }
        },
        makePdb() {
            if (!this.plugin) return;
            if (!this.component) return;
            if (!this.secondComponent) return;
            const header =
`REMARK     This file was generated by the Foldseek clusters webserver:
REMARK       https://cluster.foldseek.com
REMARK     Please cite:
REMARK       https://doi.org/10.1101/2023.03.09.531927
REMARK     Warning: Please refer to the original AFDB PDB files.
REMARK       This file was auto-generated from compressed information:
REMARK         * Non C-alpha atoms were re-generated by PULCHRA.
REMARK         * pLDDTs were discretized into 0 to 9 bins.
REMARK         * Residue/atom indices were sequentially renumbered`;
            const pdb = generatePdbAtoms(this.component.obj.data);
            const pdb2 = generatePdbAtoms(this.secondComponent.obj.data);
            const result =
`TITLE     ${this.cluster}+${this.second}
${header}
MODEL        1
${pdb}
ENDMDL
MODEL        2
${pdb2}
ENDMDL
END
`;
            downloadBlob(new Blob([result], { type: 'text/plain' }), `${this.cluster}+${this.second}.pdb`);
        },
        async initMolstar() {
            const fallback = this.$vuetify.theme.current.dark ? this.bgColorDark : this.bgColorLight;
            const bgColor = detectBackgroundColor(this.$refs.structurepanel, fallback);
            const defaultSpec = DefaultPluginUISpec();
            const spec = {
                ...defaultSpec,
                // Drop the built-in hover label (entity/chain/polymer info we
                // don't need) - our own lociLabels provider below replaces it
                // with just residue type, residue number, and pLDDT.
                behaviors: [
                    ...defaultSpec.behaviors.filter(b => b.transformer.id !== 'default-loci-label-provider'),
                    PluginSpec.Behavior(MAQualityAssessment),
                ],
                layout: {
                    initial: {
                        showControls: false,
                        regionState: { right: 'hidden', top: 'hidden', left: 'hidden', bottom: 'hidden' }
                    }
                },
                components: {
                    remoteState: 'none',
                    viewport: { controls: EmptyControls },
                    selectionTools: { controls: EmptyControls },
                },
                config: [
                    [PluginConfig.Viewport.ShowAnimation, false],
                    [PluginConfig.Viewport.ShowTrajectoryControls, false],
                ],
                canvas3d: {
                    // Deliberately opaque, not transparent: enabling real
                    // transparency triggered a persistent WebGL rendering
                    // artifact (Mol*'s postprocessing passes have a history of
                    // transparency bugs). An opaque canvas painted the same
                    // color as the surrounding panel (detectBackgroundColor,
                    // above) looks identical for our solid-colored panels.
                    transparentBackground: false,
                    renderer: {
                        backgroundColor: cssColorToMolstarColor(bgColor),
                        pickingAlphaThreshold: 0.1,
                    },
                    camera: {
                        helper: { axes: { name: 'off', params: {} } },
                        fov: 60,
                    },
                    cameraClipping: {
                        radius: 0,
                        far: false,
                        minNear: -1000,
                    },
                    postprocessing: {
                        occlusion: { name: 'off', params: {} },
                    },
                },
            };

            this.plugin = markRaw(await createPluginUI({
                target: this.$refs.viewport,
                spec,
                render: renderReact18
            }));
            this.plugin.representation.structure.themes.colorThemeRegistry.add(BfvdPlddtColorThemeProvider);
            this.plugin.managers.lociLabels.addProvider({
                label: (loci) => {
                    if (!StructureElement.Loci.is(loci)) return undefined;
                    const location = StructureElement.Stats.ofLoci(loci).firstElementLoc;
                    if (!location || !Unit.isAtomic(location.unit)) return undefined;
                    const residueIndex = location.unit.model.atomicHierarchy.residueAtomSegments.index[location.element];
                    const label = [`<b>${SP.residue.label_comp_id(location)}</b> ${residueIndex + 1}`];
                    if (this.plddt && loci.structure === this.component?.obj?.data) {
                        const bin = this.plddt[residueIndex];
                        if (bin !== undefined) {
                            label.push(`pLDDT <b>${plddtBinToScore(bin).toFixed(1)}</b>`);
                        }
                    }
                    return label.join(' &middot; ');
                },
            });
        },
        async loadPdbStructure(pdbString) {
            const data = await this.plugin.builders.data.rawData({ data: pdbString });
            const trajectory = await this.plugin.builders.structure.parseTrajectory(data, 'pdb');
            const model = await this.plugin.builders.structure.createModel(trajectory);
            const structure = await this.plugin.builders.structure.createStructure(model, { name: 'model', params: {} });
            return markRaw(structure);
        },
        async fetchStructure(accession) {
            const response = await this.$axios.get("/structure/" + accession);
            const pdb = padPdbFields(await pulchra(mockPDB(response.data.coordinates, response.data.seq, response.data.plddt)));
            const structure = await this.loadPdbStructure(pdb);
            return { structure, plddt: response.data.plddt };
        },
    },
    computed: {
        attachTarget: function() {
            // Only needed in native Fullscreen mode, where elements outside
            // the fullscreened subtree aren't painted. Otherwise, use
            // Vuetify's default body-level overlay - attaching here
            // unconditionally clipped the tooltip behind the Mol* canvas.
            return this.isFullscreen ? this.$refs.structurepanel : false;
        },
        tbIconBindings: function() {
            return (this.isFullscreen) ? { 'end': true } : {}
        },
        tbButtonBindings: function() {
            return (this.isFullscreen) ? {
                'size': 'default',
                'style': 'margin-bottom: 15px;',
            } : {
                'size': 'small',
                'style': ''
            }
        },
    },
    watch: {
        'cluster': {
            handler() {
                this.$nextTick(async () => {
                    if (!this.cluster) {
                        return;
                    }
                    await this._pluginReady;
                    if (!this.plugin) {
                        return;
                    }
                    await this.plugin.clear();
                    this.component = null;
                    this.secondComponent = null;
                    const { structure, plddt } = await this.fetchStructure(this.cluster);
                    this.component = structure;
                    this.plddt = plddt;
                    await this.plugin.builders.structure.representation.addRepresentation(this.component, {
                        type: 'cartoon',
                        color: 'bfvd-plddt',
                        colorParams: { plddt: this.plddt },
                    }, { tag: 'main-repr' });
                    this.plugin.managers.camera.reset();
                });
            },
            immediate: true,
        },
        'second': {
            handler() {
                // Guard falsy, not just "": an undefined here used to be interpolated
                // into the URL and fetched as the literal string "undefined".
                if (!this.second) {
                    return;
                }
                this.$nextTick(async () => {
                    await this._pluginReady;
                    if (!this.plugin || !this.component) return;
                    if (this.secondComponent) {
                        await this.plugin.build().delete(this.secondComponent).commit();
                        this.secondComponent = null;
                    }
                    const { structure } = await this.fetchStructure(this.second);
                    const refPdb = generatePdbAtoms(this.component.obj.data);
                    const tarPdb = generatePdbAtoms(structure.obj.data);
                    const tm = await tmalign(tarPdb, refPdb);
                    this.tmOutput = tm.output;
                    const { t, u } = tm.matrix;
                    const mat = Mat4.ofRows([
                        [u[0][0], u[0][1], u[0][2], t[0]],
                        [u[1][0], u[1][1], u[1][2], t[1]],
                        [u[2][0], u[2][1], u[2][2], t[2]],
                        [0, 0, 0, 1]
                    ]);

                    await this.plugin.build()
                        .to(structure)
                        .insert(StateTransforms.Model.TransformStructureConformation, {
                            transform: { name: 'matrix', params: { data: mat, transpose: false } }
                        })
                        .commit();

                    this.secondComponent = structure;

                    await deleteTaggedState(this.plugin, ['main-repr']);
                    await this.plugin.builders.structure.representation.addRepresentation(this.component, {
                        type: 'cartoon',
                        color: 'uniform',
                        colorParams: { value: 0x1E88E5 },
                    }, { tag: 'main-repr' });
                    await this.plugin.builders.structure.representation.addRepresentation(this.secondComponent, {
                        type: 'cartoon',
                        color: 'uniform',
                        colorParams: { value: 0xFFC107 },
                    }, { tag: 'second-repr' });

                    this.plugin.managers.camera.reset();
                });
            },
            immediate: true,
        },
    },
    async mounted() {
        this._pluginReady = this.initMolstar();
        await this._pluginReady;
        window.addEventListener('resize', this.handleResize)
        const fullscreenHandler = () => {
            this.isFullscreen = !!document.fullscreenElement;
            this.plugin?.canvas3d?.handleResize();
            this.plugin?.managers.camera.reset();
        };
        document.addEventListener('fullscreenchange', fullscreenHandler);
        document.addEventListener('webkitfullscreenchange', fullscreenHandler);
        this._fullscreenHandler = fullscreenHandler;
    },
    beforeUnmount() {
        document.removeEventListener('fullscreenchange', this._fullscreenHandler);
        document.removeEventListener('webkitfullscreenchange', this._fullscreenHandler);
        window.removeEventListener('resize', this.handleResize)
        this.plugin?.dispose();
    }
}
</script>

<style scoped lang="scss">
.structure-wrapper {
    margin: 0 auto;
    position: relative;
    flex: 1 1 auto;
    min-height: 300px;
    width: 100%;
}

.v-theme--dark .structure-wrapper .v-tooltip__content {
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
    height: 100%;
    display: flex;
    flex-direction: column;
}

.structure-caption {
    flex: 0 0 auto;
    margin-top: 0.5em;
    text-align: center;
    line-height: 1.4;
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
.structure-wrapper.hovered :deep(.help) {
    display: inline-flex;
}
.structure-wrapper :deep(.help) {
    display: none;
    position: absolute;
    z-index: 999;
    right:0;
}
</style>

<style lang="scss">
@use 'molstar/lib/mol-plugin-ui/skin/light.scss';

.msp-highlight-toast-wrapper {
    z-index: 9999;
    position: absolute !important;
    left: 0px !important;
    top: 0px !important;
    width: fit-content;
    pointer-events: none;
}

.msp-highlight-toast-wrapper:empty {
    display: none !important;
}

.msp-highlight-toast-wrapper .msp-highlight-info {
    white-space: nowrap;
    color: white !important;
    background: rgba(0, 0, 0, 0.65) !important;
    padding: 4px 4px !important;
    border-radius: 4px !important;
}

.msp-plugin canvas {
    position: relative;
}
</style>
