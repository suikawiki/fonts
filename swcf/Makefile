WGET = wget
SAVEURL = $(WGET) -O

ROOT_PATH = ../
PERL = $(ROOT_PATH)/perl -I$(ROOT_PATH)/bin/modules/json-ps/lib

all: build

build: \
    ../local/swcf/hanmin/p.ttf \
    ../local/swcf/hanmin/q.ttf \
    ../local/swcf/hanmin/r.ttf \
    ../local/swcf/hanmin/pqr0.dat.gz \
    ../local/swcf/hanmin/pqr1.dat.gz \
    ../local/swcf/hanmin/pqr2.dat.gz \
    all.css

../local/swcf/opentype.js:
	mkdir -p ../local/swcf
	$(SAVEURL) $@ https://raw.githubusercontent.com/manakai/opentypejs/master/dist/opentype.js
../local/swcf/kage.js:
	mkdir -p ../local/swcf
	$(SAVEURL) $@ https://data.suikawiki.org/js/kage.js
../local/swcf/ajm.ttf:
	mkdir -p ../local/swcf
	$(SAVEURL) $@ https://fonts.suikawiki.org/opentype/haranoaji-20230610/HaranoAjiMincho-Regular.otf
../local/swcf/mj.ttf: 
	mkdir -p ../local/swcf
	$(SAVEURL) $@ https://fonts.suikawiki.org/opentype/ipamjm00601/ipamjm.ttf
../local/swcf/akr.ttf: 
	mkdir -p ../local/swcf
	$(SAVEURL) $@ https://fonts.suikawiki.org/opentype/SourceHanSerifAKR9-20190729/SourceHanSerifAKR9-Regular.otf
../local/swcf/nnt.ttf: 
	mkdir -p ../local/swcf
	$(SAVEURL) $@ https://fonts.suikawiki.org/opentype/nom-506/NomNaTong-Regular.ttf
../local/swcf/cns-s0.ttf: 
	mkdir -p ../local/swcf
	$(SAVEURL) $@ https://fonts.suikawiki.org/opentype/cns11643-20221114/TW-Sung-98_1.ttf
../local/swcf/cns-s2.ttf: 
	mkdir -p ../local/swcf
	$(SAVEURL) $@ https://fonts.suikawiki.org/opentype/cns11643-20221114/TW-Sung-Ext-B-98_1.ttf
../local/swcf/cns-s15.ttf:
	mkdir -p ../local/swcf
	$(SAVEURL) $@ https://fonts.suikawiki.org/opentype/cns11643-20221114/TW-Sung-Plus-98_1.ttf
../local/swcf/uk-1.ttf:
	mkdir -p ../local/swcf
	$(SAVEURL) $@ https://fonts.suikawiki.org/opentype/uk/IRGN2107.ttf
../local/swcf/uk-2.ttf:
	mkdir -p ../local/swcf
	$(SAVEURL) $@ https://fonts.suikawiki.org/opentype/uk/IRGN2232.ttf
../local/swcf/bsh.ttf: 
	mkdir -p ../local/swcf
	$(SAVEURL) $@ https://fonts.suikawiki.org/opentype/babelstonehan-1512/BabelStoneHan.ttf

../local/swcf/swcf-hanmin-mapping.json:
	mkdir -p ../local/swcf
	$(SAVEURL) $@ https://manakai.github.io/data-chars/tmp/swcf-hanmin-mapping.json
../local/swcf/swcf-hanmin-mapping.txt:
	mkdir -p ../local/swcf
	$(SAVEURL) $@ https://manakai.github.io/data-chars/intermediate/swcf/swcf-hanmin-mapping.txt

../local/swcf/gwglyphcache.json:
	mkdir -p ../local/swcf
	$(SAVEURL) $@ https://wakaba.github.io/nemui/local/data/gwglyphcache.json

#SWDATA_URL_PREFIX=https://data.suikawiki.org/data/
SWDATA_URL_PREFIX=https://swdata-items-3.netlify.app/chars/
../local/swcf/gwglyphs.ttf: \
    ../local/swcf/opentype.js \
    ../local/swcf/kage.js \
    ../local/swcf/ajm.ttf \
    ../local/swcf/swcf-hanmin-mapping.json \
    ../local/swcf/gwglyphcache.json \
    gwglyphs.js \
    gwmissing-extracted.txt \
    ../swg/glyphs.json
	mkdir -p ../local/swcf
	docker run -i \
	    -v `pwd`:/app \
	    -v `pwd`/../local/swcf:/app/fonts \
	    -v `pwd`/../swg/glyphs.json:/app/fonts/glyphs.json \
	    -e SWDATA_URL_PREFIX=$(SWDATA_URL_PREFIX) \
	    node bash -c 'cd /app && npm install node-fetch paper-jsdom && node gwglyphs.js'

../local/swcf/hanmin/p.ttf: \
    ../local/swcf/opentype.js extract.js composite.js \
    ../local/swcf/mj.ttf \
    ../local/swcf/nnt.ttf \
    ../local/swcf/gwglyphs.ttf \
    ../local/swcf/swcf-hanmin-mapping.json
	mkdir -p ../local/swcf/hanmin
	docker run -i -v `pwd`:/app -v `pwd`/../local/swcf:/app/fonts \
	    node bash -c 'cd /app && node extract.js p'
	docker run -i -v `pwd`:/app -v `pwd`/../local/swcf:/app/fonts \
	    node bash -c 'cd /app && node composite.js p'
	rm -f ../local/swcf/hanmin/p.dat ../local/swcf/hanmin/p.json
../local/swcf/hanmin/q.ttf: \
    ../local/swcf/opentype.js extract.js composite.js \
    ../local/swcf/uk-1.ttf \
    ../local/swcf/uk-2.ttf \
    ../local/swcf/bsh.ttf \
    ../local/swcf/nnt.ttf \
    ../local/swcf/gwglyphs.ttf \
    ../local/swcf/swcf-hanmin-mapping.json
	mkdir -p ../local/swcf/hanmin
	docker run -i -v `pwd`:/app -v `pwd`/../local/swcf:/app/fonts \
	    node bash -c 'cd /app && node extract.js q'
	docker run -i -v `pwd`:/app -v `pwd`/../local/swcf:/app/fonts \
	    node bash -c 'cd /app && node composite.js q'
	rm -f ../local/swcf/hanmin/q.dat ../local/swcf/hanmin/q.json
../local/swcf/hanmin/r.ttf: \
    ../local/swcf/opentype.js extract.js composite.js \
    ../local/swcf/ajm.ttf \
    ../local/swcf/akr.ttf \
    ../local/swcf/cns-s0.ttf \
    ../local/swcf/cns-s2.ttf \
    ../local/swcf/cns-s15.ttf \
    ../local/swcf/nnt.ttf \
    ../local/swcf/gwglyphs.ttf \
    ../local/swcf/swcf-hanmin-mapping.json
	mkdir -p ../local/swcf/hanmin
	docker run -i -v `pwd`:/app -v `pwd`/../local/swcf:/app/fonts \
	    node bash -c 'cd /app && node extract.js r'
	docker run -i -v `pwd`:/app -v `pwd`/../local/swcf:/app/fonts \
	    node bash -c 'cd /app && node composite.js r'
	rm -f ../local/swcf/hanmin/r.dat ../local/swcf/hanmin/r.json
../local/swcf/hanmin/s.ttf: \
    ../local/swcf/opentype.js extract.js composite.js \
    ../local/swcf/ajm.ttf \
    ../local/swcf/akr.ttf \
    ../local/swcf/cns-s0.ttf \
    ../local/swcf/cns-s2.ttf \
    ../local/swcf/cns-s15.ttf \
    ../local/swcf/nnt.ttf \
    ../local/swcf/gwglyphs.ttf \
    ../local/swcf/swcf-hanmin-mapping.json
	mkdir -p ../local/swcf/hanmin
	docker run -i -v `pwd`:/app -v `pwd`/../local/swcf:/app/fonts \
	    node bash -c 'cd /app && node extract.js s'
	docker run -i -v `pwd`:/app -v `pwd`/../local/swcf:/app/fonts \
	    node bash -c 'cd /app && node composite.js s'
	rm -f ../local/swcf/hanmin/s.dat ../local/swcf/hanmin/s.json
../local/swcf/hanmin/pqr0.dat.gz: \
    ../local/swcf/opentype.js extract.js composite.js \
    ../local/swcf/mj.ttf \
    ../local/swcf/nnt.ttf \
    ../local/swcf/gwglyphs.ttf \
    ../local/swcf/swcf-hanmin-mapping.json
	mkdir -p ../local/swcf/hanmin
	docker run -i -v `pwd`:/app -v `pwd`/../local/swcf:/app/fonts \
	    node bash -c 'cd /app && node extract.js pqr0'
	gzip -f ../local/swcf/hanmin/pqr0.dat
	gzip -f ../local/swcf/hanmin/pqr0.json
../local/swcf/hanmin/pqr1.dat.gz: \
    ../local/swcf/opentype.js extract.js composite.js \
    ../local/swcf/uk-1.ttf \
    ../local/swcf/uk-2.ttf \
    ../local/swcf/bsh.ttf \
    ../local/swcf/nnt.ttf \
    ../local/swcf/gwglyphs.ttf \
    ../local/swcf/swcf-hanmin-mapping.json
	mkdir -p ../local/swcf/hanmin
	docker run -i -v `pwd`:/app -v `pwd`/../local/swcf:/app/fonts \
	    node bash -c 'cd /app && node extract.js pqr1'
	gzip -f ../local/swcf/hanmin/pqr1.dat
	gzip -f ../local/swcf/hanmin/pqr1.json
../local/swcf/hanmin/pqr2.dat.gz: \
    ../local/swcf/opentype.js extract.js composite.js \
    ../local/swcf/ajm.ttf \
    ../local/swcf/akr.ttf \
    ../local/swcf/cns-s0.ttf \
    ../local/swcf/cns-s2.ttf \
    ../local/swcf/cns-s15.ttf \
    ../local/swcf/nnt.ttf \
    ../local/swcf/gwglyphs.ttf \
    ../local/swcf/swcf-hanmin-mapping.json
	mkdir -p ../local/swcf/hanmin
	docker run -i -v `pwd`:/app -v `pwd`/../local/swcf:/app/fonts \
	    node bash -c 'cd /app && node extract.js pqr2'
	gzip -f ../local/swcf/hanmin/pqr2.dat
	gzip -f ../local/swcf/hanmin/pqr2.json

all.css: generate-css.pl \
    ../local/swcf/swcf-hanmin-mapping.json
	$(PERL) $< > $@

always:

## License: Public Domain.
