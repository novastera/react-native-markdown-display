import type {ReactNode} from 'react';

import tokensToAST from './util/tokensToAST';
import {stringToTokens} from './util/stringToTokens';
import {cleanupTokens} from './util/cleanupTokens';
import groupTextTokens from './util/groupTextTokens';
import omitListItemParagraph from './util/omitListItemParagraph';
import type {ASTNode, MarkdownParser} from '../types';

export default function parser(
  source: string | ASTNode[],
  renderer: (nodes: ASTNode[]) => ReactNode,
  markdownIt: MarkdownParser,
): ReactNode {
  if (Array.isArray(source)) {
    return renderer(source);
  }

  let tokens = stringToTokens(source, markdownIt);
  tokens = cleanupTokens(tokens);
  tokens = groupTextTokens(tokens);
  tokens = omitListItemParagraph(tokens);

  const astTree = tokensToAST(tokens);

  return renderer(astTree);
}
