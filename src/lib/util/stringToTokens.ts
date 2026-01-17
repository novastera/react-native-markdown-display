import type {MarkdownParser, MarkdownTokenLike} from '../../types';

export function stringToTokens(
  source: string,
  markdownIt: MarkdownParser,
): MarkdownTokenLike[] {
  let result: MarkdownTokenLike[] = [];
  try {
    result = markdownIt.parse(source, {});
  } catch (err) {
    console.warn(err);
  }

  return result;
}
