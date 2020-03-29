// eslint-disable-next-line strict
module.exports = {
  db: {
    'name': 'db',
    'connector': 'memory',
  },
  'heroku_postgres': {
    'url': process.env.DATABASE_URL,
    'ssl': process.env.DATABASE_DISABLE_SSL !== 'true',
    'connector': 'postgresql',
  },
  'mailjet': {
    'connector': 'loopback-connector-mailjet',
    'apiKey': process.env.MAILJET_API_KEY,
    'apiSecret': process.env.MAILJET_API_SECRET,
    'options': {
      'url': 'api.mailjet.com',
      'version': 'v3.1',
      'perform_api_call': false,
    },
  },
};
