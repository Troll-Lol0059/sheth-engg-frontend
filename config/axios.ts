import Axios from "axios";
import useSession from "@store/session";

const axios = Axios.create({
	baseURL: process.env.NEXT_PUBLIC_API_URL,
	headers: { "Content-Type": "application/json" },
});

// Attach Authorization header from session store
axios.interceptors.request.use(config => {
	if (typeof window !== "undefined") {
		const token = useSession.getState().session?.accessToken;
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
	}
	return config;
});

// Handle 401 — try refreshing token once, then redirect to login
let isRefreshing = false;

axios.interceptors.response.use(
	response => response,
	async error => {
		const originalRequest = error.config;

		if (error?.response?.status === 401 && typeof window !== "undefined" && !originalRequest._retry) {
			if (!isRefreshing) {
				isRefreshing = true;
				originalRequest._retry = true;

				try {
					const res = await fetch("/api/auth/refresh", { method: "POST" });
					if (res.ok) {
						const data = await res.json();
						const newToken = data?.data?.accessToken;

						// Update session store with new token
						const currentSession = useSession.getState().session;
						if (currentSession && newToken) {
							useSession.getState().setSession({ ...currentSession, accessToken: newToken });
						}

						isRefreshing = false;
						originalRequest.headers.Authorization = `Bearer ${newToken}`;
						return axios(originalRequest);
					}
				} catch {
					// refresh failed
				}

				isRefreshing = false;
				useSession.getState().setSession(null);
				window.location.replace("/auth/login");
			}
		}

		return Promise.reject(error);
	}
);

export default axios;
