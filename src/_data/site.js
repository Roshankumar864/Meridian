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
  /**
   * Contact form target.
   *
   * A static site has no server, so the POST has to go somewhere that will
   * accept it and send the mail. Rather than hard-code one vendor into the
   * template, the endpoint and any hidden fields it requires are declared here.
   *
   *   action  - where the browser posts
   *   netlify - adds data-netlify + the hidden form-name input
   *   hidden  - extra hidden inputs the provider needs (API key, redirect, …)
   *
   * Netlify Forms (requires "Form detection" enabled in project settings AND a
   * rebuild afterwards — detection happens at build time, not request time):
   *   { action: "/thanks/", netlify: true, hidden: {} }
   *
   * Web3Forms (no account, key issued by email, works on any host):
   *   { action: "https://api.web3forms.com/submit", netlify: false,
   *     hidden: { access_key: "…", redirect: "<site>/thanks/",
   *               subject: "New enquiry from the Meridian site" } }
   *
   * Formspree:
   *   { action: "https://formspree.io/f/<id>", netlify: false,
   *     hidden: { _next: "<site>/thanks/" } }
   */
  form: {
    action: "/thanks/",
    netlify: true,
    hidden: {},
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
