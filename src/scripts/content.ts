console.log("Content script loaded.");

/**
 * Finds the best-matching URL for a privacy-related link on the page.
 * 
 * - Patterns are prioritized by their order in the array; **lower indices mean higher priority**.
 * - Adding new patterns is easy; add it to the appropriate position in the array to adjust priority without needing to assign scores.
 * - URLs are sorted by array index priority, with the URL from the lowest index match being returned.
 *
 * @returns {string | undefined} - Best-matching URL or `undefined` if no match is found.
 */
const findPrivacyPolicyUrl = () => {
  const patterns = [
    /privacy-policy\b/i, // highest priority
    /\bprivacy\/policy\b/i,
    /privacy-policy-[a-z]+/i,
    /\bpolicy\/privacy\b/i,
    /\bprivacy\b/i,
    /\bdata-protection\b/i,
    /\bsecurity-policy\b/i,
    /\blegal-notice\b/i,
    /\bcookie-policy\b/i,
    /\bterms-of-service\b/i,
    /\bterms-and-conditions\b/i,
    /\bterms\b/i,
    /\bcompliance\b/i,
    /\bdisclaimer\b/i,
    /\blegal\b/i,
  ];

  const urls = Array.from(document.querySelectorAll("a"))
    .map(anchor => anchor.href)
    .filter(href => href.startsWith("http"));

  const bestMatch = urls
    .map(url => {
      const index = patterns.findIndex(regex => regex.test(url));
      return { url, score: index === -1 ? Infinity : index };
    })
    .filter(({ score }) => score < Infinity)  // Keep only matched URLs
    .sort((a, b) => a.score - b.score)[0];  // Sort by score (index) and get the first match

  return bestMatch ? bestMatch.url : undefined;
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getPrivacyUrl') {
    const privacyPolicyUrl = findPrivacyPolicyUrl();
    sendResponse({
      status: privacyPolicyUrl ? 'success' : 'error',
      privacyPolicyUrl
    });
  }
});
