const SENTRY_DSN = process.env.SENTRY_DSN;
const express = require('express');
const compression = require('compression');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const routes = require('./routes/index');
const data = require('./routes/data');
const update = require('./routes/update');
const app = express();
const ftwebservice = require('express-ftwebservice');
const hbs = require('express-hbs');
const raven = require('raven');
const client = new raven.Client(SENTRY_DSN);
client.patchGlobal();

ftwebservice(app, {
	manifestPath: path.join(__dirname, '../package.json'),
	about: require('./runbook.json'),
	healthCheck: require('./healthcheck'),
	goodToGoTest: () => Promise.resolve(true) // TODO
});

// view engine setup
app.engine('hbs', hbs.express4({
  partialsDir: path.join(__dirname, '/views/partials')
}));
app.set('views', path.join(__dirname, 'views')); //TODO: remove this
app.set('view engine', 'hbs');

// Set-up error reporting to sentry
app.use(raven.middleware.express.requestHandler(SENTRY_DSN));
app.use(raven.middleware.express.errorHandler(SENTRY_DSN));

app.use(compression({threshold: 0})); //TODO: Use Fastly or Akamai to compress resources
app.use(logger('dev'));

// Remove
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
// Remove ^^

app.use('/static', express.static(path.join(__dirname, '../client/dist')));

app.use('/', routes);
app.use('/data', data);
app.use('/update', update);

app.use(function (req, res) {
  res.sendStatus(404); // TODO: Redirect to FT 404 Page?
});


module.exports = app;
