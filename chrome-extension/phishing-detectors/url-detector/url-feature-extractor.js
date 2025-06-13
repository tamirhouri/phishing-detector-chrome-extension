export class UrlFeaturesExtractor {
  constructor(url) {
    this.url = url;
    this.urlObj = new URL(/^https?:\/\//i.test(url) ? url : 'http://' + url);
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

    if (parts.length > 0 && parts[0] === 'www') {
      parts = parts.slice(1);
    }

    if (parts.length <= 1) {
      return 0;
    }

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

  mainDomainLength() {
    const hostname = this.urlObj.hostname.toLowerCase();
    let parts = hostname.split('.');

    if (parts.length > 0 && parts[0] === 'www') {
      parts = parts.slice(1);
    }

    let domainIndex = parts.length - 2;
    for (let i = 0; i < parts.length - 1; i++) {
      const possibleSuffix = parts.slice(i).join('.');
      if (UrlFeaturesExtractor.PUBLIC_SUFFIXES.includes(possibleSuffix)) {
        domainIndex = i - 1;
        break;
      }
    }

    if (domainIndex >= 0) {
      return parts[domainIndex].length;
    }
    return 0;
  }

  isHttps() {
    return this.url.startsWith('https');
  }

  extractAllFeatures() {
    return {
      urlLength: parseFloat(+this.getLength()),
      subdomainLength: parseFloat(+this.subdomainLength()),
      mainDomainLength: parseFloat(+this.mainDomainLength()),
      dotCount: parseFloat(+this.dotCount()),
      hyphenCount: parseFloat(+this.hyphenCount()),
      pathLength: parseFloat(+this.pathLength()),
      isHttps: parseFloat(+this.isHttps()),
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

  static UNCOMMON_TLDS = [
    '.tk',
    '.ml',
    '.ga',
    '.cf',
    '.gq',
    '.win',
    '.top',
    '.xin',
    '.cc',
    '.cfd',
    '.icu',
    '.sbs',
    '.xyz',
  ];

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

  static PUBLIC_SUFFIXES = [
    'co.uk',
    'ac.uk',
    'gov.uk',
    'org.uk',
    'co.il',
    'org.il',
    'ac.il',
    'gov.il',
    'co.in',
    'org.in',
    'ac.in',
    'gov.in',
    'com.au',
    'gov.au',
    'edu.au',
    'com.cn',
    'gov.cn',
    'edu.cn',
    'net.cn',
    'co.za',
    'org.za',
    'gov.za',
  ];
}
