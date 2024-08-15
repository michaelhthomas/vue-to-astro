import { Component, createResource, Show } from "solid-js";
import { type Monaco } from "@monaco-editor/loader";
import { createHighlighter, Highlighter } from "shiki";
import { MonacoEditor } from "solid-monaco";
import { shikiToMonaco } from "@shikijs/monaco";

let HIGHLIGHTER: Highlighter | null = null;

async function getHighlighter(): Promise<Highlighter> {
	if (HIGHLIGHTER != null) return HIGHLIGHTER;

	HIGHLIGHTER = await createHighlighter({
		themes: ["vitesse-dark", "vitesse-light"],
		langs: ["javascript", "typescript", "vue", "astro"],
	});

	return HIGHLIGHTER;
}

export type CodeEditorProps = {
	language: "javascript" | "typescript" | "vue" | "astro";
	value?: string;
	readonly?: boolean;
	onChange?: (value: string) => void;
};

export const CodeEditor: Component<CodeEditorProps> = (props) => {
	const [highlighter] = createResource(getHighlighter);

	function handleMount(monaco: Monaco) {
		const hl = highlighter();
		if (!hl) return;

		monaco.languages.register({ id: "vue" });
		monaco.languages.register({ id: "typescript" });
		monaco.languages.register({ id: "javascript" });
		monaco.languages.register({ id: "astro" });
		shikiToMonaco(hl, monaco);
	}

	return (
		<Show when={highlighter()}>
			<MonacoEditor
				language={props.language}
				value={props.value}
				onMount={handleMount}
				options={{ readOnly: props.readonly, fontSize: 14 }}
				onChange={(value) => props.onChange && props.onChange(value)}
			/>
		</Show>
	);
};
