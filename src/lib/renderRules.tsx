import React from 'react';
import {
  Text,
  TouchableWithoutFeedback,
  View,
  Platform,
  StyleSheet,
} from 'react-native';
import {Image} from 'expo-image';

import openUrl from './util/openUrl';
import hasParents from './util/hasParents';

import textStyleProps from './data/textStyleProps';
import type {ASTNode, RenderImageFunction, RenderLinkFunction, RenderRules} from '../types';

const baseRule = (
  fn: (
    node: ASTNode,
    children: React.ReactNode[],
    parent: ASTNode[],
    styles: Record<string, unknown>,
    inheritedStyles?: Record<string, unknown>,
  ) => React.ReactNode,
) => fn;

const linkRule = (fn: RenderLinkFunction) => fn;
const imageRule = (fn: RenderImageFunction) => fn;

const renderRules: RenderRules = {
  // when unknown elements are introduced, so it wont break
  unknown: baseRule(() => null),

  // The main container
  body: baseRule((node, children, parent, styles) => (
    <View key={node.key} style={styles._VIEW_SAFE_body as object}>
      {children}
    </View>
  )),

  // Headings
  heading1: baseRule((node, children, parent, styles) => (
    <View key={node.key} style={styles._VIEW_SAFE_heading1 as object}>
      {children}
    </View>
  )),
  heading2: baseRule((node, children, parent, styles) => (
    <View key={node.key} style={styles._VIEW_SAFE_heading2 as object}>
      {children}
    </View>
  )),
  heading3: baseRule((node, children, parent, styles) => (
    <View key={node.key} style={styles._VIEW_SAFE_heading3 as object}>
      {children}
    </View>
  )),
  heading4: baseRule((node, children, parent, styles) => (
    <View key={node.key} style={styles._VIEW_SAFE_heading4 as object}>
      {children}
    </View>
  )),
  heading5: baseRule((node, children, parent, styles) => (
    <View key={node.key} style={styles._VIEW_SAFE_heading5 as object}>
      {children}
    </View>
  )),
  heading6: baseRule((node, children, parent, styles) => (
    <View key={node.key} style={styles._VIEW_SAFE_heading6 as object}>
      {children}
    </View>
  )),

  // Horizontal Rule
  hr: baseRule((node, children, parent, styles) => (
    <View key={node.key} style={styles._VIEW_SAFE_hr as object} />
  )),

  // Emphasis
  strong: baseRule((node, children, parent, styles) => (
    <Text key={node.key} style={styles.strong as object}>
      {children}
    </Text>
  )),
  em: baseRule((node, children, parent, styles) => (
    <Text key={node.key} style={styles.em as object}>
      {children}
    </Text>
  )),
  s: baseRule((node, children, parent, styles) => (
    <Text key={node.key} style={styles.s as object}>
      {children}
    </Text>
  )),

  // Blockquotes
  blockquote: baseRule((node, children, parent, styles) => (
    <View key={node.key} style={styles._VIEW_SAFE_blockquote as object}>
      {children}
    </View>
  )),

  // Lists
  bullet_list: baseRule((node, children, parent, styles) => (
    <View key={node.key} style={styles._VIEW_SAFE_bullet_list as object}>
      {children}
    </View>
  )),
  ordered_list: baseRule((node, children, parent, styles) => (
    <View key={node.key} style={styles._VIEW_SAFE_ordered_list as object}>
      {children}
    </View>
  )),
  // this is a unique and quite annoying render rule because it has
  // child items that can be styled (the list icon and the list content)
  // outside of the AST tree so there are some work arounds in the
  // AST renderer specifically to get the styling right here
  list_item: baseRule((node, children, parent, styles, inheritedStyles = {}) => {
    // we need to grab any text specific stuff here that is applied on the list_item style
    // and apply it onto bullet_list_icon. the AST renderer has some workaround code to make
    // the content classes apply correctly to the child AST tree items as well
    // as code that forces the creation of the inheritedStyles object for list_items
    const refStyle = {
      ...inheritedStyles,
      ...(StyleSheet.flatten(styles.list_item) as object),
    };

    const arr = Object.keys(refStyle);

    const modifiedInheritedStylesObj: Record<string, unknown> = {};

    for (let b = 0; b < arr.length; b++) {
      if (textStyleProps.includes(arr[b] as (typeof textStyleProps)[number])) {
        modifiedInheritedStylesObj[arr[b]] = (refStyle as Record<string, unknown>)[arr[b]];
      }
    }

    if (hasParents(parent as ASTNode[], 'bullet_list')) {
      return (
        <View key={node.key} style={styles._VIEW_SAFE_list_item as object}>
          <Text
            style={[modifiedInheritedStylesObj, styles.bullet_list_icon as object]}
            accessible={false}>
            {Platform.select({
              android: '\u2022',
              ios: '\u00B7',
              default: '\u2022',
            })}
          </Text>
          <View style={styles._VIEW_SAFE_bullet_list_content as object}>
            {children}
          </View>
        </View>
      );
    }

    if (hasParents(parent as ASTNode[], 'ordered_list')) {
      const orderedListIndex = (parent as ASTNode[]).findIndex(
        (el) => el.type === 'ordered_list',
      );

      const orderedList = (parent as ASTNode[])[orderedListIndex];
      let listItemNumber: number;

      if (orderedList.attributes && orderedList.attributes.start) {
        listItemNumber = (orderedList.attributes.start as number) + node.index;
      } else {
        listItemNumber = node.index + 1;
      }

      return (
        <View key={node.key} style={styles._VIEW_SAFE_list_item as object}>
          <Text style={[modifiedInheritedStylesObj, styles.ordered_list_icon as object]}>
            {listItemNumber}
            {node.markup}
          </Text>
          <View style={styles._VIEW_SAFE_ordered_list_content as object}>
            {children}
          </View>
        </View>
      );
    }

    // we should not need this, but just in case
    return (
      <View key={node.key} style={styles._VIEW_SAFE_list_item as object}>
        {children}
      </View>
    );
  }),

  // Code
  code_inline: baseRule((node, children, parent, styles, inheritedStyles = {}) => (
    <Text key={node.key} style={[inheritedStyles as object, styles.code_inline as object]}>
      {node.content}
    </Text>
  )),
  code_block: baseRule((node, children, parent, styles, inheritedStyles = {}) => {
    // we trim new lines off the end of code blocks because the parser sends an extra one.
    let {content} = node;

    if (
      typeof node.content === 'string' &&
      node.content.charAt(node.content.length - 1) === '\n'
    ) {
      content = node.content.substring(0, node.content.length - 1);
    }

    return (
      <Text key={node.key} style={[inheritedStyles as object, styles.code_block as object]}>
        {content}
      </Text>
    );
  }),
  fence: baseRule((node, children, parent, styles, inheritedStyles = {}) => {
    // we trim new lines off the end of code blocks because the parser sends an extra one.
    let {content} = node;

    if (
      typeof node.content === 'string' &&
      node.content.charAt(node.content.length - 1) === '\n'
    ) {
      content = node.content.substring(0, node.content.length - 1);
    }

    return (
      <Text key={node.key} style={[inheritedStyles as object, styles.fence as object]}>
        {content}
      </Text>
    );
  }),

  // Tables
  table: baseRule((node, children, parent, styles) => (
    <View key={node.key} style={styles._VIEW_SAFE_table as object}>
      {children}
    </View>
  )),
  thead: baseRule((node, children, parent, styles) => (
    <View key={node.key} style={styles._VIEW_SAFE_thead as object}>
      {children}
    </View>
  )),
  tbody: baseRule((node, children, parent, styles) => (
    <View key={node.key} style={styles._VIEW_SAFE_tbody as object}>
      {children}
    </View>
  )),
  th: baseRule((node, children, parent, styles) => (
    <View key={node.key} style={styles._VIEW_SAFE_th as object}>
      {children}
    </View>
  )),
  tr: baseRule((node, children, parent, styles) => (
    <View key={node.key} style={styles._VIEW_SAFE_tr as object}>
      {children}
    </View>
  )),
  td: baseRule((node, children, parent, styles) => (
    <View key={node.key} style={styles._VIEW_SAFE_td as object}>
      {children}
    </View>
  )),

  // Links
  link: linkRule((node, children, parent, styles, onLinkPress) => (
    <Text
      key={node.key}
      style={styles.link as object}
      onPress={() => openUrl(node.attributes.href as string, onLinkPress)}>
      {children}
    </Text>
  )),
  blocklink: linkRule((node, children, parent, styles, onLinkPress) => (
    <TouchableWithoutFeedback
      key={node.key}
      onPress={() => openUrl(node.attributes.href as string, onLinkPress)}
      style={styles.blocklink as object}>
      <View style={styles.image as object}>{children}</View>
    </TouchableWithoutFeedback>
  )),

  // Images
  image: imageRule((
    node,
    children,
    parent,
    styles,
    allowedImageHandlers,
    defaultImageHandler,
  ) => {
    const {
      src,
      alt,
      width,
      height,
      contentFit,
      contentPosition,
    } = node.attributes as Record<string, string | number | undefined>;

    if (!src) {
      return null;
    }
    const srcValue = String(src);

    // we check that the source starts with at least one of the elements in allowedImageHandlers
    const show =
      allowedImageHandlers.filter((value: string) => {
        return srcValue.toLowerCase().startsWith(value.toLowerCase());
      }).length > 0;

    if (show === false && defaultImageHandler === null) {
      return null;
    }

    const imageUri =
      show === true ? srcValue : `${defaultImageHandler ?? ''}${srcValue}`;
    const widthValue =
      typeof width === 'number' ? width : width ? Number(width) : undefined;
    const heightValue =
      typeof height === 'number' ? height : height ? Number(height) : undefined;
    const sizeStyle =
      Number.isFinite(widthValue) || Number.isFinite(heightValue)
        ? {
            ...(Number.isFinite(widthValue) ? {width: widthValue} : {}),
            ...(Number.isFinite(heightValue) ? {height: heightValue} : {}),
          }
        : undefined;

    const imageProps: Record<string, unknown> & {
      style: object | object[];
      source: {uri: string};
      accessible?: boolean;
      accessibilityLabel?: string;
    } = {
      style: sizeStyle
        ? [styles._VIEW_SAFE_image as object, sizeStyle]
        : (styles._VIEW_SAFE_image as object),
      source: {
        uri: imageUri,
      },
    };

    if (typeof contentFit === 'string') {
      imageProps.contentFit = contentFit;
    }

    if (typeof contentPosition === 'string') {
      imageProps.contentPosition = contentPosition;
    }

    if (typeof alt === 'string' && alt.length > 0) {
      imageProps.accessible = true;
      imageProps.accessibilityLabel = alt;
    }

    return <Image key={node.key} {...imageProps} />;
  }),

  // Text Output
  text: baseRule((node, children, parent, styles, inheritedStyles = {}) => (
    <Text key={node.key} style={[inheritedStyles as object, styles.text as object]}>
      {node.content}
    </Text>
  )),
  textgroup: baseRule((node, children, parent, styles) => (
    <Text key={node.key} style={styles.textgroup as object}>
      {children}
    </Text>
  )),
  paragraph: baseRule((node, children, parent, styles) => (
    <View key={node.key} style={styles._VIEW_SAFE_paragraph as object}>
      {children}
    </View>
  )),
  hardbreak: baseRule((node, children, parent, styles) => (
    <Text key={node.key} style={styles.hardbreak as object}>
      {'\n'}
    </Text>
  )),
  softbreak: baseRule((node, children, parent, styles) => (
    <Text key={node.key} style={styles.softbreak as object}>
      {'\n'}
    </Text>
  )),

  // Believe these are never used but retained for completeness
  pre: baseRule((node, children, parent, styles) => (
    <View key={node.key} style={styles._VIEW_SAFE_pre as object}>
      {children}
    </View>
  )),
  inline: baseRule((node, children, parent, styles) => (
    <Text key={node.key} style={styles.inline as object}>
      {children}
    </Text>
  )),
  span: baseRule((node, children, parent, styles) => (
    <Text key={node.key} style={styles.span as object}>
      {children}
    </Text>
  )),
};

export default renderRules;
