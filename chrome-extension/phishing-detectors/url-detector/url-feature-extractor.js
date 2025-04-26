class UrlFeaturesExtractor {
  constructor(url) {
    this.url = url;
    this.urlObj = new URL(/^https?:\/\//i.test(url) ? url : 'http://' + url); // Prepend 'http://' if the URL does not have a protocol
  }

  getLength() {
    return this.url.length;
  }

  hyphenCount() {
    return (this.urlObj.hostname.match(/-/g) || []).length;
  }

  hasRedirection() {
    const strippedUrl = this.url.replace(/^https?:\/\//, '');
    return strippedUrl.includes('//');
  }

  urlPathDepth() {
    return this.urlObj.pathname.split('/').filter((part) => part).length;
  }

  digitCount() {
    return (this.url.match(/\d/g) || []).length;
  }

  hasShorteningService() {
    const host = this.urlObj.hostname.toLowerCase();
    return UrlFeaturesExtractor.SHORTENING_SERVICES.some(
      (service) => host === service || host.endsWith('.' + service)
    );
  }

  hasIpAddress() {
    const ipRegex = /^(?:\d{1,3}\.){3}\d{1,3}$/;
    return ipRegex.test(this.urlObj.hostname);
  }

  subdomainCount() {
    if (this.hasIpAddress()) return 0;
    const parts = this.urlObj.hostname.split('.');
    return Math.max(0, parts.length - 2);
  }

  hasSuspiciousWords() {
    return UrlFeaturesExtractor.SUSPICIOUS_WORDS.some((word) =>
      this.url.toLowerCase().includes(word)
    );
  }

  uncommonTld() {
    return UrlFeaturesExtractor.UNCOMMON_TLDS.some((tld) =>
      this.urlObj.hostname.endsWith(tld)
    );
  }

  pathLength() {
    return this.urlObj.pathname.length;
  }

  queryLength() {
    return this.urlObj.search.length;
  }

  dotCount() {
    return (this.urlObj.hostname.match(/\./g) || []).length;
  }

  containsBrandName() {
    const urlLower = this.url.toLowerCase();
    return UrlFeaturesExtractor.BRANDS.some((brand) =>
      urlLower.includes(brand)
    );
  }

  subdomainLength() {
    if (this.hasIpAddress()) {
      return 0;
    }

    const hostname = this.urlObj.hostname.toLowerCase();
    let parts = hostname.split('.');

    // Remove 'www' if present
    if (parts.length > 0 && parts[0] === 'www') {
      parts = parts.slice(1);
    }

    // Must have at least 2 parts to exclude TLD
    if (parts.length <= 1) {
      return 0;
    }

    // Exclude the last part (TLD), keep the rest
    const domainParts = parts.slice(0, -1);

    return domainParts.reduce((sum, part) => sum + part.length, 0);
  }

  encodedCharCount() {
    return (this.url.match(/%/g) || []).length;
  }

  tokenCount() {
    const tokens = this.url.split(/[\/\-\.\=\?\&\%\_\@]/);
    return tokens.filter((token) => !!token).length;
  }

  extractAllFeatures() {
    return {
      urlLength: parseFloat(+this.getLength()),
      subdomainLength: parseFloat(+this.subdomainLength()),
      dotCount: parseFloat(+this.dotCount()),
      hyphenCount: parseFloat(+this.hyphenCount()),
      pathLength: parseFloat(+this.pathLength()),
      queryLength: parseFloat(+this.queryLength()),
      hasRedirection: parseFloat(+this.hasRedirection()),
      urlPathDepth: parseFloat(+this.urlPathDepth()),
      digitCount: parseFloat(+this.digitCount()),
      tokenCount: parseFloat(+this.tokenCount()),
      encodedCharCount: parseFloat(+this.encodedCharCount()),
      hasShorteningService: parseFloat(+this.hasShorteningService()),
      hasIpAddress: parseFloat(+this.hasIpAddress()),
      subdomainCount: parseFloat(+this.subdomainCount()),
      uncommonTld: parseFloat(+this.uncommonTld()),
      hasSuspiciousWords: parseFloat(+this.hasSuspiciousWords()),
      containsBrandName: parseFloat(+this.containsBrandName()),
    };
  }

  static SHORTENING_SERVICES = [
    'bit.ly',
    'tinyurl.com',
    'goo.gl',
    'ow.ly',
    't.co',
    'is.gd',
    'bitly.com',
    'vzturl.com',
    'qr.net',
    '1url.com',
    'tweez.me',
    'v.gd',
    'tr.im',
    'link.zip.net',
    'filoops.info',
  ];

  static SUSPICIOUS_WORDS = [
    'login',
    'verify',
    'account',
    'password',
    'bank',
    'secure',
    'free',
    'lucky',
    'service',
    'bonus',
    'ebayisapi',
    'webscr',
    'paypal',
    'signin',
    'update',
  ];

  static UNCOMMON_TLDS = ['.tk', '.ml', '.ga', '.cf', '.gq'];

  static BRANDS = [
    'paypal',
    'visa',
    'mastercard',
    'stripe',
    'square',
    'bankofamerica',
    'google',
    'gmail',
    'youtube',
    'android',
    'chrome',
    'facebook',
    'instagram',
    'whatsapp',
    'meta',
    'apple',
    'icloud',
    'mac',
    'itunes',
    'amazon',
    'aws',
    'microsoft',
    'office365',
    'outlook',
    'live',
    'onedrive',
    'windows',
    'github',
    'gitlab',
    'bitbucket',
    'dropbox',
    'twitter',
    'x.com',
    'tiktok',
    'snapchat',
    'linkedin',
    'slack',
    'zoom',
    'netflix',
    'hulu',
    'disney',
    'spotify',
    'steam',
    'epicgames',
    'ebay',
    'etsy',
    'shopify',
    'alibaba',
    'yahoo',
    'proton',
    'adobe',
  ];
}
