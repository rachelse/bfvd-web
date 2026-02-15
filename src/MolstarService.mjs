import { PluginContext } from 'molstar/lib/mol-plugin/context.js';
import { DefaultPluginSpec } from 'molstar/lib/mol-plugin/spec.js';
import { RawData } from 'molstar/lib/mol-plugin-state/transforms/data.js';
import { ModelFromTrajectory, StructureFromModel, TrajectoryFromPDB } from 'molstar/lib/mol-plugin-state/transforms/model.js';
import { StructureRepresentation3D } from 'molstar/lib/mol-plugin-state/transforms/representation.js';
import { pulchra } from 'pulchra-wasm';
import { setChainName, mockPDB } from './Utils.js';

export class MolstarService {
    constructor() {
        // We create a hidden container for the plugin to render into
        this.container = document.createElement('div');
        this.container.style.display = 'none'; 
        document.body.appendChild(this.container);

        this.plugin = null;
        this.promise = Promise.resolve();
        this._init();
    }

    async _init() {        
        // Use the standard PluginContext for browsers
        const spec = DefaultPluginSpec();
        this.plugin = new PluginContext(spec);
        await this.plugin.init();
        // Bind the plugin to our hidden container
        // await this.plugin.initViewer(this.container);
    }

    async _makeImage(seq1, coordinates1, seq2, coordinates2) {
        let pdb1 = mockPDB(coordinates1, seq1);
        let pdb2 = mockPDB(coordinates2, seq2);
        pdb1 = setChainName(pdb1, 'A'); // TODO: Change to set proper chain name
        pdb2 = setChainName(pdb2, 'B');
        const fullPDB = pdb1 + '\n' + pdb2;

        // Clear previous structures before drawing new ones
        await this.plugin.clear();

        const update = this.plugin.build();
        await update.toRoot()
            .apply(RawData, { data: fullPDB })
            .apply(TrajectoryFromPDB)
            .apply(ModelFromTrajectory)
            .apply(StructureFromModel)
            .apply(StructureRepresentation3D, {})
            .commit();

        this.plugin.managers.camera.reset();

        // 3. Generate the actual Image
        const renderer = this.plugin.canvas3d?.getScreenshot();
        if (!renderer) throw new Error("Canvas not ready");
        
        // Get the image as a Blob
        return new Promise(resolve => {
            renderer.toBlob((blob) => resolve(blob), 'image/png');
        });
    }

    dispose() {
        if (this.plugin) this.plugin.dispose();
    }
}