import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import replace from "@rollup/plugin-replace";
// import devtools from 'solid-devtools/vite';

export default defineConfig({
	plugins: [
		// provide unminified Vue compiler errors
		replace({
			"process.env.NODE_ENV": JSON.stringify("development"),
			include: "**/@vue[/+]compiler-*/**/*.js",
			preventAssignment: true,
		}),
		/* 
    Uncomment the following line to enable solid-devtools.
    For more info see https://github.com/thetarnav/solid-devtools/tree/main/packages/extension#readme
    */
		// devtools(),
		solidPlugin(),
	],
	server: {
		port: 3000,
	},
	build: {
		target: "esnext",
	},
});
