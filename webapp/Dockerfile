FROM node:0.10-onbuild

# Bundle app source
COPY . /src

# Install app dependencies
RUN cd /src
RUN npm install
RUN /bin/bash -c "source ./setenv.sh"

EXPOSE 3000

CMD ["npm", "start"]

