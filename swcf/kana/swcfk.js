(() => {

  let kgmapPromise = null;
  function loadSWCFKGMap () {
    if (!kgmapPromise) {
      kgmapPromise = fetch ('https://fonts.suikawiki.org/swcf/kana/kana1-fontmap.json').then (r => {
        if (r.status !== 200) throw r;
        return r.json();
      });
    }
    return kgmapPromise;
  }

  class SWCFK extends HTMLElement {
    static observedAttributes = ['features'];

    connectedCallback () {
      this._observer = new MutationObserver(() => this._scheduleRender());
      this._observer.observe(this, {
        childList: true,
        characterData: true,
        subtree: true
      });
      this._scheduleRender();
    }

    disconnectedCallback () {
      this._observer?.disconnect();
    }

    attributeChangedCallback () {
      this._scheduleRender();
    }

    _scheduleRender () {
      if (this._renderQueued) return;
      this._renderQueued = true;
      queueMicrotask(() => {
        this._renderQueued = false;
        this.render();
      });
    }

    async render () {
      let text = this.textContent;
      if (!text) return;

      let features = this.getAttribute('features') || '';

      let k1 = Array.from(text).map(ch => ch.codePointAt(0).toString(16));

      let k2 = [], k3 = [], k4 = [];
      features.split('.').filter (_ => _.length).forEach(tag => {
        if (!tag) return;
        if (tag.length < 4) k4.push(tag);
        else if (tag.length === 4) k3.push(tag);
        else k2.push(tag);
      });

      [k2, k3, k4].forEach(k => k.sort((a, b) => a < b ? 1 : -1));

      let {
        font_map: fontMap, feature_classes: featClasses,
        feature_fonts: featureFonts,
      } = await loadSWCFKGMap();

      let font = 0;
      for (let k of [k2, k3].flat ()) {
        let f = featureFonts[k.substring (0, 4)];
        if (f) {
          font = f;
          break;
        }
      }
      if (!font) {
        let kp = k1.join('.');
        let kk = [k2, k3, k4].flat();
        while (kk.length) {
          let f = fontMap[kp + '/' + kk.join('.')];
          if (f) { font = f; break; }
          kk.pop();
        }
        if (!font) font = fontMap[kp] || fontMap[''];
      }

      let feats = [k2, k3, k4].flat ().map (t => {
        let f = featClasses[t];
        if (f) {
          return f;
        } else {
          let m = t.match (/^[A-Za-z0-9]{4}$/);
          if (m) {
            return `"${t}"`;
          } else {
            m = t.match (/^([A-Za-z0-9]{4})([0-9]+)$/);
            if (m) {
              return `"${m[1]}" ${parseInt (m[2])+1}`;
            } else {
              console.log (`Unknown feature specification |${t}|`);
              return '';
            }
          }
        }
      }).filter (_ => _.length).join(', ');

      this.setAttribute('font', font);

      if (k3.includes('vert'))
        this.setAttribute('vert', '');
      else
        this.removeAttribute('vert');

      this.style.fontFeatureSettings = feats;
    }
  }
  customElements.define('swcf-k', SWCFK);

  let link = document.createElement ('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.suikawiki.org/swcf/kana/swcf-kana-additional.css';
  document.head.appendChild (link);

}) ();

/*

Copyright 2026 Wakaba <wakaba@suikawiki.org>.

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
