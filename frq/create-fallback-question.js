const fs = require ('fs/promises');
const opentype = require ("./local/opentype.js");
const OTWriter = require ('./otwriter.js');

function generate (vsStart, fileName) {
  const notdefGlyph = new opentype.Glyph ({
    name: '.notdef',
    advanceWidth: 900,
    path: new opentype.Path,
  });

const question = new opentype.Path;
{
  let gTop = 550;
  let gLeft = 225;
  // <https://ja.wikibooks.org/wiki/%E3%83%95%E3%82%A1%E3%82%A4%E3%83%AB:Purple_question_mark.svg>
  // (Public Domain)
  let segs = `M 285.9241 306.8627 C 284.8291 302.4677 283.0216 298.2802 283.4666 293.6127 C 285.5466 271.8477 309.5941 258.7327 326.9238 249.8357 C 346.0118 240.0379 365.3238 230.6752 384.4238 220.9022 C 408.1788 208.7462 437.0388 195.5087 443.2938 166.6127 C 444.4288 161.3724 444.4868 155.7072 444.1438 150.3529 C 441.5068 109.0635 403.4918 80.72818 370.1738 62.76918 C 340.3918 46.71648 307.5066 35.54368 274.6741 27.73688 C 243.2429 20.26318 211.4959 14.28778 179.1741 12.87258 C 156.1444 11.86418 133.1054 14.00378 110.4241 17.79128 C 85.12189 22.01658 59.2631 26.66308 35.1741 35.75668 C 25.6984 39.33398 13.5959 44.05368 8.077905 53.11268 C 6.263905 56.09068 4.400405 62.02348 6.676505 65.28768 C 7.646905 66.67948 9.749204 67.68998 11.1741 68.56168 C 14.1739 70.39718 17.1583 72.25318 20.1741 74.06268 C 38.0414 84.78298 57.5044 93.84368 77.1741 100.7367 C 84.82709 103.4187 92.49339 106.0297 100.1741 108.6315 C 102.4066 109.3877 104.6721 110.0255 106.9241 110.7162 C 107.7094 110.957 108.8179 111.5612 109.6516 111.3805 C 110.6934 111.1545 111.6581 109.624 112.3181 108.8627 C 114.0686 106.8437 116.0286 104.999 117.9566 103.1505 C 123.2616 98.06468 129.8189 93.60718 136.4241 90.38968 C 141.8066 87.76798 147.3931 85.40298 153.1741 83.79898 C 184.4951 75.10918 228.5841 76.24418 246.1669 108.6127 C 247.5141 111.0927 248.3951 113.9022 249.1131 116.6127 C 250.1641 120.5809 251.0266 124.9749 250.6316 129.1127 C 249.4681 141.2894 240.0271 152.3872 231.9331 160.8619 C 214.7661 178.8364 194.1699 192.7619 176.1516 209.7912 C 167.2171 218.2357 157.1761 227.6227 152.6846 239.3627 C 150.4336 245.2459 152.3701 251.3494 153.9879 257.1127 C 157.3336 269.0302 162.4694 280.5102 167.3539 291.8627 C 168.8171 295.2627 170.2249 298.6927 171.6389 302.1127 C 172.3084 303.7327 172.8854 305.9752 174.0486 307.3077 C 176.4869 310.0977 183.4114 311.1927 186.9241 311.5702 C 201.6221 313.1427 216.9209 311.6127 231.6741 311.6127 C 243.3666 311.6127 255.0191 310.9327 266.6741 310.1352 C 272.6741 309.7252 280.5791 309.9677 285.9241 306.8627
      M 256.4241 364.7181 C 240.3894 366.8301 224.6851 369.1981 210.4241 377.4331 C 199.2586 383.8831 195.0011 396.4051 200.6611 408.1131 C 202.3736 411.6551 205.2306 415.2251 208.1741 417.8181 C 217.0329 425.6151 228.2074 430.1581 239.1741 434.0601 C 258.0516 440.7801 277.8966 444.3631 297.9241 444.3631 C 304.2266 444.3631 310.6916 444.5401 316.9241 443.5331 C 320.1416 443.0101 323.4966 442.6751 326.6738 441.9251 C 337.4118 439.3901 348.2138 437.0401 357.6738 431.0601 C 363.7588 427.2101 368.8338 421.5581 369.6318 414.1131 C 369.9138 411.4781 369.5538 408.9301 369.0368 406.3631 C 368.3968 403.1881 367.0988 400.0001 365.1918 397.3651 C 362.6518 393.8531 359.6138 390.8651 356.1738 388.2381 C 348.6438 382.4901 339.7368 378.8631 330.9238 375.6281 C 315.8891 370.1131 300.0841 366.8351 284.1741 365.3201 C 275.2966 364.4751 265.3166 363.5481 256.4241 364.7181 z`
      .split (/\s+/);
  while (segs.length) {
    var seg = segs.shift ();
    if (seg === 'M') {
      question.moveTo (gLeft- -segs.shift (), gTop-segs.shift ());
    } else if (seg === 'C') {
      question.curveTo (gLeft- -segs.shift (), gTop-segs.shift (),
                        gLeft- -segs.shift (), gTop-segs.shift (),
                        gLeft- -segs.shift (), gTop-segs.shift ());
    } else if (seg === 'z') {
      question.close ();
    } else {
      question.lineTo (gLeft- -seg, gTop-segs.shift (),
                       gLeft- -segs.shift (), gTop-segs.shift ());
    }
  }
} // question
    
  const questionGlyph = new opentype.Glyph ({
    name: 'question',
    advanceWidth: 900,
    path: question,
  });

  let cmapOTW = new OTWriter;
  {
    let table = cmapOTW.startTable ([]);

    let r13 = [];
    let r14 = [];

    cmapOTW.add ([
      ['uint16', 0], // version
      ['uint16', 2], // numTables

      // EncodingRecord encodingRecords[0]
      ['uint16', 3], // platformID (Windows)
      ['uint16', 10], // encodingID (Unicode full)
      table.offset32 (r13, ['cmap', '13']),

      // EncodingRecord encodingRecords[1]
      ['uint16', 0], // platformID (Unicode)
      ['uint16', 5], // encodingID (UVS)
      table.offset32 (r14, ['cmap', '14']),
    ]);

    {
      let sub = cmapOTW.startTable (r13);

      cmapOTW.add ([
        ['uint16', 13], // format
        ['uint16', 0], // reserved
        ['uint32', 28], // length
        ['uint32', 0], // language
        ['uint32', 1], // numGroups

        // group[0]
        ['uint32', 0x0000], // startCharCode
        ['uint32', 0x10FFFF], // endCharCode
        ['uint32', 1], // glyphID
      ]);
    }

    {
      let sub = cmapOTW.startTable (r14);
      let uvs = [];
      let rr = [];
      let rs = [];
      for (let r = vsStart; r < vsStart + 236; r++) {
        let count = 0xFF;
        if (r * 0x100 + 1 + count > 0x10FFFF) {
          count = 0x10FFFF - r * 0x100 + 1 - 2;
        }
        if (count < 0) break;
        rr.push ([r * 0x100 + 1, count]);
      }

      cmapOTW.add ([
        ['uint16', 14], // format
        ['uint32', 2+4+4+256*(3+4+4)+4+(3+1)*rr.length], // length
        ['uint32', 256], // numVarSelectorRecords
      ]);

      // VariationSelector varSelector[]
      let vsList = [];
      for (let i = 0xFE00; i <= 0xFE0F; i++) vsList.push (i);
      for (let i = 0xE0100; i <= 0xE01EF; i++) vsList.push (i);
      for (let vs of vsList) {
        cmapOTW.add ([
          ['uint24', vs], // varSelector
          sub.offset32 (uvs, ['cmap', '14', 'defaultUVS']),
          ['uint32', 0], // nonDefaultUVSOffset
        ]);
      }
      {
        let du = cmapOTW.startTable (uvs);
        cmapOTW.add ([
          ['uint32', rr.length], // numUnicodeValueRanges
        ]);
        rr.forEach ((_, i) => {
          cmapOTW.add ([
            // UnicodeRange ranges[i]
            ['uint24', _[0]], // startUnicodeValue
            // U+0000 is not allowed by Chrome/Firefox
            ['uint8', _[1]], // additionalCount
          ]);
        });
      }
    }
  }

  const font = new opentype.Font ({
    familyName: 'Fallback Red Question',
    license: 'Public Domain.',
    styleName: 'Regular',
    unitsPerEm: 900,
    ascender: 900,
    descender: 0,
    glyphs: [notdefGlyph, questionGlyph],
    tables: {
      colr: {
        baseGlyphRecords: [
          {glyphID: 1, firstLayerIndex: 0, numLayers: 1},
        ],
        layerRecords: [
          {glyphID: 1, paletteIndex: 0},
        ]
      },
      cpal: {
        colorRecords: [0x0000FFFF], // 0xBBGGRRAA
      },
      cmap: {
        arrayBufferList: cmapOTW.getArrayBufferList (),
      },
    },
  });
  font.names = {
    fontFamily: {en: 'Fallback Red Question'},
    fullName: {en: 'Fallback Red Question'},
    license: {en: 'Public Domain.'},
  };

  console.log (`Write |${fileName}|...`);
  fs.writeFile (fileName, new DataView (font.toArrayBuffer ()));
} // generate

let start = 0x00;
for (let i = 0; i < 19; i++) {
  generate (start, `frq${i}.ttf`);
  start += 236;
}

// License: Public Domain.
