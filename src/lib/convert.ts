import {
	type RootNode,
	type TemplateChildNode,
	type AttributeNode,
	type DirectiveNode,
	NodeTypes,
	SourceLocation,
} from "@vue/compiler-core";
import { parse } from "@vue/compiler-sfc";
import prettier from "prettier/standalone";
import prettierPluginEstree from "prettier/plugins/estree";
import prettierPluginTs from "prettier/plugins/typescript";
import prettierPluginHtml from "prettier/plugins/html";
import * as prettierPluginAstro from "prettier-plugin-astro";
import { initialize } from "@astrojs/compiler";
import astroCompilerWasm from "@astrojs/compiler/astro.wasm?url";

type NodeCondition = ["if", string] | ["else-if", string] | ["else"] | null;

export async function convertVueToAstroJsx(
	vueTemplate: string,
): Promise<string> {
	// Parse the Vue component template using the Vue compiler
	const parsed = parse(vueTemplate);
	const templateAst = parsed.descriptor.template?.ast;
	if (!templateAst) return "";

	function toCondition(
		attr: AttributeNode | DirectiveNode | undefined,
	): NodeCondition {
		if (attr == null || attr.type !== NodeTypes.DIRECTIVE) return null;
		if (
			attr.name === "if" &&
			attr.exp &&
			attr.exp.type === NodeTypes.SIMPLE_EXPRESSION
		) {
			return ["if", attr.exp.content];
		} else if (
			attr.name === "else-if" &&
			attr.exp &&
			attr.exp.type === NodeTypes.SIMPLE_EXPRESSION
		) {
			return ["else-if", attr.exp.content];
		} else if (attr.name === "else") {
			return ["else"];
		}
		return null;
	}

	function printChildren(
		children: {
			value: string;
			condition?: NodeCondition;
			loc?: SourceLocation;
		}[],
	) {
		let result = "";

		for (let i = 0; i < children.length - 1; i++) {
			const { value: child, condition, loc } = children[i];
			const nextChild = children[i + 1];
			const nextChildCondition = nextChild.condition;
			const nextChildConditionType = nextChildCondition
				? nextChildCondition[0]
				: null;

			if (condition == null) {
				result += child;
			} else if (
				condition[0] === "if" &&
				nextChildConditionType === "else-if"
			) {
				result += `{(${condition[1]}) ? (${child}) : `;
			} else if (condition[0] === "if" && nextChildConditionType === "else") {
				result += `{(${condition[1]}) ? (${child}) : (${children[i + 1].value})}`;
			} else if (
				condition[0] === "else-if" &&
				nextChildConditionType === "else-if"
			) {
				result += `(${condition[1]}) ? (${child}) : `;
			} else if (
				condition[0] === "else-if" &&
				nextChildConditionType === "else"
			) {
				result += `(${condition[1]}) ? (${child}) : (${children[i + 1].value})}`;
			} else if (condition[0] === "if") {
				result += `{(${condition[1]}) && (${child})}`;
			}

			// compute lines of whitespace
			//
			if (loc && nextChild.loc) {
				const difference = nextChild.loc.start.line - loc.end.line;
				result += "\n".repeat(difference);
			}
		}

		const lastChild = children.at(-1);
		if (!lastChild) {
		} else if (lastChild.condition == null) {
			result += lastChild.value;
		} else if (lastChild.condition[0] === "if") {
			result += `{(${lastChild.condition[1]}) && (${lastChild.value})}\n`;
		}

		return result;
	}

	// Function to recursively convert Vue AST to JSX
	function convertNode(node: RootNode | TemplateChildNode): {
		value: string;
		condition?: NodeCondition;
		loc?: SourceLocation;
	} {
		if (node.type === NodeTypes.ROOT) {
			return {
				value: printChildren(node.children.map(convertNode)),
				loc: node.loc,
			};
		} else if (node.type === NodeTypes.ELEMENT) {
			const tagName = node.tag;
			const attributes = node.props.map(convertAttribute).join(" ");
			const children = printChildren(node.children.map(convertNode));

			const condition = toCondition(
				node.props.find((el) => toCondition(el) != null),
			);

			return {
				value: node.isSelfClosing
					? `<${tagName} ${attributes} />`
					: `<${tagName} ${attributes}>${children}</${tagName}>`,
				condition,
				loc: node.loc,
			};
		} else if (node.type === NodeTypes.TEXT) {
			return { value: node.content, loc: node.loc };
		} else if (node.type === NodeTypes.COMMENT) {
			return { value: `{/* ${node.content} */}`, loc: node.loc };
		} else if (
			node.type === NodeTypes.INTERPOLATION &&
			node.content.type === NodeTypes.SIMPLE_EXPRESSION
		) {
			return { value: `{${node.content.content}}`, loc: node.loc };
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
