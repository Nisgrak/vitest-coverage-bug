import Cookies from 'js-cookie';
import ky, { HTTPError } from "ky";
import { ErrorSSO, ErrorSSOPlain, LoginOptions, TokenResponse, UserInfo } from './types';
import { DisabledUser, RedirectToLogin } from './errors';

const ACCESS_TOKEN = "access_token";
const REFRESH_TOKEN = "refresh_token";
const NO_TENANT = "NO_TENANT";

let SSO_PATH = "examplesso";
let LOG_PATH = "examplelog";
let SSO_ROUTE = "EMPTY";

let tokens = {

	get accessToken(): string | undefined {
		// console.log("ACCESS TOKEN", Cookies.get(ACCESS_TOKEN));

		return Cookies.get(ACCESS_TOKEN);


	},

	set accessToken(newAccessToken: string | null | undefined) {
		if (typeof newAccessToken === "string") {


			Cookies.set(ACCESS_TOKEN, newAccessToken);

		} else {

			Cookies.remove(ACCESS_TOKEN);


		}
	},

	get refreshToken(): string | undefined {

		// console.log("REFRESH TOKEN", Cookies.get(REFRESH_TOKEN));

		return Cookies.get(REFRESH_TOKEN);


	},

	set refreshToken(newRefreshToken: string | null | undefined) {
		if (typeof newRefreshToken === "string") {


			Cookies.set(REFRESH_TOKEN, newRefreshToken);

		} else {


			Cookies.remove(REFRESH_TOKEN);


		}
	},

	get userCode(): string | null {
		// console.log("CODE", new URLSearchParams(window.location.search).get("code"));
		return new URLSearchParams(window.location.search).get("code");
	}
}

export function getUserPermissions(userData: UserInfo, app: string): string[] {
	if (app === undefined) {
		throw new Error("App Name isn't valid")
	}

	const permissions = userData.permissions.filter(
		permission => permission.enabled && !permission.deleted && permission.key.split(".")[0] === app
	).map(permission => permission.key);

	return permissions;
}

export function getUsername(userData: UserInfo): string {
	if (userData === undefined || typeof userData.email !== "string") {
		throw new Error("Error in user info")
	}
	return userData.email;

}

export function getTenant(userData: UserInfo, app: string): typeof NO_TENANT | string {
	if (app === undefined) {
		throw new Error("App Name isn't valid")
	}

	const permission = userData.permissions.find(permission => permission.key === `${app}.read` && permission.enabled && !permission.deleted);

	if (permission === undefined || permission.organization === null) {

		return NO_TENANT;

	}

	return permission.organization;
}

export async function login(options?: LoginOptions): Promise<UserInfo> {
	if (options !== undefined) {
		if (options.ssoPath !== undefined) {
			SSO_PATH = options.ssoPath;

		}
		if (options.ssoRoute !== undefined) {
			SSO_ROUTE = options.ssoRoute;

		}
		if (options.logs !== undefined && options.logs.path !== undefined) {
			LOG_PATH = options.logs.path;

		}
	}

	if (tokens.accessToken === undefined) {
		if (tokens.refreshToken !== undefined) { // Try to obtain a new access token with the refresh
			try {

				tokens.accessToken = await updateTokensWithRefresh(tokens.refreshToken);

			} catch (err) { // The refresh token was wrong so cleanup and try again

				tokens.refreshToken = undefined;

				if (err instanceof HTTPError && await isBadTokenError(err.response)) {

					return login();

				}

				throw err

			}
		} else if (tokens.userCode !== null) { // Try to obtain new tokens
			try {

				let newTokens = await updateTokens(tokens.userCode);

				tokens.accessToken = newTokens.accessToken;
				tokens.refreshToken = newTokens.refreshToken;

			} catch (err) { // The code was wrong, redirect to obtain a new one or throw is unknown error

				if (err instanceof HTTPError && await isBadTokenError(err.response)) {

					return redirectToSSOLogin();

				}

				throw err
			}

		} else {

			return redirectToSSOLogin();

		}
	}

	try {

		let userData = await getUserInfo(tokens.accessToken);

		if (options?.logs !== undefined && typeof options.logs.namespace === "string" && typeof options.logs.type === "string" && typeof options.logs.token === "string") {
			await sendLog(LOG_PATH, options.logs.namespace, options.logs.type, options.logs.token, {
				enabled: userData.enabled,
				client_id: userData.client_id,
				email: userData.email,
				fullname: userData.fullname,
				name: userData.name,
				surname: userData.surname,
				source: userData.source
			});
		}

		return userData;

	} catch (err) { // Access token is wrong, clear and try again

		if (err instanceof HTTPError && await isBadTokenError(err.response)) {

			tokens.accessToken = undefined;

			return login();

		} else {

			// The error was unknown

			tokens.refreshToken = undefined;
			tokens.accessToken = undefined;

			throw err;
		}

	}
}

const sendLog = (url: string, namespace: string, type: string, token: string, data: Record<string, unknown>) => {
	return ky.post(`${url}/ingest/${namespace}/${type}`, {
		retry: 0,
		json: data,
		headers: {
			'X-API-KEY': token
		}
	});
}

const redirectToSSOLogin = (): never => {
	window.location.assign(`${SSO_ROUTE}/oauth2/auth?redirect_uri=${window.location.origin}${window.location.pathname}`);

	throw new RedirectToLogin(SSO_ROUTE);
}

const updateTokensWithRefresh = async (refreshToken: string): Promise<string> => {
	const body = {
		grant_type: "refresh_token",
		refresh_token: refreshToken
	};

	const response = await ky.post(
		`${SSO_PATH}/example/token`,
		{ json: body, timeout: false, retry: 0 }
	).json<TokenResponse>();

	return response.access_token;
}

const updateTokens = async (code: string): Promise<{ refreshToken: string, accessToken: string }> => {
	const body = {
		grant_type: "authorization_code",
		code
	};

	const response = await ky.post(
		`${SSO_PATH}/example/token`,
		{ json: body, timeout: false, retry: 0 }
	).json<TokenResponse>();


	return {
		refreshToken: response.refresh_token,
		accessToken: response.access_token
	}
}

const getUserInfo = async (accessToken: string): Promise<UserInfo> => {
	let user: UserInfo | undefined = undefined;

	user = await ky.get(`${SSO_PATH}/example/userdata`, {
		retry: 0,
		headers: {
			Authorization: `Bearer ${accessToken}`
		},
		timeout: false
	}).json<UserInfo>();


	if (!user?.enabled) {

		throw new DisabledUser();

	}


	return user;
}

const isBadTokenError = async (error: Response): Promise<boolean> => {
	let rawMessage = await error.text();

	let messageValidate;

	try {
		let err = JSON.parse(rawMessage) as ErrorSSO;

		messageValidate = err.message;

	} catch (err) {

		messageValidate = (rawMessage as ErrorSSOPlain).split(": ")[1];

	}

	// console.log("MSG", messageValidate);
	const tokenError = [
		"token expired",
		"token revoked",
		"token not found",
		"invalid_request",
		"code expired",
		"code required",
		"invalid code"
	];

	if (tokenError.includes(messageValidate)) {
		return true;
	}

	return false;
}

export * from './types';
export * from './errors';