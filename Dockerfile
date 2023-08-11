FROM quay.io/wakaba/base:sid

ADD images/ /app/fonts/images/
ADD local/opentype/ /app/fonts/opentype/
ADD local/bdf/ /app/fonts/bdf/
ADD local/glyphwiki/ /app/fonts/glyphwiki/

## License: Public Domain.