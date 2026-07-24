import fs from "node:fs";
import path from "node:path";

export default function (eleventyConfig) {
  // Static passthrough. CSS is inlined at build time (see `inlineCss` below),
  // so only images/fonts/icons are copied.
  eleventyConfig.addPassthroughCopy({ "src/assets/img": "assets/img" });
  eleventyConfig.addPassthroughCopy({ "src/assets/static": "/" });

  eleventyConfig.addWatchTarget("src/assets/css");

  /**
   * Inline the site stylesheet into <head>.
   * The whole sheet is ~9 KB uncompressed, which is smaller than the round trip
   * a separate render-blocking request would cost. Removes the CSS request from
   * the critical path entirely -> better FCP/LCP on slow mobile connections.
   */
  eleventyConfig.addShortcode("inlineCss", () => {
    const file = path.join(process.cwd(), "src/assets/css/main.css");
    return fs.readFileSync(file, "utf8");
  });

  // Absolute URL helper for canonical / og / schema fields.
  eleventyConfig.addFilter("absoluteUrl", (url, base) =>
    new URL(url, base).href
  );

  eleventyConfig.addFilter("isoDate", (d) => new Date(d).toISOString());

  // 1450 -> "1,450". Display only; the schema Offer keeps the raw number.
  eleventyConfig.addFilter("money", (n) =>
    new Intl.NumberFormat("en-GB").format(n)
  );

  // `{{ obj | json }}` for JSON-LD blocks.
  eleventyConfig.addFilter("json", (value) => JSON.stringify(value, null, 2));

  /**
   * Build the page's JSON-LD @graph.
   *
   * Kept in JS rather than hand-written in the templates so the structured data
   * is generated from the same data files that render the visible page — a
   * price cannot change on /pricing/ without the Offer changing with it, which
   * is the usual source of "structured data does not match page content"
   * warnings in Search Console.
   */
  eleventyConfig.addShortcode("schemaGraph", (o) => {
    const { site, page, meta = {}, plans, faqs, breadcrumbs } = o;
    const abs = (u) => new URL(u, site.url).href;
    const orgId = `${site.url}/#organization`;
    const siteId = `${site.url}/#website`;
    const pageId = `${abs(page.url)}#webpage`;

    const graph = [
      {
        "@type": "Organization",
        "@id": orgId,
        name: site.name,
        legalName: site.legalName,
        url: `${site.url}/`,
        description: site.description,
        foundingDate: site.founded,
        logo: {
          "@type": "ImageObject",
          "@id": `${site.url}/#logo`,
          url: abs("/assets/img/logo.svg"),
          width: 512,
          height: 512,
          caption: site.name,
        },
        image: { "@id": `${site.url}/#logo` },
        email: site.email,
        telephone: site.phone,
        address: {
          "@type": "PostalAddress",
          streetAddress: site.address.street,
          addressLocality: site.address.city,
          addressRegion: site.address.region,
          postalCode: site.address.postcode,
          addressCountry: site.address.country,
        },
        contactPoint: [
          {
            "@type": "ContactPoint",
            contactType: "sales",
            email: site.email,
            telephone: site.phone,
            availableLanguage: ["English"],
            areaServed: ["GB", "EU", "US"],
          },
          {
            "@type": "ContactPoint",
            contactType: "technical support",
            email: `support@${site.email.split("@")[1]}`,
            availableLanguage: ["English"],
          },
        ],
        sameAs: Object.values(site.social),
      },
      {
        "@type": "WebSite",
        "@id": siteId,
        url: `${site.url}/`,
        name: site.name,
        description: site.description,
        publisher: { "@id": orgId },
        inLanguage: site.lang,
      },
      {
        "@type": meta.pageType || "WebPage",
        "@id": pageId,
        url: abs(page.url),
        name: meta.title,
        description: meta.description,
        isPartOf: { "@id": siteId },
        about: { "@id": orgId },
        inLanguage: site.lang,
        primaryImageOfPage: { "@id": `${site.url}/#logo` },
        datePublished: "2024-01-15",
        dateModified: new Date(page.date).toISOString().slice(0, 10),
      },
    ];

    if (breadcrumbs && breadcrumbs.length) {
      const crumbs = [{ text: "Home", url: "/" }, ...breadcrumbs];
      graph.push({
        "@type": "BreadcrumbList",
        "@id": `${abs(page.url)}#breadcrumb`,
        itemListElement: crumbs.map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: c.text,
          item: abs(c.url),
        })),
      });
      graph[2].breadcrumb = { "@id": `${abs(page.url)}#breadcrumb` };
    }

    if (meta.product && plans) {
      const numeric = plans.tiers.filter((t) => typeof t.price === "number");
      graph.push({
        "@type": "SoftwareApplication",
        "@id": `${site.url}/#software`,
        name: `${site.name} Control`,
        applicationCategory: "BusinessApplication",
        applicationSubCategory: "Compliance automation",
        operatingSystem: "Web browser",
        url: abs("/product/"),
        description:
          "Compliance automation platform that continuously tests SOC 2, ISO 27001, HIPAA and GDPR controls against live infrastructure and collects audit evidence automatically.",
        publisher: { "@id": orgId },
        provider: { "@id": orgId },
        image: abs("/assets/img/og.png"),
        featureList: (meta.featureList || []).join(", "),
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: plans.currency,
          lowPrice: Math.min(...numeric.map((t) => t.price)),
          highPrice: Math.max(...numeric.map((t) => t.price)),
          offerCount: plans.tiers.length,
          url: abs("/pricing/"),
          offers: numeric.map((t) => ({
            "@type": "Offer",
            name: `${site.name} ${t.name}`,
            price: t.price,
            priceCurrency: plans.currency,
            url: `${abs("/pricing/")}#plan-${t.id}`,
            availability: "https://schema.org/InStock",
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price: t.price,
              priceCurrency: plans.currency,
              billingIncrement: 1,
              unitCode: "MON",
              referenceQuantity: {
                "@type": "QuantitativeValue",
                value: 1,
                unitCode: "MON",
              },
            },
          })),
        },
      });
    }

    if (faqs && faqs.length) {
      graph.push({
        "@type": "FAQPage",
        "@id": `${abs(page.url)}#faq`,
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      });
    }

    return JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
  });

  // Collapse whitespace in HTML output. Cheap, dependency-free minification
  // that never touches <pre>/<textarea> content.
  eleventyConfig.addTransform("htmlmin", function (content) {
    if (!(this.page.outputPath || "").endsWith(".html")) return content;
    return content
      .replace(/\n\s*\n/g, "\n")
      .replace(/>\s+</g, "><")
      .trim();
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
