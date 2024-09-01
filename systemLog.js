import { inspect } from 'node:util';
import config from './config.js';

export default function systemLog(message, level) {
	if (config.syslogLevelPrefix) {
		if (typeof message !== 'string') {
			message = inspect(message, { depth: null });
		}

		message = message
			.trim()
			.split('\n')
			.map((line) => `<${level}>${line}`)
			.join('\n');
	}

	if (level <= SyslogLevel.warning) {
		console.error(message);
	} else {
		console.log(message);
	}
}

export const SyslogLevel = {
	emerg: 0,
	alert: 1,
	crit: 2,
	err: 3,
	warning: 4,
	notice: 5,
	info: 6,
	debug: 7,
}
