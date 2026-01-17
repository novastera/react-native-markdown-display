import type {MarkdownTokenLike} from '../../types';
import TokenGroup from './Token';

export default function groupTextTokens(
  tokens: MarkdownTokenLike[],
): MarkdownTokenLike[] {
  const result: MarkdownTokenLike[] = [];

  let hasGroup = false;

  tokens.forEach((token) => {
    if (!token.block && !hasGroup) {
      hasGroup = true;
      result.push(new TokenGroup('textgroup', 1));
      result.push(token);
    } else if (!token.block && hasGroup) {
      result.push(token);
    } else if (token.block && hasGroup) {
      hasGroup = false;
      result.push(new TokenGroup('textgroup', -1));
      result.push(token);
    } else {
      result.push(token);
    }
  });

  return result;
}
