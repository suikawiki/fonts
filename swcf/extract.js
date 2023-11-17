const fs = require ('fs/promises');
const opentype = require ("./fonts/opentype.js");

const loadJSON = async path => {
  return JSON.parse (await fs.readFile (path));
}; // loadJSON

const loadOTF = async path => {
  const read = await fs.readFile (path);
  return opentype.parse (read.buffer, {});
}; // loadOTF

const writeBinaryFile = (path, ab) => {
  console.log ("Writing |"+path+"|...");
  return fs.writeFile (path, new DataView (ab));
}; // writeBinaryFile

const writeTextFile = (path, text) => {
  console.log ("Writing |"+path+"|...");
  return fs.writeFile (path, text);
}; // writeTextFile

(async () => {

  const getSourceFont = async (path, key) => {
    let ot = await loadOTF (path);
  
    let unicodeCmap = ot.tables.cmap.subtables.filter
        (_ => _.platformID === 3 && _.encodingID === 10) [0] ||
                      ot.tables.cmap.subtables.filter
        (_ => _.platformID === 3 && _.encodingID === 1) [0];
    let uvsCmap = ot.tables.cmap.subtables.filter
        (_ => _.platformID === 0 && _.encodingID === 5 && _.format === 14) [0];
    if (uvsCmap) {
      uvsCmap.parse ();
    } else {
      uvsCmap = {varGlyphIndexMap: {}};
    }
    
    return {
      key,
      
      unicodeCmap, uvsCmap, glyphs: ot.glyphs,
      names: (ot.tables.post || {}).glyphIDToName || [],
      
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
      added: [],

      upem: sf.upem,
      ascender: sf.ascender,
      descender: sf.descender,
      
      legal: sf.legal,
    };
    return df;
  }; // createDestFont

  const mergeLegal = function () {
    let legal = {};

    for (let l of arguments) {
      for (let n in l) {
        let v = l[n] || '';
        if (v.match (/^\s*$/)) continue;
        legal[n] = legal[n] || [];
        legal[n].push (v);
      }
    }

    for (let k in legal) {
      let found = {};
      legal[k] = legal[k].filter (_ => {
        if (found[_]) {
          return false;
        } else {
          found[_] = true;
          return true;
        }
      });
    }

    if (legal.licenseURL && legal.licenseURL.length > 1) {
      legal.license = legal.license || [];
      legal.license = legal.license.concat (legal.licenseURL);
      delete legal.licenseURL;
    }

    for (let k in legal) {
      legal[k] = legal[k].join ("\n\n");
    }

    return legal;
  }; // mergeLegal
  
  const copyByGlyphId = (sf, df, glyphId) => {
    var glyph = sf.glyphs.get (glyphId);
    if (!df.added[sf.key + ',' + glyphId]) {
      df.glyphs.push (glyph);
      glyph.unicodes = [];
      glyph.unicode = null;
      if (sf.upem !== df.upem) {
        let x = 0;
        let y = -sf.descender * (df.upem / sf.upem) + df.descender;
        glyph.path = glyph.getPath (x, y, df.upem, {
          xScale: (df.upem / sf.upem),
          yScale: -1 * (df.upem / sf.upem),
        });
        glyph.advanceWidth *= df.upem / sf.upem;
      }
      df.added[sf.key + ',' + glyphId] = true;
    }
    return glyph;
  }; // copyByGlyphId
  const copyByGlyphName = (sf, df, glyphName) => {
    let glyphId = sf.names.indexOf (glyphName);
    if (glyphId === -1) return null;
    return copyByGlyphId (sf, df, glyphId);
  }; // copyByGlyphName
  const copyByCode = (sf, df, code) => {
    let glyphId = sf.unicodeCmap.glyphIndexMap[code];
    if (!glyphId) return null;
    return copyByGlyphId (sf, df, glyphId);
  }; // copyByCode
  const copyByVSCode = (sf, df, code1, code2) => {
    let gid = (sf.uvsCmap.varGlyphIndexMap[code2] || [])[code1];
    if (gid === -1) {
      return copyByCode (sf, df, code1);
    } else if (gid) {
      return copyByGlyphId (sf, df, gid);
    } else {
      return null;
    }
  }; // copyByVSCode
  const copyByGWGlyphName = (sf, df, glyphName, gwGlyphList) => {
    let i = gwGlyphList.indexOf (glyphName);
    if (i === -1) throw new Error ('Unknown glyph name |'+glyphName+'|');
    return copyByGlyphId (sf, df, i + 1);
  }; // copyByGWGlyphName
  
  const copyByGlyphKey = (sf, df, v, gwGlyphList) => {
    let [w, x] = v.split (/:/);
    if (sf.key === 'nnt') {
      if (sf.key === w) {
        let glyph = copyByGlyphId (sf, df, parseInt (x));
        return glyph;
      } else {
        return null;
      }
    } else if (sf.key === 'uk1' || sf.key === 'uk2') {
      if (sf.key === w) {
        return copyByCode (sf, df, parseInt (x));
      } else {
        return null;
      }
    } else if (sf.key === 'cns0' || sf.key === 'cns2' || sf.key === 'cns15') {
      let code = parseInt (x, 16);
      if (w === 'cns' && 0x0000 <= code && code <= 0xFFFF) {
        return copyByCode (sf, df, code);
      } else if (w === 'cns' && 0x20000 <= code && code <= 0x2FFFF) {
        return copyByCode (sf, df, code);
      } else if (w === 'cns' && 0xF0000 <= code && code <= 0xFFFFF) {
        return copyByCode (sf, df, code);
      } else {
        return null;
      }
    } else if (sf.key === 'aj') {
      let m = v.match (/^shs([0-9]+)$/);
      if (m) {
        return copyByGlyphId (sf, df, parseInt (m[1]));
      } else {
        return null;
      }
    } else if (sf.key === "akr") {
      let m = v.match (/^akr:([0-9]+)$/);
      if (m) {
        return copyByGlyphId (sf, df, parseInt (m[1]));
      } else {
        return null;
      }
    } else if (sf.key === "bsh") {
      let m = v.match (/^bsh:([0-9]+)$/);
      if (m) {
        return copyByGlyphId (sf, df, parseInt (m[1]));
      } else {
        return null;
      }
    } else if (sf.key === 'mj') {
      let m = v.match (/^MJ[0-9]+$/);
      if (m) {
        return copyByGlyphName (sf, df, v.toLowerCase ());
      } else {
        return null;
      }
    } else if (sf.key === 'gw') {
      if (v.match (/^(?!shs[0-9]+$)[a-z][a-z0-9_-]+$/)) {
        return copyByGWGlyphName (sf, df, v, gwGlyphList);
      } else {
        return null;
      }
    } else {
      throw new Error ('Bad sf.key |'+sf.key+'|');
    }
  }; // copyByGlyphKey
  
  const copyChars = (sf, df, json, mode, gwGlyphList) => {
    let copied = false;
    Object.keys (json.chars).sort ((a, b) => a < b ? -1 : +1).forEach (ucs => {
      let data = json.chars[ucs];
      if (mode !== data.category && !(data.more_categories && data.more_categories[mode])) return;

      let ucode = parseInt (ucs, 16);
      if (data.default) {
        let glyph = copyByGlyphKey (sf, df, data.default, gwGlyphList);
        if (glyph) {
          glyph.addUnicode (ucode);
          if (data.mark) glyph.isMark = true;
          copied = true;
        }
      }
      Object.keys (data.vs || {}).sort ((a, b) => a < b ? -1 : +1).forEach (ucs2 => {
        if (!data.vs[ucs2]) throw new Error (`Glyph for {ucs} {ucs2} not defined`);
        let ucode2 = parseInt (ucs2, 16);
        let glyph = copyByGlyphKey (sf, df, data.vs[ucs2], gwGlyphList);
        if (glyph) {
          glyph.addVS (ucode, ucode2);
          copied = true;
        }
      });
      Object.keys (data.ligature || {}).sort ((a, b) => a < b ? -1 : +1).forEach (ucs2 => {
        if (!data.ligature[ucs2]) throw new Error (`Glyph for {ucs} {ucs2} not defined`);
        let ucode2 = parseInt (ucs2, 16);
        let glyph = copyByGlyphKey (sf, df, data.ligature[ucs2], gwGlyphList);
        if (glyph) {
          if (!glyph.ligatures) glyph.ligatures = [];
          glyph.ligatures.push ([ucode, ucode2]);
          copied = true;
        }
      });
      Object.keys (data.zwjligature || {}).sort ((a, b) => a < b ? -1 : +1).forEach (ucs2 => {
        if (!data.zwjligature[ucs2]) throw new Error (`Glyph for {ucs} ZWJ {ucs2} not defined`);
        let ucode2 = parseInt (ucs2, 16);
        let glyph = copyByGlyphKey (sf, df, data.zwjligature[ucs2], gwGlyphList);
        if (glyph) {
          if (!glyph.ligatures) glyph.ligatures = [];
          glyph.ligatures.push ([ucode, 0x200D, ucode2]);
          copied = true;
        }
      });
    });
    return copied;
  }; // copyChars

  const generate = async function (sf, code, opts) {
    const df = createDestFont (sf);

    if (opts.notdef) {
      df.glyphs.push (sf.glyphs.get (0));
    }
    if (opts.ascii) {
      for (let code = 0x0020; code <= 0x007E; code++) {
        copyByCode (sf, df, code);
      }
    }
    await code (df);

    if (opts.otfPath) {
      const font = new opentype.Font({
        familyName: opts.familyName,
        styleName: 'Regular',

        license: df.legal.license,
        licenseURL: df.legal.licenseURL,
        copyright: df.legal.copyright,
        trademark: df.legal.trademark,

        unitsPerEm: df.upem,
        ascender: df.ascender,
        descender: df.descender,
        glyphs: df.glyphs,
      });

      await writeBinaryFile (opts.otfPath, font.toArrayBuffer ());
    }

    if (opts.datPath) {
      let json = {
        cmap: {},
        ligatures: [],
        marks: [],

        upem: df.upem,
        ascender: df.ascender,
        descender: df.descender,
      };

      let charstrings = [];
      let charstringsLength = 0;
      let offsets = [];
      let offset = 0;
      for (let i = 0; i < df.glyphs.length /* * 0+10 */; i++) {
        charstrings[i] = opentype.Glyph._makeCharString (df.glyphs[i]);
        charstringsLength += charstrings[i].length;
        offset += charstrings[i].length /* *0 + 4*/;
        offsets.push (offset);
      }
      if (offset > 2**32-1) throw new Error ("Offset overflow: " + offset);

      let ab = new ArrayBuffer (2 + offsets.length * 8 + charstringsLength);
      let a8 = new Uint8Array (ab);
      let a8Next = 0;
      a8[a8Next++] = (offsets.length >> 8) & 0xFF;
      a8[a8Next++] = offsets.length & 0xFF;
      for (let i = 0; i < offsets.length; i++) {
        let v1 = df.glyphs[i].advanceWidth;
        let v2 = df.glyphs[i].leftSideBearing;
        a8[a8Next++] = (v1 >> 8) & 0xFF;
        a8[a8Next++] = v1 & 0xFF;
        if (v2 >= 32768) v2 = -(2 * 32768 - v2);
        a8[a8Next++] = (v2 >> 8) & 0xFF;
        a8[a8Next++] = v2 & 0xFF;
      }
      for (let i = 0; i < offsets.length; i++) {
        a8[a8Next++] = (offsets[i] >> 24) & 0xFF;
        a8[a8Next++] = (offsets[i] >> 16) & 0xFF;
        a8[a8Next++] = (offsets[i] >> 8) & 0xFF;
        a8[a8Next++] = offsets[i] & 0xFF;
      }

      for (let i = 0; i < charstrings.length; i++) {
        for (let j = 0; j < charstrings[i].length; j++) {
          a8[a8Next++] = charstrings[i][j];
        }
      }

      for (let i = 0; i < df.glyphs.length; i++) {
        let glyph = df.glyphs[i];
        for (let j = 0; j < glyph.unicodes.length; j++) {
          if (!json.cmap[0]) json.cmap[0] = {};
          json.cmap[0][glyph.unicodes[j]] = i;
        }
        for (let j = 0; j < glyph.vses.length; j++) {
          let vs = glyph.vses[j][1];
          if (!json.cmap[vs]) json.cmap[vs] = {};
          json.cmap[vs][glyph.vses[j][0]] = i;
        }

        if (glyph.ligatures) for (let j = 0; j < glyph.ligatures.length; j++) {
          json.ligatures.push ([glyph.ligatures[j], i]);
        }

        if (glyph.isMark) {
          json.marks.push (i);
        }
      }

      json.legal = df.legal;
      if (df.ranges) json.ranges = df.ranges;

      await writeBinaryFile (opts.datPath, ab);
      await writeTextFile (opts.jsonPath, JSON.stringify (json));
    }
  }; // generate

  const generateGWGlyphList = (json) => {
    let glyphs = {};
    let putGlyph = glyph => {
      if (/^MJ|^shs|:/.test (glyph)) {
        //
      } else if (/^g[0-9]+$/.test (glyph)) {
        glyphs[glyph] = true;
      } else {
        glyphs[glyph] = true;
      }
    }; // putGlyph
    Object.values (json.chars).forEach (data => {
      if (data.default) putGlyph (data.default);
      Object.values (data.vs || {}).forEach (putGlyph);
      Object.values (data.ligature || {}).forEach (putGlyph);
      Object.values (data.zwjligature || {}).forEach (putGlyph);
    });
    return Object.keys (glyphs).sort ((a, b) => a < b ? -1 : +1);
  }; // generateGWGlyphList

  let sourceFonts = {
    p: [
      ["mj", 'fonts/mj.ttf'],
    ],
    q: [
      ["uk1", 'fonts/uk-1.ttf'],
      ["uk2", 'fonts/uk-2.ttf'],
      ["bsh", 'fonts/bsh.ttf'],
    ],
    r: [
      ["aj", 'fonts/ajm.ttf'],
      ["akr", 'fonts/akr.ttf'],
      ["cns0", 'fonts/cns-s0.ttf'],
      ["cns2", 'fonts/cns-s2.ttf'],
      ["cns15", 'fonts/cns-s15.ttf'],
    ],
    z: [
      ["nnt", 'fonts/nnt.ttf'],
      ["gw", 'fonts/gwglyphs.ttf'],
    ],
  };
  sourceFonts.s = sourceFonts.r;
  this.main = async function (mode) {
    const json = await loadJSON ("fonts/swcf-hanmin-mapping.json");

    let knownCategories = {
      p: true,
      q: true,
      r: true, s: true, rs: true,
      pqr: true, pq: true, pr: true, prs: true, ps: true,
      z: true, 
    };
    Object.keys (json._categories).forEach (cat => {
      if (!knownCategories[cat]) {
        throw new Error ("Unknown category |"+cat+"|");
      }
    });
    
    let glyphList = generateGWGlyphList (json);
    if (mode.length === 1) { // p, q, r, s
      if (!sourceFonts[mode]) throw new Error ("Bad mode |"+mode+"|");
      let sfs = await Promise.all (sourceFonts[mode].map (_ => getSourceFont (_[1], _[0])));
      let sfs2 = await Promise.all (sourceFonts.z.map (_ => getSourceFont (_[1], _[0])));
      await generate (sfs[0], async df => {
        let legals = {};
        sfs.concat (sfs2).forEach (sf => {
          if (copyChars (sf, df, json, mode, glyphList)) {
            legals[sf.key] = sf.legal;
          }
          if (mode === "s" && copyChars (sf, df, json, "rs", glyphList)) {
            legals[sf.key] = sf.legal;
          }
          if (mode === "s" && copyChars (sf, df, json, "z", glyphList)) {
            legals[sf.key] = sf.legal;
          }
        });
        df.legal = mergeLegal.apply (null, Object.values (legals));
      }, {
        notdef: true,
        //ascii: true,
        familyName: mode,
        //otfPath: 'fonts/hanmin/' + mode + '.ttf',
        datPath: 'fonts/hanmin/' + mode + '.dat',
        jsonPath: 'fonts/hanmin/' + mode + '.json',
      });
    } else if (mode.length === 4) { // pqr0, pqr1, pqr2
      let modeIndex = parseInt (mode.substring (3, 4));
      let modeKey = mode.substr (modeIndex, 1);
      let modeCat = mode.substring (0, 3);
      if (!sourceFonts[modeKey]) throw new Error ("Bad mode |"+mode+"|");
      let sfs0 = await Promise.all (sourceFonts[mode.substring (0, 1)].map (_ => getSourceFont (_[1], _[0])));
      let sfs = await Promise.all (sourceFonts[modeKey].map (_ => getSourceFont (_[1], _[0])));
      let sfs2 = modeIndex === 0 ? await Promise.all (sourceFonts.z.map (_ => getSourceFont (_[1], _[0]))) : [];
      await generate (sfs0[0], async df => {
        let legals = {};
        sfs.concat (sfs2).forEach (sf => {
          if (copyChars (sf, df, json, modeCat, glyphList)) {
            legals[sf.key] = sf.legal;
          }
          if (modeCat === "pqr") {
            if (copyChars (sf, df, json, "pq", glyphList)) {
              legals[sf.key] = sf.legal;
            }
            if (copyChars (sf, df, json, "pr", glyphList)) {
              legals[sf.key] = sf.legal;
            }
            if (copyChars (sf, df, json, "ps", glyphList)) {
              legals[sf.key] = sf.legal;
            }
            if (copyChars (sf, df, json, "prs", glyphList)) {
              legals[sf.key] = sf.legal;
            }
          }
        });
        df.legal = mergeLegal.apply (null, Object.values (legals));
        df.ranges = json.ranges[modeCat].split (/,/).map (_ => 'U+' + _).join (',');
        if (modeCat === "pqr") {
          ["pq", "pr", "ps", "pqr", "pqs", "prs", "pqrs"].forEach (mode => {
            if (!json.ranges[mode]) return;
            df.ranges += "," + json.ranges[mode].split (/,/).map (_ => 'U+' + _).join (',');
          });
        }
      }, {
        notdef: true,
        familyName: mode,
        datPath: 'fonts/hanmin/' + mode + '.dat',
        jsonPath: 'fonts/hanmin/' + mode + '.json',
      });
    } else {
      throw new Error ("Unknown mode: |"+mode+"|");
    }
  }; // main
 
}) ();

this.main (process.argv[2]);

/*

Copyright 2023 Wakaba <wakaba@suikawiki.org>.

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
