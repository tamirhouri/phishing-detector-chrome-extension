export class UrlFeaturesExtractor {
  constructor(url) {
    this.url = url;
    this.urlObj = new URL(url);
  }

  // --------------------
  // 🔐 Security Features
  // --------------------

  isHttps() {
    return this.urlObj.protocol === 'https:';
  }

  // You'd need to fetch this data with `chrome.tabs.query` or a background fetch to check SSL cert.
  hasSslCert() {
    // Placeholder — would need actual implementation
    return null;
  }

  usesSuspiciousTLD() {
    const tld = this.urlObj.hostname.split('.').pop();
    const badTLDs = ['tk', 'ml', 'ga', 'cf', 'gq'];
    return badTLDs.includes(tld);
  }

  usesIPAddress() {
    return /^\d{1,3}(\.\d{1,3}){3}$/.test(this.urlObj.hostname);
  }

  // ----------------------------
  // 🧠 Lexical / Structural Features
  // ----------------------------

  urlLength() {
    return this.url.length;
  }

  hostnameLength() {
    return this.urlObj.hostname.length;
  }

  pathLength() {
    return this.urlObj.pathname.length;
  }

  queryLength() {
    return this.urlObj.search.length;
  }

  hashLength() {
    return this.urlObj.hash.length;
  }

  dotCount() {
    return (this.urlObj.hostname.match(/\./g) || []).length;
  }

  hyphenCount() {
    return (this.urlObj.hostname.match(/-/g) || []).length;
  }

  hasAtSymbol() {
    return this.url.includes('@') ? 1 : 0;
  }

  hasDoubleSlashInPath() {
    return this.urlObj.pathname.includes('//') ? 1 : 0;
  }

  hasEquals() {
    return this.url.includes('=') ? 1 : 0;
  }

  hasSemicolon() {
    return this.url.includes(';') ? 1 : 0;
  }

  isShortened() {
    const shorteners = ['bit.ly', 'tinyurl.com', 'goo.gl', 'ow.ly', 't.co'];
    return shorteners.some(domain => this.urlObj.hostname.includes(domain));
  }

  // ---------------------
  // 💬 Wordlist Features
  // ---------------------

  containsBrandName() {
    const brands = ['paypal', 'facebook', 'google', 'apple', 'amazon', 'microsoft'];
    return brands.some(name => this.url.toLowerCase().includes(name));
  }

  containsPhishyWords() {
    const phishyWords = ['secure', 'account', 'login', 'update', 'verify', 'banking'];
    return phishyWords.some(word => this.url.toLowerCase().includes(word));
  }

  looksLikeHex() {
    return /[a-f0-9]{20,}/i.test(this.url);
  }

  // --------------------
  // 🔁 Domain Features
  // --------------------

  isKnownDomain() {
    const whitelist = ['google.com', 'facebook.com', 'github.com']; // Extend as needed
    return whitelist.some(domain => this.urlObj.hostname.endsWith(domain));
  }

  domainAge() {
    // Requires WHOIS API — placeholder
    return null;
  }

  // --------------------
  // 🛠️ Extra Heuristics
  // --------------------

  hostnameEntropy() {
    const str = this.urlObj.hostname;
    const freq = {};
    for (let char of str) {
      freq[char] = (freq[char] || 0) + 1;
    }
    const len = str.length;
    let entropy = 0;
    for (let char in freq) {
      const p = freq[char] / len;
      entropy -= p * Math.log2(p);
    }
    return entropy;
  }

  // Levenshtein distance would need to be computed manually or with a library
  // Example: levenshtein(this.urlObj.hostname, 'paypal.com')

  // --------------------
  // 🎯 Final: All Features Together
  // --------------------

  extractAllFeatures() {
    return {
      isHttps: this.isHttps(),
      usesSuspiciousTLD: this.usesSuspiciousTLD(),
      usesIPAddress: this.usesIPAddress(),
      urlLength: this.urlLength(),
      hostnameLength: this.hostnameLength(),
      pathLength: this.pathLength(),
      queryLength: this.queryLength(),
      hashLength: this.hashLength(),
      dotCount: this.dotCount(),
      hyphenCount: this.hyphenCount(),
      hasAtSymbol: this.hasAtSymbol(),
      hasDoubleSlashInPath: this.hasDoubleSlashInPath(),
      hasEquals: this.hasEquals(),
      hasSemicolon: this.hasSemicolon(),
      isShortened: this.isShortened(),
      containsBrandName: this.containsBrandName(),
      containsPhishyWords: this.containsPhishyWords(),
      looksLikeHex: this.looksLikeHex(),
      isKnownDomain: this.isKnownDomain(),
      hostnameEntropy: this.hostnameEntropy(),
    };
  }
}
