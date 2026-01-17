import type {ReactNode} from 'react';
import {StyleSheet} from 'react-native';

import getUniqueID from './util/getUniqueID';
import convertAdditionalStyles from './util/convertAdditionalStyles';

import textStyleProps from './data/textStyleProps';
import type {
  ASTNode,
  RenderFunction,
  RenderImageFunction,
  RenderLinkFunction,
  RenderRules,
} from '../types';

export default class AstRenderer {
  private _renderRules: RenderRules;
  private _style: Record<string, unknown>;
  private _onLinkPress?: (url: string) => boolean;
  private _maxTopLevelChildren?: number | null;
  private _topLevelMaxExceededItem?: React.ReactNode;
  private _allowedImageHandlers?: string[];
  private _defaultImageHandler?: string | null;
  private _debugPrintTree?: boolean;

  constructor(
    renderRules: RenderRules,
    style: Record<string, unknown>,
    onLinkPress?: (url: string) => boolean,
    maxTopLevelChildren?: number | null,
    topLevelMaxExceededItem?: ReactNode,
    allowedImageHandlers?: string[],
    defaultImageHandler?: string | null,
    debugPrintTree?: boolean,
  ) {
    this._renderRules = renderRules;
    this._style = style;
    this._onLinkPress = onLinkPress;
    this._maxTopLevelChildren = maxTopLevelChildren;
    this._topLevelMaxExceededItem = topLevelMaxExceededItem;
    this._allowedImageHandlers = allowedImageHandlers;
    this._defaultImageHandler = defaultImageHandler;
    this._debugPrintTree = debugPrintTree;
  }

  getRenderFunction = (
    type: string,
  ): RenderFunction | RenderLinkFunction | RenderImageFunction => {
    const renderFunction = this._renderRules[type];

    if (!renderFunction) {
      console.warn(
        `Warning, unknown render rule encountered: ${type}. 'unknown' render rule used (by default, returns null - nothing rendered)`,
      );
      return this._renderRules.unknown as RenderFunction;
    }

    return renderFunction as RenderFunction | RenderLinkFunction | RenderImageFunction;
  };

  renderNode = (
    node: ASTNode,
    parentNodes: ASTNode[],
    isRoot = false,
  ): ReactNode => {
    const renderFunction = this.getRenderFunction(node.type);
    const parents = [...parentNodes];

    if (this._debugPrintTree === true) {
      const str = '-'.repeat(parents.length);

      console.log(`${str}${node.type}`);
    }

    parents.unshift(node);

    // calculate the children first
    let children = node.children.map((value) => {
      return this.renderNode(value, parents);
    });

    // render any special types of nodes that have different renderRule function signatures
    if (node.type === 'link' || node.type === 'blocklink') {
      return (renderFunction as RenderLinkFunction)(
        node,
        children,
        parentNodes,
        this._style,
        this._onLinkPress,
      );
    }

    if (node.type === 'image') {
      return (renderFunction as RenderImageFunction)(
        node,
        children,
        parentNodes,
        this._style,
        this._allowedImageHandlers ?? [],
        this._defaultImageHandler ?? null,
      );
    }

    // We are at the bottom of some tree - grab all the parent styles
    // this effectively grabs the styles from parents and
    // applies them in order of priority parent (least) to child (most)
    // to allow styling global, then lower down things individually

    // we have to handle list_item seperately here because they have some child
    // pseudo classes that need the additional style props from parents passed down to them
    if (children.length === 0 || node.type === 'list_item') {
      const styleObj: Record<string, unknown> = {};

      for (let a = parentNodes.length - 1; a > -1; a--) {
        // grab and additional attributes specified by markdown-it
        let refStyle: Record<string, unknown> = {};

        const styleAttr = parentNodes[a].attributes.style;
        if (typeof styleAttr === 'string') {
          refStyle = convertAdditionalStyles(styleAttr);
        }

        // combine in specific styles for the object
        if (this._style[parentNodes[a].type]) {
          refStyle = {
            ...refStyle,
            ...(StyleSheet.flatten(
              this._style[parentNodes[a].type],
            ) as Record<string, unknown>),
          };

          // workaround for list_items and their content cascading down the tree
          if (parentNodes[a].type === 'list_item') {
            let contentStyle: Record<string, unknown> = {};

            if (parentNodes[a + 1].type === 'bullet_list') {
              contentStyle = this._style
                .bullet_list_content as Record<string, unknown>;
            } else if (parentNodes[a + 1].type === 'ordered_list') {
              contentStyle = this._style
                .ordered_list_content as Record<string, unknown>;
            }

            refStyle = {
              ...refStyle,
              ...(StyleSheet.flatten(contentStyle) as Record<string, unknown>),
            };
          }
        }

        // then work out if any of them are text styles that should be used in the end.
        const arr = Object.keys(refStyle);

        for (let b = 0; b < arr.length; b++) {
          if (
            textStyleProps.includes(arr[b] as (typeof textStyleProps)[number])
          ) {
            styleObj[arr[b]] = refStyle[arr[b]];
          }
        }
      }

      const baseRenderFunction = renderFunction as RenderFunction;
      return baseRenderFunction(
        node,
        children,
        parentNodes,
        this._style,
        styleObj,
      );
    }

    // cull top level children
    if (
      isRoot === true &&
      this._maxTopLevelChildren &&
      children.length > this._maxTopLevelChildren
    ) {
      children = children.slice(0, this._maxTopLevelChildren);
      if (this._topLevelMaxExceededItem) {
        children.push(this._topLevelMaxExceededItem);
      }
    }

    // render anythign else that has a normal signature
    const baseRenderFunction = renderFunction as RenderFunction;
    return baseRenderFunction(node, children, parentNodes, this._style);
  };

  render = (nodes: ASTNode[]): ReactNode => {
    const root: ASTNode = {
      type: 'body',
      sourceType: 'body',
      key: getUniqueID(),
      content: '',
      markup: '',
      tokenIndex: -1,
      index: 0,
      attributes: {},
      children: nodes,
    };
    return this.renderNode(root, [], true);
  };
}
