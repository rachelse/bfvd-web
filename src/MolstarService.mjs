import { createPluginUI } from 'molstar/lib/mol-plugin-ui/index.js';
import { DefaultPluginUISpec } from 'molstar/lib/mol-plugin-ui/spec.js';
import { PluginContext } from 'molstar/lib/mol-plugin/context.js';
import { Color } from 'molstar/lib/mol-util/color/index.js';
import { pulchra } from 'pulchra-wasm';


export class MolstarService {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.plugin = null;
        this.promise = Promise.resolve();
        this._init();
    }

    async _init() {
        // We initialize a minimal plugin instance
        const spec = DefaultPluginUISpec();
        spec.layout = { initial: { showControls: false } };
        
        // Creating a context without a full UI for background processing
        this.plugin = new PluginContext(spec);
        await this.plugin.init();
    }

    makeImage(seq, plddt, coordinates) {
        return new Promise((resolve) => {
            this.promise = this.promise.then(async () => {
                const img = await this._makeImage(seq, plddt, coordinates);
                resolve(img);
                return img;
            });
        });
    }

    async _makeImage(seq, plddt, coordinates) {
        const fullPDB = await pulchra(mockPDB(coordinates, seq));
        
        // Clear previous structures
        await this.plugin.clear();

        // Load Structure
        const data = await this.plugin.builders.data.rawData({ data: fullPDB });
        const trajectory = await this.plugin.builders.structure.parse(data, 'pdb');
        const model = await this.plugin.builders.structure.addModel(trajectory);
        const structure = await this.plugin.builders.structure.addStructure(model);

        // Add Representation (Coloring by pLDDT/B-factor)
        // Molstar has a built-in 'plddt-confidence' theme
        await this.plugin.builders.structure.representation.addRepresentation(structure, {
            type: 'cartoon',
            color: 'plddt-confidence' 
        });

        // Center view
        this.plugin.managers.camera.reset();

        // Generate Image (Factor 1 = 1:1 scale)
        const imageData = await this.plugin.helpers.viewportScreenshot.getByteData({
            transparent: true,
            multiply: 1 
        });

        return new Blob([imageData], { type: 'image/png' });
    }

    dispose() {
        if (this.plugin) this.plugin.dispose();
    }
}