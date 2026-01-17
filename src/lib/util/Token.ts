import type {MarkdownTokenLike} from '../../types';

export default class Token implements MarkdownTokenLike {
  type: string;
  nesting: number;
  children: MarkdownTokenLike[] | null;
  block: boolean;

  constructor(
    type: string,
    nesting = 0,
    children: MarkdownTokenLike[] | null = null,
    block = false,
  ) {
    this.type = type;
    this.nesting = nesting;
    this.children = children;
    this.block = block;
  }
}
