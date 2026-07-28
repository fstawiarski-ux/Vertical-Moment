#!/usr/bin/env node
/**
 * make_chapter.js — generate a Polish guidebook chapter from a cragkit area folder.
 *
 *   node make_chapter.js --area ./areas/wachau --title "Wachau – Dürnstein" \
 *        --sun-date 2026-03-20 --out ./Wachau_rozdzial.docx
 *
 * Reads master.json + sun_shade.csv. Sector tables, IDs, aspect and sun windows are
 * generated; only prose is hand-written, and anything unverified prints as a
 * [DO UZUPEŁNIENIA] marker rather than a confident-looking blank.
 */

const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
        WidthType, ShadingType, AlignmentType, PageBreak, LevelFormat } = require('docx');
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------- args
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const AREA = arg('area');
const TITLE = arg('title', 'Rejon');
const SUNDATE = arg('sun-date', null);
const OUT = arg('out', './rozdzial.docx');
const CONFIG = arg('config', null);
if (!AREA) { console.error('--area required'); process.exit(1); }

const master = JSON.parse(fs.readFileSync(path.join(AREA, 'master.json'), 'utf8'));
const cfg = CONFIG ? JSON.parse(fs.readFileSync(CONFIG, 'utf8')) : {};

// ---------------------------------------------------------------- csv
function readCsv(p) {
  if (!fs.existsSync(p)) return [];
  const lines = fs.readFileSync(p, 'utf8').split(/\r?\n/).filter(Boolean);
  const head = lines[0].split(',');
  return lines.slice(1).map(l => {
    const cells = []; let cur = '', q = false;
    for (const ch of l) {
      if (ch === '"') q = !q;
      else if (ch === ',' && !q) { cells.push(cur); cur = ''; }
      else cur += ch;
    }
    cells.push(cur);
    return Object.fromEntries(head.map((h, i) => [h, cells[i]]));
  });
}

const sun = readCsv(path.join(AREA, 'sun_shade.csv'));
const dates = [...new Set(sun.map(r => r.date))].sort();
const sunDate = SUNDATE || dates[0];
const sunBy = {};
sun.filter(r => r.date === sunDate).forEach(r => { sunBy[r.slug] = r; });
const noElev = master.has_elevation === false;
const noAspect = master.sectors.every(s => s.aspect_deg === null || s.aspect_deg === undefined);
const estimated = !noElev && !noAspect && master.sectors.some(s => s.terrain_source !== 'dem');
const tooFarApart = !noElev && noAspect;

// ---------------------------------------------------------------- helpers
const PL8 = { N: 'Płn', NNE: 'Płn', NE: 'Płn-Wsch', ENE: 'Wsch', E: 'Wsch', ESE: 'Wsch',
              SE: 'Płd-Wsch', SSE: 'Płd', S: 'Płd', SSW: 'Płd', SW: 'Płd-Zach',
              WSW: 'Zach', W: 'Zach', WNW: 'Zach', NW: 'Płn-Zach', NNW: 'Płn' };
const P16 = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
const compass = b => (b === null || b === undefined) ? null : P16[Math.floor(((b + 11.25) % 360) / 22.5)];
const aspectPl = b => { const c = compass(b); return c ? PL8[c] : '?'; };

const TERRACOTTA = 'B85C38', CHARCOAL = '2E2E2E', SAGE = '8A9A5B';
const H = (t, l) => new Paragraph({ text: t, heading: l, spacing: { before: 280, after: 140 } });
const P = (t, o = {}) => new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: t, ...o })] });
const BUL = t => new Paragraph({ numbering: { reference: 'bul', level: 0 }, children: [new TextRun(t)] });
const TODO = t => new Paragraph({ spacing: { after: 100 },
  children: [new TextRun({ text: '[ DO UZUPEŁNIENIA ] ' + t, italics: true, color: TERRACOTTA })] });

const COLS = [480, 2440, 760, 900, 1250, 1776, 2100];
const TOTAL = COLS.reduce((a, b) => a + b, 0);

function cell(text, { head = false, w, align = AlignmentType.LEFT, size = 17 } = {}) {
  return new TableCell({
    width: { size: w, type: WidthType.DXA },
    shading: head ? { type: ShadingType.CLEAR, fill: 'EFEAE3', color: 'auto' } : undefined,
    margins: { top: 55, bottom: 55, left: 80, right: 80 },
    children: [new Paragraph({ alignment: align,
      children: [new TextRun({ text: String(text), bold: head, size })] })]
  });
}

const fmtSun = r => {
  if (!r) return '—';
  if (!r.sun_from) return 'cień';
  const w = `${r.sun_from}–${r.sun_to}`;
  return r.interruptions && r.interruptions !== 'shade all day' ? w + ' *' : w;
};

function sectorTable(clusterId) {
  const rs = master.sectors.filter(s => s.cluster === clusterId)
                           .sort((a, b) => b.enu[2] - a.enu[2]);
  const header = new TableRow({ tableHeader: true, children:
    ['#', 'Sektor', 'm n.p.m.', 'Eksp.', (noElev || tooFarApart) ? 'Dzień' : 'Słońce', 'Współrzędne', 'Drogi / ocena']
      .map((t, i) => cell(t, { head: true, w: COLS[i] })) });
  const body = rs.map((s, i) => new TableRow({ children: [
    cell(i + 1, { w: COLS[0], align: AlignmentType.CENTER }),
    cell(s.name, { w: COLS[1] }),
    cell(s.enu[2] === null || s.enu[2] === undefined ? '—' : Math.round(s.enu[2]), { w: COLS[2], align: AlignmentType.CENTER }),
    cell(s.aspect_deg === null || s.aspect_deg === undefined ? '' : aspectPl(s.aspect_deg), { w: COLS[3], align: AlignmentType.CENTER }),
    cell(fmtSun(sunBy[s.slug]), { w: COLS[4], align: AlignmentType.CENTER }),
    cell(`${s.wgs84[0].toFixed(5)}\u00A0/\u00A0${s.wgs84[1].toFixed(5)}`, { w: COLS[5], size: 15, align: AlignmentType.CENTER }),
    cell('', { w: COLS[6] })
  ] }));
  return new Table({ columnWidths: COLS, width: { size: TOTAL, type: WidthType.DXA }, rows: [header, ...body] });
}

// group-level sun summary, straight from the data
function sunSummary(clusterId) {
  const rs = master.sectors.filter(s => s.cluster === clusterId)
    .map(s => sunBy[s.slug]).filter(Boolean);
  if (!rs.length) return null;
  const hrs = rs.map(r => parseFloat(r.sun_hours));
  const best = rs[hrs.indexOf(Math.max(...hrs))];
  const worst = rs[hrs.indexOf(Math.min(...hrs))];
  const shade = rs.filter(r => !r.sun_from).length;
  if (noElev || tooFarApart) return `Długość dnia ${sunDate}: ${Math.min(...hrs).toFixed(1)}–${Math.max(...hrs).toFixed(1)} h (bez uwzględnienia ekspozycji).`;
  let t = `Słońce ${sunDate}: od ${Math.min(...hrs).toFixed(1)} do ${Math.max(...hrs).toFixed(1)} h. ` +
          `Najdłużej ${best.sector} (${best.sun_from}–${best.sun_to}), najkrócej ${worst.sector}` +
          (worst.sun_from ? ` (${worst.sun_from}–${worst.sun_to})` : ' – cień cały dzień') + '.';
  if (shade) t += ` Sektorów w cieniu przez cały dzień: ${shade}.`;
  return t;
}

const groupNames = cfg.groups || {};
const groupNotes = cfg.group_notes || {};

const clusters = [...new Set(master.sectors.map(s => s.cluster))].sort((a, b) => a - b);
const eles = master.sectors.map(s => s.enu[2]).filter(v => v !== null && v !== undefined);

const doc = new Document({
  numbering: { config: [{ reference: 'bul', levels: [{ level: 0, format: LevelFormat.BULLET, text: '\u2022',
    alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 460, hanging: 240 } } } }] }] },
  styles: { default: {
    document: { run: { font: 'Calibri', size: 21, color: CHARCOAL } },
    heading1: { run: { font: 'Calibri', size: 34, bold: true, color: TERRACOTTA } },
    heading2: { run: { font: 'Calibri', size: 26, bold: true, color: CHARCOAL } },
    heading3: { run: { font: 'Calibri', size: 22, bold: true, color: SAGE } } } },
  sections: [{
    properties: { page: { margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 } } },
    children: [
      H(TITLE, HeadingLevel.HEADING_1),
      P('Sportowe Wspinanie pod Wiedniem · Weekendowe Gotowce', { italics: true, color: SAGE }),
      P(`${master.sectors.length} sektorów. Tabele wygenerowane z pliku ${master.source_gpx} ` +
        `(${master.generated}). ` +
        (noElev ? 'Plik źródłowy nie zawiera wysokości.' : 'Wysokości z modelu terenu – orientacyjne.'),
        { size: 18 }),

      ...(cfg.access_warning ? [
        H('Dostęp – uwaga', HeadingLevel.HEADING_2),
        P(cfg.access_warning, { bold: true, color: TERRACOTTA })
      ] : []),

      H('W skrócie', HeadingLevel.HEADING_2),
      BUL(`Liczba sektorów: ${master.sectors.length}, w ${clusters.length} grupach`),
      ...(noElev ? [] : [BUL(`Wysokość: ${Math.round(Math.min(...eles))}–${Math.round(Math.max(...eles))} m n.p.m.`)]),
      ...(master.area_type === 'region'
        ? [BUL(`Rozpiętość rejonu: ok. ${(master.extent_m / 1000).toFixed(1)} km – to zbiór osobnych skałek, nie jeden masyw`)]
        : []),
      BUL((() => {
        const r = master.route_summary;
        const w = r.walk_min ?? 0, d = r.drive_min ?? 0;
        const asc = (r.ascent_m === null || r.ascent_m === undefined)
          ? '' : `, +${r.ascent_m} m podejścia`;
        if (d === 0) return `Obejście wszystkich sektorów: ok. ${r.total_min} min marszu${asc}`;
        if (w === 0) return `Objazd wszystkich sektorów: ok. ${r.total_min} min jazdy ` +
          `(odległości w linii prostej ×1,4 – nie nawigacja drogowa)`;
        return `Objazd i obejście wszystkich sektorów: ok. ${r.total_min} min razem – ` +
          `${w} min pieszo, ${d} min samochodem${asc}`;
      })()),
      BUL((noElev || tooFarApart)
        ? `Kolumna „Dzień” to długość dnia dla daty ${sunDate} (czas lokalny)`
        : `Kolumna „Słońce” dotyczy daty ${sunDate} (czas lokalny)`),
      TODO('Skała, zakres wycen, liczba i długość dróg, stan obitości, sezon, zakazy okresowe.'),

      H('Ekspozycja i słońce – jak czytać tabele', HeadingLevel.HEADING_2),
      (noElev || tooFarApart)
        ? P('Kolumna „Dzień” podaje wschód i zachód słońca dla podanej daty. Kolumna „Eksp.” pozostaje ' +
            'pusta do czasu policzenia ekspozycji z modelu terenu.')
        : P('Kolumna „Eksp.” podaje kierunek, w którym opada teren pod sektorem, a kolumna „Słońce” – ' +
            'przedział, w którym słońce pada na tę ekspozycję. Gwiazdka (*) oznacza przerwę w nasłonecznieniu ' +
            'w ciągu dnia. Pełne zestawienie dla czterech dat w roku znajduje się w załączniku.'),
      noElev
        ? P('Uwaga: źródłowy plik GPX nie zawiera wysokości, więc ekspozycji ani nasłonecznienia ścian ' +
            'nie dało się policzyć. Kolumna „Słońce” podaje jedynie długość dnia (wschód–zachód) i nie ' +
            'uwzględnia ani kierunku ściany, ani zasłonięcia przez teren. Do uzupełnienia z modelu terenu ' +
            'lub pomiarem w terenie.', { italics: true, color: TERRACOTTA })
        : tooFarApart
        ? P('Uwaga: sektory w tym pliku leżą zbyt daleko od siebie, żeby oszacować ekspozycję ścian ' +
            'z samych punktów GPX – dopasowana płaszczyzna opisywałaby nachylenie całego masywu, ' +
            'a nie konkretnej ściany. Kolumna „Eksp.” pozostaje pusta, a kolumna „Słońce” podaje ' +
            'jedynie długość dnia. Do policzenia z numerycznego modelu terenu.',
            { italics: true, color: TERRACOTTA })
        : estimated
        ? P('Uwaga: ekspozycja została oszacowana z geometrii punktów GPX, bez numerycznego modelu terenu. ' +
            'Wartości należy traktować jako wskazówkę, nie pomiar – i zweryfikować w terenie.',
            { italics: true, color: TERRACOTTA })
        : P('Ekspozycja, nachylenie i zasłonięcie horyzontu policzone z lidarowego modelu terenu.', { italics: true }),

      H('Dojazd', HeadingLevel.HEADING_2),
      cfg.approach ? P(cfg.approach) : TODO('Dojazd samochodem i koleją, parking, punkt startu i czas podejścia do każdej grupy.'),

      H('Podział rejonu', HeadingLevel.HEADING_2),
      P(`Podział na ${clusters.length} grup${clusters.length === 1 ? 'ę' : 'y'} wynika z analizy przestrzennej punktów GPX. ` +
        (cfg.groups ? '' : 'Nazwy grup są robocze – do zastąpienia nazewnictwem lokalnym.')),

      ...clusters.flatMap(c => {
        const kids = [
          H(`${c}. ${groupNames[c] || 'Grupa ' + c}`, HeadingLevel.HEADING_3),
        ];
        if (groupNotes[c]) kids.push(P(groupNotes[c]));
        const ss = sunSummary(c);
        if (ss) kids.push(P(ss, { size: 19, color: SAGE }));
        kids.push(sectorTable(c));
        kids.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
        return kids;
      }),

      new Paragraph({ children: [new PageBreak()] }),

      H('Weekendowy Gotowiec', HeadingLevel.HEADING_2),
      cfg.weekend ? P(cfg.weekend) : TODO('Plan na dwa dni: wybór dróg, kolejność sektorów, warianty pogodowe.'),
      P('Wskazówka z danych: przy planowaniu dnia warto zaczynać od sektorów o najwcześniejszym ' +
        'nasłonecznieniu i kończyć na tych, które łapią słońce popołudniem – kolejność wynika wprost ' +
        'z kolumny „Słońce”.', { size: 19 }),

      H('Dokumentacja 3D (Vertical Moment)', HeadingLevel.HEADING_2),
      P('Rejon objęty planem dokumentacji fotogrametrycznej. Modele 3D i topo ortho powstają ' +
        'z tego samego pliku źródłowego co niniejsze tabele.'),
      TODO('Numer i data lotu, link do modelu 3D dla każdego sektora.'),

      ...((cfg.history || []).length ? [
        new Paragraph({ children: [new PageBreak()] }),
        H(cfg.history_title || 'Historia', HeadingLevel.HEADING_2),
        ...(cfg.history_intro ? [P(cfg.history_intro)] : []),
        ...cfg.history.flatMap(h => [
          H(h.title, HeadingLevel.HEADING_3),
          ...(Array.isArray(h.body) ? h.body : [h.body]).map(b => P(b)),
          ...(h.todo ? [TODO(h.todo)] : [])
        ])
      ] : []),

      ...((cfg.sources || []).length ? [
        H('Źródła', HeadingLevel.HEADING_2),
        P('Rozdział historyczny opracowano na podstawie poniższych źródeł. Daty i nazwiska ' +
          'wymagają potwierdzenia w literaturze przed drukiem.', { size: 18, italics: true }),
        ...cfg.sources.map(BUL)
      ] : []),

      H('Lista kontrolna przed drukiem', HeadingLevel.HEADING_2),
      ...[
        'Zweryfikować nazwy sektorów z lokalnym przewodnikiem',
        'Uzupełnić wyceny i liczbę dróg',
        'Zweryfikować ekspozycje w terenie (kolumna „Eksp.”)',
        'Sprawdzić okresowe zakazy wspinania (ochrona ptaków, obszary chronione)',
        'Potwierdzić status prawny dostępu i parkingu',
        'Zweryfikować rodzaj skały i podać źródło'
      ].map(BUL)
    ]
  }]
});

Packer.toBuffer(doc).then(b => { fs.writeFileSync(OUT, b); console.log('wrote ' + OUT); });
