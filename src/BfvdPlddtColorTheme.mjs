import { StructureElement, Bond, Unit } from 'molstar/lib/mol-model/structure.js';
import { Color } from 'molstar/lib/mol-util/color/color.js';
import { ParamDefinition as PD } from 'molstar/lib/mol-util/param-definition.js';
import { ColorThemeCategory } from 'molstar/lib/mol-theme/color/categories.js';

// Mol*'s built-in 'plddt-confidence' theme reads the score from a
// structure's B-factor column, but pulchra's full-atom reconstruction of our
// CA-only trace drops that column entirely. This theme is handed the
// original per-residue pLDDT bins directly instead, and looks residues up
// by their position in the structure.

const DefaultColor = Color(0xaaaaaa);

// plddt is a string of single-digit 0-9 confidence bins, one per residue
// (see mockPDB in StructureViewer.vue/MolstarService.mjs) - rescale back to
// the usual 0-100 pLDDT range.
export function plddtBinToScore(bin) {
    return (+bin + 0.5) * 10;
}

function scoreColor(score) {
    if (score <= 50) return Color(0xff5400);
    if (score <= 70) return Color(0xff9e00);
    if (score <= 90) return Color(0x0096C7);
    return Color(0x023e8a);
}

function BfvdPlddtColorTheme(ctx, props) {
    const plddt = props.plddt;
    let color = () => DefaultColor;
    if (ctx.structure && plddt && plddt.length) {
        const getColor = (location) => {
            const { unit, element } = location;
            if (!Unit.isAtomic(unit)) return DefaultColor;
            const residueIndex = unit.model.atomicHierarchy.residueAtomSegments.index[element];
            const bin = plddt[residueIndex];
            if (bin === undefined) return DefaultColor;
            return scoreColor(plddtBinToScore(bin));
        };
        const l = StructureElement.Location.create(ctx.structure.root);
        color = (location) => {
            if (StructureElement.Location.is(location)) return getColor(location);
            if (Bond.isLocation(location)) {
                l.unit = location.aUnit;
                l.element = location.aUnit.elements[location.aIndex];
                return getColor(l);
            }
            return DefaultColor;
        };
    }
    return {
        factory: BfvdPlddtColorTheme,
        granularity: 'group',
        preferSmoothing: true,
        color,
        props,
        description: 'Colors residues by BFVD pLDDT confidence bin, supplied directly rather than read from B-factor.',
    };
}

export const BfvdPlddtColorThemeProvider = {
    name: 'bfvd-plddt',
    label: 'BFVD pLDDT',
    category: ColorThemeCategory.Validation,
    factory: BfvdPlddtColorTheme,
    getParams: () => ({ plddt: PD.Value([], { isHidden: true }) }),
    defaultValues: { plddt: [] },
    isApplicable: (ctx) => !!ctx.structure,
};
