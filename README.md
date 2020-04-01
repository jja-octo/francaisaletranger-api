# Plateforme de mise en relation des français bloqués à l&#39;étranger - API

This is the backend of `francaisaletranger` app.

The project is generated by [LoopBack](http://loopback.io).

## Requirements

- node 13.8+
- yarn
- PostgreSQL 12.2+ with psotgis & uuid-ossp extensions
- Mailjet

## Setup

Create the database using the [provided schema](schema.sql).

Copy `.env.example` to `.env` & set the right values on environment variables in this file.

You'll need to add `DATABASE_DISABLE_SSL=true` if your local database does not support SSL.

```bash
# install dependencies
$ yarn install

# run tests
yarn test

# run tests in watch mode
yarn test --watch

# Launch on localhost:3001
$ yarn start

```

