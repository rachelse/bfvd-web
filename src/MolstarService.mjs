import { PluginContext } from 'molstar/lib/mol-plugin/context.js';
import { DefaultPluginSpec } from 'molstar/lib/mol-plugin/spec.js';
import { PluginCommands } from 'molstar/lib/mol-plugin/commands.js';
import { RawData } from 'molstar/lib/mol-plugin-state/transforms/data.js';
import { ModelFromTrajectory, StructureFromModel, TrajectoryFromPDB, StructureSelectionFromExpression } from 'molstar/lib/mol-plugin-state/transforms/model.js';
import { StructureRepresentation3D } from 'molstar/lib/mol-plugin-state/transforms/representation.js';
import { MolScriptBuilder as MS } from 'molstar/lib/mol-script/language/builder.js';
import { canvasToBlob } from 'molstar/lib/mol-canvas3d/util.js';
import { pulchra } from 'pulchra-wasm';
import { setChainName, mockPDB, getInterfaceExpression } from './Utils.js';
import * as Colors from './Colors.js';

export class MolstarService {
    constructor() {
        const div = document.createElement('div');
        div.style.width = '100px';
        div.style.height = '100px';
        div.style.position = 'absolute';
        div.style.top = '0';
        div.style.left = '-1000px';
        div.style.zIndex = '-999';
        div.ariaHidden = true;
    
        this.container = div;
        document.querySelector("body").appendChild(div);
        
        this.plugin = new PluginContext(DefaultPluginSpec());
        this.promise = Promise.resolve();
        this.ready = this._init();
    }

    async _init() {        
        await this.plugin.init();
        await this.plugin.mountAsync(this.container);
        await this.plugin.canvas3dInitialized;
        this.plugin.canvas3d?.setProps({ 
            cameraResetDurationMs: 0,  
            renderer: {
                ...this.plugin.canvas3d.props.renderer,
            }
        });
        const renderer = this.plugin.canvas3d?.props?.renderer;
        
        // Bind the plugin to our hidden container
        if (renderer) {

            await PluginCommands.Canvas3D.SetSettings(this.plugin, {
                settings: {
                renderer: {
                    ...renderer,
                    ambientIntensity: 0.2,
                    backgroundAlpha: 0,
                },
                },
            });
        }
    }

    async makeImage(seq1, coordinates1, seq2, coordinates2) {
        return new Promise((resolve) => {
            this.promise = this.promise.then(async () => {
                const img = await this._makeImage(seq1, coordinates1, seq2, coordinates2);
                resolve(img);
                return img;
            });
        });
    }

    async _makeImage(seq1, coordinates1, seq2, coordinates2) {
        await this.ready;
        let pdb1 = await pulchra(mockPDB(coordinates1, seq1));
        let pdb2 = await pulchra(mockPDB(coordinates2, seq2));
        
        pdb1 = setChainName(pdb1, 'A');
        pdb2 = setChainName(pdb2, 'B');
        const fullPDB = pdb1 + '\n' + pdb2;

        const chainA = MS.struct.generator.atomGroups({
            'chain-test': MS.core.rel.eq([MS.struct.atomProperty.macromolecular.auth_asym_id(), 'A'])
        });
        const chainB = MS.struct.generator.atomGroups({
            'chain-test': MS.core.rel.eq([MS.struct.atomProperty.macromolecular.auth_asym_id(), 'B'])
        });

        const { interface1, interface2 } = getInterfaceExpression(chainA, chainB);

        const nonInterface1 = MS.struct.modifier.exceptBy({ 0: chainA, by: interface1 });
        const nonInterface2 = MS.struct.modifier.exceptBy({ 0: chainB, by: interface2 });

        // Clear previous structures before drawing new ones
        await this.plugin.clear();
        const update = this.plugin.build();
        const root = await update.toRoot()
            .apply(RawData, { data: fullPDB })
            .apply(TrajectoryFromPDB)
            .apply(ModelFromTrajectory)
            .apply(StructureFromModel);
        
        await root
            .apply(StructureSelectionFromExpression, {
                expression: interface1,
            })
            .apply(StructureRepresentation3D, {
                type: { name: 'cartoon', params: {} },
                colorTheme: { name: 'uniform', params: { value: Colors.purple.hex } },
            })
        
        await root
            .apply(StructureSelectionFromExpression, {
                expression: interface2,
            })
            .apply(StructureRepresentation3D, {
                type: { name: 'cartoon', params: {} },
                colorTheme: { name: 'uniform', params: { value: Colors.skyblue.hex } },
            })
            .commit();
        
        // Set Non interface region transparent
        // await root
        //     .apply(StructureSelectionFromExpression, {
        //         expression: nonInterface1,
        //     })
        //     .apply(StructureRepresentation3D, {
        //         type: { name: 'cartoon', params: { alpha: 0.1, transparentBackfaces: 'off' } },
        //         colorTheme: { name: 'uniform', params: { value: Colors.purple.hex } },
        //     })
        
        // await root
        //     .apply(StructureSelectionFromExpression, {
        //         expression: nonInterface2,
        //     })
        //     .apply(StructureRepresentation3D, {
        //         type: { name: 'cartoon', params: { alpha: 0.1, transparentBackfaces: 'off' } },
        //         colorTheme: { name: 'uniform', params: { value: Colors.skyblue.hex } },
        //     })
        //     .commit();

        this.plugin.managers.camera.reset(undefined, 0);
        this.plugin.canvas3d?.commit(true);
        const ss = this.plugin.helpers.viewportScreenshot;
        ss.behaviors.values.next({
            ...ss.values,
            transparent: true,
        });
        const p = await ss.getPreview(); 
        return canvasToBlob(p.canvas, 'png');
    }

    dispose() {
        if (this.plugin) this.plugin.dispose();
        if (this.container) this.container.remove();
    }
}