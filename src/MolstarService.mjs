import { createPluginUI } from 'molstar/lib/mol-plugin-ui/index.js';
import { DefaultPluginUISpec } from 'molstar/lib/mol-plugin-ui/spec.js';
import { PluginContext } from 'molstar/lib/mol-plugin/context.js';
import { Color } from 'molstar/lib/mol-util/color/index.js';
import { pulchra } from 'pulchra-wasm';

const oneToThree = {
  "A":"ALA", "R":"ARG", "N":"ASN", "D":"ASP",
  "C":"CYS", "E":"GLU", "Q":"GLN", "G":"GLY",
  "H":"HIS", "I":"ILE", "L":"LEU", "K":"LYS",
  "M":"MET", "F":"PHE", "P":"PRO", "S":"SER",
  "T":"THR", "W":"TRP", "Y":"TYR", "V":"VAL",
  "U":"SEC", "O":"PHL", "X":"XAA"
};

function mockPDB(ca, seq) {
    const chainLength = ca.length / 3;
    const pdb = [];
    let j = 0;

    for (let i = 0; i < ca.length; i+=3, j++) {
        const line = 'ATOM  '
            + j.toString().padStart(5)
            + '  CA  ' + oneToThree[seq != "" && (ca.length/3) == seq.length ? seq[i/3] : 'A'] + ' A'
            + j.toString().padStart(4)
            + '    '
            + ca[0 * chainLength + j].toString().padStart(8)
            + ca[1 * chainLength + j].toString().padStart(8)
            + ca[2 * chainLength + j].toString().padStart(8)
            + '  1.00  0.00           C  ';
        pdb.push(line);
    }
    return pdb.join('\n');
}

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

    makeImage(seq1, coordinates1, seq2, coordinates2) {
        return new Promise((resolve) => {
            this.promise = this.promise.then(async () => {
                const img = await this._makeImage(seq1, coordinates1, seq2, coordinates2);
                resolve(img);
                return img;
            });
        });
    }

    async _makeImage(seq1, coordinates1, seq2, coordinates2) {
        const fullPDB1 = await pulchra(mockPDB(coordinates1, seq1));
        const fullPDB2 = await pulchra(mockPDB(coordinates2, seq2));
        const fullPDB = fullPDB1 + '\n' + fullPDB2;
        
        // Clear previous structures
        await this.plugin.clear();

        // Load Structure
        const data = await this.plugin.builders.data.rawData({ data: fullPDB });
        const trajectory = await this.plugin.builders.structure.parseTrajectory(data, 'pdb');
        const model = await this.plugin.builders.structure.createModel(trajectory);
        const structure = await this.plugin.builders.structure.createStructure(model);

        await this.plugin.builders.structure.representation.addRepresentation(structure, {
            type: 'cartoon',
        });

        // Center view
        this.plugin.managers.camera.reset();

        // Generate Image (Factor 1 = 1:1 scale)
        const helper = this.plugin.helpers.viewportScreenshot;
        helper.behaviors.values.next({...helper.values, transparent: true, format: {name:'png', params:{}}})
        const imageData = await helper.getImageData(this.canvas.width, this.canvas.height);
        return new Blob([imageData], { type: 'image/png' });
    }

    dispose() {
        if (this.plugin) this.plugin.dispose();
    }
}