import 'dotenv/config';

const partialConfig = {};
const config = partialConfig;
export default config;

function tryParseBoolean(value) {
	if (value === '1' || value === 'true') {
		return true;
	}

	if (value === '0' || value === 'false') {
		return false;
	}
}

function tryParseInt(value) {
	if (value == null) {
		return;
	}

	const number = parseInt(value, 10);

	if (!isNaN(number)) {
		return number;
	}
}

function tryParseString(value) {
	if (value) {
		return value;
	}
}

partialConfig.syslogLevelPrefix = tryParseBoolean(process.env.LOG_SYSLOG_LEVEL_PREFIX);
partialConfig.osuBaseUrl = tryParseString(process.env.OSU_BASE_URL);
partialConfig.osuClientId = tryParseInt(process.env.OSU_CLIENT_ID);
partialConfig.osuClientSecret = tryParseString(process.env.OSU_CLIENT_SECRET);

const optionalOptions = new Set([

]);

for (const [option, value] of Object.entries(partialConfig)) {
	if (value == null && !optionalOptions.has(option)) {
		throw `Invalid config option ${option}: not set`;
	}
}

config.osuBaseUrl = config.osuBaseUrl.replace(/\/+$/, '');
