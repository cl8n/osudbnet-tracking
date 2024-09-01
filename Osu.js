import superagent from 'superagent';
import config from './config.js';
import Limiter from './Limiter.js';
import systemLog, { SyslogLevel } from './systemLog.js';

const apiBaseUrl = `${config.osuBaseUrl}/api/v2`;
const refreshTokenThreshold = 3600000; // 1 hour

function serializeApiResponse(response) {
	return {
		body: response.body,
		status: response.status,
		time: Date.now(),
	};
}

function serializeTokenResponse(response) {
	if (response.body.token_type !== 'Bearer') {
		throw 'Unexpected token type from osu! API';
	}

	return {
		accessToken: response.body.access_token,
		tokenExpiresAt: Date.now() + 1000 * response.body.expires_in,
	};
}

export default class Osu {
	#apiAgent;
	#limiter;
	#tokenExpiresAt;

	constructor(tokenInfo) {
		this.#limiter = new Limiter(1000);
		this.#tokenExpiresAt = Date.now();

		if (tokenInfo != null) {
			this.#assignTokenInfo(tokenInfo);
		}
	}

	#assignTokenInfo(tokenInfo) {
		this.#apiAgent = superagent.agent()
			.auth(tokenInfo.accessToken, { type: 'bearer' })
			.ok(() => true)
			.redirects(0);
		this.#tokenExpiresAt = tokenInfo.tokenExpiresAt;
	}

	async getClientCredentialsToken() {
		if (Date.now() >= this.#tokenExpiresAt - refreshTokenThreshold) {
			const tokenInfo = serializeTokenResponse(
				await superagent.post(`${config.osuBaseUrl}/oauth/token`).type('form').send({
					client_id: config.osuClientId,
					client_secret: config.osuClientSecret,
					grant_type: 'client_credentials',
					scope: 'public',
				}),
			);

			this.#assignTokenInfo(tokenInfo);
			return tokenInfo;
		}
	}

	getBeatmapset(beatmapsetId) {
		return this.#limiter
			.run(() => this.#apiAgent.get(`${apiBaseUrl}/beatmapsets/${beatmapsetId}`))
			.then(serializeApiResponse);
	}
}
