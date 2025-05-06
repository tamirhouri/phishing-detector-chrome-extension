const sigmoid = (z) => 1 / (1 + Math.exp(-z));

class StaticContentDetector {
  static LR_PARAMS = {
    bias: -2.2398080593777188,
    weights: [
      -0.9899956160523192, 2.702919061458331, -1.4968377434547058,
      3.3054986714530714, -0.5595815621302184, -0.001275593950066384,
    ],
  };

  static PHISHING_THRESHOLD = 0.34281203833795315;

  constructor(_withReasons = false, _withFeatures = false) {}

  withReasons() {
    this._withReasons = true;
    return this;
  }

  withFeatures() {
    this._withFeatures = true;
    return this;
  }

  _predictRaw() {
    return [
      this._detectSuspiciousFormsScore(),
      this._detectPasswordFieldsWithoutHTTPSScore(),
      this._detectMismatchedLinkTextScore(),
      this._detectObfuscatedJavaScriptScore(),
      this._detectExternalLogosScore(),
      this._detectTooManyInputFieldsScore(),
    ];
  }

  predict() {
    const detectors = this._predictRaw();
    const features = detectors.map((d) => d.score);

    const z = features.reduce(
      (sum, x_i, i) => sum + x_i * StaticContentDetector.LR_PARAMS.weights[i],
      StaticContentDetector.LR_PARAMS.bias
    );

    return {
      score: sigmoid(z),
      reasons: this._withReasons
        ? detectors.flatMap((d) => d.reasons ?? [])
        : undefined,
      features: this._withFeatures ? features : undefined,
    };
  }

  _detectSuspiciousFormsScore() {
    const forms = document.querySelectorAll('form');
    const currentHost = location.hostname.replace(/^www\./, '');
    const baseDomain = (host) => host.split('.').slice(-2).join('.');

    let score = 0;
    const reasons = this._withReasons ? [] : undefined;

    const suspiciousKeywords = [
      'login',
      'auth',
      'secure',
      'verify',
      'bank',
      'account',
    ];

    Array.from(forms).forEach((form) => {
      const action = form.getAttribute('action');
      if (!action) return;

      try {
        const formUrl = new URL(action, location.href);
        const actionHost = formUrl.hostname.replace(/^www\./, '');

        const isCrossDomain = actionHost !== currentHost;
        const isSuspiciousSubdomain =
          !isCrossDomain && baseDomain(currentHost) === baseDomain(actionHost);

        const hasPhishyKeywords = suspiciousKeywords.some((word) =>
          formUrl.href.toLowerCase().includes(word)
        );

        if (isCrossDomain) {
          score += 0.6;
          reasons?.push(`Form action points to cross-domain: ${actionHost}`);
        }

        if (isSuspiciousSubdomain) {
          score += 0.2;
          reasons?.push(`Form action on suspicious subdomain: ${actionHost}`);
        }

        if (hasPhishyKeywords) {
          score += 0.2;
          reasons?.push('Form action contains phishing-keyword(s)');
        }
      } catch {
        // Skip malformed URLs
      }
    });

    return { score: Math.min(score, 1), reasons };
  }

  _detectMismatchedLinkTextScore() {
    const links = document.querySelectorAll('a[href]');
    let suspiciousCount = 0;
    const reasons = this._withReasons ? [] : undefined;

    const vagueTextList = [
      'click here',
      'login',
      'log in',
      'sign in',
      'verify',
      'update',
      'go',
      'submit',
      'continue',
    ];

    const shorteners = ['bit.ly', 't.co', 'tinyurl.com', 'goo.gl'];
    const domainPattern = /\b[a-z0-9.-]+\.[a-z]{2,}\b/;

    links.forEach((link) => {
      const text = link.textContent.trim().toLowerCase();
      const href = link.getAttribute('href')?.toLowerCase();

      if (!text || !href) return;

      try {
        const hrefUrl = new URL(href, location.href);
        const isExternal = hrefUrl.hostname !== location.hostname;

        // Case 1: Mismatched visible domain vs. actual link
        const match = text.match(domainPattern);
        if (match && !href.includes(match[0]) && !text.includes('<')) {
          // Ensure text is not HTML
          suspiciousCount++;
          reasons?.push(`Domain mismatch: text "${text}" vs href "${href}"`);
          return;
        }

        // Case 2: Vague text + external link
        if (vagueTextList.includes(text) && isExternal) {
          suspiciousCount++;
          reasons?.push(
            `Vague CTA "${text}" points to external domain "${hrefUrl.hostname}"`
          );
          return;
        }

        // Case 3: Link uses known shortener
        if (shorteners.some((s) => hrefUrl.hostname.toLowerCase() === s)) {
          // Use strict equality for exact match
          suspiciousCount++;
          reasons?.push(`Shortened URL detected: "${hrefUrl.hostname}"`);
          return;
        }

        // Case 4: Href uses raw IP address
        if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(hrefUrl.hostname)) {
          suspiciousCount++;
          reasons?.push(
            `Link uses IP address instead of domain: "${hrefUrl.hostname}"`
          );
          return;
        }
      } catch {
        // Ignore invalid links
      }
    });

    const total = links.length || 1;
    const score = Math.min(suspiciousCount / total, 1);

    return { score, reasons };
  }

  knownCdns = [
    'static.wixstatic.com',
    'cdn.shopify.com',
    /(^|\.)amazonaws\.com$/i,
    'fonts.gstatic.com',
    'fonts.googleapis.com',
    'cloudfront.net',
    'akamaihd.net',
    'jsdelivr.net',
    'stackpathdns.com',
    'cdn.jsdelivr.net',
    'cloudflare.com',
    'fbcdn.net',
    'twimg.com',
    'instagram.com',
  ];

  _detectExternalLogosScore() {
    const imgs = Array.from(document.querySelectorAll('img'));
    const reasons = this._withReasons ? [] : undefined;
    const currentHost = location.hostname.replace(/^www\./, '');

    const isWhitelisted = (host) =>
      this.knownCdns.some((pattern) =>
        pattern instanceof RegExp ? pattern.test(host) : host === pattern
      );

    const logoImgs = imgs.filter((img) => {
      const src = img.getAttribute('src') || '';
      const alt = img.getAttribute('alt') || '';
      return /logo/i.test(src) || /logo/i.test(alt);
    });

    let suspiciousCount = 0;
    logoImgs.forEach((img) => {
      const src = img.getAttribute('src') || '';
      try {
        const imgUrl = new URL(src, location.href);
        const imgHost = imgUrl.hostname.replace(/^www\./, '');

        if (imgHost !== currentHost && !isWhitelisted(imgHost)) {
          suspiciousCount++;
          reasons?.push(`Logo image loaded from different domain: ${imgHost}`);
        }
      } catch {
        // skip malformed URLs
      }
    });

    const score = Math.min(suspiciousCount / (logoImgs.length || 1), 1);
    return { score, reasons };
  }

  _detectPasswordFieldsWithoutHTTPSScore() {
    const passwordInputs = document.querySelectorAll("input[type='password']");
    const reasons = this._withReasons ? [] : undefined;

    const isHttp = location.protocol !== 'https:';

    if (passwordInputs.length > 0 && isHttp) {
      reasons?.push(
        'Page contains password field but is not served over HTTPS'
      );
      return { score: 1, reasons };
    }

    return { score: 0, reasons };
  }

  _detectObfuscatedJavaScriptScore() {
    const scripts = document.querySelectorAll('script');
    const reasons = this._withReasons ? [] : undefined;

    let suspiciousCount = 0;

    const combinedScriptText = Array.from(scripts)
      .map((script) => script.innerText)
      .join('\n');

    const patterns = [
      {
        regex: /eval\(/,
        reason: 'Use of eval() detected in inline JavaScript',
      },
      {
        regex: /document\.write\(/,
        reason: 'Use of document.write() detected in script',
      },
      {
        regex: /new Function\(/,
        reason: 'Use of new Function() detected in script',
      },
      {
        regex: /atob\(|btoa\(/,
        reason: 'Base64 encoding/decoding detected in script',
        countThreshold: 2,
      },
      {
        regex: /setTimeout\(|setInterval\(/,
        reason:
          'Dynamic script injection using setTimeout or setInterval detected',
        countThreshold: 2,
      },
      {
        regex: /<script.*?>.*?<\/script>/,
        reason:
          'Suspicious regular expressions targeting <script> tags detected',
      },
      {
        regex: /(['"`][^'"`]*['"`])\s*\+\s*(['"`][^'"`]*['"`])/g,
        reason: 'Excessive string concatenation detected in script',
        countThreshold: 5,
      },
    ];

    patterns.forEach(({ regex, reason, countThreshold }) => {
      const matches = combinedScriptText.match(regex);
      if (matches) {
        if (countThreshold && matches.length > countThreshold) {
          suspiciousCount++;
          reasons?.push(reason);
        } else if (!countThreshold) {
          suspiciousCount++;
          reasons?.push(reason);
        }
      }
    });

    const score = Math.min(suspiciousCount / (scripts.length || 1), 1);
    return { score, reasons };
  }

  _detectTooManyInputFieldsScore() {
    const inputs = document.querySelectorAll('input');
    const reasons = this._withReasons ? [] : undefined;

    if (inputs.length > 10) {
      reasons?.push(
        `Page contains unusually many input fields (${inputs.length})`
      );
      return { score: 1, reasons };
    }

    return { score: 0, reasons };
  }
}
