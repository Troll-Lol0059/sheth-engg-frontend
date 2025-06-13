"use client";
import { JSX, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function usePasswordToggle() {
	const [visibility, setVisibility] = useState<boolean>(false);

	const inputIcon: JSX.Element = visibility ? (
		<Eye className="ml-auto cursor-pointer opacity-50 peer-disabled:cursor-not-allowed" onClick={() => setVisibility(visibility => !visibility)} />
	) : (
		<EyeOff className="ml-auto cursor-pointer opacity-50 peer-disabled:cursor-not-allowed" onClick={() => setVisibility(visibility => !visibility)} />
	);
	const inputType: "text" | "password" = visibility ? "text" : "password";
	return { inputIcon, inputType };
}
