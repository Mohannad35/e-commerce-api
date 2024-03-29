import fs from 'fs';
import debug from 'debug';
import morgan from 'morgan';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import logger from '../middleware/logger.js';
const devDebugger = debug('app:dev');
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default function (app) {
	if (app.get('env') === 'development') {
		const customFormat =
			'[:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] [:response-time ms : :total-time ms] ":user-agent"';
		// log all responses to console
		app.use(morgan(customFormat));
		// log all requests to access.log
		app.use(
			morgan(customFormat, {
				stream: fs.createWriteStream(join(__dirname, '../logs/access.log'), { flags: 'a' })
			})
		);
		app.use(
			morgan(
				function (tokens, req, res) {
					return JSON.stringify({
						method: tokens.method(req, res),
						url: tokens.url(req, res),
						status: Number.parseFloat(tokens.status(req, res)),
						content_length: tokens.res(req, res, 'content-length'),
						response_time: Number.parseFloat(tokens['response-time'](req, res)),
						user_agent: tokens.res(req, res, 'user-agent')
					});
				},
				{
					stream: {
						// Configure Morgan to use our custom logger with the http severity
						write: message => logger.http(`incoming-request`, JSON.parse(message))
					}
				}
			)
		);
		devDebugger(`env: ${app.get('env')}. Morgan enabled.`);
	}
}
