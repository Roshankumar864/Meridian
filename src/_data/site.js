/**
 * Global site metadata.
 * Deploy targets (Netlify, Vercel, Cloudflare Pages) expose the canonical
 * deploy URL as an env var; fall back to the production domain locally.
 */
const url =
  process.env.SITE_URL ||
  process.env.URL ||
  (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
  "https://meridian-control.netlify.app";

export default {
  url: url.replace(/\/$/, ""),
  name: "Meridian",
  legalName: "Meridian Control, Inc.",
  tagline: "Continuous compliance for engineering teams",
  description:
    "Meridian turns SOC 2, ISO 27001 and HIPAA controls into automated checks that run against your real infrastructure — so audits become a report, not a project.",
  locale: "en_GB",
  lang: "en",
  themeColor: "#0b1220",
  founded: "2019",
  email: "rosh63441@gmail.com",
  phone: "+91 98219 50573",
  address: {
    street: "40 Rushworth Street",
    city: "London",
    region: "England",
    postcode: "SE1 0RB",
    country: "GB",
  },
  social: {
    linkedin: "https://www.linkedin.com/company/example-meridian",
    github: "https://github.com/example-meridian",
  },
  credit: {
    text: "Built for Digital Heroes Training Task",
    url: "https://digitalheroesco.com",
  },
};
