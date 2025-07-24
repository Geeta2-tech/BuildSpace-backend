npm i crypto bcrypt jsonwebtoken joi winston dotenv
const logger = require('./utils/loggers');

// Basic logging
logger.info('User logged in successfully');
logger.warn('API rate limit approaching');
logger.error('Database connection failed');
logger.debug('Debug information');

# **Environment Setup**

To set up the environment for the BuildSpace backend application, you will need to create a `.env` file in your `config` folder with the following variables:

### Required Variables

- `PORT` : The port number to use for the application.
- `DB_NAME` : The name of the MySQL database to use.
- `DB_USER` : The username to use for the MySQL database.
- `DB_PASSWORD` : The password to use for the MySQL database.
- `DB_HOST` : The **container name** of the MySQL database server.
- `DB_DIALECT` : The dialect to use for the MySQL database (e.g. `mysql`).
- `ENVIRONMENT` : The environment to use for the application (e.g. `development`, `production`).
- `SECRET_KEY` : A secret key to use for encryption and other security purposes.

# **Setting up Backend using Docker**

To set up Docker for this project, follow these steps:

### Step 1: Create a Docker network

Run the following command to create a Docker network:

```bash
npm run docker:network
```

This will create a Docker network named `buildspace_network`.

### Step 2: Connect the MySQL database to the network

Run the following command to connect the MySQL database to the network:

> **NOTE** : Run this command once you have a MYSQL container named `my-mysql` already set up.

```bash
npm run docker:db
```

This will connect the MySQL database to the `buildspace_network` network.

### Step 3: Build the Docker image

Run the following command to build the Docker image:

```bash
npm run docker:build
```

This will build a Docker image with the name `buildspace_backend`.

### Step 4: Run the Docker container

Run the following command to run the Docker container:

```bash
npm run docker:run
```

This will start a new Docker container from the `buildspace_backend` image and map port 3000 on the host machine to port 3000 in the container.

### Step 5: Start, Stop and remove the Docker container (optional)

To start, stop and remove the Docker container, run the following commands:

```bash
npm run docker:start
npm run docker:stop
npm run docker:rm
```

> **Note**: Make sure to stop the container before removing it.

That's it! You should now have a running Docker container with the BuildSpace backend application.


**APIs**
=============

**Auth API Endpoints**

The following endpoints are available for the AUTH APIs:

* `POST /auth/register`: Register a new user
* `POST /auth/login`: Login an existing user
* `POST /auth/logout`: Logout a user
* `POST /auth/forgot-password`: Send a password reset email to a user
* `POST /auth/reset-password`: Reset a user's password
* `POST /auth/send-verification`: Send an email verification link to a user
* `GET /auth/verify-email`: Verify a user's email address

**Using Swagger**
=================

The BuildSpace backend application uses Swagger to provide API documentation. To access the Swagger UI, navigate to `http://localhost:3333/api-docs` in your web browser.

> **Note:** Make sure to replace `http://localhost:3333` with the actual URL of your application.