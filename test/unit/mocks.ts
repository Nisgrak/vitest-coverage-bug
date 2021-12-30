import { rest } from 'msw'
import { setupServer } from 'msw/node'
import type { TokenResponse, UserInfo } from "../../src/types";
import fs from 'fs/promises';

const raw = await fs.readFile("test/e2e/fixtures/validUserInfo.json", 'utf-8');
let userData = JSON.parse(raw) as UserInfo;

const rawDisabled = await fs.readFile("test/e2e/fixtures/disabledUserInfo.json", 'utf-8');
let disabledUserData = JSON.parse(rawDisabled) as UserInfo;

const rawTokenResponse = await fs.readFile("test/e2e/fixtures/validTokenData.json", 'utf-8');
let tokenResponse = JSON.parse(rawTokenResponse) as TokenResponse;

export default () => {

	const server = setupServer(
		rest.get('https://login.test/example/userdata', (req, res, ctx) => {
			let authToken = req.headers.get("authorization")?.replace("Bearer ", "");

			if (authToken === "valid") {

				return res(ctx.json(userData));
			} else if (authToken === "disabled") {
				return res(ctx.json(disabledUserData));

			} else {
				return res(ctx.status(500), ctx.text("Error: invalid_request"))

			}
		}),
		rest.post('https://login.test/example/token', (req, res, ctx) => {
			if (typeof req.body !== "object") {
				return res(ctx.status(500), ctx.text("Error: invalid code"))

			}

			let { grant_type, code, refresh_token } = req.body;

			if (req.body.grant_type === "refresh_token") {

				if (refresh_token !== "valid") {
					return res(ctx.status(500), ctx.text("Error: invalid code"))
				}

				return res(ctx.json(tokenResponse))

			} else if (grant_type === "authorization_code") {
				if (code !== "valid") {
					return res(ctx.status(500), ctx.text("Error: invalid code"))
				}

				return res(ctx.json(tokenResponse))
			}

			return res(ctx.status(500), ctx.text("Error: invalid code"))

		}),
		rest.post('https://logs.test/ingest/validNamespace/validType', (req, res, ctx) => {
			let logData = {
				enabled: true,
				client_id: '6bb04601-eb41-5cb9-sdfa-c08da7229ae0',
				email: 'correoTest@correoTest.com',
				fullname: 'NombrePrueba Apellido1Prueba Apellido2Prueba',
				name: 'NombrePrueba',
				surname: 'Apellido1Prueba Apellido2Prueba',
				source: '360'
			};

			if (req.headers.get("x-api-key") !== "validToken") {
				return res(ctx.status(500), ctx.json({}))

			}
			if (JSON.stringify(req.body) !== JSON.stringify(logData)) {

				return res(ctx.status(500), ctx.json({}))
			}

			return res(ctx.json({}))
		})
	)

	return server;
}