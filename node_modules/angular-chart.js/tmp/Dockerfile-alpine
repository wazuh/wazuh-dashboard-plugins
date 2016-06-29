#FROM rafakato/alpine-graphicsmagick
RUN apk add --update --no-cache \
	build-base \
	python \
	git \
	nodejs \
	curl \
	ca-certificates
WORKDIR /src
ADD . ./
RUN adduser -S node
RUN chown -R node /src
USER node
RUN npm install && npm install bower && ./node_modules/bower/bin/bower install
CMD ["npm", "test"]
