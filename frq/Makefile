all: fallback-question.ttf

../local/opentype.js:
	cd .. && $(MAKE) local/opentype.js

fallback-question.ttf: create-fallback-question.js ../local/opentype.js
	docker run -i -v `pwd`:/app -v `pwd`/../local/opentype.js:/app/opentype.js -w /app node node create-fallback-question.js

## License: Public Domain.
