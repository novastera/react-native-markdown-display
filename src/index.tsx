/**
 * Base Markdown component
 * @author Novastera + contributors
 */

import React, {useMemo} from 'react';
import {Text, StyleSheet} from 'react-native';
import MarkdownIt from 'markdown-it';
import {Image as MarkdownImage} from 'expo-image';

import parser from './lib/parser';
import getUniqueID from './lib/util/getUniqueID';
import hasParents from './lib/util/hasParents';
import openUrl from './lib/util/openUrl';
import tokensToAST from './lib/util/tokensToAST';
import renderRules from './lib/renderRules';
import AstRenderer from './lib/AstRenderer';
import removeTextStyleProps from './lib/util/removeTextStyleProps';
import {styles} from './lib/styles';
import {stringToTokens} from './lib/util/stringToTokens';
import textStyleProps from './lib/data/textStyleProps';
import type {
  ASTNode,
  MarkdownParser,
  MarkdownProps,
  RenderFunction,
  RenderRules,
  AstRenderer as AstRendererLike,
} from './types';

export type {ASTNode, MarkdownParser, MarkdownProps, RenderFunction, RenderRules};

export {
  getUniqueID,
  openUrl,
  hasParents,
  renderRules,
  AstRenderer,
  parser,
  stringToTokens,
  tokensToAST,
  MarkdownIt,
  styles,
  removeTextStyleProps,
  textStyleProps,
  MarkdownImage,
  MarkdownImage as FitImage,
};

type StyleMap = StyleSheet.NamedStyles<Record<string, unknown>>;

// we use StyleSheet.flatten here to make sure we have an object, in case someone
// passes in a StyleSheet.create result to the style prop
const getStyle = (
  mergeStyle: boolean,
  style?: StyleMap | null,
): ReturnType<typeof StyleSheet.create> => {
  let useStyles: Record<string, unknown> = {};
  const styleRecord = (style ?? {}) as Record<string, unknown>;

  if (mergeStyle === true && style) {
    // make sure we get anything user defuned
    Object.keys(styleRecord).forEach((value) => {
      const styleEntry = styleRecord[value];
      useStyles[value] = {
        ...(StyleSheet.flatten(styleEntry ?? {}) as Record<string, unknown>),
      };
    });

    // combine any existing styles
    Object.keys(styles).forEach((value) => {
      const styleEntry = styleRecord[value];
      useStyles[value] = {
        ...(styles as Record<string, Record<string, unknown>>)[value],
        ...(StyleSheet.flatten(styleEntry ?? {}) as Record<string, unknown>),
      };
    });
  } else {
    useStyles = {
      ...(styles as Record<string, Record<string, unknown>>),
    };

    if (style) {
      Object.keys(styleRecord).forEach((value) => {
        const styleEntry = styleRecord[value];
        useStyles[value] = {
          ...(StyleSheet.flatten(styleEntry ?? {}) as Record<string, unknown>),
        };
      });
    }
  }

  Object.keys(useStyles).forEach((value) => {
    useStyles['_VIEW_SAFE_' + value] = removeTextStyleProps(
      useStyles[value] as Record<string, unknown>,
    );
  });

  return StyleSheet.create(
    useStyles as StyleSheet.NamedStyles<Record<string, unknown>>,
  );
};

const getRenderer = (
  renderer?: AstRendererLike | ((nodes: ASTNode[]) => React.ReactNode) | null,
  rules?: RenderRules | null,
  style?: StyleMap | null,
  mergeStyle: boolean = true,
  onLinkPress?: (url: string) => boolean,
  maxTopLevelChildren?: number | null,
  topLevelMaxExceededItem?: React.ReactNode,
  allowedImageHandlers?: string[],
  defaultImageHandler?: string | null,
  debugPrintTree?: boolean,
): AstRendererLike | ((nodes: ASTNode[]) => React.ReactNode) => {
  if (renderer && rules) {
    console.warn(
      'react-native-markdown-display you are using renderer and rules at the same time. This is not possible, props.rules is ignored',
    );
  }

  if (renderer && style) {
    console.warn(
      'react-native-markdown-display you are using renderer and style at the same time. This is not possible, props.style is ignored',
    );
  }

  // these checks are here to prevent extra overhead.
  if (renderer) {
    if (typeof renderer === 'function') {
      return renderer;
    }
    if (typeof renderer.render === 'function') {
      return renderer;
    }
    throw new Error(
      'Provided renderer is not compatible with function or AstRenderer. please change',
    );
  }

  const useStyles = getStyle(mergeStyle, style);

  return new AstRenderer(
    {
      ...renderRules,
      ...(rules || {}),
    },
    useStyles,
    onLinkPress,
    maxTopLevelChildren,
    topLevelMaxExceededItem,
    allowedImageHandlers,
    defaultImageHandler,
    debugPrintTree,
  );
};

const Markdown = React.memo(
  ({
    children,
    renderer,
    rules,
    style,
    mergeStyle = true,
    markdownit = MarkdownIt({
      typographer: true,
    }),
    onLinkPress,
    maxTopLevelChildren = null,
    topLevelMaxExceededItem = <Text key="dotdotdot">...</Text>,
    allowedImageHandlers = [
      'data:image/png;base64',
      'data:image/gif;base64',
      'data:image/jpeg;base64',
      'https://',
      'http://',
    ],
    defaultImageHandler = 'https://',
    debugPrintTree = false,
  }: React.PropsWithChildren<MarkdownProps>) => {
    const memoizedRenderer = useMemo(
      () =>
        getRenderer(
          renderer,
          rules,
          style,
          mergeStyle,
          onLinkPress,
          maxTopLevelChildren,
          topLevelMaxExceededItem,
          allowedImageHandlers,
          defaultImageHandler,
          debugPrintTree,
        ),
      [
        maxTopLevelChildren,
        onLinkPress,
        renderer,
        rules,
        style,
        mergeStyle,
        topLevelMaxExceededItem,
        allowedImageHandlers,
        defaultImageHandler,
        debugPrintTree,
      ],
    );

    const memoizedParser = useMemo(() => markdownit, [markdownit]);
    const render =
      typeof memoizedRenderer === 'function'
        ? memoizedRenderer
        : memoizedRenderer.render;

    return parser(children as string | ASTNode[], render, memoizedParser);
  },
);

export default Markdown;
