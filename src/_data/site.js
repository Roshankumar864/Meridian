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
  legalName: "Meridian Control Technologies Pvt. Ltd.",
  tagline: "Continuous compliance for engineering teams",
  description:
    "Meridian turns SOC 2, ISO 27001 and DPDP controls into automated checks that run against your real infrastructure — so audits become a report, not a project.",
  locale: "en_IN",
  lang: "en-IN",
  themeColor: "#0b1220",
  founded: "2019",
  email: "rosh63441@gmail.com",
  phone: "+91 98219 50573",
  address: {
    street: "Unit 402, Solitaire Corporate Park, Andheri East",
    city: "Mumbai",
    region: "Maharashtra",
    postcode: "400093",
    country: "IN",
    countryName: "India",
  },
  hours: "Monday to Friday, 09:30–18:30 IST",
  social: {
    linkedin: "https://www.linkedin.com/company/example-meridian",
    github: "https://github.com/example-meridian",
  },
  credit: {
    text: "Built for Digital Heroes Training Task",
    url: "https://digitalheroesco.com",
  },
};
