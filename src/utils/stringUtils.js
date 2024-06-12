function abbreviateString (str, maxLen) {
  if (str.length <= maxLen) {
    return str;
  } else {
    return str.substring(0, maxLen - 1) + " ...";
  }
}

function levenshteinDistance (str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const dp = [];
  for (let i = 0; i <= len1; i++) {
    dp[i] = [];
    for (let j = 0; j <= len2; j++) {
      if (i === 0) {
        dp[i][j] = j;
      } else if (j === 0) {
        dp[i][j] = i;
      } else {
        dp[i][j] = 0;
      }
    }
  }
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[len1][len2];
}

function levenshteinGetSuggest(searchText, wordList, size) {
  return wordList.sort((a, b) => levenshteinDistance(searchText, a) - levenshteinDistance(searchText, b)).slice(0, size);
}

export default {
  abbreviateString,
  levenshteinDistance,
  levenshteinGetSuggest
};
