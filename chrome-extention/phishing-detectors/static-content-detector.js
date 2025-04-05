export class StaticContentDetector {
    constructor() {}

    predict(url) {
        let score = 0;
        const htmlLength = document.documentElement.outerHTML.length;
        const isHtmlShort = htmlLength < 7500;
        if (isHtmlShort) {
            score += 0.35;
        }
        // Condition 2: Check form actions
        const forms = document.querySelectorAll("form");
        let insecureForms = 0;
        forms.forEach(form => {
            const action = form.getAttribute("action");
            if (!action || action.startsWith("http://")) {
                insecureForms++;
            }
        });
        const hasInsecureForm = insecureForms > 0;
        if (hasInsecureForm) {
            score += 0.35;
        }
        // Condition 3: Check external images
        const images = document.querySelectorAll("img");
        let externalImages = 0;
        const currentDomain = window.location.hostname;
        images.forEach(img => {
            const src = img.getAttribute("src");
            if (src && src.startsWith("http") && !src.includes(currentDomain)) {
                externalImages++;
            }
        });
        const isFewExternalImages = externalImages <= 5;
        if (isFewExternalImages) {
            score += 0.35;
        }

        return Math.min(score, 1);
    }
}
