class StaticContentDetector {
    constructor() { }

    predict() {
        const detectors = [
            { ...this._detectSuspiciousFormsScore(), weight: 1.0 },
            { ...this._detectMismatchedLinkTextScore(), weight: 0.7 },
            { ...this._detectExternalLogosScore(), weight: 0.4 },
            { ...this._detectPasswordFieldsWithoutHTTPSScore(), weight: 1.0 },
            { ...this._detectObfuscatedJavaScriptScore(), weight: 0.6 },
            { ...this._detectTooManyInputFieldsScore(), weight: 0.3 }
        ];

        const { totalWeight, weightedSum, reasons } = detectors.reduce((acc, detector) => {
            acc.weightedSum += detector.score * detector.weight;
            acc.totalWeight += detector.weight;
            acc.reasons.push(...detector.reasons || []);
            return acc;
        }, { weightedSum: 0, totalWeight: 0, reasons: [] });

        const finalScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

        return {
            score: Math.min(finalScore, 1),
            reasons
        };
    }

    _detectSuspiciousFormsScore() {
        const forms = document.querySelectorAll("form");
        const currentHost = location.hostname.replace(/^www\./, "");
        const baseDomain = (host) => host.split('.').slice(-2).join('.');

        let score = 0;
        const reasons = [];

        const suspiciousKeywords = ["login", "auth", "secure", "verify", "bank", "account"];

        Array.from(forms).forEach((form) => {
            const action = form.getAttribute("action");
            if (!action) return;

            try {
                const formUrl = new URL(action, location.href);
                const actionHost = formUrl.hostname.replace(/^www\./, "");

                const isCrossDomain = actionHost !== currentHost;
                const isSuspiciousSubdomain =
                    baseDomain(currentHost) === baseDomain(actionHost) &&
                    currentHost !== actionHost;

                const hasPhishyKeywords = suspiciousKeywords.some((word) =>
                    formUrl.href.toLowerCase().includes(word)
                );

                if (isCrossDomain) {
                    score += 0.6;
                    reasons.push(`Form action points to different domain: ${actionHost}`);
                }

                if (isSuspiciousSubdomain) {
                    score += 0.2;
                    reasons.push(`Suspicious subdomain in form action: ${actionHost}`);
                }

                if (hasPhishyKeywords) {
                    score += 0.2;
                    reasons.push(`Form action contains phishing-related keyword(s)`);
                }
            } catch {
                // Skip malformed URLs
            }
        });

        return { score: Math.min(score, 1), reasons };
    }

    _detectMismatchedLinkTextScore() {
        const links = document.querySelectorAll("a[href]");
        let suspiciousCount = 0;
        const reasons = [];

        const vagueTextList = [
            "click here", "login", "log in", "sign in", "verify", "update", "go", "submit", "continue"
        ];

        const shorteners = ["bit.ly", "t.co", "tinyurl.com", "goo.gl"];
        const domainPattern = /\b[a-z0-9.-]+\.[a-z]{2,}\b/;

        links.forEach(link => {
            const text = link.textContent.trim().toLowerCase();
            const href = link.getAttribute("href")?.toLowerCase();

            if (!text || !href) return;

            try {
                const hrefUrl = new URL(href, location.href);
                const isExternal = hrefUrl.hostname !== location.hostname;

                // Case 1: Mismatched visible domain vs. actual link
                const match = text.match(domainPattern);
                if (match && !href.includes(match[0]) && !text.includes("<")) { // Ensure text is not HTML
                    suspiciousCount++;
                    reasons.push(`Domain mismatch: text "${text}" vs href "${href}"`);
                    return;
                }

                // Case 2: Vague text + external link
                if (vagueTextList.includes(text) && isExternal) {
                    suspiciousCount++;
                    reasons.push(`Vague CTA "${text}" points to external domain "${hrefUrl.hostname}"`);
                    return;
                }

                // Case 3: Link uses known shortener
                if (shorteners.some(s => hrefUrl.hostname.includes(s))) {
                    suspiciousCount++;
                    reasons.push(`Shortened URL detected: "${hrefUrl.hostname}"`);
                    return;
                }

                // Case 4: Href uses raw IP address
                if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(hrefUrl.hostname)) {
                    suspiciousCount++;
                    reasons.push(`Link uses IP address instead of domain: "${hrefUrl.hostname}"`);
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

    _detectExternalLogosScore() {
        const imgs = document.querySelectorAll("img");
        const reasons = [];

        const currentHost = location.hostname.replace(/^www\./, "");
        let suspiciousCount = 0;

        imgs.forEach((img) => {
            const src = img.getAttribute("src");
            if (!src || !src.match(/logo/i)) return;

            try {
                const imgUrl = new URL(src, location.href);
                const imgHost = imgUrl.hostname.replace(/^www\./, "");

                if (imgHost !== currentHost) {
                    suspiciousCount++;
                    reasons.push(`Logo image loaded from different domain: ${imgHost}`);
                }
            } catch {
                // Ignore malformed URLs
            }
        });

        const score = Math.min(suspiciousCount / (imgs.length || 1), 1);
        return { score, reasons };
    }

    _detectPasswordFieldsWithoutHTTPSScore() {
        const passwordInputs = document.querySelectorAll("input[type='password']");
        const reasons = [];

        const isHttp = location.protocol !== "https:";

        if (passwordInputs.length > 0 && isHttp) {
            reasons.push("Page contains password field but is not served over HTTPS");
            return { score: 1, reasons };
        }

        return { score: 0, reasons };
    }

    _detectObfuscatedJavaScriptScore() {
        const scripts = document.querySelectorAll("script");
        const reasons = [];

        let suspiciousCount = 0;

        scripts.forEach((script) => {
            const text = script.innerText;

            if (text.includes("eval(")) {
                suspiciousCount++;
                reasons.push("Use of eval() detected in inline JavaScript");
            }

            if (text.includes("document.write(")) {
                suspiciousCount++;
                reasons.push("Use of document.write() detected in script");
            }
        });

        const score = Math.min(suspiciousCount / (scripts.length || 1), 1);
        return { score, reasons };
    }

    _detectTooManyInputFieldsScore() {
        const inputs = document.querySelectorAll("input");
        const reasons = [];

        if (inputs.length > 10) {
            reasons.push(`Page contains unusually many input fields (${inputs.length})`);
            return { score: 1, reasons };
        }

        return { score: 0, reasons };
    }
}