((self) => {

  let isNodeJS = ! (self && self.window);

  const log2 = v => Math.log (v) / Math.log (2) | 0;

  const checksum = (a8, srcOffset, srcLength) => {
    let sum = 0;
    for (let i = srcOffset; i < srcOffset + srcLength; i += 4) {
      sum += (a8[i] << 24) +
             (a8[i + 1] << 16) +
             (a8[i + 2] << 8) +
             (a8[i + 3]);
    }
    
    sum %= 2 ** 32;
    return sum;
  }; // checksum
  
  const createDestFont = () => {
    let df = {
      glyphCount: 0,

      // Filled later
      //upem: sf.upem,
      //ascender: sf.ascender,
      //descender: sf.descender,
      
      created: 0,
      modified: 0,

      //XXX
      xMin: 0,
      xMax: 0,
      yMin: 0,
      yMax: 0,
      
      hmtxBlocks: [],
      csOffsets: [1],
      csBlocks: [],
      csLength: 0,
      
      cmap: {},
      ligatures: [],
      marks: [],

      ranges: [],
      legal: "",
    };
    
    return df;
  }; // createDestFont

  let loadFile = null;
  if (isNodeJS) {
    const fs = require ('fs/promises');
    loadFile = path => fs.readFile (path);
  }

  const loadComponent = async (df, input, base) => {
    let [datA8, json] = await Promise.all ([
      input.datPath ? loadFile (input.datPath).then (_ => new Uint8Array (_.buffer)) : fetch (new URL (input.datURL, base)).then (async res => {
        if (res.status !== 200) throw res;
        if (input.datGzipped) {
          var ds = new DecompressionStream ('gzip');
          var rs = res.body.pipeThrough (ds);
          var reader = rs.getReader ();
          var values = [];
          while (true) {
            var {value, done} = await reader.read ();
            if (done) break;
            values.push (value);
          }
          var blob = new Blob (values);
          return blob.arrayBuffer ();
        } else {
          return res.arrayBuffer ();
        }
      }).then (_ => new Uint8Array (_)),
      input.jsonPath ? loadFile (input.jsonPath).then (JSON.parse) : fetch (new URL (input.jsonURL, base)).then (async res => {
        if (res.status !== 200) throw res;
        if (input.jsonGzipped) {
          var ds = new DecompressionStream ('gzip');
          var rs = res.body.pipeThrough (ds);
          var reader = rs.getReader ();
          var values = [];
          while (true) {
            var {value, done} = await reader.read ();
            if (done) break;
            values.push (value);
          }
          var blob = new Blob (values);
          return blob.text ().then (text => JSON.parse (text));
        } else {
          return res.json ();
        }
      }),
    ]);
    
    let datLength = (datA8[0] << 8) + datA8[1];
    let datHmtxStart = 2;
    let datOffsets = [];
    let datOffsetStart = 2 + datLength * 4;
    for (let i = 0; i < datLength; i++) {
      datOffsets.push ((datA8[datOffsetStart + i * 4] << 24) +
                       (datA8[datOffsetStart + i * 4 + 1] << 16) +
                       (datA8[datOffsetStart + i * 4 + 2] << 8) +
                        datA8[datOffsetStart + i * 4 + 3]);
    }
    let datCSStart = 2 + datLength * 8;
    let datCSLength = datOffsets[datOffsets.length - 1];
    
    df.hmtxBlocks.push ({
      a8: datA8,
      start: datHmtxStart,
      next: datOffsetStart,
    });
    let offsetDelta = df.csOffsets[df.csOffsets.length - 1];
    for (let i = 0; i < datOffsets.length; i++) {
      df.csOffsets.push (datOffsets[i] + offsetDelta);
    }
    df.csBlocks.push ({
      a8: datA8,
      offset: datCSStart,
      length: datCSLength,
    });
    df.csLength += datCSLength;
    let gidOffset = df.glyphCount;
    df.glyphCount += datLength;

    for (let c1 in json.cmap) {
      if (!df.cmap[c1]) df.cmap[c1] = {};
      for (let c2 in json.cmap[c1]) {
        if (!df.cmap[c1][c2]) df.cmap[c1][c2] = gidOffset + json.cmap[c1][c2];
      }
    }
    df.ligatures.push (json.ligatures.map (_ => [_[0], gidOffset + _[1]]));

    df.marks = df.marks.concat (json.marks.map (_ => gidOffset + _));

    df.legal += [
      json.legal.copyright,
      json.legal.license,
      json.legal.licenseURL,
      json.legal.trademark,
      '',
    ].filter (_ => _ != null).join ("\n\n");
    
    if (!df.upem) {
      df.upem = json.upem,
      df.ascender = json.ascender;
      df.descender = json.descender;
      df.xMax = df.upem;
      df.yMax = df.ascender;
      df.yMin = df.descender;
    }
    df.ranges.push (json.ranges);
  }; // loadComponent
  
  async function swComposeFont (opts) {
    let df = createDestFont ();

    for (let i = 0; i < opts.components.length; i++) {
      await loadComponent (df, opts.components[i], opts.baseURL);
    }

    let a8;
    let a8Next = 0;
    const a8tag = v => {
      a8[a8Next++] = v[0];
      a8[a8Next++] = v[1];
      a8[a8Next++] = v[2];
      a8[a8Next++] = v[3];
    };
    const a8u8 = v => {
      a8[a8Next++] = v;
    };
    const a8u16 = v => {
      a8[a8Next++] = (v >> 8) & 0xFF;
      a8[a8Next++] = v & 0xFF;
    };
    const a8s16 = v => {
      if (v >= 32768) v = -(2 * 32768 - v);
      a8[a8Next++] = (v >> 8) & 0xFF;
      a8[a8Next++] = v & 0xFF;
    };
    const a8u24 = v => {
      a8[a8Next++] = (v >> 16) & 0xFF;
      a8[a8Next++] = (v >> 8) & 0xFF;
      a8[a8Next++] = v & 0xFF;
    };
    const a8u32 = v => {
      a8[a8Next++] = (v >> 24) & 0xFF;
      a8[a8Next++] = (v >> 16) & 0xFF;
      a8[a8Next++] = (v >> 8) & 0xFF;
      a8[a8Next++] = v & 0xFF;
    };
    const a8ldt = v => {
      a8[a8Next++] = 0;
      a8[a8Next++] = 0;
      a8[a8Next++] = 0;
      a8[a8Next++] = 0;
      a8[a8Next++] = (v >> 24) & 0xFF;
      a8[a8Next++] = (v >> 16) & 0xFF;
      a8[a8Next++] = (v >> 8) & 0xFF;
      a8[a8Next++] = v & 0xFF;
    };
    a8xn = v => {
      if (v >= -107 && v <= 107) {
        a8[a8Next++] = v + 139;
      } else if (v >= 108 && v <= 1131) {
        v = v - 108;
        a8[a8Next++] = (v >> 8) + 247;
        a8[a8Next++] = v & 0xFF;
      } else if (v >= -1131 && v <= -108) {
        v = -v - 108;
        a8[a8Next++] = (v >> 8) + 251;
        a8[a8Next++] = v & 0xFF;
      } else if (v >= -32768 && v <= 32767) {
        a8[a8Next++] = 28
        a8[a8Next++] = (v >> 8) & 0xFF;
        a8[a8Next++] = v & 0xFF;
      } else {
        a8[a8Next++] = 29;
        a8[a8Next++] = (v >> 24) & 0xFF;
        a8[a8Next++] = (v >> 16) & 0xFF;
        a8[a8Next++] = (v >> 8) & 0xFF;
        a8[a8Next++] = v & 0xFF;
      }
    };
    a8x16 = v => {
      a8[a8Next++] = 28
      a8[a8Next++] = (v >> 8) & 0xFF;
      a8[a8Next++] = v & 0xFF;
    };
    a8x32 = v => {
      a8[a8Next++] = 29;
      a8[a8Next++] = (v >> 24) & 0xFF;
      a8[a8Next++] = (v >> 16) & 0xFF;
      a8[a8Next++] = (v >> 8) & 0xFF;
      a8[a8Next++] = v & 0xFF;
    };
    
    let tables = [];

  tables.push ({
    tag: 'name',
    length: 6 + 1 * 12 + df.legal.length * 2,
    write: () => {
      a8u16 (0); // version
      a8u16 (1); // count
      a8u16 (6 + 1 * 12); // storageOffset

      a8u16 (3); // platformID: Windows
      a8u16 (1); // encodingID: UCS-2
      a8u16 (0x0409); // languageID: Windows US English
      a8u16 (0); // nameID: copyright notice
      a8u16 (df.legal.length * 2); // length
      a8u16 (0); // offset
      
      for (let i = 0; i < df.legal.length; i++) {
        a8u16 (df.legal[i].codePointAt (0));
      }
    },
  });

  tables.push ({
    tag: 'head',
    length: 4 * 4 + 2 * 11 + 8 * 2,
    write: () => {
      a8tag ([0x00, 0x01, 0x00, 0x00]); // majorVersion, minorVersion
      a8tag ([0x00, 0x01, 0x00, 0x00]); // fontRevision
      a8u32 (0); // checksumAdjustment
      a8tag ([0x5F, 0x0F, 0x3C, 0xF5]);
      a8u16 (3); // flags
      a8u16 (df.upem);
      a8ldt (df.created + 2082844800);
      a8ldt (df.modified + 2082844800);
      a8s16 (df.xMin);
      a8s16 (df.yMin);
      a8s16 (df.xMax);
      a8s16 (df.yMax);
      a8u16 (0); // macStyle
      a8u16 (3); // lowestRecPPEM
      a8s16 (2); // fontDirectionHint
      a8s16 (0); // indexToLocFormat
      a8s16 (0); // glyphDataFormat
    },
  });

  tables.push ({
    tag: 'OS/2',
    length: 2 * 29 + 1 * 10 + 4 * 7,
    write: () =>{
      a8u16 (3); // version
      a8s16 (df.upem); // xAvgCharWidth Math.round (avg (advanceWidth))
      a8u16 (500); // usWeightClass
      a8u16 (5); // usWidthClass
      a8u16 (0); // fsType
      a8s16 (650); // ySubscriptXSize
      a8s16 (699); // ySubscriptYSize
      a8s16 (0); // ySubscriptXOffset
      a8s16 (140); // ySubscriptYOffset
      a8s16 (650); // ySuperscriptXSize
      a8s16 (699); // ySuperscriptYSize
      a8s16 (0); // ySuperscriptXOffset
      a8s16 (479); // ySuperscriptYOffset
      a8s16 (49); // yStrikeoutSize
      a8s16 (258); // yStrikeoutPosition
      a8s16 (0); // sFamilyClass
      a8u8 (0); // bFamilyType
      a8u8 (0); // bSerifStyle
      a8u8 (0); // bWeight
      a8u8 (0); // bProportion
      a8u8 (0); // bContrast
      a8u8 (0); // bStrokeVariation
      a8u8 (0); // bArmStyle
      a8u8 (0); // bLetterForm
      a8u8 (0); // bMidline
      a8u8 (0); // bXHeight
      a8u32 (0); // ulUnicodeRange1
      a8u32 (0); // ulUnicodeRange2
      a8u32 (0); // ulUnicodeRange3
      a8u32 (0); // ulUnicodeRange4
      a8tag ([0x00, 0x00, 0x00, 0x00]); // achVendID
      a8u16 (0); // fsSelection
      a8u16 (0); // usFirstCharIndex
      a8u16 (0); // usLastCharIndex
      a8s16 (df.ascender); // sTypoAscender
      a8s16 (df.descender); // sTypoDescender
      a8s16 (0); // sTypoLineGap
      a8s16 (df.yMax); // usWinAscent
      a8s16 (Math.abs (df.yMin)); // usWinDescent
      a8u32 (0); // ulCodePageRange1
      a8u32 (0); // ulCodePageRange2
      a8s16 (df.yMax); // sxHeight // XXX
      a8s16 (df.yMax); // sCapHeight // XXX
      a8u16 (0); // usDefaultChar
      a8u16 (0); // usBreakChar
      a8u16 (0); // usMaxContext
    },
  });

  tables.push ({
    tag: 'hhea',
    length: 18 * 2,
    write: () => {
      a8tag ([0x00, 0x01, 0x00, 0x00]); // version
      a8s16 (df.ascender);
      a8s16 (df.descender);
      a8s16 (0); // lineGap
      a8u16 (df.xMax); // advanceWidthMax XXX max (advanceWidth)
      a8s16 (0); // minLeftSideBearing XXX
      a8s16 (0); // minRightSideBearing XXX
      a8s16 (0); // xMaxExtent XXX maxLSB + xMax - xMin
      a8s16 (1); // caretSlopeRise
      a8s16 (0); // caretSlopeRun
      a8s16 (0); // caretOffset
      a8s16 (0); // reserved1
      a8s16 (0); // reserved2
      a8s16 (0); // reserved3
      a8s16 (0); // reserved4
      a8s16 (0); // metricDataFormat
      a8u16 (df.glyphCount); // numberOfHMetrics
    },
  }); // hhea

  tables.push ({
    tag: 'vhea',
    length: 18 * 2,
    write: () => {
      a8tag ([0x00, 0x01, 0x10, 0x00]); // version 1.1
      a8s16 (df.upem / 2); // vertTypoAscender
      a8s16 (-df.upem / 2); // vertTypoDescender
      a8s16 (0); // vertTypoLineGap
      a8u16 (df.yMax); // advanceHeightMax XXX max (advanceHeight)
      a8s16 (0); // minTopSideBearing XXX
      a8s16 (0); // minBottomSideBearing XXX
      a8s16 (0); // yMaxExtent XXX max (tsb + (yMax - yMin))
      a8s16 (1); // caretSlopeRise
      a8s16 (0); // caretSlopeRun
      a8s16 (0); // caretOffset
      a8s16 (0); // reserved
      a8s16 (0); // reserved
      a8s16 (0); // reserved
      a8s16 (0); // reserved
      a8s16 (0); // metricDataFormat
      a8u16 (df.glyphCount); // numOfLongVerMetrics
    },
  }); // vhea

    tables.push ({
      tag: 'maxp',
      length: 4 + 2,
      write: () => {
        a8tag ([0x00, 0x00, 0x50, 0x00]);
        a8u16 (df.glyphCount);
      },
    }); // maxp

    let u2g = []; // [startCharCode, endCharCode, startGlyphID]
    Object.keys (df.cmap[0]).forEach (_ => {
      u2g.push ([_, _, df.cmap[0][_]]);
    });
    u2g = u2g.sort ((a, b) => a[0] - b[0]);
    let l2g = [];
    let l2gKeys = [];
    let l2gLength = 0;
    Object.keys (df.cmap).forEach (vs => {
      if (vs == 0) return;
      l2gKeys.push (vs);
      l2g[vs] = {};
      Object.keys (df.cmap[vs]).forEach (_ => {
        l2g[vs][_] = df.cmap[vs][_];
        l2gLength++;
      });
    });
    if (l2gKeys.length === 0) {
      l2gKeys.push (0xFE00);
      l2g[0xFE00] = {};
      l2g[0xFE00][0xFFFE] = 1;
      l2gLength++;
    }
    l2gKeys = l2gKeys.sort ((a, b) => a - b);
  tables.push ({
    tag: 'cmap',
    length: 4 + 8 + 8 + 16 + u2g.length * 12 + 10 + l2gKeys.length * (11 + 4) + l2gLength * 5,
    write: () => {
      a8u16 (0); // version
      a8u16 (2); // numTables

      a8u16 (3); // platformID Windows
      a8u16 (10); // encodingID
      a8u32 (4 + 8 + 8); // offset

      a8u16 (0); // platformID
      a8u16 (5); // encodingID
      a8u32 (4 + 8 + 8 + 16 + u2g.length * 12); // offset

      a8u16 (12); // format
      a8u16 (0); // reserved
      a8u32 (16 + u2g.length * 12); // length
      a8u32 (0); // language
      a8u32 (u2g.length); // numGroups

      for (let i = 0; i < u2g.length; i++) {
        a8u32 (u2g[i][0]); // startCharCode
        a8u32 (u2g[i][1]); // endCharCode
        a8u32 (u2g[i][2]); // startGlyphID
      }

      a8u16 (14); // format
      a8u32 (10 + l2gKeys.length * (11 + 4) + l2gLength * 5); // length
      a8u32 (l2gKeys.length); // numVarSelectorRecords

      let offset = 10 + l2gKeys.length * 11;
      l2gKeys.forEach (vs => {
        a8u24 (vs); // varSelector
        a8u32 (0); // defaultUVSOffset
        a8u32 (offset); // nonDefaultUVSOffset
        offset += 4 + Object.keys (l2g[vs]).length * 5;
      });
      
      l2gKeys.forEach (vs => {
        let keys = Object.keys (l2g[vs]).sort ((a, b) => a - b);
        a8u32 (keys.length); // numUVSMappings
        keys.forEach (c => {
          a8u24 (c);
          a8u16 (l2g[vs][c]);
        });
      });
    },
    }); // cmap

    /*
      [
        [gids[0], [
          [gids, newGid],
        ]],
      ]
    */
    let ligSets = [];
    let lss = new Map;
    for (let m of df.ligatures) {
      for (let l of m) {
        let gids = l[0].map (_ => df.cmap[0][_]);
        if (!lss.has (gids[0])) lss.set (gids[0], []);
        lss.get (gids[0]).push ([gids, l[1]]);
      }
    }
    ligSets = [...lss.entries ()].sort ((a, b) => a[0] - b[0]);
    let firstGlyphCount = ligSets.length;
    let ligCount = 0;
    let glyphCount = 0;
    ligSets.forEach (ligSet => {
      ligCount += ligSet[1].length;
      ligSet[1].forEach (lig => {
        glyphCount += lig[0].length;
      });
    });
    tables.push ({
      tag: 'GSUB',
      length: 2*5 + 2+4+2+2*2+2*3 + 2+4+2+2*2+2 +
          2*2+2*5 + 2*3+2*firstGlyphCount+2*2+2*firstGlyphCount + 2*2*firstGlyphCount+2*2*ligCount+2*glyphCount,
      write: () => {
        a8u16 (1); // majorVersion
        a8u16 (0); // minorVersion

        a8u16 (2*5); // scriptListOffset
        a8u16 (2*5 + 2+4+2+2*2+2*3); // featureListOffset
        a8u16 (2*5 + 2+4+2+2*2+2*3 + 2+4+2+2*2+2); // lookupListOffset

        // ScriptList
        a8u16 (1); // scriptCount
        // scriptRecords
        {
          a8tag ([...'DFLT'].map (_ => _.codePointAt (0))); // scriptTag
          a8u16 (2+4+2); // scriptOffset
          // script
          {
            a8u16 (2*2); // defaultLangSysOffset
            a8u16 (0); // langSysCount
            // LangSysRecord
            // default LangSys
            {
              a8u16 (0); // lookupOrdderOffset
              a8u16 (0); // requiredFeatureIndex: feature #0 ccmp
              a8u16 (0); // featureIndexCount
              // featureIndices
            }
          }
        }

        // FeatureList
        a8u16 (1); // featureCount
        // featureRecords
        {
          a8tag ([...'ccmp'].map (_ => _.codePointAt (0))); // featureTag
          a8u16 (2+4+2); // featureOffset
        }
        // Feature #0 ccmp
        {
          a8u16 (0); // featureParamsOffset
          a8u16 (1); // lookupIndexCount
          // lookupListIndices
          a8u16 (0);
        }

        // LookupList
        a8u16 (1); // lookupCount
        // lookupOffsets
        a8u16 (2*2);
        // Lookup 0
        {
          a8u16 (4); // lookupType: ligature
          a8u16 (0); // lookupFlag
          a8u16 (1); // subTableCount
          // subtableOffsets
          a8u16 (2*5);
          a8u16 (0); // markFilteringSet
          {
            a8u16 (1); // substFormat
            a8u16 (2*3+2*firstGlyphCount); // coverageOffset
            a8u16 (firstGlyphCount); // ligatureSetCount
            // ligatureSetOffsets
            let offset = 2*3+2*firstGlyphCount + 2*2+2*firstGlyphCount;
            ligSets.forEach (ligSet => {
              a8u16 (offset);
              offset += 2+2*3*ligSet[1].length;
              ligSet[1].forEach (lig => offset += 2*lig[0].length-2);
            });
            {
              a8u16 (1); // coverageFormat
              a8u16 (firstGlyphCount); // glyphCount
              // glyphArray
              ligSets.forEach (ligSet => {
                a8u16 (ligSet[0]);
              });
            }
            ligSets.forEach (ligSet => {
              a8u16 (ligSet[1].length); // ligatureCount
              // ligatureOffsets
              let offset = 2+2*ligSet[1].length;
              ligSet[1].forEach (lig => {
                a8u16 (offset);
                offset += 2+2*lig[0].length; // 2*2+2*(length-1)
              });
              ligSet[1].forEach (lig => {
                a8u16 (lig[1]); // ligatureGlyph
                a8u16 (lig[0].length); // componentCount
                // componentGlyphIDs
                for (let i = 1; i < lig[0].length; i++) a8u16 (lig[0][i]);
              });
            }); // ligSet
          }
        }
      },
    }); // GSUB
    
    tables.push ({
      tag: 'GPOS',
      length: 2*5 + 2+4+2+2*2+2*3 + 2 + 2,
      write: () => {
        a8u16 (1); // majorVersion
        a8u16 (0); // minorVersion

        a8u16 (2*5); // scriptListOffset
        a8u16 (2*5 + 2+4+2+2*2+2*3); // featureListOffset
        a8u16 (2*5 + 2+4+2+2*2+2*3 + 2); // lookupListOffset

        // ScriptList
        a8u16 (1); // scriptCount
        // scriptRecords
        {
          a8tag ([...'DFLT'].map (_ => _.codePointAt (0))); // scriptTag
          a8u16 (2+4+2); // scriptOffset
          // script
          {
            a8u16 (2*2); // defaultLangSysOffset
            a8u16 (0); // langSysCount
            // LangSysRecord
            // default LangSys
            {
              a8u16 (0); // lookupOrdderOffset
              a8u16 (0); // requiredFeatureIndex
              a8u16 (0); // featureIndexCount
              // featureIndices
            }
          }
        }

        // FeatureList
        a8u16 (0); // featureCount
        // featureRecords

        // LookupList
        a8u16 (0); // lookupCount
        // lookupOffsets
      },
    }); // GPOS

    let gcs = new Map;
    for (let i = 0; i < df.glyphCount; i++) gcs.set (i, 1);
    tables.push ({
      tag: 'GDEF',
      length: 2*(7-1) + 2*2+2*3*gcs.size,
      write: () => {
        a8u16 (1); // majorVersion
        a8u16 (0); // minorVersion

        a8u16 (2*(7-1)); // glyphClassDefOffset
        a8u16 (0); // attachListOffset
        a8u16 (0); // ligCaretListOffset
        a8u16 (0); // markAttachClassDefOffset
        //a8u16 (0); // markGlyphSetsDefOffset v1.2

        // glyph class def
        a8u16 (2); // classFormat
        a8u16 (gcs.size); // classRangeCount
        // classRangeRecords
        Array.from (gcs.keys ()).sort ((a, b) => a - b).forEach (gid => {
          a8u16 (gid); // startGlyphID
          a8u16 (gid); // endGlyphID
          a8u16 (gcs.get (gid)); // class
        });
      },
    }); // GDEF

  tables.push ({
    tag: 'post',
    length: 4 * 8,
    write: () => {
      a8tag ([0x00, 0x03, 0x00, 0x00]); // version
      a8u32 (0); // italicAngle
      a8u16 (0); // underlinePosition
      a8u16 (0); // underlineThickness
      a8u32 (0); // isFixedPitch
      a8u32 (0); // minMemType42
      a8u32 (0); // maxMemType42
      a8u32 (0); // minMemType1
      a8u32 (0); // maxMemType1
    },
  });

    tables.push ({
      tag: 'hmtx',
      length: df.glyphCount * 4,
      write: () => {
        df.hmtxBlocks.forEach (block => {
          for (let i = block.start; i < block.next; i++) {
            a8[a8Next++] = block.a8[i];
          }
        });
      },
    }); // hmtx

    /*XXX
    tables.push ({
      tag: 'vmtx',
      length: df.glyphCount * 4,
      write: () => {
        df.vmtxBlocks.forEach (block => {
          for (let i = block.start; i < block.next; i++) {
            a8[a8Next++] = block.a8[i];
          }
        });
      },
      }); // vmtx
      */

  tables.push ({
    tag: 'CFF ',
    length: 4 + 6 + 7 + 2 + 2 + 3 + 4 * (df.glyphCount + 1) + df.csLength,
    write: () => {
      // header
      a8u8 (1); // major
      a8u8 (0); // minor
      a8u8 (4); // hdrSize
      a8u8 (3); // offSize

      // nameIndex
      a8u16 (1); // count
      a8u8 (1); // offSize
      a8u8 (1); // offset
      a8u8 (1 + 1); // offset
      a8u8 (0x41); // data

      // topDictIndex
      a8u16 (1); // count
      a8u8 (1); // offSize
      a8u8 (1); // offset 0
      a8u8 (1 + 2); // offset 1
      a8xn (4 + 6 + 7 + 2 + 2);
      a8u8 (17); // "CharStrings"

      // stringIndex
      a8u8 (0);
      a8u8 (0);

      // globalSubrIndex
      a8u8 (0);
      a8u8 (0);

      // charsets
      //

      // charStringsIndex
      a8u16 (df.glyphCount); // count
      a8u8 (4); // offSize

      for (let i = 0; i < df.csOffsets.length; i++) {
        a8u32 (df.csOffsets[i]);
      }
      for (let j = 0; j < df.csBlocks.length; j++) {
        let csb = df.csBlocks[j];
        for (let i = 0; i < csb.length; i++) {
          a8[a8Next++] = csb.a8[i + csb.offset];
        }
      }

      // privateDict
      //
    },
  });
    
    tables = tables.sort ((a, b) => {
      return a.tag > b.tag ? +1 : -1;
    });
    
    let offset = 4 + 2 + 2 + 2 + 2 + ((4 + 4 + 4 + 4) * tables.length);
    while (offset % 4 !== 0) offset++;
    let checksumOffset;
    for (let i = 0; i < tables.length; i++) {
      let table = tables[i];

      table.offset = offset;
      table.paddingLength = 0;

      if (table.tag === 'head') checksumOffset = offset + 4 + 4;
      
      offset += table.length;
      while (offset % 4 !== 0) {
        offset++;
        table.paddingLength++;
      }
    }

    const ab = new ArrayBuffer (offset);
    a8 = new Uint8Array (ab);

    a8tag ([...'OTTO'].map (_ => _.codePointAt (0))); // sfntVersion
    a8u16 (tables.length);
    const highestPowerOf2 = Math.pow (2, log2 (tables.length));
    const searchRange = 16 * highestPowerOf2;
    a8u16 (searchRange);
    a8u16 (log2 (highestPowerOf2)); // entrySelector
    a8u16 (tables.length * 16 - searchRange); // rangeShift
    for (let i = 0; i < tables.length; i++) {
      let table = tables[i];
      a8tag ([...table.tag].map (_ => _.codePointAt (0)));
      table.checksumOffset = a8Next;
      a8u32 (0);
      a8u32 (table.offset);
      a8u32 (table.length);
    }
    for (let i = 0; i < tables.length; i++) {
      let table = tables[i];
      a8Next = table.offset;

      table.write ();

      let sum = checksum (a8, table.offset, table.length + table.paddingLength);
      let destOffset = table.checksumOffset;
      a8[destOffset++] = (sum >> 24) & 0xFF;
      a8[destOffset++] = (sum >> 16) & 0xFF;
      a8[destOffset++] = (sum >> 8) & 0xFF;
      a8[destOffset++] = sum & 0xFF;
    }

    let sum = 0xB1B0AFBA - checksum (a8, 0, offset);
    let destOffset = checksumOffset;
    a8[destOffset++] = (sum >> 24) & 0xFF;
    a8[destOffset++] = (sum >> 16) & 0xFF;
    a8[destOffset++] = (sum >> 8) & 0xFF;
    a8[destOffset++] = sum & 0xFF;

    if (opts.install) {
      var blob = new Blob ([ab]);
      var url = URL.createObjectURL (blob);
      
      var ff = new FontFace (opts.fontFamily, "url(" + url + ")");
      if (df.ranges) ff.unicodeRange = df.ranges.join (",");
      return ff.load ().then (() => {
        console.log ("Font added", url, ff); // for devs
        document.fonts.add (ff);
      });
    } else {
      return {
        arrayBuffer: ab,
        ranges: df.ranges.join (","),
      };
    }
  } // swComposeFont

  self.swComposeFont = swComposeFont;
  
}) (globalThis);

if (this.document && this.document.currentScript) {

((base, install) => {
  if (install === null) return;
  let cssURL = new URL ('all.css', base);
  let gzipped = install === 'gzip' || cssURL.hostname === 'fonts.suikawiki.org';

  let link = document.createElement ('link');
  link.rel = 'stylesheet';
  link.href = cssURL;
  document.head.appendChild (link);
  
  swComposeFont ({
    fontFamily: 'SuikaWiki Composed Han pqr',
    baseURL: base,
    components: [
      {datURL: "hanmin/pqr0.dat.gz", datGzipped: gzipped,
       jsonURL: "hanmin/pqr0.json.gz", jsonGzipped: gzipped},
      {datURL: "hanmin/pqr1.dat.gz", datGzipped: gzipped,
       jsonURL: "hanmin/pqr1.json.gz", jsonGzipped: gzipped},
      {datURL: "hanmin/pqr2.dat.gz", datGzipped: gzipped,
       jsonURL: "hanmin/pqr2.json.gz", jsonGzipped: gzipped},
    ],
    install: true,
  });
  
}) (document.currentScript.src, document.currentScript.getAttribute ('data-install'));

} else if (! (this && this.window)) {
  let mode = process.argv[2];

  swComposeFont ({
    fontFamily: 'SuikaWiki Composed Han ' + mode,
    components: [
      {datPath: "fonts/hanmin/"+mode+".dat",
       jsonPath: "fonts/hanmin/"+mode+".json"},
    ],
  }).then (r => {
    const fs = require ('fs/promises');
    let path = "fonts/hanmin/"+mode+".ttf";
    console.log ("Writing |"+path+"|...");
    return fs.writeFile (path, new DataView (r.arrayBuffer));
  });
}


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
