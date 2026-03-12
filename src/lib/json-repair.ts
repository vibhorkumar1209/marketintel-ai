/**
 * Simple utility to repair truncated JSON strings by closing unclosed quotes, brackets, and braces.
 */
export function repairJson(str: string): string {
  let s = str.trim();
  
  // Find the first { or [ to start from
  const firstBrace = s.indexOf('{');
  const firstBracket = s.indexOf('[');
  let start = -1;
  if (firstBrace !== -1 && firstBracket !== -1) {
    start = Math.min(firstBrace, firstBracket);
  } else {
    start = firstBrace !== -1 ? firstBrace : firstBracket;
  }
  
  if (start === -1) return s;
  s = s.substring(start);

  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (let i = 0; i < s.length; i++) {
    const char = s[i];
    
    if (escaped) {
      escaped = false;
      continue;
    }
    
    if (char === '\\') {
      escaped = true;
      continue;
    }
    
    if (char === '"') {
      inString = !inString;
      continue;
    }
    
    if (inString) continue;

    if (char === '{') {
      stack.push('}');
    } else if (char === '[') {
      stack.push(']');
    } else if (char === '}') {
      if (stack[stack.length - 1] === '}') stack.pop();
    } else if (char === ']') {
      if (stack[stack.length - 1] === ']') stack.pop();
    }
  }

  // If we ended inside a string, close it
  if (inString) {
    s += '"';
  }

  // Remove any trailing commas that would make the JSON invalid
  s = s.trim().replace(/,$/, '');

  // Close everything still in the stack
  while (stack.length > 0) {
    const closer = stack.pop();
    s = s.trim().replace(/,$/, ''); // Remove comma before closing
    s += closer;
  }

  return s;
}

export function safeJsonParse<T>(str: string, fallback: T): T {
  try {
    // Try normal parse
    const jsonMatch = str.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    const toParse = jsonMatch ? jsonMatch[0] : str;
    return JSON.parse(toParse) as T;
  } catch {
    try {
      // Try repair if normal parse fails
      const repaired = repairJson(str);
      return JSON.parse(repaired) as T;
    } catch {
      return fallback;
    }
  }
}
