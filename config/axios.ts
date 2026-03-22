import Axios from "axios";

const axios = Axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
})

axios.interceptors.response.use(
    response => response,
    error => {
        if(error?.response?.status === 401 && typeof window !== "undefined"){
            window.location.replace("/auth/login");
        }
        return Promise.reject(error);
    }
)

export default axios;