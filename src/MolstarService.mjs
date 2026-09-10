import { PluginContext } from 'molstar/lib/mol-plugin/context.js';
import { DefaultPluginSpec } from 'molstar/lib/mol-plugin/spec.js';
import { canvasToBlob } from 'molstar/lib/mol-canvas3d/util.js';
import { PluginSpec } from 'molstar/lib/mol-plugin/spec.js';
import { MAQualityAssessment } from 'molstar/lib/extensions/model-archive/quality-assessment/behavior.js';
import { BfvdPlddtColorThemeProvider } from './BfvdPlddtColorTheme.mjs';
import { pulchra } from 'pulchra-wasm';

const oneToThree = {
  "A":"ALA", "R":"ARG", "N":"ASN", "D":"ASP",
  "C":"CYS", "E":"GLU", "Q":"GLN", "G":"GLY",
  "H":"HIS", "I":"ILE", "L":"LEU", "K":"LYS",
  "M":"MET", "F":"PHE", "P":"PRO", "S":"SER",
  "T":"THR", "W":"TRP", "Y":"TYR", "V":"VAL",
  "U":"SEC", "O":"PHL", "X":"XAA"
};

// pLDDT is a string of single-digit 0-9 confidence bins, one per residue.
// Rescaled to a 0-100 range so it lines up with Mol*'s built-in
// pLDDT-confidence color theme thresholds (<=50/<=70/<=90/>90).
function mockPDB(ca, seq, plddt) {
    const chainLength = ca.length / 3;
    const pdb = new Array()
    let j = 0;
    for (let i = 0; i < ca.length; i+=3, j++) {
        const bfactor = plddt ? ((+(plddt[j])) + 0.5) * 10 : 100;
        const line = 'ATOM  '
            + j.toString().padStart(5)
            + '  CA  ' + oneToThree[seq != "" && (ca.length/3) == seq.length ? seq[i/3] : 'A'] + ' A'
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

        const defaultSpec = DefaultPluginSpec();
        this.plugin = new PluginContext({
            ...defaultSpec,
            behaviors: [...defaultSpec.behaviors, PluginSpec.Behavior(MAQualityAssessment)],
        });
        this.promise = Promise.resolve();
        this.ready = this._init();
    }

    async _init() {
        await this.plugin.init();
        this.plugin.representation.structure.themes.colorThemeRegistry.add(BfvdPlddtColorThemeProvider);
        await this.plugin.mountAsync(this.container);
        await this.plugin.canvas3dInitialized;
        const renderer = this.plugin.canvas3d?.props?.renderer;
        if (renderer) {
            this.plugin.canvas3d?.setProps({
                cameraResetDurationMs: 0,
                renderer: {
                    ...renderer,
                    ambientIntensity: 0.2,
                },
                postprocessing: {
                    occlusion: { name: 'off', params: {} },
                },
            });
        }
    }

    makeImage(seq, plddt, coordinates) {
        return new Promise((resolve, reject) => {
            this.promise = this.promise.then(async () => {
                try {
                    const img = await this._makeImage(seq, plddt, coordinates);
                    resolve(img);
                    return img;
                } catch (e) {
                    reject(e);
                }
            });
        });
    }

    async _makeImage(seq, plddt, coordinates) {
        await this.ready;
        const pdb = await pulchra(mockPDB(coordinates, seq, plddt));

        await this.plugin.clear();
        const data = await this.plugin.builders.data.rawData({ data: pdb });
        const trajectory = await this.plugin.builders.structure.parseTrajectory(data, 'pdb');
        const model = await this.plugin.builders.structure.createModel(trajectory);
        const structure = await this.plugin.builders.structure.createStructure(model, { name: 'model', params: {} });
        await this.plugin.builders.structure.representation.addRepresentation(structure, {
            type: 'cartoon',
            color: 'bfvd-plddt',
            colorParams: { plddt },
        });

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
