import Cookies from 'js-cookie';


export default (cookies: { name: string, value: string }[]) => {
	for (const cookie of cookies) {
		Cookies.set(cookie.name, cookie.value)
	}
}