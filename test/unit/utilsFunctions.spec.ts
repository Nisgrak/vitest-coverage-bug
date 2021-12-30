import { describe, it, expect } from "vitest";
import fs from 'fs/promises';
import "ky-universal";

import { getTenant, getUsername, getUserPermissions } from "../../src/main";
import type { UserInfo } from "../../src/types";

const raw = await fs.readFile("test/e2e/fixtures/validUserInfo.json", 'utf-8');
let userData = JSON.parse(raw) as UserInfo;

let appName = "example-app"

describe("Utils Functions", () => {

	describe("Get Permissions", () => {
		it('Valid filter data', async () => {
			expect(getUserPermissions(userData, appName)).toHaveLength(2)

		})

		it('Don\'t have unenabled', async () => {
			let permissions = getUserPermissions(userData, appName);

			expect(permissions).not.include("example-app.unenabledPermission")

		})
		it('Don\'t have deleted', async () => {
			let permissions = getUserPermissions(userData, appName);

			expect(permissions).not.include("example-app.deletedPermission")

		})
	});

	describe("Get Tenant", () => {
		it('No tenant', async () => {
			expect(getTenant(userData, appName)).to.be.string("NO_TENANT")

		})

		it('Have Tenant', async () => {
			let copyUserData = { ...userData }

			copyUserData.permissions = copyUserData.permissions.map(perm => {
				if (perm.key === `${appName}.read`) {
					perm.organization = "EXAMPLE_TENANT"
				}

				return perm
			})

			expect(getTenant(userData, appName)).to.be.string("EXAMPLE_TENANT")

		})
	});

	describe("Get Username", () => {
		it('Valid data', async () => {

			expect(getUsername(userData)).toBe("correoTest@correoTest.com")

		})

		it('Send undefined', async () => {
			// @ts-expect-error
			expect(() => getUsername(undefined)).toThrow("Error in user info")

		})

		it('Send email undefined', async () => {
			// @ts-expect-error
			expect(() => getUsername({ ...userData, email: undefined })).toThrow("Error in user info")

		})
		it('Send email number', async () => {
			// @ts-expect-error
			expect(() => getUsername({ ...userData, email: 0 })).toThrow("Error in user info")

		})
	})
})
