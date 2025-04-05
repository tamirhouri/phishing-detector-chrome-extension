export class UrlDetector {
  constructor() {
    this.freeHostingProviders = [
      "000webhost",
      "freehostia",
      "neocities",
      "wordpress",
      "blogspot",
      "netlify",
      "weebly",
      "github",
      "weeblysite"
    ]
  }

  predict() {
    const parsedUrl = new URL(window.location.href);
    const hostname = parsedUrl.hostname; // e.g., sub.example.com

    // Split the hostname into parts (e.g., ['sub', 'example', 'com'])
    const parts = hostname.split('.');

    let score = 0;
    // Ensure we have at least one subdomain (minimum 3 parts: subdomain, domain, TLD)
    if (parts.length < 3) {
      return score;
    }

    // Extract the subdomain portion (all parts except the last two)
    const subdomainParts = parts.slice(0, parts.length - 2);
    const subdomain = subdomainParts.join('.');

    // Check the first condition: subdomain length must be greater than 5
    if (subdomain.length > 5) {
      score += 0.5;
    }

    // Extract the main domain (assuming the second-to-last part)
    const domain = parts[parts.length - 2].toLowerCase();

    // List of known free hosting providers (adjust as needed)
    const isFreeHosting = this.freeHostingProviders.includes(domain);

    // Check if the URL has multiple segments divided by hyphen.
    // Splitting by '-' yields an array; if there is at least one hyphen,
    // then there are multiple segments.
    const hasHyphenSegments = window.location.href.split('-').length > 1;

    // Apply the heuristic:
    // IF (subdomain length > 5) AND ((is free hosting) OR (has hyphen segments))
    if (isFreeHosting || hasHyphenSegments) {
      score += 0.5;
    }

    return score;
  }
}
