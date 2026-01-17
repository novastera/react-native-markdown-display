import type {ReactElement} from 'react';

type SplitNodes = {
  textNodes: ReactElement[];
  nonTextNodes: ReactElement[];
};

function isTextElement(node: ReactElement): boolean {
  if (typeof node.type === 'string') {
    return node.type === 'Text';
  }

  const displayName = (node.type as {displayName?: string}).displayName;
  return displayName === 'Text';
}

export default function splitTextNonTextNodes(
  children: ReactElement[],
): SplitNodes {
  return children.reduce<SplitNodes>(
    (acc, curr) => {
      if (isTextElement(curr)) {
        acc.textNodes.push(curr);
      } else {
        acc.nonTextNodes.push(curr);
      }

      return acc;
    },
    {textNodes: [], nonTextNodes: []},
  );
}
