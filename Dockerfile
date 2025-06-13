# Use an official Node.js runtime as a parent image
FROM node:20

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install any needed packages specified in package.json
RUN npm install

# Copy the remaining application code to the working directory
COPY . .

RUN npm run build

# Make port 3004 available to the world outside this container
EXPOSE 3004

# Run npm start when the container launches
CMD ["npm", "start", "--", "--port", "3004", "-H", "0.0.0.0"]