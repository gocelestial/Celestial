FROM node:12

# Set up correct timezone
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Update npm to the latest version available
RUN npm update -g npm

# Set working dir for RUN, CMD, COPY, ENTRYPOINT to /app
WORKDIR /app

# Instruct the container to execute this by default
CMD ["npm", "start"]

# Expose the port the app starts on, so it can be accessed from outside the container
EXPOSE $PORT