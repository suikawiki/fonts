(function (global, init) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = init ();
  } else {
    global.OTWriter = init ();
  }
}) (globalThis, function () {

  function OTWriter () {
    this.currentOffset = 0;
    this.abs = [];
    this.bookmarks = [];
  } // OTWriter

  OTWriter.prototype.getArrayBufferList = function () {
    return this.abs;
  }; // getTypedArrays

  OTWriter.prototype.setBookmark = function () {
    this.bookmarks.push (this.currentOffset);
  }; // setBookmark

  OTWriter.prototype.getBookmarks = function () {
    return this.bookmarks;
  }; // getBookmarks

  OTWriter.prototype.startTable = function (refs) {
    let tableStartOffset = this.currentOffset;
    let thisRef = new TableRef (tableStartOffset);

    refs.forEach (ref => {
      ref.fillOffset (tableStartOffset);
    });

    return thisRef;
  }; // startTable

  OTWriter.prototype.startList = function () {
    return new ListRef ();
  };

  OTWriter.prototype.add = function (items) {
    let size = 0;
    items.forEach (item => {
      if (!item) return;
      
      let type = item[0];
      if (type === 'uint8') {
        size += 1;
      } else if (type === 'uint16' || type === 'int16' ||
                 type === 'Offset16' || type === '_index') {
        size += 2;
      } else if (type === 'uint24') {
        size += 3;
      } else if (type === 'uint32' || type === 'int32' ||
                 type === 'Offset32' || type === 'Tag') {
        size += 4;
      } else {
        throw new TypeError ("Bad field type: " + type);
      }
    });
    let ab = new ArrayBuffer (size);
    let ab8 = new Uint8Array (ab);
    let ab8Offset = 0;
    items.forEach (item => {
      if (!item) return;
      
      let type = item[0];
      if (type === 'uint8') {
        ab8[ab8Offset++] = item[1] & 0xFF;
      } else if (type === 'uint16') {
        ab8[ab8Offset++] = (item[1] >> 8) & 0xFF;
        ab8[ab8Offset++] = item[1] & 0xFF;
      } else if (type === 'int16') {
        let v = item[1];
	if (v >= 32768) {
	  v = -(2 * 32768 - v);
	}
        ab8[ab8Offset++] = (v >> 8) & 0xFF;
        ab8[ab8Offset++] = v & 0xFF;
      } else if (type === 'uint24') {
        ab8[ab8Offset++] = (item[1] >> 16) & 0xFF;
        ab8[ab8Offset++] = (item[1] >> 8) & 0xFF;
        ab8[ab8Offset++] = item[1] & 0xFF;
      } else if (type === 'uint32') {
        ab8[ab8Offset++] = (item[1] >> 24) & 0xFF;
        ab8[ab8Offset++] = (item[1] >> 16) & 0xFF;
        ab8[ab8Offset++] = (item[1] >> 8) & 0xFF;
        ab8[ab8Offset++] = item[1] & 0xFF;
      } else if (type === 'int32') {
        let v = item[1];
	if (v >= 2147483648) {
	  v = -(2 * 2147483648 - v);
	}
        ab8[ab8Offset++] = (v >> 24) & 0xFF;
        ab8[ab8Offset++] = (v >> 16) & 0xFF;
        ab8[ab8Offset++] = (v >> 8) & 0xFF;
        ab8[ab8Offset++] = v & 0xFF;
      } else if (type === 'Offset16' || type === '_index') {
        item.ab8 = ab8;
        item.ab8Offset = ab8Offset;
        ab8[ab8Offset++] = 0;
        ab8[ab8Offset++] = 0;
      } else if (type === 'Offset32') {
        item.ab8 = ab8;
        item.ab8Offset = ab8Offset;
        ab8[ab8Offset++] = 0;
        ab8[ab8Offset++] = 0;
        ab8[ab8Offset++] = 0;
        ab8[ab8Offset++] = 0;
      } else if (type === 'Tag') {
        ab8[ab8Offset++] = item[1].charCodeAt (0) & 0xFF;
        ab8[ab8Offset++] = item[1].charCodeAt (1) & 0xFF;
        ab8[ab8Offset++] = item[1].charCodeAt (2) & 0xFF;
        ab8[ab8Offset++] = item[1].charCodeAt (3) & 0xFF;
      }
    });
    this.abs.push (ab);
    this.currentOffset += ab8Offset;
  }; // add

  OTWriter.prototype._addLookup = function (subInputs, code, opts) {
    let r = {laters: []};
    
    let lookupTable = this.startTable (opts.refs || []);
    let subs = [];
    subInputs.forEach (input => {
      let item = {
        input: input,
        coverageRefSet: [],
        ref: lookupTable.offset16 ([], opts.labels.concat (['subtable'])),
      };
      if (!opts.extension) item.realRef = item.ref;
      subs.push (item);
    });

    let lookupFlag = 0;
    if (opts.markFilteringSet != null) {
      lookupFlag |= 0x0010; // USE_MARK_FILTERING_SET
    }

    if (opts.extension) {
      this.add ([
        ['uint16', opts.extension === 'GSUB' ? 7 : 9], // lookupType
        ['uint16', lookupFlag], // lookupFlag
        ['uint16', subs.length], // subtableCount
        ...subs.map (_ => _.ref), // subtableOffsets[]
        ...(lookupFlag & 0x0010 ? [['uint16', opts.markFilteringSet]] : []), // markFilteringSet
      ]);
      subs.forEach (_ => {
        let subtable = this.startTable ([_.ref]);
        _.realRef = subtable.offset32 ([], opts.labels.concat (['extensionOffset']));
        this.add ([
          ['uint16', 1], // format
          ['uint16', opts.lookupType], // extensionLookupType
          _.realRef,
        ]);
      });
    } else {
      this.add ([
        ['uint16', opts.lookupType], // lookupType
        ['uint16', lookupFlag], // lookupFlag
        ['uint16', subs.length], // subtableCount
        ...subs.map (_ => _.realRef), // subtableOffsets[]
        ...(lookupFlag & 0x0010 ? [['uint16', opts.markFilteringSet]] : []), // markFilteringSet
      ]);
    }

    if (opts.extension) {
      r.laters.push (() => subs.forEach (code));
    } else {
      subs.forEach (code);
    }

    return r;
  };

  function TableRef (offset) {
    this.tableStartOffset = offset;
  } // TableRef

  TableRef.prototype.offset16 = function (list, labels) {
    let item = new Placeholder (this.tableStartOffset);
    item[0] = 'Offset16';
    if (list) list.push (item);
    item.labels = labels || [];
    return item;
  };
  TableRef.prototype.offset32 = function (list, labels) {
    let item = new Placeholder (this.tableStartOffset);
    item[0] = 'Offset32';
    if (list) list.push (item);
    item.labels = labels || [];
    return item;
  };
  
  TableRef.prototype.index = function (list, labels) {
    let item = new Placeholder ();
    item[0] = '_index';
    if (list) list.push (item);
    item.labels = labels || [];
    return item;
  };

  function ListRef () {
    this.nextIndex = 0;
  } // ListRef

  ListRef.prototype.push = function (refs) {
    let index = this.nextIndex++;
  
    refs.forEach (ref => {
      ref.fillIndex (index);
    });
  }; // push


  function Placeholder (offset) {
    this.tableStartOffset = offset; // or undefined
    //this[0] (type)
    //this.ab8
    //this.ab8Offset
    //this.filledValue
  }

  Placeholder.prototype.fillOffset = function (offset) {
    if (this.filledValue !== undefined) {
      throw new TypeError ('Second fillOffset invocation for the placeholder');
    }
    if (!this.ab8) {
      throw new TypeError ('Placeholder not added to table yet');
    }
    let delta = offset - this.tableStartOffset;
    this.filledValue = delta;
    if (this[0] === 'Offset16') {
      if (delta >= 2**16) throw new TypeError ('Bad offset value: |'+delta+'| in ' + this.labels);
      this.ab8[this.ab8Offset] = (delta >> 8) & 0xFF;
      this.ab8[this.ab8Offset + 1] = delta & 0xFF;
    } else if (this[0] === 'Offset32') {
      if (delta >= 2**32) throw new TypeError ('Bad offset value: |'+delta+'| in ' + this.labels);
      this.ab8[this.ab8Offset] = (delta >> 24) & 0xFF;
      this.ab8[this.ab8Offset + 1] = (delta >> 16) & 0xFF;
      this.ab8[this.ab8Offset + 2] = (delta >> 8) & 0xFF;
      this.ab8[this.ab8Offset + 3] = delta & 0xFF;
    } else {
      throw new TypeError ('Bad fillOffset invocation: ' + this[0]);
    }
  }; // fillOffset

  Placeholder.prototype.fillIndex = function (index) {
    if (this.filledValue !== undefined) {
      throw new TypeError ('Second fillIndex invocation for the placeholder: ' + this.labels);
    }
    if (!this.ab8) {
      throw new TypeError ('Placeholder not added to table yet: ' + this.labels);
    }
    this.filledValue = index;
    if (this[0] === '_index') {
      if (index >= 2**16) throw new TypeError ('Bad index value: |'+index+'| in ' + this.labels);
      this.ab8[this.ab8Offset] = (index >> 8) & 0xFF;
      this.ab8[this.ab8Offset + 1] = index & 0xFF;
    } else {
      throw new TypeError ('Bad fillIndex invocation: ' + this[0]);
    }
  }; // fillIndex

  Placeholder.prototype.getValue = function () {
    if (this.filledValue === undefined) {
      throw new TypeError ('No filled value for the placeholder');
    }
    return this.filledValue;
  };

  return OTWriter;
});

/*

Copyright 2024-2026 Wakaba <wakaba@suikawiki.org>.

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
