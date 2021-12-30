export class RedirectToLogin extends Error {
	constructor(message?: string) {
		super(message);
		this.name = "RedirectToLogin";
	}
}

export class DisabledUser extends Error {
	constructor(message?: string) {
		super(message);
		this.name = "DisabledUser";
	}
}
