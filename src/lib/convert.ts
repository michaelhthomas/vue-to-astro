import {
	type RootNode,
	type TemplateChildNode,
	type IfBranchNode,
	type AttributeNode,
	type DirectiveNode,
	type ExpressionNode,
	NodeTypes,
	SourceLocation,
} from "@vue/compiler-core";
import { parse } from "@vue/compiler-sfc";
import { transform, getBaseTransformPreset } from "@vue/compiler-core";
import prettier from "prettier/standalone";
import prettierPluginEstree from "prettier/plugins/estree";
import prettierPluginTs from "prettier/plugins/typescript";
import prettierPluginHtml from "prettier/plugins/html";
import * as prettierPluginAstro from "prettier-plugin-astro";
import { initialize } from "@astrojs/compiler";
import astroCompilerWasm from "@astrojs/compiler/astro.wasm?url";

export async function convertVueToAstroJsx(
	vueTemplate: string,
): Promise<string> {
	// Parse the Vue component template using the Vue compiler
	const parsed = parse(vueTemplate);
	const templateAst = parsed.descriptor.template?.ast;
	if (!templateAst) return "";

	const [nodeTransforms, directiveTransforms] = getBaseTransformPreset();
	transform(templateAst, { nodeTransforms, directiveTransforms });

	function printChildren(
		children: {
			value: string;
			loc?: SourceLocation;
		}[],
	) {
		let result = "";

		for (let i = 0; i < children.length - 1; i++) {
			const { value: child, loc } = children[i];
			const nextChild = children[i + 1];

			result += child;

			// compute lines of whitespace
			if (loc && nextChild.loc) {
				const difference = nextChild.loc.start.line - loc.end.line;
				result += "\n".repeat(difference);
			}
		}

		const lastChild = children.at(-1);
		if (lastChild) {
			result += lastChild.value;
		}

		return result;
	}

	function printExpression(node: ExpressionNode) {
		if (node.type === NodeTypes.SIMPLE_EXPRESSION) return node.content;
		else throw new Error("Complex expressions are not yet supported.");
	}

	// Function to recursively convert Vue AST to JSX
	function convertNode(
		node: RootNode | TemplateChildNode,
		withinExpression = false,
	): {
		value: string;
		loc?: SourceLocation;
	} {
		if (node.type === NodeTypes.ROOT) {
			return {
				value: printChildren(node.children.map((n) => convertNode(n))),
				loc: node.loc,
			};
		} else if (node.type === NodeTypes.ELEMENT) {
			const tagName = node.tag;
			const attributes = node.props.map(convertAttribute).join(" ");
			const children = printChildren(node.children.map((n) => convertNode(n)));

			return {
				value: node.isSelfClosing
					? `<${tagName} ${attributes} />`
					: `<${tagName} ${attributes}>${children}</${tagName}>`,
				loc: node.loc,
			};
		} else if (node.type === NodeTypes.TEXT) {
			return { value: node.content, loc: node.loc };
		} else if (node.type === NodeTypes.TEXT_CALL) {
			return convertNode(node.content);
		} else if (node.type === NodeTypes.COMMENT) {
			return { value: `{/* ${node.content} */}`, loc: node.loc };
		} else if (node.type === NodeTypes.INTERPOLATION) {
			return {
				value: `{${printExpression(node.content)}}`,
				loc: node.loc,
			};
		} else if (node.type === NodeTypes.IF) {
			const printBranch = (branch: IfBranchNode) =>
				branch.children.length > 1
					? `<>${printChildren(branch.children.map((n) => convertNode(n)))}</>`
					: printChildren(branch.children.map((n) => convertNode(n, true)));

			// single conditional
			if (node.branches.length === 1) {
				const branch = node.branches[0];
				if (!branch.condition)
					throw new Error("Conditional missing condition.");

				const result = `(${printExpression(branch.condition)}) && (${printBranch(branch)})`;
				return {
					value: withinExpression ? result : `{${result}}`,
					loc: node.loc,
				};
			} else if (node.branches.length > 1) {
				if (node.branches.filter((n) => n.condition == null).length > 1)
					throw new Error(
						"A 'v-else' must be preceeded by a 'v-if' or 'v-else-if'.",
					);

				const parts = node.branches.map((branch) =>
					branch.condition
						? `(${printExpression(branch.condition)}) ? (${printBranch(branch)})`
						: `(${printBranch(branch)})`,
				);

				// chain ends in an else-if
				if (node.branches.at(-1)?.condition != null) {
					parts.push("null");
				}

				const result = parts.join(" : ");

				return {
					value: withinExpression ? result : `{${result}}`,
					loc: {
						...node.loc,
						end: node.branches.at(-1)?.loc.end ?? node.loc.end,
					},
				};
			}
		} else if (node.type === NodeTypes.FOR) {
			const rawSource = printExpression(node.source);
			// handle numeric ranges
			// https://vuejs.org/guide/essentials/list#v-for-with-a-range
			const source = /^\d*$/.test(rawSource)
				? `Array.from(Array(${rawSource}), (_, i) => i+1)`
				: rawSource;
			const mapArgs = [node.valueAlias, node.keyAlias]
				.filter((n) => n != null)
				.map(printExpression)
				.join(", ");
			const children =
				node.children.length > 1
					? `<>${printChildren(node.children.map((n) => convertNode(n)))}</>`
					: printChildren(node.children.map((n) => convertNode(n, true)));

			const result = `(${source}).map((${mapArgs}) => (${children}))`;
			return {
				value: withinExpression ? result : `{${result}}`,
				loc: node.codegenNode?.loc ?? node.loc,
			};
		}

		throw new Error(`Node type ${node.type} not implemented`);
	}

	function convertAttribute(attr: AttributeNode | DirectiveNode) {
		if (attr.type === NodeTypes.ATTRIBUTE) {
			// Static attribute
			return attr.value?.content != null
				? `${attr.name}="${attr.value?.content}"`
				: attr.name;
		} else if (attr.type === NodeTypes.DIRECTIVE) {
			// Directive (e.g., v-bind, v-if)
			const arg =
				attr.arg && attr.arg.type === NodeTypes.SIMPLE_EXPRESSION
					? attr.arg?.content
					: null;
			const content =
				attr.exp && attr.exp.type === NodeTypes.SIMPLE_EXPRESSION
					? attr.exp?.content
					: null;

			if (attr.name === "bind" && arg == null) {
				return `{...${content}}`;
			} else if (attr.name === "bind" && arg == "class") {
				return `class:list={[${content}]}`;
			} else if (attr.name === "on") {
				// ignore, since there is no direct Astro equivalent (no interactivity)
				return "";
			} else if (attr.name === "bind") {
				return arg === content ? `{${content}}` : `${arg}={${content}}`;
			}
		}
		return "";
	}

	async function formatAstro(template: string) {
		await initialize({ wasmURL: astroCompilerWasm });
		return prettier.format(template, {
			plugins: [
				prettierPluginEstree,
				prettierPluginTs,
				prettierPluginHtml,
				prettierPluginAstro,
			],
			parser: "astro",
			htmlWhitespaceSensitivity: "ignore",
		});
	}

	const result = convertNode(templateAst).value;

	try {
		return await formatAstro(result);
	} catch (e) {
		if (e instanceof Error) {
			const error = new Error(
				`Formatting failed with error ${e.message} while formatting ${result}.`,
			);
			error.stack = e.stack;
			throw error;
		} else {
			return `Formatting failed with an unknown error whiile formatting ${result}.`;
		}
	}
}
