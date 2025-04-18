export class UrlFeaturesExtractor {
    static SHORTENING_SERVICES = new Set([
        "bit.ly", "tinyurl.com", "goo.gl", "ow.ly", "t.co", "is.gd", "bitly.com",
        "vzturl.com", "qr.net", "1url.com", "tweez.me", "v.gd", "tr.im", "link.zip.net",
        "filoops.info"
    ]);

    static SUSPICIOUS_WORDS = new Set([
        "login", "verify", "account", "password", "bank", "secure",
        "free", "lucky", "service", "bonus", "ebayisapi", "webscr",
        "paypal", "signin", "update"
    ]);

    static UNCOMMON_TLDS = new Set([".tk", ".ml", ".ga", ".cf", ".gq"]);

    constructor(url) {
        this.url = url;
        this.urlObj = new URL(url);
    }


    getLength() {
        return this.url.length;
    }

    hyphenCount() {
        return (this.urlObj.hostname.match(/-/g) || []).length;
    }

    countSpecialChars() {
        return ["@", "=", "&", "#", "?", "%", "+"].reduce((count, char) => count + (this.url.split(char).length - 1), 0);
    }

    portLength() {
        return this.urlObj.port ? this.urlObj.port.length : 0;
    }

    hasRedirection() {
        const strippedUrl = this.url.replace(/^https?:\/\//, "");
        return strippedUrl.includes("//");
    }

    urlPathDepth() {
        return this.urlObj.pathname.split("/").filter(part => part).length;
    }

    digitCount() {
        return (this.url.match(/\d/g) || []).length;
    }

    hasShorteningService() {
        const host = this.urlObj.hostname.toLowerCase();
        return Array.from(UrlFeaturesExtractor.SHORTENING_SERVICES)
            .some(service => host === service || host.endsWith("." + service));
    }

    hasIpAddress() {
        const ipRegex = /^(?:\d{1,3}\.){3}\d{1,3}$/;
        return ipRegex.test(this.urlObj.hostname);
    }

    subdomainCount() {
        if (this.hasIpAddress()) return 0.0;
        const parts = this.urlObj.hostname.split(".");
        return Math.max(0, parts.length - 2);
    }

    hasSuspiciousWords() {
        return Array.from(UrlFeaturesExtractor.SUSPICIOUS_WORDS).some(word => this.url.toLowerCase().includes(word));
    }

    uncommonTld() {
        return Array.from(UrlFeaturesExtractor.UNCOMMON_TLDS).some(tld => this.urlObj.hostname.endsWith(tld));
    }

    isHttps() {
        return this.urlObj.protocol === 'https:';
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

    dotCount() {
        return (this.urlObj.hostname.match(/\./g) || []).length;
    }

    extractAllFeatures() {
        return {
            urlLength: parseFloat(+this.getLength()),
            dotCount: parseFloat(+this.dotCount()),
            hyphenCount: parseFloat(+this.hyphenCount()),
            isHttps: parseFloat(+this.isHttps()),
            hostnameLength: parseFloat(+this.hostnameLength()),
            pathLength: parseFloat(+this.pathLength()),
            queryLength: parseFloat(+this.queryLength()),
            portLength: parseFloat(+this.portLength()),
            hasRedirection: parseFloat(+this.hasRedirection()),
            urlPathDepth: parseFloat(+this.urlPathDepth()),
            digitCount: parseFloat(+this.digitCount()),
            hasShorteningService: parseFloat(+this.hasShorteningService()),
            hasIpAddress: parseFloat(+this.hasIpAddress()),
            subdomainCount: parseFloat(+this.subdomainCount()),
            hasSuspiciousWords: parseFloat(+this.hasSuspiciousWords()),
            countSpecialChars: parseFloat(+this.countSpecialChars()),
            uncommonTld: parseFloat(+this.uncommonTld())
        };
    }
}
