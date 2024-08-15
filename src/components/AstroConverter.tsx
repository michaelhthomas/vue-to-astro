import { Component, createResource, Show } from "solid-js";
import { convertVueToAstroJsx } from "../lib/convert";
import { CodeEditor } from "./CodeEditor";
import { ErrorViewer } from "./ErrorViewer";

export type AstroConverterProps = {
	template: string;
};

export const AstroConverter: Component<AstroConverterProps> = (props) => {
	const [converted] = createResource(
		() => props.template,
		(template) => convertVueToAstroJsx(template),
	);

	return (
		<>
			<Show when={converted.state === "ready"}>
				<CodeEditor readonly language="astro" value={converted()} />
			</Show>
			<Show when={converted.error}>
				<ErrorViewer error={converted.error} />
			</Show>
		</>
	);
};
