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
                <v-btn v-bind="tbButtonBindings"
                    v-on:click="updateStructureMode()"
                    title="Switch between showing only the interface, highlighting the interface, or showing the whole structure"
                >
                    <v-icon v-bind="tbIconBindings">{{ structureMode == 0 ? $MDI.CircleHalf : (structureMode == 1 ? $MDI.Circle : $MDI.CircleOpacity) }}</v-icon>
                    <span v-if="isFullscreen">&nbsp;{{ structureMode == 0 ? 'Only Interface' : (structureMode == 1 ? 'Whole Structure' : 'Highlight Interface') }}</span>
                </v-btn>
                </v-item-group>
            </div>
            <div class="structure-viewer" ref="viewport"></div>
        </div>
        <template v-if="second">
            <span v-if="secondComponent == null">Superposition loading</span>
            <template v-else>
                <div class="d-flex align-center" style="flex-wrap: wrap; gap: 4px;">
                    <span class="d-inline-flex align-center" style="white-space: nowrap;">
                        <span style="position: relative; display: inline-flex; width: 16px; height: 16px; align-items: center; justify-content: center;" class="mr-1">
                            <v-icon :color="seccol1.code" size="small" style="position: absolute;">
                            {{ $MDI.CircleHalf }} </v-icon><v-icon :color="seccol2.code" size="small" style="position: absolute; transform: scaleX(-1);">
                            {{ $MDI.CircleHalf }} </v-icon>
                        </span>
                        <span>{{ second }}</span>
                    </span>
                    <span style="white-space: nowrap;">superposed on representative</span>
                    <span class="d-inline-flex align-center" style="white-space: nowrap;">
                        <span style="position: relative; display: inline-flex; width: 16px; height: 16px; align-items: center; justify-content: center;" class="mr-1">
                            <v-icon :color="col1.code" size="small" style="position: absolute;">
                                {{ $MDI.CircleHalf }} 
                            </v-icon><v-icon :color="col2.code" size="small" style="position: absolute; transform: scaleX(-1);">
                                {{ $MDI.CircleHalf }} 
                            </v-icon>
                        </span>
                        <span>{{ cluster }}</span>
                    </span>
                </div>
                <template v-if="tmOutput">
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
import { Vec3 } from 'molstar/lib/mol-math/linear-algebra';
import { Segmentation } from 'molstar/lib/mol-data/int';
import { StructureSelection, QueryContext, StructureElement, StructureProperties as SP } from 'molstar/lib/mol-model/structure';
import { MolScriptBuilder as MS } from 'molstar/lib/mol-script/language/builder';
import { compile } from 'molstar/lib/mol-script/runtime/query/compiler';
import { StateTransforms } from 'molstar/lib/mol-plugin-state/transforms';
import { Mat4 } from 'molstar/lib/mol-math/linear-algebra.js';
import { isProtein } from 'molstar/lib/mol-model/structure/model/types';

import Panel from './Panel.vue';
import { pulchra } from 'pulchra-wasm';
import { setChainName, mockPDB } from './Utils.js';
import * as Colors from './Colors.js';

// TM-align worker setup stays same
const worker = new Worker(new URL('./tmalign-worker.js', import.meta.url));
const tmalign = function(pdb1, pdb2) {
    return new Promise((resolve, reject) => {
        worker.onmessage = (e) => resolve(e.data);
        worker.onerror = (e) => reject(e);
        worker.postMessage({ pdb1, pdb2 });
    });
};

function generatePdbAtoms(structureData) {
    if (!structureData) return '';
    const l = StructureElement.Location.create(structureData);
    const atomLines = [];

    for (const unit of structureData.units) {
        const elements = unit.elements;
        l.unit = unit;
        
        for (let j = 0; j < elements.length; j++) {
            l.element = elements[j];
            
            // TODO: allow only protein
            const isPolymer = SP.entity.type(l) === 'polymer';
            if (!isPolymer) continue;
            
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

async function addStructureRepresentation(plugin, color1, color2, main1, main2, transparent1 = null, transparent2 = null) {
    if (transparent1) {
        await plugin.builders.structure.representation.addRepresentation(transparent1, {
            type: 'cartoon', color: 'uniform', colorParams: { value: 0xFFFFFF /* color1*/ },
            typeParams: { alpha: 0.3, transparentBackfaces: 'off' },
        }, { tag: 'chain-1-ui' });
    }

    if (transparent2) {
        await plugin.builders.structure.representation.addRepresentation(transparent2, {
            type: 'cartoon', color: 'uniform', colorParams: { value: 0xFFFFFF /* color2*/ },
            typeParams: { alpha: 0.3, transparentBackfaces: 'off' },
        }, { tag: 'chain-2-ui' });
    }

    await plugin.builders.structure.representation.addRepresentation(main1, {
        type: 'cartoon', color: 'uniform', colorParams: { value: color1 },
    }, { tag: 'chain-1-ui' });
    await plugin.builders.structure.representation.addRepresentation(main2, {
        type: 'cartoon', color: 'uniform', colorParams: { value: color2 },
    }, { tag: 'chain-2-ui' });
}

function getCAPositions(unit) {
    const { elements, model } = unit;
    const { chainAtomSegments, residueAtomSegments, atoms } = model.atomicHierarchy;

    const atomId = atoms.label_atom_id;

    const chainIt = Segmentation.transientSegments(chainAtomSegments, elements);
    const residueIt = Segmentation.transientSegments(residueAtomSegments, elements);

    const caUnitIndex = [];

    while (chainIt.hasNext) {
        const chainSeg = chainIt.move();
        residueIt.setSegment(chainSeg);

        while (residueIt.hasNext) {
            const r = residueIt.move();
            let found = -1;

            for (let ui = r.start; ui < r.end; ui++) {
                const e = elements[ui];
                if (atomId.value(e) === 'CA') { found = ui; break;}
            }

            caUnitIndex.push(found);
        }
    }
    return caUnitIndex;
}

async function getInterfaceResidues(structure, chain1, chain2, thresholdSq = 10.0 * 10.0) {
    let { units } = structure.data;
    units = units.filter(unit => { // Make sure we only have protein chains
        return isProtein(unit.model.atomicHierarchy.derived.residue.moleculeType[0]);
    });
    
    if (units.length < 2) {
        console.warn("Structure does not have two chains for interface detection.");
        return;
    }

    const u1 = units[0];
    const u2 = units[1];

    const caQuery1 = compile(MS.struct.generator.atomGroups({
        'chain-test': MS.core.rel.eq([MS.struct.atomProperty.macromolecular.auth_asym_id(), 'A']),
        'atom-test': MS.core.rel.eq([MS.struct.atomProperty.macromolecular.label_atom_id(), 'CA'])
    }));
    const structuredata = structure.obj.data;
    const sel1 = StructureSelection.toLociWithCurrentUnits(caQuery1(new QueryContext(structuredata)));
    const caloci1 = StructureElement.Loci.is(sel1) ? sel1 : StructureElement.Loci.none(structuredata);

    const caQuery2 = compile(MS.struct.generator.atomGroups({
        'chain-test': MS.core.rel.eq([MS.struct.atomProperty.macromolecular.auth_asym_id(), chain2]),
        'atom-test': MS.core.rel.eq([MS.struct.atomProperty.macromolecular.label_atom_id(), 'CA'])
    }));
    const sel2 = StructureSelection.toLociWithCurrentUnits(caQuery2(new QueryContext(structuredata)));
    const caloci2 = StructureElement.Loci.is(sel2) ? sel2 : StructureElement.Loci.none(structuredata);
    
    const interfaceResidues1 = new Set();
    const interfaceResidues2 = new Set();
    const v1 = Vec3();
    const v2 = Vec3();

    for (let i = 0; i < caloci1.elements[0].indices.length; i++) {
        const e1 = caloci1.elements[0].indices[i];
        u1.conformation.position(u1.elements[e1], v1);
        for (let j = 0; j < caloci2.elements[0].indices.length; j++) {
            const e2 = caloci2.elements[0].indices[j];

            u2.conformation.position(u2.elements[e2], v2);
            const d2 = Vec3.squaredDistance(v1, v2);
            if (d2 < thresholdSq) {
                interfaceResidues1.add(i);
                interfaceResidues2.add(j);
            }
        }
    }
    
    return { interfaceResidues1, interfaceResidues2 };
}

export default {
    components: { Panel },
    data: () => ({
        plugin: null, // Molstar Context
        component: null, // Primary Structure
        secondComponent: null, // Superposed Structure
        tmOutput: null,
        chain1: null,
        chain2: null,
        interface1: null,
        interface2: null,
        secondChain1: null,
        secondChain2: null,
        secondInterface1: null,
        secondInterface2: null,
        'isFullscreen': false,
        'hovered': false,
        col1: Colors.purple,
        col2: Colors.aquaBlue, 
        seccol1: Colors.lightPurple,
        seccol2: Colors.skyblue,
        structureMode: 0, // 0: highlight interface, 1: only interface, 2: whole structure
    }),
    props: {
        'cluster': { type: String, required: true },
        'second': { type: String, required: true },
        'toolbar': { type: Boolean, default: true },
        'bgColorLight': { type: String, default: Colors.white.hex },
        'bgColorDark': { type: String, default: Colors.black.hex },
    },
    methods: {
        async initMolstar() {
            const bgColor = this.$vuetify.theme.dark ? this.bgColorDark : this.bgColorLight;
            const spec = {
                ...DefaultPluginUISpec(),
                layout: {
                    initial: {
                        showControls: false,
                        regionState: { right: 'hidden', top: 'hidden', left: 'hidden', bottom: 'hidden' }
                    }
                },
                canvas3d: {
                    renderer: {
                        transparentBackground: true,
                        backgroundColor: bgColor 
                    },
                }
            };

            this.plugin = await createPluginUI({
                target: this.$refs.viewport,
                spec,
                render: renderReact18
            });
        },

        async loadPdbStructure(pdbString, colorHex = null) {
            const data = await this.plugin.builders.data.rawData({ data: pdbString });
            const trajectory = await this.plugin.builders.structure.parseTrajectory(data, 'pdb');
            const model = await this.plugin.builders.structure.createModel(trajectory);
            const structure = await this.plugin.builders.structure.createStructure(model, { name: 'model', params: {} });
            return structure;
        },

        async loadClusterStructure() {
            if (!this.plugin || !this.cluster) return;
            await this.plugin.clear();
            this.component = null;
            this.secondComponent = null;

            try {
                const response = await this.$axios.get("/chainid/" + this.cluster);
                if (!response || !response.data) return;

                const structure = await this.fetchDimerStructure(
                    response.data.chain1_id, 
                    response.data.chain2_id, 
                    response.data.chain1, 
                    response.data.chain2
                );
                
                this.component = structure;
            } catch (error) {
                console.error("Error loading cluster structure:", error);
            }
        },

        async loadSecondStructure() {
            if (!this.plugin || !this.second || this.second === "") return;

            if (this.secondComponent) {
                await this.plugin.build().delete(this.secondComponent).commit();
                this.secondComponent = null;
            }

            try {
                const response = await this.$axios.get("/chainid/" + this.second);
                if (!response || !response.data) return;
                const secondStructure = await this.fetchDimerStructure(
                    response.data.chain1_id, response.data.chain2_id, response.data.chain1, response.data.chain2
                );
                this.secondComponent = secondStructure;

                const { chain1, chain2, interface1, interface2 } = await this.getStructureCompoments(secondStructure);
                this.secondChain1 = chain1;
                this.secondChain2 = chain2;
                this.secondInterface1 = interface1;
                this.secondInterface2 = interface2;
                const ref_int1 = generatePdbAtoms(this.interface1.obj.data);
                const ref_int2 = generatePdbAtoms(this.interface2.obj.data);
                const ref_int = ref_int1 + "\n" + ref_int2;
                
                const tar_int1 = generatePdbAtoms(interface1.obj.data);
                const tar_int2 = generatePdbAtoms(interface2.obj.data);
                const tar_int = tar_int1 + "\n" + tar_int2;
                const result = await tmalign(ref_int, tar_int);
                this.tmOutput = result.output;
                const { t, u } = result.matrix;
                
                let mat = Mat4.ofRows([
                    [u[0][0], u[0][1], u[0][2], t[0]],
                    [u[1][0], u[1][1], u[1][2], t[1]],
                    [u[2][0], u[2][1], u[2][2], t[2]],
                    [0, 0, 0, 1]]
                );

                await this.plugin.build()
                    .to(this.secondComponent)
                    .insert(StateTransforms.Model.TransformStructureConformation, {
                        transform: {name: 'matrix',params: { data: Mat4.invert(Mat4(), mat), transpose: false }}
                    })
                    .commit();

                if (this.structureMode === 0) {
                    await addStructureRepresentation(this.plugin, this.seccol1.hex, this.seccol2.hex, interface1, interface2);
                } else if (this.structureMode === 1) {
                    await addStructureRepresentation(this.plugin, this.seccol1.hex, this.seccol2.hex, interface1, interface2);
                } else if (this.structureMode === 2) {
                    await addStructureRepresentation(this.plugin, this.seccol1.hex, this.seccol2.hex, chain1, chain2);
                }
                // await this.plugin.builders.structure.representation.applyPreset(this.secondComponent, 'auto');
                this.plugin?.managers.camera.reset();
            } catch (error) {
                console.error("Error loading second structure:", error);
            }
        },

        async resetView() {
            if (!this.plugin) return;
            if (this.secondComponent) {
                await this.plugin.build().delete(this.secondComponent).commit();
                this.secondComponent = null;
                this.$emit('reset', null);
            }
            this.plugin?.managers.camera.reset();
        },

        async makeImage() {
            if (!this.plugin) return;
            const helper = this.plugin.helpers.viewportScreenshot;
            helper.behaviors.values.next({
                ...helper.values,
                transparent: true,
                format: { name: 'png', params: {} },
            });

            try {
                const filename = `${this.cluster || 'structure'}.png`;
                await helper.download(filename);

            } catch (e) {
                console.error("Error downloading image:", e);
            }
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
        async makePdb() {
            if (!this.plugin) return;
            if (!this.component) return;
            const header = `REMARK     This file was generated by the Foldseek clusters webserver:
REMARK       https://todo.foldseek.com
REMARK     Please cite:
REMARK       https://todo
REMARK     Warning: Please refer to the original PDB files.
REMARK       This file was auto-generated from compressed information:
REMARK         * Non C-alpha atoms were re-generated by PULCHRA.
REMARK         * Residue/atom indices were sequentially renumbered`;
            
            const structrure1Data = this.component.obj.data;
            const pdb1String = generatePdbAtoms(structrure1Data);
            let result = '';
            if (!this.secondComponent) {
                result = `TITLE     ${this.cluster}\n${header}\n${pdb1String}\nEND\n`;
            } else {
                const structrure2Data = this.secondComponent.obj.data;
                const pdb2String = generatePdbAtoms(structrure2Data);
                result = `TITLE     ${this.cluster}+${this.second}\n${header}\nMODEL        1\n${pdb1String}\nENDMDL\nMODEL        2\n${pdb2String}\nENDMDL\nEND\n`;
            }

            const blob = new Blob([result], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${this.cluster}${this.second ? '-' + this.second : ''}.pdb`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },

        async updateStructureMode() {
            this.structureMode = (this.structureMode + 1) % 3;
            if (this.component) {
                const allCells = Array.from(this.plugin.state.data.cells.values());
                const cellsToDelete = allCells.filter(cell => {
                    const tags = cell.transform?.tags;
                    return Array.isArray(tags) && (
                        tags.includes('chain-1-ui') || tags.includes('chain-2-ui')
                    );
                });
                const update = this.plugin.build();
                for (const cell of cellsToDelete) {
                    update.delete(cell.transform.ref);
                }
                await update.commit();
            }
            if ( this.structureMode === 0) {
                // Default: Show whole structure (transparent) with interface highlighted
                await addStructureRepresentation(this.plugin, this.col1.hex, this.col2.hex, this.interface1, this.interface2, this.chain1, this.chain2);
            } else if (this.structureMode === 1) {
                // Show only interface
                await addStructureRepresentation(this.plugin, this.col1.hex, this.col2.hex, this.interface1, this.interface2);
            } else if (this.structureMode === 2) {
                // Show whole structure
                await addStructureRepresentation(this.plugin, this.col1.hex, this.col2.hex, this.chain1, this.chain2);
            }

            if (this.secondComponent) {
                if ( this.structureMode === 0) {
                    await addStructureRepresentation(this.plugin, this.seccol1.hex, this.seccol2.hex, this.secondInterface1, this.secondInterface2, this.secondChain1, this.secondChain2);
                } else if (this.structureMode === 1) {
                    await addStructureRepresentation(this.plugin, this.seccol1.hex, this.seccol2.hex, this.secondInterface1, this.secondInterface2);
                } else if (this.structureMode === 2) {
                    await addStructureRepresentation(this.plugin, this.seccol1.hex, this.seccol2.hex, this.secondChain1, this.secondChain2);
                }
            }
            this.plugin?.managers.camera.reset();
        },

        async fetchStructure(accession) {
            const response = await this.$axios.get("/structure/" + accession);
            const pdb = await pulchra(mockPDB(response.data.coordinates, response.data.seq));
            const structure = await this.loadPdbStructure(pdb);
            return structure
        },

        async fetchDimerStructure(id1, id2, chain1 = 'A', chain2 = 'B') {
            const [r1, r2] = await Promise.all([
                this.$axios.get("/structure/" + id1),
                this.$axios.get("/structure/" + id2)
            ]);
            let pdb1 = await pulchra(mockPDB(r1.data.coordinates, r1.data.seq));
            let pdb2 = await pulchra(mockPDB(r2.data.coordinates, r2.data.seq));
            // TODO: How can we set chain names if they are long? 
            pdb1 = setChainName(pdb1, 'A'); // Chain Names are gone after running pulchra
            pdb2 = setChainName(pdb2, 'B'); 
            const combined = pdb1.split('END')[0] + '\n' + pdb2.split('END')[0];

            const structure = await this.loadPdbStructure(combined);
            return structure;
        },

        async getStructureCompoments(component, chainId1 = 'A', chainId2 = 'B') {
            const chain1_sel = MS.struct.generator.atomGroups({'chain-test': MS.core.rel.eq([MS.struct.atomProperty.macromolecular.auth_asym_id(), chainId1])});
            const chain2_sel = MS.struct.generator.atomGroups({'chain-test': MS.core.rel.eq([MS.struct.atomProperty.macromolecular.auth_asym_id(), chainId2])});

            const interface1_sel = MS.struct.modifier.intersectBy({
                0: chain1_sel,
                by: MS.struct.modifier.includeSurroundings({ 0: chain2_sel, radius: 10, 'as-whole-residues': true })
            });
            const interface2_sel = MS.struct.modifier.intersectBy({
                0: chain2_sel,
                by: MS.struct.modifier.includeSurroundings({ 0: chain1_sel, radius: 10, 'as-whole-residues': true })
            });
            
            const chain1 = await this.plugin.builders.structure.tryCreateComponentFromExpression(component, chain1_sel, 'A');
            const chain2 = await this.plugin.builders.structure.tryCreateComponentFromExpression(component, chain2_sel, 'B');
            const interface1 = await this.plugin.builders.structure.tryCreateComponentFromExpression(component, interface1_sel, 'A-interface');
            const interface2 = await this.plugin.builders.structure.tryCreateComponentFromExpression(component, interface2_sel, 'B-interface');
            return { chain1, chain2, interface1, interface2 };
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
            handler: 'loadClusterStructure',
            immediate: false
        },
        'second': {
            handler: 'loadSecondStructure',
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
        this._fullscreenHandler = fullscreenHandler;

        if (this.cluster) {
            await this.loadClusterStructure();
            const { chain1, chain2, interface1, interface2 } = await this.getStructureCompoments(this.component);
            this.chain1 = chain1;
            this.chain2 = chain2;
            this.interface1 = interface1;
            this.interface2 = interface2;
            await addStructureRepresentation(this.plugin, this.col1.hex, this.col2.hex, this.interface1, this.interface2, this.chain1, this.chain2);
            this.plugin?.managers.camera.reset();

            if (this.second && this.second !== "") {
                await this.loadSecondStructure();
            }
        }

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
    height: 360px;
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
