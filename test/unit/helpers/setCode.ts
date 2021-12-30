
export default (code?: string) => {
	if (code) {

		window.location = {
			...window.location, search: `?code=${code}`
		};
	}
}