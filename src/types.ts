export interface TokenResponse {
	access_token: string
	expires_at: string
	expires_in: number
	refresh_token: string
	token_type: string
}

export interface ErrorSSO {
	message: string
	name: "Error"
	status: 500
}

export type ErrorSSOPlain = `Error: ${string}`

export interface LoginOptions {
	ssoRoute?: string,
	ssoPath?: string
	logs?: {
		namespace: string
		type: string
		token: string
		path?: string
	}
}

export interface UserInfo {
	enabled: boolean;
	client_id: string;
	email: string;
	fullname: string;
	name: string;
	surname: string;
	source: string;
	groups: null;
	organizations: Organization[];
	vaults: any[];
	conditions: any[];
	roles: Role[];
	permissions: Permission[];
}

export interface Organization {
	key: string;
	enabled: boolean;
	name: string;
	description: null | string;
	deleted: boolean;
}

export interface Permission {
	organization: string | null;
	key: string;
	description: null | string;
	enabled: boolean;
	deleted: boolean;
	vault: null;
	condition: null;
	inherit: boolean;
}

export interface Role {
	key: string;
	name: string;
	description: null | string;
	enabled: boolean;
	deleted: boolean;
	service: null | string;
	organizations: null[];
	inherit: boolean;
}