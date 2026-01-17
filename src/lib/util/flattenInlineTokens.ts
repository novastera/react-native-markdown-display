import type {MarkdownTokenLike} from '../../types';

export default function flattenTokens(tokens: MarkdownTokenLike[]): MarkdownTokenLike[] {
  return tokens.reduce<MarkdownTokenLike[]>((acc, curr) => {
    if (curr.type === 'inline' && curr.children && curr.children.length > 0) {
      const children = flattenTokens(curr.children);
      while (children.length) {
        acc.push(children.shift() as MarkdownTokenLike);
      }
    } else {
      acc.push(curr);
    }

    return acc;
  }, []);
}
