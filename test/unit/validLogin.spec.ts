import mocks from './mocks';

const server = mocks();

import { describe, it, expect, beforeEach, beforeAll, afterAll, afterEach, vitest } from "vitest";
import "ky-universal";

import { login } from "../../src/main";
import { RedirectToLogin, DisabledUser } from "../../src/errors";

import setCode from "./helpers/setCode";
import setCookies from "./helpers/setCookies";

// Enable API mocking before tests.
beforeAll(() => server.listen())

// Reset any runtime request handlers we may add during the tests.
afterEach(() => server.resetHandlers())

// Disable API mocking after the tests are done.
afterAll(() => server.close())

beforeEach(() => {
	// @ts-expect-error
	delete window.location;

	window.location = {
		...window.location,
		href: '',
		hostname: '',
		pathname: '',
		protocol: '',
		assign: vitest.fn()
	};

	setCode();

})

describe("Empty Code", () => {


	it('Empty tokens', async () => {
		try {

			await login({ ssoPath: "https://login.test" });

		} catch (err) {
			expect(err).to.instanceOf(RedirectToLogin)

		}
	})

	it('Valid access token', async () => {
		setCookies([{ name: 'access_token', value: "valid" }])

		await login({ ssoPath: "https://login.test" });
	})

	it('Valid refresh token', async () => {
		setCookies([{ name: 'refresh_token', value: "valid" }])

		await login({ ssoPath: "https://login.test" });
	})

	it('Valid access token and valid refresh token', async () => {
		setCookies([{ name: 'access_token', value: "valid" }, { name: 'refresh_token', value: "valid" }])

		await login({ ssoPath: "https://login.test" });
	})

	it('Invalid access token', async () => {
		setCookies([{ name: 'access_token', value: "invalid" }])


		try {

			await login({ ssoPath: "https://login.test" });

		} catch (err) {

			expect(err).to.instanceOf(RedirectToLogin)

		}
	})

	it('Invalid refresh token', async () => {
		setCookies([{ name: 'refresh_token', value: "invalid" }])

		try {

			await login({ ssoPath: "https://login.test" });

		} catch (err) {

			expect(err).to.instanceOf(RedirectToLogin)

		}
	})

	it('Invalid access token and invalid refresh token', async () => {
		setCookies([{ name: 'access_token', value: "invalid" }, { name: 'refresh_token', value: "invalid" }])

		try {

			await login({ ssoPath: "https://login.test" });

		} catch (err) {

			expect(err).to.instanceOf(RedirectToLogin)

		}
	})
})


describe("Valid Code", () => {

	beforeEach(() => {
		setCode("valid")

	})

	it('Empty tokens', async () => {

		await login({ ssoPath: "https://login.test" });
	})

	it('Valid access token', async () => {
		setCookies([{ name: "access_token", value: "valid" }])


		await login({ ssoPath: "https://login.test" });

	})

	it('Valid refresh token', async () => {

		setCookies([{ name: "refresh_token", value: "valid" }])


		await login({ ssoPath: "https://login.test" });
	})

	it('Valid access token and valid refresh token', async () => {
		setCookies([{ name: "access_token", value: "valid" }, { name: "refresh_token", value: "valid" }])

		await login({ ssoPath: "https://login.test" });
	})

	it('Invalid access token', async () => {
		setCookies([{ name: "access_token", value: "invalid" }])

		await login({ ssoPath: "https://login.test" });
	})

	it('Invalid refresh token', async () => {
		setCookies([{ name: "refresh_token", value: "invalid" }])

		await login({ ssoPath: "https://login.test" });
	})

	it('Invalid access token and invalid refresh token', async () => {
		setCookies([{ name: "access_token", value: "invalid" }, { name: "refresh_token", value: "invalid" }])

		await login({ ssoPath: "https://login.test" });
	})

})

describe("Invalid Code", () => {

	beforeEach(() => {
		setCode("invalid")

	})

	it('Empty tokens', async () => {
		try {

			await login({ ssoPath: "https://login.test" });

		} catch (err) {
			expect(err).to.instanceOf(RedirectToLogin)

		}
	})

	it('Valid access token', async () => {
		setCookies([{ name: "access_token", value: "valid" }])

		await login({ ssoPath: "https://login.test" });
	})

	it('Valid refresh token', async () => {
		setCookies([{ name: "refresh_token", value: "valid" }])

		await login({ ssoPath: "https://login.test" });
	})

	it('Valid access token and valid refresh token', async () => {
		setCookies([{ name: "access_token", value: "valid" }, { name: "refresh_token", value: "valid" }])

		await login({ ssoPath: "https://login.test" });

	})

	it('Invalid access token', async () => {
		setCookies([{ name: "access_token", value: "invalid" }])

		try {

			await login({ ssoPath: "https://login.test" });

		} catch (err) {
			expect(err).to.instanceOf(RedirectToLogin)

		}
	})

	it('Invalid refresh token', async () => {
		setCookies([{ name: "refresh_token", value: "invalid" }])

		try {

			await login({ ssoPath: "https://login.test" });

		} catch (err) {
			expect(err).to.instanceOf(RedirectToLogin)

		}
	})

	it('Invalid access token and invalid refresh token', async () => {
		setCookies([{ name: "access_token", value: "invalid" }, { name: "refresh_token", value: "invalid" }])

		try {

			await login({ ssoPath: "https://login.test" });

		} catch (err) {
			expect(err).to.instanceOf(RedirectToLogin)

		}
	})
})

it('Set SSO Route', async () => {
	setCookies([{ name: "access_token", value: "invalid" }])

	try {

		await login({ ssoPath: "https://login.test", ssoRoute: "https://sso.test" });

	} catch (err) {
		expect(err).to.instanceOf(RedirectToLogin)
		expect((err as RedirectToLogin).message).to.eq("https://sso.test")

	}
})

it('Disabled User', async () => {
	setCookies([{ name: "access_token", value: "disabled" }])

	try {

		await login({ ssoPath: "https://login.test" });

	} catch (err) {
		expect(err).to.instanceOf(DisabledUser)

	}
})

it('Send Log', async () => {
	setCookies([{ name: "access_token", value: "valid" }])

	await login({ ssoPath: "https://login.test", logs: { namespace: "validNamespace", type: "validType", token: "validToken", path: "https://logs.test" } });


})
