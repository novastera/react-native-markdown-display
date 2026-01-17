import type {ReactNode} from 'react';
import type {StyleSheet} from 'react-native';

export interface MarkdownTokenLike {
  type: string;
  nesting: number;
  children?: MarkdownTokenLike[] | null;
  block?: boolean;
  content?: string;
  attrs?: Array<[string, string]> | null;
  tag?: string;
  info?: string;
  meta?: unknown;
  markup?: string;
  attrIndex?: (name: string) => number;
}

export interface ASTNode {
  type: string;
  sourceType: string;
  sourceInfo?: string;
  sourceMeta?: unknown;
  block?: boolean;
  key: string;
  content: string;
  markup: string;
  tokenIndex: number;
  index: number;
  attributes: Record<string, unknown>;
  children: ASTNode[];
}

export type RenderFunction = (
  node: ASTNode,
  children: ReactNode[],
  parentNodes: ASTNode[],
  styles: Record<string, unknown>,
  styleObj?: Record<string, unknown>,
  ...args: unknown[]
) => ReactNode;

export type RenderLinkFunction = (
  node: ASTNode,
  children: ReactNode[],
  parentNodes: ASTNode[],
  styles: Record<string, unknown>,
  onLinkPress?: (url: string) => boolean,
) => ReactNode;

export type RenderImageFunction = (
  node: ASTNode,
  children: ReactNode[],
  parentNodes: ASTNode[],
  styles: Record<string, unknown>,
  allowedImageHandlers: string[],
  defaultImageHandler: string | null,
) => ReactNode;

export interface RenderRules {
  [name: string]:
    | RenderFunction
    | RenderLinkFunction
    | RenderImageFunction
    | undefined;
  link?: RenderLinkFunction;
  blocklink?: RenderLinkFunction;
  image?: RenderImageFunction;
}

export interface MarkdownParser {
  parse: (value: string, options: Record<string, unknown>) => MarkdownTokenLike[];
}

export interface MarkdownProps {
  rules?: RenderRules;
  style?: StyleSheet.NamedStyles<Record<string, unknown>>;
  renderer?: AstRenderer | ((nodes: ASTNode[]) => ReactNode);
  markdownit?: MarkdownParser;
  mergeStyle?: boolean;
  debugPrintTree?: boolean;
  onLinkPress?: (url: string) => boolean;
  maxTopLevelChildren?: number | null;
  topLevelMaxExceededItem?: ReactNode;
  allowedImageHandlers?: string[];
  defaultImageHandler?: string | null;
}

export interface AstRenderer {
  getRenderFunction(
    type: string,
  ): RenderFunction | RenderLinkFunction | RenderImageFunction;
  renderNode(
    node: ASTNode,
    parentNodes: ReadonlyArray<ASTNode>,
    isRoot?: boolean,
  ): ReactNode;
  render(nodes: ReadonlyArray<ASTNode>): ReactNode;
}
