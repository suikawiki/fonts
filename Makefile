CURL = curl
WGET = wget
GIT = git

all: data

clean:

updatenightly: 
	$(CURL) -s -S -L https://gist.githubusercontent.com/wakaba/34a71d3137a52abb562d/raw/gistfile1.txt | sh
	$(GIT) add bin/modules
	perl local/bin/pmbp.pl --update
	$(GIT) add config
	$(CURL) -sSLf https://raw.githubusercontent.com/wakaba/ciconfig/master/ciconfig | RUN_GIT=1 REMOVE_UNUSED=1 perl

updatebyhook: data
	$(GIT) add images/

## ------ Setup ------

PERL = ./perl

deps: git-submodules pmbp-install

git-submodules:
	$(GIT) submodule update --init

local/bin/pmbp.pl:
	mkdir -p local/bin
	$(CURL) -s -S -L -f https://raw.githubusercontent.com/pawjy/perl-setupenv/master/bin/pmbp.pl > $@
pmbp-upgrade: local/bin/pmbp.pl
	perl local/bin/pmbp.pl --update-pmbp-pl
pmbp-update: git-submodules pmbp-upgrade
	perl local/bin/pmbp.pl --update
pmbp-install: pmbp-upgrade
	perl local/bin/pmbp.pl --install \
            --create-perl-command-shortcut perl

## ------ Build ------

data: deps data-main

data-main: glyph-images

glyph-images: bin/generate-images.pl local/glyphs.json
	$(PERL) $<

local/glyphs.json:
	$(WGET) -O $@ https://raw.githubusercontent.com/suikawiki/extracted/master/data/extracted/data-glyph-.json

build-github-pages: git-submodules
	mkdir -p local
	docker run -v `pwd`/local:/local --user `id --user` quay.io/suikawiki/swfonts cp -R /app/fonts/opentype /local/opentype
	docker run -v `pwd`/local:/local --user `id --user` quay.io/suikawiki/swfonts cp -R /app/fonts/bdf /local/bdf
	mv local/opentype local/bdf ./
	rm -fr ./bin/modules ./modules ./local

build-for-docker: build-for-docker-from-old \
    local/opentype/ipamjm00601 \
    local/opentype/haranoaji-20220220 \
    local/opentype/haranoajicn-20220220 \
    local/opentype/haranoajitw-20220220 \
    local/opentype/haranoajikr-20220220 \
    local/opentype/haranoajik1-20220220 \
    local/opentype/SourceHanSerifAKR9-20190729 \
    local/opentype/cns11643-20221114 \
    local/bdf/intlfonts-1.4.2 \
    local/bdf/intlfonts-1.4.2/Japanese.X/jiskan16.dat \
    local/bdf/intlfonts-1.4.2/Japanese.X/jiskan24.dat
	chmod ugo+r -R local/opentype local/bdf

build-for-docker-from-old:
	mkdir -p local
	docker run -v `pwd`/local:/local --user `id --user` quay.io/suikawiki/swfonts cp -R /app/fonts/opentype /local/opentype
	docker run -v `pwd`/local:/local --user `id --user` quay.io/suikawiki/swfonts cp -R /app/fonts/bdf /local/bdf

	#XXX
	rm -fr local/opentype/haranoaji*

local/opentype/ipamjm00601:
	$(WGET) -O local/ipamjm00601.zip https://dforest.watch.impress.co.jp/library/i/ipamjfont/10750/ipamjm00601.zip
	mkdir -p $@
	cd $@ && unzip ../../ipamjm00601.zip

local/opentype/haranoaji-20220220:
	mkdir -p $@
	$(WGET) -O $@/LICENSE https://raw.githubusercontent.com/trueroad/HaranoAjiFonts/44a23f1296c892d63f54265cf127fae73f0837a8/LICENSE
	$(WGET) -O $@/HaranoAjiGothic-ExtraLight.otf https://raw.githubusercontent.com/trueroad/HaranoAjiFonts/44a23f1296c892d63f54265cf127fae73f0837a8/HaranoAjiGothic-ExtraLight.otf
local/opentype/haranoajicn-20220220:
	mkdir -p $@
	$(WGET) -O $@/LICENSE https://raw.githubusercontent.com/trueroad/HaranoAjiFontsCN/a99536d0ec64e6c0e1ece276064136a15dd41b87/LICENSE
	$(WGET) -O $@/HaranoAjiGothicCN-ExtraLight.otf https://raw.githubusercontent.com/trueroad/HaranoAjiFontsCN/a99536d0ec64e6c0e1ece276064136a15dd41b87/HaranoAjiGothicCN-ExtraLight.otf
local/opentype/haranoajitw-20220220:
	mkdir -p $@
	$(WGET) -O $@/LICENSE https://raw.githubusercontent.com/trueroad/HaranoAjiFontsTW/d48499ce7b819817046d23e1bb9b469e43bafd65/LICENSE
	$(WGET) -O $@/HaranoAjiGothicTW-ExtraLight.otf https://raw.githubusercontent.com/trueroad/HaranoAjiFontsTW/d48499ce7b819817046d23e1bb9b469e43bafd65/HaranoAjiGothicTW-ExtraLight.otf
local/opentype/haranoajikr-20220220:
	mkdir -p $@
	$(WGET) -O $@/LICENSE https://raw.githubusercontent.com/trueroad/HaranoAjiFontsKR/1937089673c70826c05e7c792f37b13436c61cd7/LICENSE
	$(WGET) -O $@/HaranoAjiGothicKR-ExtraLight.otf https://raw.githubusercontent.com/trueroad/HaranoAjiFontsKR/1937089673c70826c05e7c792f37b13436c61cd7/HaranoAjiGothicKR-ExtraLight.otf
local/opentype/haranoajik1-20220220:
	mkdir -p $@
	$(WGET) -O $@/LICENSE https://raw.githubusercontent.com/trueroad/HaranoAjiFontsK1/519e99bd545948726636359e71bb43ff51c0bf33/LICENSE
	$(WGET) -O $@/HaranoAjiGothicK1-ExtraLight.otf https://raw.githubusercontent.com/trueroad/HaranoAjiFontsK1/519e99bd545948726636359e71bb43ff51c0bf33/HaranoAjiGothicK1-ExtraLight.otf
local/opentype/SourceHanSerifAKR9-20190729:
	mkdir -p $@
	$(WGET) -O $@/SourceHanSerifAKR9-Regular.otf https://github.com/adobe-type-tools/Adobe-KR/releases/download/20190729/SourceHanSerifAKR9-Regular.otf

local/opentype/cns11643-20221114:
	$(WGET) -O local/cns.zip https://www.cns11643.gov.tw/AIDB/Open_Data.zip
	-cd local && unzip cns.zip
	rm -f local/Open_Data/Fonts/*.txt
	mv local/Open_Data/Fonts $@
	$(WGET) -O $@/license.html https://data.gov.tw/license

local/bdf/intlfonts-1.4.2:
	$(WGET) -O local/intlfonts-1.4.2.tar.gz https://ftp.gnu.org/gnu/intlfonts/intlfonts-1.4.2.tar.gz
	mkdir -p $@
	cd local/bdf && tar zxf ../intlfonts-1.4.2.tar.gz
local/bdf/intlfonts-1.4.2/Japanese.X/jiskan16.dat \
:: %.dat: %.bdf bin/bdftodat.pl
	$(PERL) bin/bdftodat.pl $< $@ 16
local/bdf/intlfonts-1.4.2/Japanese.X/jiskan24.dat \
:: %.dat: %.bdf bin/bdftodat.pl
	$(PERL) bin/bdftodat.pl $< $@ 24

## ------ Tests ------

test: test-main test-deps

test-deps: deps

test-main:
	$(PERL) -c bin/generate-images.pl

## License: Public Domain.
