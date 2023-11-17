const fs = require ('fs/promises');
const opentype = require ("./fonts/opentype.js");
const kage = require ("./fonts/kage.js");
const { PaperScope, Path, Point, Raster, Color } = require ('paper-jsdom');
let fetch;

let serverPrefix = process.env.SWDATA_URL_PREFIX;
if (!serverPrefix) throw new Error ("No environment variable |SWDATA_URL_PREFIX|");

const loadJSON = async path => {
  return JSON.parse (await fs.readFile (path));
}; // loadJSON

const loadJSONOrEmpty = async path => {
  try {
    return JSON.parse (await fs.readFile (path));
  } catch (e) {
    return {};
  };
}; // loadJSONOrEmpty

const loadText = async path => {
  return await fs.readFile (path, "utf-8");
}; // loadText

const loadOTF = async path => {
  const read = await fs.readFile (path);
  return opentype.parse (read.buffer, {});
}; // loadOTF

const writeBinaryFile = (path, ab) => {
  console.log ("Writing |"+path+"|...");
  return fs.writeFile (path, new DataView (ab));
}; // writeBinaryFile

const writeJSONFile = (path, obj) => {
  console.log ("Writing |"+path+"|...");
  return fs.writeFile (path, JSON.stringify (obj));
}; // writeJSONFile

const getSourceFont = async path => {
  let ot = await loadOTF (path);
  
  let unicodeCmap = ot.tables.cmap.subtables.filter
      (_ => _.platformID === 3 && _.encodingID === 10) [0];
  let uvsCmap = ot.tables.cmap.subtables.filter
      (_ => _.platformID === 0 && _.encodingID === 5 && _.format === 14) [0];
  uvsCmap.parse ();

  return {
    key: path,
    
    unicodeCmap, uvsCmap, glyphs: ot.glyphs,
    
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

let cached = {};

const fetchJSON = async function (url) {
  let run = async () => fetch (url).then (res => {
    if (res.status === 404) return {};
    if (res.status !== 200) throw res;
    return res.json ();
  });
  let n = 0;
  while (n < 10) {
    try {
      return await run ();
    } catch (e) {
      console.log ("Need retry: ", n);
      n++;
    }
  }
  throw new Error ("Too many errors: ", url);
}; // fetchJSON
const fetchJSONL = function (url) {
  return fetch (url).then (res => {
    if (res.status === 404) return {};
    if (res.status !== 200) throw res;
    return res.text ().then (text => {
      var obj = {};
      text.split (/\n/).forEach (line => {
        if (line) {
          var json = JSON.parse (line);
          obj[json[0]] = json[1];
        }
      });
      return obj;
    });
  });
}; // fetchJSONL

const charToIndex = function (index, char) {
  var len = [...char].length;

  var m;
  if (len === 1) {
    var c = char.codePointAt (0);
    if (c <= 0x10FFFF) {
      return 1 + Math.floor (c / 0x200);
    }
  } else if (len == 2) {
    var [c1, c2] = [...char];
    var code1 = c1.codePointAt (0);
    var x = (code1 % 2) ? 0x100 : 0;
    var vs = c2.codePointAt (0);
    if (0xE0100 <= vs && vs <= 0xE01FF) {
      return vs - 0xE0000 + x;
    } else {
      return 0xFF;
    }
  } else if (m = char.match (index.prefixPattern)) {
    return index.prefix_to_index[m[1]];
  } else if (/^:u-/.test (char)) {
    return 0x300;
  } else if (3 <= len && len <= 10) {
    return 0x400 - 2 + len;
  }

  return 0;
}; // charToIndex

const relDataLoad = async function (dsKey) {
  var k = 'dsIndex' + dsKey;
  var index = cached[k];
  if (!index) {
    index = cached[k] = await fetchJSON (serverPrefix + 'charrels/' + dsKey + '/merged-rels/index.json');
    index.prefixPattern = new RegExp ('^:(?:gw-(?:[a-z0-9]+_|)|)(' + index.prefix_pattern + ')');
    index.relDefs = [];
    Object.keys (index.rel_types).forEach (rel => {
      index.relDefs[index.rel_types[rel].id] = index.rel_types[rel];
      index.rel_types[rel].key = rel;
    });
  }
  return index;
}; // relDataLoad

const getRels = async function (dsKey, char) {
  var index = await relDataLoad (dsKey);
  
  var fileIndex = charToIndex (index, char);
  var part = await fetchJSONL (serverPrefix + 'charrels/' + dsKey + '/merged-rels/part-' + fileIndex + '.jsonl');

  return part[char] || {};
}; // getRels

const loadGlyphIndex = async function () {
  var k = 'fontGlyphIndex';
  var index = cached[k];
  if (!index) {
    index = cached[k] = await fetchJSON (serverPrefix + "charrels/glyphs/gwglyphs/index.json");
    index.prefixPattern = new RegExp ('^(' + index.prefix_pattern + ')');
  }
  return index;
}; // loadGlyphIndex

const glyphNameToFileIndex = function (index, char) {
  let m;
  if (m = char.match (index.prefixPattern)) {
    return index.prefix_to_index[m[1]];
  }

  if (m = char.match (/([0-9a-f]+)/)) {
    return 0x100 + parseInt (m[1], 16) % 10;
  }
  
  return 0;
}; // glyphNameToFileIndex

const loadGlyphSource = async glyphName => {
  var index = await loadGlyphIndex ();
  var fileIndex = glyphNameToFileIndex (index, glyphName);
  var part = await fetchJSONL (serverPrefix + 'charrels/glyphs/gwglyphs/part-' + fileIndex + '.jsonl');

  var sd = part[glyphName];
  if (sd) return sd;

  var index = await relDataLoad ('glyphs');
  let rds = index.relDefs;

  // XXX nesting depth
  var rr = await getRels ('glyphs', ':gw-' + glyphName);
  for (let c2 in rr) {
    var relIds = rr[c2];
    for (let k = 0; k < relIds.length; k++) {
      var rel = rds[relIds[k]];
      if (rel.key === 'glyphwiki:alias') {
        return loadGlyphSource (c2.replace (/^:gw-/, ''));
      }
    }
  }

  return null;
}; // loadGlyphSource

let GWSupGlyphs = {};
const loadGWSupGlyphs = async () => {
  let text = await loadText ('gwmissing-extracted.txt');
  text.split (/\n/).forEach (line => {
    let m = line.match (/^\s*(\S+)\s*\|\s*\S+\s*\|\s*(\S+)$/);
    if (!m) {
      if (! line.length) return;
      throw new Error ("Bad line |"+line+"|");
    }
    GWSupGlyphs[m[1].replace (/\\@/g, '@')] = m[2];
  });
}; // loadGWSupGlyphs

let GWMissingGlyphs = {};
const getGlyphSVG = (name, replace, defs) => {
  let hasError = false;
  return kage.getKageGlyphSVG (async (n) => {
    if (GWSupGlyphs[n]) GWSupGlyphs[n];
    let q = n.split (/\@/);
    let s = replace[q[0]] || q[0];
    let gs = defs[s] || await loadGlyphSource (s);
    if (!gs) {
      console.log ("no glyph data: ", s);
      GWMissingGlyphs[n] = name;
      hasError = true;
    }
    return gs;
  }, name).then (r => {
    if (hasError) return null;
    return r;
  });
}; // getGlyphSVG

(async () => {
  fetch = (await import ('node-fetch')).default;
  
  const generate = async function (sf, code, opts) {
    const df = createDestFont (sf);

    if (opts.notdef) {
      df.glyphs.push (sf.glyphs.get (0));
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
      if (offset > 2**24-1) throw new Error ("Offset overflow: " + offset);

      let ab = new ArrayBuffer (2 + offsets.length * 7 + charstringsLength);
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
      }

      json.legal = df.legal;

      await writeBinaryFile (opts.datPath, ab);
      await writeTextFile (opts.jsonPath, JSON.stringify (json));
    }
  }; // generate

  let GWGlyphCache = {};
  let GWGlyphAdded = 0;
  const loadGWGlyphCache = async (opts) => {
    GWGlyphCache = await loadJSONOrEmpty ('fonts/gwglyphcache.json');
    if (!opts.allowEmpty && !Object.keys (GWGlyphCache).length) {
      throw new Error ("gwglyphcache.json is empty");
    }
  };
  const saveGWGlyphCache = () => {
    return writeJSONFile ('fonts/gwglyphcache.json', GWGlyphCache);
  };

  const saveGWMissingGlyphs = () => {
    return writeJSONFile ('fonts/gwmissingglyphs.json', GWMissingGlyphs);
  };

  let SWGGlyphDefs;
  const getGlyphPath = async glyphName => {
    let pathData = GWGlyphCache[glyphName];
    if (!pathData) {
      let svg;
      if (/^g[0-9]+$/.test (glyphName)) {
        let glyph = SWGGlyphDefs.glyphs[glyphName];
        if (!glyph) {
          console.log ("no glyph data: ", glyphName);
          GWMissingGlyphs[glyphName] = glyphName;
          return null;
        }
        svg = await getGlyphSVG (glyph.base, glyph.replace || {}, glyph.redefine || {});
      } else {
        svg = await getGlyphSVG (glyphName, {}, {});
        if (!svg) return null;
      }
      
      const paper = new PaperScope;
      paper.setup ();

      let paperPath = new paper.Path;
      if (svg.svg.match (/<g fill="black">\s*<\/g>/)) {
        //
      } else {
        svg.svg.match (/(?<=<polygon points=")[^"]+(?=")/g).forEach (points => {
          let pp = points.split (/\s+/).filter (_ => _.length).map (_ => _.split (/,/));
          let pp1 = new paper.Path (`M ${pp[0]} L ${pp.slice (1).join (' ')} Z`);
          paperPath = paperPath.unite (pp1);
        });
      }
      
      pathData = paperPath.pathData;
      GWGlyphCache[glyphName] = pathData;
      if ((GWGlyphAdded++ % 100) == 0) saveGWGlyphCache ();
    } // pathData
    
    let path = new opentype.Path;
    pathData = pathData.replace (/([A-Za-z])/g, ' $1 ');
    let segments = pathData.split (/[,\s]+/).filter (_ => _.length);
    let cX;
    let cY;
    while (segments.length) {
      let cmd = segments.shift ();
      if (cmd === 'M') {
        cX = parseFloat (segments.shift ());
        cY = parseFloat (segments.shift ());
        path.moveTo (cX, cY);
      } else if (cmd === 'L') {
        cX = parseFloat (segments.shift ());
        cY = parseFloat (segments.shift ());
        path.lineTo (cX, cY);
      } else if (cmd === 'l') {
        cX += parseFloat (segments.shift ());
        cY += parseFloat (segments.shift ());
        path.lineTo (cX, cY);
      } else if (cmd === 'h') {
        cX += parseFloat (segments.shift ());
        path.lineTo (cX, cY);
      } else if (cmd === 'v') {
        cY += parseFloat (segments.shift ());
        path.lineTo (cX, cY);
      } else if (cmd === 'Z' || cmd === 'z') {
        path.closePath ();
      } else {
        throw new Error (cmd);
      }
    }

    return path;
  }; // getGlyphPath
  
  const createGlyph = async (df, glyphName) => {
    let path = await getGlyphPath (glyphName);
    if (!path) path = new opentype.Path;
    
    var glyph = new opentype.Glyph ({
      name: glyphName,
      advanceWidth: 200,
      path,
    });
    glyph.path = glyph.getPath (0, 0 + df.upem + df.descender, df.upem, {
      xScale: (df.upem / glyph.advanceWidth),
      yScale: (df.upem / glyph.advanceWidth),
    });
    glyph.advanceWidth = df.upem;
    
    return glyph;
  }; // createGlyph
  
  const copyGlyphs = async (df, list) => {
    let all = list.length;
    let done = 0;
    for (let glyphName of list) {
      if (done % 10 == 0) console.log (done, " / ", all);
      let glyph = await createGlyph (df, glyphName);
      if (glyph) df.glyphs.push (glyph);
      done++;
    }
  }; // copyGlyphs

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
  
  const ajSF = await getSourceFont ('fonts/ajm.ttf');
  await loadGWSupGlyphs ();
  SWGGlyphDefs = await loadJSON ("fonts/glyphs.json");
  await generate (ajSF, async df => {
    await loadGWGlyphCache ({allowEmpty: false});

    const json = await loadJSON ("fonts/swcf-hanmin-mapping.json");
    let glyphList = generateGWGlyphList (json);
    await copyGlyphs (df, glyphList);

    await saveGWGlyphCache ();
    await saveGWMissingGlyphs ();

    df.legal = {
      copyright: "See <https://glyphwiki.org/wiki/GlyphWiki:%e3%83%87%e3%83%bc%e3%82%bf%e3%83%bb%e8%a8%98%e4%ba%8b%e3%81%ae%e3%83%a9%e3%82%a4%e3%82%bb%e3%83%b3%e3%82%b9>",
    };
  }, {
    notdef: true,
    familyName: 'gwglyphs',
    otfPath: 'fonts/gwglyphs.ttf',
  });

}) ();

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
