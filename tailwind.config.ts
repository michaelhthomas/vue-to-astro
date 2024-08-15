import type { Config } from "tailwindcss";
import daisyUi from "daisyui";

const config: Config = {
	content: ["./src/**/*.{js,jsx,ts,tsx}"],
	theme: {
		extend: {},
	},
	plugins: [daisyUi],
};

export default config;
