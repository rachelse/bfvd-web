import * as d3 from 'd3';
import * as Colors from './Colors.js';
import { MolScriptBuilder as MS } from 'molstar/lib/mol-script/language/builder.js';

export function drawStackedBar(svgEl, data, {
    isFraction = true,          // true if values are 0..1
    showLabelsMinPct = 0.25,    // label segments >= 15%
    barHeight = 30,
    leftPad = 0,
    rightPad = 0,
    topPad = 0,
    bottomPad = 0
} = {}) {
    if (!svgEl) return;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const rect = svgEl.getBoundingClientRect();
    const width = rect.width || 400;          // real rendered width
    const height = rect.height || 60;  

    // Clean data
    let clean = data
        .map(d => ({ label: d.label, value: Number(d.value) }))
        .filter(d => Number.isFinite(d.value) && d.value > 0);

    if (clean.length === 0) return;

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    // Normalize to fractions that sum to 1
    clean = clean.map(d => ({ ...d, frac: (isFraction ? d.value : d.value / 100) }));
    const fracSum = d3.sum(clean, d => d.frac);
    clean = clean.map(d => ({ ...d, frac: d.frac / fracSum }));

    const innerW = Math.max(1, width - leftPad - rightPad);
    const y = topPad;

    const palette4 = d3.range(4).map(i => d3.interpolateHcl(Colors.purple.code, Colors.darkblue.code)(i / 3));

    const color = d3.scaleOrdinal()
        .domain(clean.map(d => d.label))
        .range(palette4);

    // Compute segment x positions
    let acc = 0;
    const segments = clean.map(d => {
        const x0 = acc;
        acc += d.frac;
        return { ...d, x0, x1: acc };
    });

    // Group
    const g = svg.append('g').attr('transform', `translate(${leftPad}, 0)`);

    // Tooltip (white transparent)
    const tooltip = svg.append('g').style('display', 'none');

    const tooltipBg = tooltip.append('rect')
        .attr('rx', 6).attr('ry', 6)
        .attr('fill', Colors.white.code)
        .attr('fill-opacity', 0.8);

    const tooltipText = tooltip.append('text')
        .style('fill', Colors.black.code)
        .style('font-size', '12px');

    function setTooltip(event, text) {
        tooltip.style('display', null);
        tooltipText.text(text);

        const bbox = tooltipText.node().getBBox();
        tooltipBg
        .attr('width', bbox.width + 16)
        .attr('height', bbox.height + 12);

        tooltipText
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('x', (bbox.width + 16) / 2)
            .attr('y', (bbox.height + 12) / 2);
        const [mx, my] = d3.pointer(event, svg.node());
        const tx = Math.min(mx + 10, width - (bbox.width + 24));
        const ty = Math.max(my - (bbox.height + 18), 0);
        tooltip.attr('transform', `translate(${tx}, ${ty})`);
    }

    function hideTooltip() {
        tooltip.style('display', 'none');
    }

    // Draw stacked bar segments
    const rects = g.selectAll('rect.segment')
        .data(segments)
        .enter()
        .append('rect')
        .attr('class', 'segment')
        .attr('x', d => d.x0 * innerW)
        .attr('y', y)
        .attr('width', d => Math.max(1, (d.x1 - d.x0) * innerW))
        .attr('height', barHeight)
        .attr('fill', d => color(d.label))
        .attr('stroke-width', 1)
        .style('cursor', 'pointer')
        .on('mouseenter', function (event, d) {
        // subtle highlight
        d3.select(this).attr('stroke-width', 2);

        const pct = (d.frac * 100).toFixed(2) + '%';
        setTooltip(event, `${d.label}: ${pct}`);
        })
        .on('mousemove', function (event, d) {
        const pct = (d.frac * 100).toFixed(2) + '%';
        setTooltip(event, `${d.label}: ${pct}`);
        })
        .on('mouseleave', function () {
        d3.select(this).attr('stroke-width', 1);
        hideTooltip();
        });

    // Optional labels inside segments (only for big parts)
    const labels = g.selectAll('text.seg-label')
        .data(segments.filter(d => d.frac >= showLabelsMinPct))
        .enter()
        .append('text')
        .attr('class', 'seg-label')
        .attr('x', d => (d.x0 + (d.x1 - d.x0) / 2) * innerW)
        .attr('y', y + barHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .style('font-weight', '500')
        .style('font-size', '10px')
        .style('pointer-events', 'none')
        .style('fill', Colors.white.code)
        .text(d => `${d.label} ${Math.round(d.frac * 100)}%`);

    // If you want to hide labels during hover (like your pie):
    rects.on('mouseenter.hideLabels', function (event, d) {
        labels.style('display', 'none');
        // keep existing hover behavior:
        d3.select(this).attr('stroke-width', 2);
        setTooltip(event, `${d.label}: ${(d.frac * 100).toFixed(2)}%`);
    }).on('mouseleave.hideLabels', function () {
        labels.style('display', null);
        d3.select(this).attr('stroke-width', 1);
        hideTooltip();
    });
}

export function drawPie(svgEl, data) {
    if (!svgEl) return;

    // Clear previous draw
    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const width = +svg.attr('width') || 220;
    const height = +svg.attr('height') || 160;
    const radius = Math.min(width, height) / 2 - 10;

    // Clean data
    const clean = data
        .map(d => ({ label: d.label, value: Number(d.value) }))
        .filter(d => Number.isFinite(d.value) && d.value > 0);

    if (clean.length === 0) return;

    const total = d3.sum(clean, d => d.value);

    // Config
    const minPctToLabel = 0.15; // label slices >= 15%

    // Colors + layout
    const color = d3.scaleOrdinal()
        .domain(clean.map(d => d.label))
        .range(d3.schemeTableau10);

    const pie = d3.pie().sort(null).value(d => d.value);
    const pieData = pie(clean);

    const arc = d3.arc().innerRadius(0).outerRadius(radius);
    const arcHover = d3.arc().innerRadius(0).outerRadius(radius + 6);

    const labelArc = d3.arc()
        .innerRadius(radius * 0.55)
        .outerRadius(radius * 0.55);

    // Main group (centered)
    const g = svg.append('g')
        .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // --- Tooltip (hidden by default) ---
    const tooltip = svg.append('g').style('display', 'none');

    const tooltipBg = tooltip.append('rect')
        .attr('rx', 6).attr('ry', 6)
        .attr('fill', Colors.white.code)
        .attr('fill-opacity', 0.75);

    const tooltipText = tooltip.append('text')
        .attr('fill', Colors.black.code)
        .style('font-size', '12px');

    function setTooltipPosition(event) {
        const bbox = tooltipText.node().getBBox();
        const [mx, my] = d3.pointer(event, svg.node());
        const tx = Math.min(mx + 10, width - (bbox.width + 24));
        const ty = Math.max(my - (bbox.height + 18), 0);
        tooltip.attr('transform', `translate(${tx}, ${ty})`);
    }

    // --- Draw slices ---
    const slices = g.selectAll('path')
        .data(pieData)
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', d => color(d.data.label))
        .attr('stroke', Colors.white.code)
        .attr('stroke-width', 1)
        .style('cursor', 'pointer');

    // --- Slice labels (big slices only) ---
    const labels = g.selectAll('text.slice-label')
        .data(pieData.filter(d => (d.data.value / total) >= minPctToLabel))
        .enter()
        .append('text')
        .attr('class', 'slice-label')
        .attr('transform', d => `translate(${labelArc.centroid(d)})`)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .style('font-weight', '600')
        .style('pointer-events', 'none');

    // Two-line label with tspan: "Label" then "XX%"
    labels.each(function(d) {
        const text = d3.select(this);
        const pct = Math.round((d.data.value / total) * 100);
        // Font size scaling by portion, clamped
        // const p = d.data.value / total;                 // 0..1
        // const fs = Math.max(10, Math.min(16, 10 + p * 18)); // tweak

        text.append('tspan')
        .attr('x', 0)
        .attr('dy', '-0.2em')
        .style('font-size', `9px`)
        .text(d.data.label);

        text.append('tspan')
        .attr('x', 0)
        .attr('dy', '1.1em')
        .style('font-size', `11px`)
        .text(`${pct}%`);
    });

    // --- Hover handlers (hide labels while hovering) ---
    function showTooltip(event, d) {
        labels.style('display', 'none'); // hide all labels while hovering

        d3.select(this).transition().duration(120).attr('d', arcHover);

        const pct = ((d.data.value / total) * 100).toFixed(2) + '%';
        const label = `${d.data.label}: ${pct}`;

        tooltip.style('display', null);
        tooltipText.text(label);

        const bbox = tooltipText.node().getBBox();
        tooltipBg
        .attr('width', bbox.width + 16)
        .attr('height', bbox.height + 12);

        tooltipText
        .attr('x', 8)
        .attr('y', 8 + bbox.height - 2);

        setTooltipPosition(event);
    }

    function moveTooltip(event) {
        if (tooltip.style('display') !== 'none') setTooltipPosition(event);
    }

    function hideTooltip() {
        labels.style('display', null); // show labels again

        d3.select(this).transition().duration(120).attr('d', arc);
        tooltip.style('display', 'none');
    }

    slices
        .on('mouseenter', showTooltip)
        .on('mousemove', moveTooltip)
        .on('mouseleave', hideTooltip);
};

export function setChainName(structure, chainName) {
    const lines = structure.split('\n');
    let chainname = chainName;
    if (chainName.length > 1) {
        chainname = chainName.slice(0,1); // PDB format limitation
    }
    const newLines = lines.map(line => {
        if (line.startsWith('ATOM') || line.startsWith('HETATM')) {
            return line.slice(0, 21) + chainname + line.slice(22);
        }
        return line;
    });
    return newLines.join('\n');
}


const oneToThree = {
  "A":"ALA", "R":"ARG", "N":"ASN", "D":"ASP",
  "C":"CYS", "E":"GLU", "Q":"GLN", "G":"GLY",
  "H":"HIS", "I":"ILE", "L":"LEU", "K":"LYS",
  "M":"MET", "F":"PHE", "P":"PRO", "S":"SER",
  "T":"THR", "W":"TRP", "Y":"TYR", "V":"VAL",
  "U":"SEC", "O":"PHL", "X":"XAA"
};

export function mockPDB(ca, seq) {
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

export function getInterfaceExpression(chainExpr1, chainExpr2, radius = 10) {
    // const chain1 = MS.struct.generator.atomGroups({
    //     'chain-test': MS.core.rel.eq([MS.struct.atomProperty.macromolecular.auth_asym_id(), chainId1])
    // });
    // const chain2 = MS.struct.generator.atomGroups({
    //     'chain-test': MS.core.rel.eq([MS.struct.atomProperty.macromolecular.auth_asym_id(), chainId2])
    // });

    const interface1 = MS.struct.modifier.intersectBy({
        0: chainExpr1,
        by: MS.struct.modifier.includeSurroundings({ 0: chainExpr2, radius, 'as-whole-residues': true })
    });
    const interface2 = MS.struct.modifier.intersectBy({
        0: chainExpr2,
        by: MS.struct.modifier.includeSurroundings({ 0: chainExpr1, radius, 'as-whole-residues': true })
    });

    return { interface1, interface2 };

}