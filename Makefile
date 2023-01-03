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
    local/opentype/haranoaji-20200220 \
    local/bdf/intlfonts-1.4.2
	chmod ugo+r -R local/opentype local/bdf

build-for-docker-from-old:
	mkdir -p local/opentype
	-docker run -v `pwd`/local:/local --user `id --user` quay.io/suikawiki/swfonts cp -R /app/fonts/opentype /local/opentype
	-docker run -v `pwd`/local:/local --user `id --user` quay.io/suikawiki/swfonts cp -R /app/fonts/bdf /local/bdf

local/opentype/ipamjm00601:
	$(WGET) -O local/ipamjm00601.zip https://dforest.watch.impress.co.jp/library/i/ipamjfont/10750/ipamjm00601.zip
	mkdir -p $@
	cd $@ && unzip ../../ipamjm00601.zip

local/opentype/haranoaji-20200220:
	mkdir -p $@
	$(WGET) -O LICENSE https://raw.githubusercontent.com/trueroad/HaranoAjiFonts/44a23f1296c892d63f54265cf127fae73f0837a8/LICENSE
	$(WGET) -O HaranoAjiGothic-ExtraLight.otf https://raw.githubusercontent.com/trueroad/HaranoAjiFonts/44a23f1296c892d63f54265cf127fae73f0837a8/HaranoAjiGothic-ExtraLight.otf

local/bdf/intlfonts-1.4.2:
	$(WGET) -O local/intlfonts-1.4.2.tar.gz https://ftp.gnu.org/gnu/intlfonts/intlfonts-1.4.2.tar.gz
	mkdir -p $@
	cd local/bdf && tar zxf ../intlfonts-1.4.2.tar.gz

## ------ Tests ------

test: test-main test-deps

test-deps: deps

test-main:
	$(PERL) -c bin/generate-images.pl

## License: Public Domain.
