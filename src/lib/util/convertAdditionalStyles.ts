function toCamelCase(input: string): string {
  return input.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());
}

function parseValue(value: string): string | number {
  const trimmed = value.trim();
  const pxMatch = trimmed.match(/^(-?\d+(\.\d+)?)px$/);
  if (pxMatch) {
    return Number(pxMatch[1]);
  }

  const numMatch = trimmed.match(/^-?\d+(\.\d+)?$/);
  if (numMatch) {
    return Number(trimmed);
  }

  return trimmed;
}

export default function convertAdditionalStyles(
  style: string,
): Record<string, string | number> {
  if (!style || typeof style !== 'string') {
    return {};
  }

  const rules = style.split(';');

  const tuples = rules
    .map((rule) => {
      const [rawKey, rawValue] = rule.split(':');

      if (rawKey && rawValue) {
        const key = toCamelCase(rawKey.trim());
        const value = parseValue(rawValue);
        return [key, value] as const;
      }

      return null;
    })
    .filter(
      (x): x is readonly [string, string | number] => x !== null,
    );

  return tuples.reduce<Record<string, string | number>>((acc, [key, value]) => {
    acc[key] = value;
    return acc;
  }, {});
}
