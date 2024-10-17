CURL = curl
WGET = wget
SAVEURL = $(WGET) -O
GIT = git

all: data build

clean:

updatenightly: build-index
	$(CURL) -s -S -L https://gist.githubusercontent.com/wakaba/34a71d3137a52abb562d/raw/gistfile1.txt | sh
	$(GIT) add bin/modules generated
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

build: build-index data

data: deps data-main

data-main: glyph-images

glyph-images: bin/generate-images.pl local/glyphs.json
	$(PERL) $<

local/glyphs.json:
	$(SAVEURL) $@ https://raw.githubusercontent.com/suikawiki/extracted/master/data/extracted/data-glyph-.json

build-github-pages: git-submodules build-gp-main build-gp-index

build-gp-main:
	mkdir -p local
	docker run -v `pwd`/local:/local --user `id --user` quay.io/suikawiki/swfonts cp -R /app/fonts/opentype /local/opentype
	docker run -v `pwd`/local:/local --user `id --user` quay.io/suikawiki/swfonts cp -R /app/fonts/bdf /local/bdf
	docker run -v `pwd`/local:/local --user `id --user` quay.io/suikawiki/swfonts cp -R /app/fonts/glyphwiki /local/glyphwiki
	docker run -v `pwd`/local:/local --user `id --user` quay.io/suikawiki/swfonts cp -R /app/fonts/imageset /local/imageset
	docker run -v `pwd`/local:/local --user `id --user` quay.io/suikawiki/swfonts cp -R /app/fonts/swcf /local/swcf
	mv local/opentype local/bdf local/glyphwiki local/imageset ./
	mv local/swcf/* ./swcf/
	rm -fr ./bin/modules ./modules ./local

build-for-docker: build-for-docker-from-old \
    local/opentype/ipamjm00601 \
    local/opentype/ipamjm00101 \
    local/opentype/ipaexfont00401 \
    local/opentype/haranoaji-20220220 \
    local/opentype/haranoajicn-20220220 \
    local/opentype/haranoajitw-20220220 \
    local/opentype/haranoajikr-20220220 \
    local/opentype/haranoajik1-20220220 \
    local/opentype/haranoaji-20230610 \
    local/opentype/SourceHanSerifAKR9-20190729 \
    local/opentype/cjksymbols-1001 \
    local/opentype/cjksymbols-2000 \
    local/opentype/cns11643-20221114 \
    local/opentype/uk \
    local/opentype/babelstonehan-1512 \
    local/opentype/nom-506 \
    local/opentype/jis-engraving-080803 \
    local/opentype/unifont-15006 \
    local/opentype/GenEiKoburiMin-61 \
    local/opentype/hentaigana-r50630 \
    local/opentype/KiriMinL4002 \
    local/opentype/DroidSansFallback \
    local/opentype/hannomrcv \
    local/opentype/iming-800 \
    local/opentype/fallback-question/fallback-question.ttf \
    local/opentype/notoserif-2014 \
    local/opentype/notosans-2014 \
    local/bdf/intlfonts-1.4.2 \
    local/bdf/intlfonts-1.4.2/Japanese.X/jiskan16.dat \
    local/bdf/intlfonts-1.4.2/Japanese.X/jiskan24.dat \
    local/bdf/intlfonts-1.4.2/Japanese/j78-16.dat \
    local/bdf/intlfonts-1.4.2/Japanese/j90-16.dat \
    local/bdf/intlfonts-1.4.2/Japanese/jksp16.dat \
    local/bdf/intlfonts-1.4.2/Japanese/j00-1-16.dat \
    local/bdf/intlfonts-1.4.2/Japanese/j00-2-16.dat \
    local/bdf/intlfonts-1.4.2/Chinese/sish16-etl.dat \
    local/bdf/intlfonts-1.4.2/Chinese/guob16.dat \
    local/bdf/intlfonts-1.4.2/Chinese.X/gb16fs.dat \
    local/bdf/intlfonts-1.4.2/Chinese/taipei16.dat \
    local/bdf/intlfonts-1.4.2/Korean.X/hanglg16.bdf \
    local/bdf/intlfonts-1.4.2/Asian/ind1c24-mule.dat \
    local/bdf/intlfonts-1.4.2/Asian/ind24-mule.dat \
    local/bdf/intlfonts-1.4.2/Asian/isci24-mule.dat \
    local/bdf/intlfonts-1.4.2/Asian/lao16-mule.dat \
    local/bdf/intlfonts-1.4.2/Asian/thai16.dat \
    local/bdf/intlfonts-1.4.2/Asian/xtis24.dat \
    local/bdf/intlfonts-1.4.2/Asian/visc16-etl.dat \
    local/bdf/intlfonts-1.4.2/Asian/tib24-mule.dat \
    local/bdf/intlfonts-1.4.2/Asian/tib1c24-mule.dat \
    local/bdf/intlfonts-1.4.2/Misc/ipa16-etl.dat \
    local/bdf/intlfonts-1.4.2/European/cyr16-etl.dat \
    local/bdf/intlfonts-1.4.2/European/grk16-etl.dat \
    local/bdf/intlfonts-1.4.2/European/koi16-etl.dat \
    local/bdf/intlfonts-1.4.2/European/lt1-16-etl.dat \
    local/bdf/intlfonts-1.4.2/European/lt2-16-etl.dat \
    local/bdf/intlfonts-1.4.2/European/lt3-16-etl.dat \
    local/bdf/intlfonts-1.4.2/European/lt4-16-etl.dat \
    local/bdf/intlfonts-1.4.2/European/lt5-16-etl.dat \
    local/bdf/intlfonts-1.4.2/Misc/heb16-etl.dat \
    local/bdf/intlfonts-1.4.2/Misc/arab16-0-etl.dat \
    local/bdf/intlfonts-1.4.2/Misc/arab16-1-etl.dat \
    local/bdf/intlfonts-1.4.2/Misc/arab16-2-etl.dat \
    local/bdf/cgreek/cgreek16.dat \
    local/bdf/wqy-unibit110/wqy-unibit.dat \
    local/glyphwiki \
    local/imageset/wakan \
    local/imageset/tensho \
    local/imageset/modmag \
    local/imageset/kuzushiji \
    local/swcf
	-chmod ugo+r -R local/opentype local/bdf local/glyphwiki local/imageset
	-chmod ugo+r -R local/swcf

build-for-docker-from-old:
	mkdir -p local
	docker run -v `pwd`/local:/local --user `id --user` quay.io/suikawiki/swfonts cp -R /app/fonts/opentype /local/opentype
	docker run -v `pwd`/local:/local --user `id --user` quay.io/suikawiki/swfonts cp -R /app/fonts/bdf /local/bdf
	docker run -v `pwd`/local:/local --user `id --user` quay.io/suikawiki/swfonts cp -R /app/fonts/glyphwiki /local/glyphwiki
	docker run -v `pwd`/local:/local --user `id --user` quay.io/suikawiki/swfonts cp -R /app/fonts/imageset /local/imageset
	docker run -v `pwd`/local:/local --user `id --user` quay.io/suikawiki/swfonts cp -R /app/fonts/swcf /local/swcf || mkdir -p local/swcf

local/opentype/ipamjm00601:
	$(SAVEURL) local/ipamjm00601.zip https://dforest.watch.impress.co.jp/library/i/ipamjfont/10750/ipamjm00601.zip
	mkdir -p $@
	cd $@ && unzip ../../ipamjm00601.zip

local/opentype/ipamjm00101:
	$(SAVEURL) local/ipamjm00101.zip https://github.com/mandel59/MJView/raw/master/data/ipamjm00101.zip
	mkdir -p $@
	cd local && unzip ipamjm00101.zip
	mv local/ipamjm00101/* $@/

local/opentype/ipaexfont00401:
	$(SAVEURL) local/ipaexfont00401.zip https://moji.or.jp/wp-content/ipafont/IPAexfont/IPAexfont00401.zip
	mkdir -p $@
	cd local && unzip ipaexfont00401.zip
	mv local/IPAexfont00401/* $@/

local/opentype/haranoaji-20220220:
	mkdir -p $@
	$(SAVEURL) $@/LICENSE https://raw.githubusercontent.com/trueroad/HaranoAjiFonts/44a23f1296c892d63f54265cf127fae73f0837a8/LICENSE
	$(SAVEURL) $@/HaranoAjiGothic-ExtraLight.otf https://raw.githubusercontent.com/trueroad/HaranoAjiFonts/44a23f1296c892d63f54265cf127fae73f0837a8/HaranoAjiGothic-ExtraLight.otf
local/opentype/haranoajicn-20220220:
	mkdir -p $@
	$(SAVEURL) $@/LICENSE https://raw.githubusercontent.com/trueroad/HaranoAjiFontsCN/a99536d0ec64e6c0e1ece276064136a15dd41b87/LICENSE
	$(SAVEURL) $@/HaranoAjiGothicCN-ExtraLight.otf https://raw.githubusercontent.com/trueroad/HaranoAjiFontsCN/a99536d0ec64e6c0e1ece276064136a15dd41b87/HaranoAjiGothicCN-ExtraLight.otf
local/opentype/haranoajitw-20220220:
	mkdir -p $@
	$(SAVEURL) $@/LICENSE https://raw.githubusercontent.com/trueroad/HaranoAjiFontsTW/d48499ce7b819817046d23e1bb9b469e43bafd65/LICENSE
	$(SAVEURL) $@/HaranoAjiGothicTW-ExtraLight.otf https://raw.githubusercontent.com/trueroad/HaranoAjiFontsTW/d48499ce7b819817046d23e1bb9b469e43bafd65/HaranoAjiGothicTW-ExtraLight.otf
local/opentype/haranoajikr-20220220:
	mkdir -p $@
	$(SAVEURL) $@/LICENSE https://raw.githubusercontent.com/trueroad/HaranoAjiFontsKR/1937089673c70826c05e7c792f37b13436c61cd7/LICENSE
	$(SAVEURL) $@/HaranoAjiGothicKR-ExtraLight.otf https://raw.githubusercontent.com/trueroad/HaranoAjiFontsKR/1937089673c70826c05e7c792f37b13436c61cd7/HaranoAjiGothicKR-ExtraLight.otf
local/opentype/haranoajik1-20220220:
	mkdir -p $@
	$(SAVEURL) $@/LICENSE https://raw.githubusercontent.com/trueroad/HaranoAjiFontsK1/519e99bd545948726636359e71bb43ff51c0bf33/LICENSE
	$(SAVEURL) $@/HaranoAjiGothicK1-ExtraLight.otf https://raw.githubusercontent.com/trueroad/HaranoAjiFontsK1/519e99bd545948726636359e71bb43ff51c0bf33/HaranoAjiGothicK1-ExtraLight.otf
local/opentype/haranoaji-20230610:
	mkdir -p $@
	$(SAVEURL) $@/LICENSE  https://raw.githubusercontent.com/trueroad/HaranoAjiFonts/6984b4483e055b0cbdfcc0333789481a35792652/LICENSE
	$(SAVEURL) $@/HaranoAjiMincho-Regular.otf https://raw.githubusercontent.com/trueroad/HaranoAjiFonts/6984b4483e055b0cbdfcc0333789481a35792652/HaranoAjiMincho-Regular.otf
	$(SAVEURL) $@/HaranoAjiGothic-ExtraLight.otf https://raw.githubusercontent.com/trueroad/HaranoAjiFonts/6984b4483e055b0cbdfcc0333789481a35792652/HaranoAjiGothic-ExtraLight.otf
	$(SAVEURL) $@/HaranoAjiMinchoCN-Regular.otf https://raw.githubusercontent.com/trueroad/HaranoAjiFontsCN/43637fb3cb2453b44e344b9cf31bf06e71f88767/HaranoAjiMinchoCN-Regular.otf
	$(SAVEURL) $@/HaranoAjiGothicCN-ExtraLight.otf https://raw.githubusercontent.com/trueroad/HaranoAjiFontsCN/43637fb3cb2453b44e344b9cf31bf06e71f88767/HaranoAjiGothicCN-ExtraLight.otf
	$(SAVEURL) $@/HaranoAjiMinchoKR-Regular.otf https://raw.githubusercontent.com/trueroad/HaranoAjiFontsKR/554759cd1d0b72785753b278f5fb5598a99a6545/HaranoAjiMinchoKR-Regular.otf
	$(SAVEURL) $@/HaranoAjiGothicKR-ExtraLight.otf https://raw.githubusercontent.com/trueroad/HaranoAjiFontsKR/554759cd1d0b72785753b278f5fb5598a99a6545/HaranoAjiGothicKR-ExtraLight.otf
	$(SAVEURL) $@/HaranoAjiMinchoTW-Regular.otf https://raw.githubusercontent.com/trueroad/HaranoAjiFontsTW/b42aa02a4f8b5369ee130260a8f7c00f7ef2f9f5/HaranoAjiMinchoTW-Regular.otf
	$(SAVEURL) $@/HaranoAjiGothicTW-ExtraLight.otf https://raw.githubusercontent.com/trueroad/HaranoAjiFontsTW/b42aa02a4f8b5369ee130260a8f7c00f7ef2f9f5/HaranoAjiGothicTW-ExtraLight.otf
	$(SAVEURL) $@/HaranoAjiMinchoK1-Regular.otf https://raw.githubusercontent.com/trueroad/HaranoAjiFontsK1/e106eddb29fa0cb81ee95dddb70437f580681512/HaranoAjiMinchoK1-Regular.otf
	$(SAVEURL) $@/HaranoAjiGothicK1-ExtraLight.otf https://raw.githubusercontent.com/trueroad/HaranoAjiFontsK1/e106eddb29fa0cb81ee95dddb70437f580681512/HaranoAjiGothicK1-ExtraLight.otf

local/opentype/SourceHanSerifAKR9-20190729:
	mkdir -p $@
	$(SAVEURL) $@/SourceHanSerifAKR9-Regular.otf https://github.com/adobe-type-tools/Adobe-KR/releases/download/20190729/SourceHanSerifAKR9-Regular.otf

local/opentype/notoserif-2014:
	mkdir -p $@
	$(SAVEURL) local/notoserif2014.zip https://github.com/notofonts/latin-greek-cyrillic/releases/download/NotoSerif-v2.014/NotoSerif-v2.014.zip
	cd local && unzip notoserif2014.zip NotoSans/googlefonts/variable-ttf/NotoSerif\[wdth,wght\].ttf
	cd local && unzip notoserif2014.zip NotoSans/googlefonts/variable-ttf/NotoSerif-Italic\[wdth,wght\].ttf
	cd local && unzip notoserif2014.zip OFL.txt
	mv local/NotoSerif/googlefonts/variable-ttf/*.ttf $@/
	mv OFL.txt $@/
local/opentype/notosans-2014:
	mkdir -p $@
	$(SAVEURL) local/notosans2014.zip https://github.com/notofonts/latin-greek-cyrillic/releases/download/NotoSans-v2.014/NotoSans-v2.014.zip
	cd local && unzip notosans2014.zip NotoSans/googlefonts/variable-ttf/NotoSans\[wdth,wght\].ttf
	cd local && unzip notosans2014.zip NotoSans/googlefonts/variable-ttf/NotoSans-Italic\[wdth,wght\].ttf
	cd local && unzip notosans2014.zip OFL.txt
	mv local/NotoSans/googlefonts/variable-ttf/*.ttf $@/
	mv OFL.txt $@/

local/opentype/cjksymbols-1001:
	mkdir -p $@
	$(SAVEURL) $@/CJKSymbols-Regular.otf https://github.com/unicode-org/cjk-symbols/releases/download/1.001/CJKSymbols-Regular.otf
	$(SAVEURL) $@/LICENSE https://raw.githubusercontent.com/unicode-org/cjk-symbols/main/LICENSE
local/opentype/cjksymbols-2000:
	mkdir -p $@
	$(SAVEURL) $@/CJKSymbols-Regular.otf https://github.com/unicode-org/cjk-symbols/releases/download/2.000/CJKSymbols-Regular.otf
	$(SAVEURL) $@/LICENSE https://raw.githubusercontent.com/unicode-org/cjk-symbols/main/LICENSE

local/opentype/cns11643-20221114:
	$(SAVEURL) local/cns.zip https://www.cns11643.gov.tw/AIDB/Open_Data.zip
	-cd local && unzip cns.zip
	rm -f local/Open_Data/Fonts/*.txt
	mv local/Open_Data/Fonts $@
	$(SAVEURL) $@/license.html.txt https://data.gov.tw/license
	cp data/cns11643-20220713/cns-*.txt local/opentype/cns11643-20221114/

local/opentype/uk:
	mkdir -p local/opentype/uk
	$(SAVEURL) $@/IRGN2107.ttf https://github.com/unicode-org/uk-source-ideographs/releases/download/20210303/IRGN2107.ttf
	$(SAVEURL) $@/IRGN2232.ttf https://github.com/unicode-org/uk-source-ideographs/releases/download/20210303/IRGN2232.ttf
	$(SAVEURL) local/opentype/uk/LICENSE https://raw.githubusercontent.com/unicode-org/uk-source-ideographs/main/LICENSE
local/opentype/babelstonehan-1512:
	mkdir -p $@
	$(SAVEURL) $@/BabelStoneHan.ttf https://www.babelstone.co.uk/Fonts/Download/BabelStoneHan.ttf
	$(SAVEURL) $@/LICENSE.html.txt https://www.babelstone.co.uk/Fonts/Han.html

local/opentype/nom-506:
	mkdir -p $@
	$(SAVEURL) $@/NomNaTong-Regular.ttf https://github.com/nomfoundation/font/releases/download/v5.06/NomNaTong-Regular.ttf
	$(SAVEURL) $@/LICENSE https://github.com/nomfoundation/font/blob/master/LICENSE

local/opentype/unifont-15006:
	mkdir -p $@
	$(SAVEURL) $@/unifont.ttf https://unifoundry.com/pub/unifont/unifont-15.0.06/font-builds/unifont-15.0.06.ttf
	$(SAVEURL) $@/unifont_upper.ttf https://unifoundry.com/pub/unifont/unifont-15.0.06/font-builds/unifont_upper-15.0.06.ttf
	$(SAVEURL) $@/unifont_csur.ttf https://unifoundry.com/pub/unifont/unifont-15.0.06/font-builds/unifont_csur-15.0.06.ttf
	$(SAVEURL) $@/index.html.txt https://unifoundry.com/unifont/index.html

local/GenEiKoburiMin_v6.1.zip:
	$(SAVEURL) $@.gz https://okoneya.jp/font/GenEiKoburiMin_v6.1.zip
	gzip -d $@.gz
local/GenEiKoburiMin_v6.1a: local/GenEiKoburiMin_v6.1.zip
	cd local && unzip GenEiKoburiMin_v6.1.zip
local/opentype/GenEiKoburiMin-61:
	$(MAKE) local/GenEiKoburiMin_v6.1a
	mkdir -p $@
	cp local/GenEiKoburiMin_v6.1a/GenEiKoburiMin6-R.ttf $@/
	cp local/GenEiKoburiMin_v6.1a/OFLicense.txt $@/

local/bin/lhasa: local/lhasa-0.2.0.tar.gz
	mkdir -p local/bin
	cd local && tar zxf lhasa-0.2.0.tar.gz
	cd local/lhasa-0.2.0 && ./configure && make
	cp local/lhasa-0.2.0/src/lha local/bin/lhasa
local/lhasa-0.2.0.tar.gz:
	mkdir -p local
	$(SAVEURL) $@ https://soulsphere.org/projects/lhasa/lhasa-0.2.0.tar.gz

local/JIS-Engraving-080803.lzh:
	$(SAVEURL) $@ http://izumilib.web.fc2.com/jis-engraving/JIS-Engraving-080803.lzh
local/opentype/jis-engraving-080803:
	$(MAKE) local/bin/lhasa local/JIS-Engraving-080803.lzh
	mkdir -p $@
	cd $@ && ../../../local/lhasa-0.2.0/src/lha xf ../../../$<
	rm $@/*.sfd

local/opentype/hentaigana-r50630:
	mkdir -p $@
	$(SAVEURL) $@/hentaigana-r50630.ttf https://wakaba.github.io/nemui/local/data/hentaigana-r50630.ttf
	$(SAVEURL) $@/4889029.html.txt https://hentaigana.booth.pm/items/4889029

local/kml.zip:
	$(SAVEURL) $@ http://www.akenotsuki.com/eyeben/fonts/files/KiriMinL4_002.zip
local/KiriMinL.otf: local/kml.zip
	cd local && unzip kml.zip
	touch $@
local/opentype/KiriMinL4002:
	$(MAKE) local/KiriMinL.otf
	mkdir -p $@
	cp local/KiriMinL.otf $@/KiriMinL.otf
	$(SAVEURL) $@/kirimin.html.txt http://www.akenotsuki.com/eyeben/fonts/kirimin.html

local/opentype/DroidSansFallback:
	mkdir -p $@
	$(SAVEURL) $@/DroidSansFallback-ff.ttf https://raw.githubusercontent.com/jenskutilek/free-fonts/master/Droid/Droid%20Sans%20Fallback/DroidSansFallback.ttf
	$(SAVEURL) $@/LICENSE-ff.txt https://raw.githubusercontent.com/jenskutilek/free-fonts/master/LICENSE.txt
	$(SAVEURL) $@/DroidSansFallback-aosp.ttf https://raw.githubusercontent.com/aosp-mirror/platform_frameworks_base/master/data/fonts/DroidSansFallback.ttf
	$(SAVEURL) $@/DroidSansFallbackFull-aosp.ttf https://raw.githubusercontent.com/aosp-mirror/platform_frameworks_base/master/data/fonts/DroidSansFallbackFull.ttf
	$(SAVEURL) $@/LICENSE-aosp.txt https://raw.githubusercontent.com/aosp-mirror/platform_frameworks_base/master/data/fonts/README.txt

local/opentype/hannomrcv:
	mkdir -p $@
	$(SAVEURL) $@/MinhNguyenExtraLight.ttf https://github.com/TKYKmori/Minh-Nguyen/raw/main/Minh%20Nguyen%20ExtraLight.ttf
	$(SAVEURL) $@/GothicNguyenRegular.ttf https://github.com/TKYKmori/Gothic-Nguyen/raw/main/Gothic%20Nguyen%20Regular.ttf
	$(SAVEURL) $@/HanNomKhaiRegular300623.ttf https://x0.at/XLFz.ttf
	$(SAVEURL) $@/README.md.minh https://github.com/TKYKmori/Minh-Nguyen/raw/main/README.md
	$(SAVEURL) $@/README.md.gothic https://github.com/TKYKmori/Gothic-Nguyen/blob/main/README.md

local/opentype/iming-800:
	mkdir -p $@
	$(SAVEURL) $@/IMing.ttf https://github.com/ichitenfont/I.Ming/raw/master/8.00/I.Ming-8.00.ttf
	$(SAVEURL) $@/LICENSE.md.txt https://github.com/ichitenfont/I.Ming/raw/master/8.00/IPA_Font_License_Agreement_v1.0.md

local/opentype.js:
	$(SAVEURL) $@ https://raw.githubusercontent.com/manakai/opentypejs/master/dist/opentype.js

local/fallback-question.ttf: bin/create-fallback-question.js local/opentype.js
	docker run -i -v `pwd`:/app node bash -c 'cd /app && node bin/create-fallback-question.js'

local/opentype/fallback-question/fallback-question.ttf:
	mkdir -p local/opentype/fallback-question
	$(MAKE) local/fallback-question.ttf
	cp local/fallback-question.ttf $@

local/bdf/intlfonts-1.4.2:
	$(SAVEURL) local/intlfonts-1.4.2.tar.gz https://ftp.gnu.org/gnu/intlfonts/intlfonts-1.4.2.tar.gz
	mkdir -p $@
	cd local/bdf && tar zxf ../intlfonts-1.4.2.tar.gz
local/bdf/intlfonts-1.4.2/Chinese/sish16-etl.dat \
local/bdf/intlfonts-1.4.2/Asian/lao16-mule.dat \
local/bdf/intlfonts-1.4.2/Asian/thai16.dat \
local/bdf/intlfonts-1.4.2/Asian/visc16-etl.dat \
local/bdf/intlfonts-1.4.2/Misc/ipa16-etl.dat \
local/bdf/intlfonts-1.4.2/Misc/bmp16-etl.dat \
local/bdf/intlfonts-1.4.2/Misc/heb16-etl.dat \
local/bdf/intlfonts-1.4.2/Misc/arab16-0-etl.dat \
local/bdf/intlfonts-1.4.2/Misc/arab16-1-etl.dat \
local/bdf/intlfonts-1.4.2/European/cyr16-etl.dat \
local/bdf/intlfonts-1.4.2/European/grk16-etl.dat \
local/bdf/intlfonts-1.4.2/European/koi16-etl.dat \
local/bdf/intlfonts-1.4.2/European/lt1-16-etl.dat \
local/bdf/intlfonts-1.4.2/European/lt2-16-etl.dat \
local/bdf/intlfonts-1.4.2/European/lt3-16-etl.dat \
local/bdf/intlfonts-1.4.2/European/lt4-16-etl.dat \
local/bdf/intlfonts-1.4.2/European/lt5-16-etl.dat \
:: %.dat: %.bdf bin/bdftodat.pl
	$(PERL) bin/bdftodat.pl $< $@ raw 16/2
local/bdf/intlfonts-1.4.2/Misc/arab16-2-etl.dat \
:: %.dat: %.bdf bin/bdftodat.pl
	$(PERL) bin/bdftodat.pl $< $@ raw 16
local/bdf/intlfonts-1.4.2/Asian/isci24-mule.dat \
:: %.dat: %.bdf bin/bdftodat.pl
	$(PERL) bin/bdftodat.pl $< $@ raw 24
local/bdf/intlfonts-1.4.2/Japanese.X/jiskan16.dat \
local/bdf/intlfonts-1.4.2/Japanese/j78-16.dat \
local/bdf/intlfonts-1.4.2/Japanese/j90-16.dat \
local/bdf/intlfonts-1.4.2/Japanese/jksp16.dat \
local/bdf/intlfonts-1.4.2/Japanese/j00-1-16.dat \
local/bdf/intlfonts-1.4.2/Japanese/j00-2-16.dat \
local/bdf/intlfonts-1.4.2/Chinese/guob16.dat \
local/bdf/intlfonts-1.4.2/Chinese.X/gb16fs.dat \
local/bdf/intlfonts-1.4.2/Korean.X/hanglg16.dat \
:: %.dat: %.bdf bin/bdftodat.pl
	$(PERL) bin/bdftodat.pl $< $@ 9494 16
local/bdf/intlfonts-1.4.2/Chinese/taipei16.dat \
:: %.dat: %.bdf bin/bdftodat.pl
	$(PERL) bin/bdftodat.pl $< $@ dbcs 16
local/bdf/intlfonts-1.4.2/Japanese.X/jiskan24.dat \
local/bdf/intlfonts-1.4.2/Asian/ind24-mule.dat \
local/bdf/intlfonts-1.4.2/Asian/tib24-mule.dat \
:: %.dat: %.bdf bin/bdftodat.pl
	$(PERL) bin/bdftodat.pl $< $@ 9494 24
local/bdf/intlfonts-1.4.2/Asian/ind1c24-mule.dat \
local/bdf/intlfonts-1.4.2/Asian/xtis24.dat \
local/bdf/intlfonts-1.4.2/Asian/tib1c24-mule.dat \
:: %.dat: %.bdf bin/bdftodat.pl
	$(PERL) bin/bdftodat.pl $< $@ 9494 24/2

local/cgreek-2.tar.gz:
	$(SAVEURL) $@ http://ring.ix.oita-u.ac.jp/archives/pc/meadow/2.00/packages/cgreek-2-pkg.tar.gz
local/cgreek-2:
	$(MAKE) local/cgreek-2.tar.gz
	mkdir -p $@
	cd $@ && tar zxf ../../$<
local/cgreek-2/fonts/cgreek/cgreek16.bdf: local/cgreek-2

local/bdf/cgreek/cgreek16.bdf:
	$(MAKE) local/cgreek-2/fonts/cgreek/cgreek16.bdf
	mkdir -p local/bdf/cgreek
	cp $< $@
local/bdf/cgreek/cgreek16.dat:
	$(MAKE) local/bdf/cgreek/cgreek16.bdf bin/bdftodat.pl
	$(PERL) bin/bdftodat.pl $< $@ raw 16/2

local/unibit110.tar.gz:
	$(SAVEURL) $@ https://master.dl.sourceforge.net/project/wqy/wqy-unibit/1.1.0/wqy-unibit-bdf-1.1.0-1.tar.gz?viasf=1
local/wqy-unibit: local/unibit110.tar.gz
	cd local && tar zxf ../$<
local/bdf/wqy-unibit110:
	$(MAKE) local/wqy-unibit
	mkdir -p $@
	cp local/wqy-unibit/wqy-unibit.bdf $@/wqy-unibit.bdf
	cp local/wqy-unibit/README $@/README
local/bdf/wqy-unibit110/wqy-unibit.bdf: local/bdf/wqy-unibit110
local/bdf/wqy-unibit110/wqy-unibit.dat: \
    local/bdf/wqy-unibit110/wqy-unibit.bdf  bin/bdftodat.pl
	$(PERL) bin/bdftodat.pl $< $@ raw 16

local/glyphwiki:
	mkdir -p local/glyphwiki
	$(SAVEURL) $@ https://glyphwiki.org/wiki/GlyphWiki:%e3%83%87%e3%83%bc%e3%82%bf%e3%83%bb%e8%a8%98%e4%ba%8b%e3%81%ae%e3%83%a9%e3%82%a4%e3%82%bb%e3%83%b3%e3%82%b9
	#$(SAVEURL) $@/dump-1.tar.gz https://glyphwiki.org/dump.tar.gz
	#$(SAVEURL) $@/dump-2.tar.gz https://glyphwiki.org/dump.tar.gz
#local/glyphwiki/dump-2.tar.gz:
#	$(SAVEURL) $@ https://glyphwiki.org/dump.tar.gz

local/imageset/wakan:
	cd local && $(WGET) -r -l 1 -np https://wakaba.github.io/nemui/local/data/wakan/index.html
	mv local/wakaba.github.io/nemui/local/data/wakan/ $@
	$(SAVEURL) $@/wakan.html.txt https://kana.aa-ken.jp/wakan/
	#$(SAVEURL) $@ https://wakaba.github.io/nemui/local/data/wakan/image-index.json

local/imageset/tensho:
	mkdir -p $@
	$(SAVEURL) $@/image-index.json https://x0.at/sdve.json

local/imageset/kuzushiji:
	mkdir -p $@
	$(SAVEURL) local/kuzushiji-images.tar.gz https://x0.at/Pzis.tar.gz
	cd $@ && tar zxf ../../kuzushiji-images.tar.gz
	mv $@/kuzushiji-images $@/image-index

local/imageset/modmag:
	mkdir -p $@
	$(SAVEURL) local/modmag-images.tar.gz https://wakaba.github.io/nemui/modmag-image.tar.gz
	cd $@ && tar zxf ../../modmag-images.tar.gz
	mv $@/modmag-images $@/image-index

local/swcf: always
	cd swcf && $(MAKE)

build-index: generated/fonts.css local/opentype/index/all.css

generated/fonts.css: bin/generate-index.pl \
    config/fonts.json
	$(PERL) $<

build-gp-index: opentype/index/all.css

opentype/index/all.css: generated/fonts.css
	mkdir -p opentype/index
	cp $< $@
local/opentype/index/all.css: generated/fonts.css
	mkdir -p local/opentype/index
	cp generated/fonts.css $@

## ------ Tests ------

test: test-main test-deps

test-deps: deps

test-main:
	$(PERL) -c bin/generate-images.pl

always:

## License: Public Domain.
