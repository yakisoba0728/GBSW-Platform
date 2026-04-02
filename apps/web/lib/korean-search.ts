const CHOSEONG = [
  'ㄱ',
  'ㄲ',
  'ㄴ',
  'ㄷ',
  'ㄸ',
  'ㄹ',
  'ㅁ',
  'ㅂ',
  'ㅃ',
  'ㅅ',
  'ㅆ',
  'ㅇ',
  'ㅈ',
  'ㅉ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ',
] as const

function getChoseong(char: string) {
  const code = char.charCodeAt(0) - 0xac00

  if (code < 0 || code > 11171) {
    return char
  }

  return CHOSEONG[Math.floor(code / 588)]
}

export function koreanIncludes(text: string, query: string) {
  const normalizedQuery = query.trim()

  if (!normalizedQuery) {
    return true
  }

  if (text.includes(normalizedQuery)) {
    return true
  }

  const textChars = Array.from(text)
  const queryChars = Array.from(normalizedQuery)

  outer: for (
    let textIndex = 0;
    textIndex <= textChars.length - queryChars.length;
    textIndex += 1
  ) {
    for (
      let queryIndex = 0;
      queryIndex < queryChars.length;
      queryIndex += 1
    ) {
      const queryChar = queryChars[queryIndex]
      const textChar = textChars[textIndex + queryIndex]

      if (/^[ㄱ-ㅎ]$/.test(queryChar)) {
        if (getChoseong(textChar) !== queryChar) {
          continue outer
        }

        continue
      }

      if (textChar !== queryChar) {
        continue outer
      }
    }

    return true
  }

  return false
}
