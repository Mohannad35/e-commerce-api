import * as Sentry from '@sentry/node';
import logger from '../middleware/logger.js';
import config from 'config';

export default function init(app) {
	if (process.env.DSN && process.env.DSN !== '') {
		Sentry.init({
			dsn: process.env.DSN,
			integrations: [
				// enable HTTP calls tracing
				new Sentry.Integrations.Http({ tracing: true }),
				// enable Express.js middleware tracing
				new Sentry.Integrations.Express({ app }),
				// Automatically instrument Node.js libraries and frameworks
				...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations()
			],

			// Set tracesSampleRate to 1.0 to capture 100%
			// of transactions for performance monitoring.
			// We recommend adjusting this value in production
			tracesSampleRate: 0.8
		});

		// RequestHandler creates a separate execution context, so that all
		// transactions/spans/breadcrumbs are isolated across requests
		app.use(Sentry.Handlers.requestHandler());
		// TracingHandler creates a trace for every incoming request
		app.use(Sentry.Handlers.tracingHandler());
	}
}

export function errorHandler(app) {
	if (process.env.DSN && process.env.DSN !== '') {
		// The error handler must be before any other error middleware and after all controllers
		app.use(Sentry.Handlers.errorHandler());

		// Fallthrough error handler
		app.use(function onError(err, req, res, next) {
			logger.error(err.message, err);
			// The error id is attached to `res.sentry` to be returned
			// and optionally displayed to the user for support.
			res.statusCode = 500;
			res.send({ message: 'Internal Server Error', code: res.sentry });
		});
	} else {
		// Fallthrough error handler
		app.use(function onError(err, req, res, next) {
			logger.error(err.message, err);
			res.statusCode = 500;
			res.send({ message: 'Internal Server Error' });
		});
	}
}
