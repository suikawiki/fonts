all: frq0.ttf

../local/opentype.js:
	cd .. && $(MAKE) local/opentype.js

frq0.ttf: create-fallback-question.js ../local/opentype.js otwriter.js
	docker run -i -v `pwd`:/app -v `pwd`/../local/:/app/local/ -w /app node node create-fallback-question.js

## License: Public Domain.
