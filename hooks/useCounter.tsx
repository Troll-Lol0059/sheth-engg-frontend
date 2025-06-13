"use client";
import { useEffect, useState } from "react";

export default function useCounter(seconds: number = 0) {
	const [counter, setCounter] = useState<number>(seconds);

	useEffect(() => {
		if (counter === 0) {
			return;
		}
		const interval = setInterval(() => {
			setCounter(counter - 1);
		}, 1000);

		return () => clearTimeout(interval);
	}, [counter]);

	function startCounter(seconds: number) {
		setCounter(seconds);
	}

	return { counter, startCounter };
}