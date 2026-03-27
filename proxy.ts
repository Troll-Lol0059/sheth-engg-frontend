import { jwtDecode } from "jwt-decode";
import { NextRequest, NextResponse } from "next/server";

export const proxy = async (request: NextRequest) => {
	const apiUrl = process.env.NEXT_PUBLIC_API_URL;
	const apiOrigin = apiUrl ? new URL(apiUrl).origin : "";

	const cspDirectives = [
		"base-uri 'self'",
		`connect-src 'self' blob: data: https://res.cloudinary.com ${apiOrigin}`.trim(),
		"default-src 'self' blob: data:",
		"font-src 'self' https://fonts.gstatic.com",
		"form-action 'self'",
		"frame-ancestors 'self'",
		"frame-src 'self'",
		"img-src 'self' blob: data: https://res.cloudinary.com https://github.com",
		"object-src 'none'",
		"script-src 'self' 'unsafe-inline' 'unsafe-eval'",
		"style-src 'self' 'unsafe-inline'",
		"upgrade-insecure-requests",
	];

	const contentSecurityPolicyHeaderValue = cspDirectives.join("; ");

	const requestHeaders = new Headers(request.headers);
	requestHeaders.set("Content-Security-Policy", contentSecurityPolicyHeaderValue);

	const ADMIN_ROLES = ["ROLE_OWNER", "ROLE_ADMIN"];

	const privatePages = [
		"/audit-logs",
		"/client-master",
		"/master",
		"/party",
		"/po-register",
		"/profile",
		"/RFQ",
		"/settings",
		"/staff",
	];

	const pathRoleMap: Record<string, string[]> = {
		"/audit-logs": ADMIN_ROLES,
		"/client-master": ADMIN_ROLES,
		"/master": ADMIN_ROLES,
		"/party": ADMIN_ROLES,
		"/po-register": ADMIN_ROLES,
		"/profile": ADMIN_ROLES,
		"/RFQ": ADMIN_ROLES,
		"/settings": ADMIN_ROLES,
		"/staff": ADMIN_ROLES,
	};

	const token = request.cookies.get("accessToken")?.value;
	const decoded_token: Token | null = token ? jwtDecode(token) : null;
	const pathname = request?.nextUrl?.pathname;
	const userRole = decoded_token?.role || "";

	if (!token) {
		if (privatePages.some((option: string) => pathname.startsWith(option))) {
			const response = NextResponse.redirect(new URL("/auth/login", request.url));
			response.headers.set("Content-Security-Policy", contentSecurityPolicyHeaderValue);
			return response;
		}
	} else {
		if (pathname === "/" || pathname.startsWith("/auth")) {
			if (ADMIN_ROLES.includes(userRole)) {
				const response = NextResponse.redirect(new URL("/profile", request.url));
				response.headers.set("Content-Security-Policy", contentSecurityPolicyHeaderValue);
				return response;
			} else {
				const response = NextResponse.rewrite(new URL("/errors/unauthorized", request.url));
				response.headers.set("Content-Security-Policy", contentSecurityPolicyHeaderValue);
				return response;
			}
		}

		for (const [path, roles] of Object.entries(pathRoleMap)) {
			if (pathname.startsWith(path)) {
				if (roles.includes(userRole)) {
					const response = NextResponse.next({ request: { headers: requestHeaders } });
					response.headers.set("Content-Security-Policy", contentSecurityPolicyHeaderValue);
					return response;
				}
				const response = NextResponse.rewrite(new URL("/errors/unauthorized", request.url));
				response.headers.set("Content-Security-Policy", contentSecurityPolicyHeaderValue);
				return response;
			}
		}
	}

	const response = NextResponse.next({ request: { headers: requestHeaders } });
	response.headers.set("Content-Security-Policy", contentSecurityPolicyHeaderValue);
	return response;
};

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
