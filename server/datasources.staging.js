// eslint-disable-next-line strict
module.exports = {
  db: {
    'name': 'db',
    'connector': 'memory',
  },
  'heroku_postgres': {
    'url': process.env.DATABASE_URL,
    'connector': 'postgresql',
  },
};
