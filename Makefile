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

## ------ Tests ------

test: test-main test-deps

test-deps: deps

test-main:
	$(PERL) -c bin/generate-images.pl

## License: Public Domain.
