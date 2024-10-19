const fs = require ('fs/promises');
const opentype = require ("./namelogos/opentype.js");

const getOT = async path => {
  const read = await fs.readFile (path);
  const ab = read.buffer;
  return opentype.parse (ab, {});
}; // getOT

const getSourceFont = ot => {
  let unicodeCmap = ot.tables.cmap.subtables.filter
      (_ => _.platformID === 3 && _.encodingID === 10) [0];
  return {
    unicodeCmap, glyphs: ot.glyphs,
    
    upem: ot.unitsPerEm,
    ascender: ot.tables.os2.sTypoAscender,
    descender: ot.tables.os2.sTypoDescender,

    legal: {
      copyright: (ot.names.copyright || {}).en,
      license: (ot.names.license || {}).en,
      licenseURL: (ot.names.licenseURL || {}).en,
      trademark: (ot.names.trademark || {}).en,
    },
  };
}; // getSourceFont

const createDestFont = (sf) => {
  let df = {
    glyphs: [],
    baseGlyphRecords: [],
    layerRecords: [],
    added: [],

    upem: sf.upem,
    ascender: sf.ascender,
    descender: sf.descender,

    legal: sf.legal,
  };
  return df;
}; // createDestFont

(async (key) => {

  let copy = (sf, df, code) => {
    var glyphId = sf.unicodeCmap.glyphIndexMap[code];
    if (!glyphId) return;
    var glyph = sf.glyphs.get (glyphId);
    if (!df.added[glyphId]) {
      df.unicodeCmap.glyphIndexMap[code] = df.glyphs.length;
      df.glyphs.push (glyph);
      if (sf.upem !== df.upem) {
        glyph.path = glyph.getPath(0, 0, df.upem, {
          xScale: (df.upem / sf.upem),
          yScale: -1 * (df.upem / sf.upem),
        });
        glyph.advanceWidth *= df.upem / sf.upem;
      }
      df.added[glyphId] = true;
    }
  }; // copy

  async function generate (sf, code, opts, def) {
    const df = createDestFont (sf);
    df.unicodeCmap = {glyphIndexMap: {}};

    if (opts.notdef) {
      df.glyphs.push (sf.glyphs.get (0));
    }
    if (opts.ascii) {
      for (let code = 0x0020; code <= 0x007E; code++) {
        copy (sf, df, code);
      }
    }
    await code (df);

    let dummyGlyph1 = new opentype.Glyph ({
      name: "dummy1",
      advanceWidth: 0,
      path: df.unicodeCmap.glyphIndexMap[0x0020].path,
    });
    df.glyphs.push (dummyGlyph1);
    let gidDG1 = df.glyphs.length-1;

    var gidL = df.unicodeCmap.glyphIndexMap[0x004C];
    var gidA = df.unicodeCmap.glyphIndexMap[0x0041];
    var gida = df.unicodeCmap.glyphIndexMap[0x0061];
    var gidT = df.unicodeCmap.glyphIndexMap[0x0054];
    var gidE = df.unicodeCmap.glyphIndexMap[0x0045];
    var gide = df.unicodeCmap.glyphIndexMap[0x0065];
    var gidX = df.unicodeCmap.glyphIndexMap[0x0058];

    {
      let glyphA = df.glyphs[gidA];
      let path = glyphA.getPath(0, 0, df.upem, {
        xScale: def.aScale,
        yScale: -def.aScale,
      });
      let glyphA2 = new opentype.Glyph ({
        name: "a2",
        advanceWidth: glyphA.advanceWidth * 0.7,
        path,
      });
      df.glyphs.push (glyphA2);
    }
    let gidA2 = df.glyphs.length-1;

    {
      let font = new opentype.Font ({
        familyName: opts.familyName,
        styleName: def.style || 'Regular',

        license: sf.legal.license,
        licenseURL: sf.legal.licenseURL,
        copyright: sf.legal.copyright,
        trademark: sf.legal.trademark,

        unitsPerEm: df.upem,
        ascender: df.ascender,
        descender: df.descender,
        glyphs: df.glyphs,
      });

      font.tables.gsub = {
        version: 1,
        scripts: [{tag: "DFLT", script: {defaultLangSys: {
          reserved: 0,
          reqFeatureIndex: 0xFFFF,
          featureIndexes: [0],
        }, langSysRecords: []}}],
        features: [{
          tag: 'ccmp',
          feature: {lookupListIndexes: [1], featureParams: 0},
        }],
        lookups: [{
          lookupType: 2,
          lookupFlag: 0,
          subtables: [{
            substFormat: 1,
            coverage: {format: 1, glyphs: [gida, gide]},
            sequences: [
              [gidDG1, gidA2],
              [gidDG1, gidE],
            ],
          }],
        }, {
          lookupType: 6,
          lookupFlag: 0,
          subtables: [{
            substFormat: 3,
            backtrackCoverage: [{format: 1, glyphs: [gidL]}],
            inputCoverage: [{format: 1, glyphs: [gida]},
                            {format: 1, glyphs: [gidT]},
                            {format: 1, glyphs: [gide]}],
            lookaheadCoverage: [{format: 1, glyphs: [gidX]}],
            lookupRecords: [{sequenceIndex: 0, lookupListIndex: 0},
                            {sequenceIndex: 3, lookupListIndex: 0}],
          }, {
            substFormat: 3,
            backtrackCoverage: [{format: 1, glyphs: [gidT]}],
            inputCoverage: [{format: 1, glyphs: [gide]}],
            lookaheadCoverage: [{format: 1, glyphs: [gidX]}],
            lookupRecords: [{sequenceIndex: 0, lookupListIndex: 0}],
          }],
        }],
      };
      font.tables.gpos = {
        version: 1,
        scripts: [{tag: "DFLT", script: {defaultLangSys: {
          reserved: 0,
          reqFeatureIndex: 0xFFFF,
          featureIndexes: [0],
        }, langSysRecords: []}}],
        features: [{
          tag: 'ccmp',
          feature: {lookupListIndexes: [1], featureParams: 0},
        }],
        lookups: [{
          lookupType: 1,
          lookupFlag: 0,
          subtables: [{
            posFormat: 1,
            coverage: {format: 1, glyphs: [gidE]},
            valueFormat: 0x0001 | 0x0002 | 0x0004,
            value: {yPlacement: -0.2153 * df.upem,
                    xPlacement: -0.1667 * df.upem,
                    xAdvance: (-0.1667 + -def.eRight) * df.upem},
          }, {
            posFormat: 1,
            coverage: {format: 1, glyphs: [gidA2]},
            valueFormat: 0x0001 | 0x0002 | 0x0004,
            value: {xPlacement: -def.aLeft * df.upem,
                    yPlacement: (1 - def.aScale) * df.upem + df.descender * 0.7 / def.aDeltaYFactor,
                    xAdvance: (-def.aLeft + -def.aRight) * df.upem},
          }],
        }, {
          lookupType: 8,
          lookupFlag: 0,
          subtables: [{
            posFormat: 3,
            backtrackCoverage: [{format: 1, glyphs: [gidDG1]}],
            inputCoverage: [{format: 1, glyphs: [gidE, gidA2]}],
            lookaheadCoverage: [],
            lookupRecords: [{sequenceIndex: 0, lookupListIndex: 0}],
          }],
        }],
      };

      console.log ("Writing |"+opts.otfPath+"|...");
      await fs.writeFile (opts.otfPath, new DataView (font.toArrayBuffer ()));
    }
  } // generate

  let def = {
    serif: {
      name: 'NameLogos Serif',
      outPath: 'namelogosserif.ttf',
      inPath: "data/notoserif/files/NotoSerif_wdth_wght_.ttf",
      aScale: 0.65,
      aDeltaYFactor: 2,
      aLeft: 0.36,
      aRight: 0.15,
      eRight: 0.125,
    },
    serifitalic: {
      name: 'NameLogos Serif',
      style: 'Italic',
      outPath: 'namelogosserif-italic.ttf',
      inPath: "data/notoserif/files/NotoSerif-Italic_wdth_wght_.ttf",
      aScale: 0.65,
      aDeltaYFactor: 2,
      aLeft: 0.32,
      aRight: 0.15,
      eRight: 0.125,
    },
    sans: {
      name: 'NameLogos Sans',
      outPath: 'namelogossans.ttf',
      inPath: "data/notosans/files/NotoSans_wdth_wght_.ttf",
      aScale: 0.7,
      aDeltaYFactor: 2,
      aLeft: 0.30,
      aRight: 0.11,
      eRight: 0.125,
    },
    sansitalic: {
      name: 'NameLogos Sans',
      style: 'Italic',
      outPath: 'namelogossans-italic.ttf',
      inPath: "data/notosans/files/NotoSans-Italic_wdth_wght_.ttf",
      aScale: 0.7,
      aDeltaYFactor: 2,
      aLeft: 0.25,
      aRight: 0.11,
      eRight: 0.05,
    },
    haranoajim: {
      name: 'NameLogos Serif 2',
      outPath: 'namelogosserif2.ttf',
      inPath: "data/haranoajim/files/HaranoAjiMincho-Regular.otf",
      aScale: 0.65,
      aDeltaYFactor: 0.8,
      aLeft: 0.36,
      aRight: 0.15,
      eRight: 0.125,
    },
  }[key];
  if (!def) throw new Error ("Bad key |"+key+"|");

  console.log ("Loading...");
  let ajOT = await getOT (def.inPath);
  let ajSF = getSourceFont (ajOT);

  console.log ("Processing...");

  await generate (ajSF, (df) => {
  }, {
    notdef: true,
    ascii: true,
    familyName: def.name,
    otfPath: def.outPath,
  }, def);
 
}) (process.argv[2]);

/*

Copyright 2024 Wakaba <wakaba@suikawiki.org>.

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but
WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public
License along with this program.  If not, see
<https://www.gnu.org/licenses/>.

*/
