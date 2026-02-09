PERL = ../perl
WGET = wget
SAVEURL = $(WGET) -O

LOCAL_PATH = ../local/swmlrefs

all: list.html

$(LOCAL_PATH)/replaces.json:
	mkdir -p $(LOCAL_PATH)
	$(SAVEURL) $@ https://raw.githubusercontent.com/suikawiki/extracted/refs/heads/master/data/extracted/stats-swml_5Freplace-.json

list.html: $(LOCAL_PATH)/replaces.json list.pl
	$(PERL) list.pl $< > $@

## License: Public Domain.
