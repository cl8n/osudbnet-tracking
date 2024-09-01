import { mkdir, readFile, writeFile } from 'node:fs/promises';
import Osu from './Osu.js';
import systemLog, { SyslogLevel } from './systemLog.js';

const maxBeatmapsetId = 2245000;
const maxUserId = 36600000;

const tokenFile = 'token.json';
const lastBeatmapsetIdFile = 'last-beatmapset-id';

await mkdir('data', { recursive: true });

const tokenInfo = await readFile(tokenFile, 'utf8')
	.then((content) => JSON.parse(content))
	.catch(() => null);
let lastBeatmapsetId = await readFile(lastBeatmapsetIdFile, 'utf8')
	.then((content) => parseInt(content, 10))
	.catch(() => 0);

const osu = new Osu(tokenInfo);

async function updateToken() {
	const newTokenInfo = await osu.getClientCredentialsToken()
		.catch((error) => {
			systemLog('Error getting client credentials token', SyslogLevel.err);
			systemLog(error, SyslogLevel.err);
		});

	if (newTokenInfo != null) {
		await writeFile(tokenFile, JSON.stringify(newTokenInfo));
	}
}

while (true) {
	const beatmapsetId = lastBeatmapsetId + 1;

	if (beatmapsetId > maxBeatmapsetId) {
		break;
	}

	await updateToken();

	await osu.getBeatmapset(beatmapsetId)
		.then((response) => writeFile(`data/${response.time}.json`, JSON.stringify({
			...response,
			request_type: 'beatmapset',
			request_id: beatmapsetId,
		})))
		.catch((error) => {
			systemLog(`Error refreshing beatmapset ${beatmapsetId}`, SyslogLevel.err);
			systemLog(error, SyslogLevel.err);
		});

	await writeFile(lastBeatmapsetIdFile, `${++lastBeatmapsetId}`);
}
