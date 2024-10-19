WGET = wget
SAVEURL = $(WGET) -O

ROOT_PATH = ../

all: build

build: ddsd-pull build-main

build-main: \
    namelogosserif.ttf namelogosserif-italic.ttf \
    namelogossans.ttf namelogossans-italic.ttf \
    namelogosserif2.ttf \
    LICENSE.ttf.txt LICENSE.ttf2.txt

ddsd-booter:
	cd .. && $(MAKE) ddsd-booter
ddsd-pull:
	cd .. && $(MAKE) ddsd-pull

../local/namelogos/opentype.js:
	mkdir -p ../local/namelogos
	$(SAVEURL) $@ https://raw.githubusercontent.com/manakai/opentypejs/master/dist/opentype.js

namelogosserif.ttf: \
    ../local/namelogos/opentype.js generate.js \
    ../local/data/notoserif/files/NotoSerif_wdth_wght_.ttf
	mkdir -p ../local/namelogos
	docker run -i -v `pwd`:/app \
	    -v `pwd`/../local/namelogos:/app/namelogos \
	    -v `pwd`/../local/data:/app/data \
	    node bash -c 'cd /app && node generate.js serif'
namelogosserif-italic.ttf: \
    ../local/namelogos/opentype.js generate.js \
    ../local/data/notoserif/files/NotoSerif-Italic_wdth_wght_.ttf
	mkdir -p ../local/namelogos
	docker run -i -v `pwd`:/app \
	    -v `pwd`/../local/namelogos:/app/namelogos \
	    -v `pwd`/../local/data:/app/data \
	    node bash -c 'cd /app && node generate.js serifitalic'
namelogossans.ttf: \
    ../local/namelogos/opentype.js generate.js \
    ../local/data/notosans/files/NotoSans_wdth_wght_.ttf
	mkdir -p ../local/namelogos
	docker run -i -v `pwd`:/app \
	    -v `pwd`/../local/namelogos:/app/namelogos \
	    -v `pwd`/../local/data:/app/data \
	    node bash -c 'cd /app && node generate.js sans'
namelogossans-italic.ttf: \
    ../local/namelogos/opentype.js generate.js \
    ../local/data/notosans/files/NotoSans-Italic_wdth_wght_.ttf
	mkdir -p ../local/namelogos
	docker run -i -v `pwd`:/app \
	    -v `pwd`/../local/namelogos:/app/namelogos \
	    -v `pwd`/../local/data:/app/data \
	    node bash -c 'cd /app && node generate.js sansitalic'

LICENSE.ttf.txt: ../local/data/notoserif/files/OFL.txt
	cp $< $@

namelogosserif2.ttf: \
    ../local/namelogos/opentype.js generate.js \
    ../local/data/haranoajim/files/HaranoAjiMincho-Regular.otf
	mkdir -p ../local/namelogos
	docker run -i -v `pwd`:/app \
	    -v `pwd`/../local/namelogos:/app/namelogos \
	    -v `pwd`/../local/data:/app/data \
	    node bash -c 'cd /app && node generate.js haranoajim'

LICENSE.ttf2.txt: ../local/data/haranoajim/files/LICENSE
	cp $< $@

## License: Public Domain.
