function extractLeadData() {
  const text = document.documentElement.innerText;

  const emailRegex = /[\w.+-]+@[\w.-]+\.[a-z]{2,6}/gi;
  const textEmails = text.match(emailRegex) || [];
  const mailtoEmails = Array.from(document.querySelectorAll('a[href^="mailto:"]')).map(
    (anchor) => anchor.href.replace("mailto:", "").split("?")[0].trim()
  );

  const emails = [...new Set([...textEmails, ...mailtoEmails])].filter(
    (email) =>
      !email.includes("example.com") &&
      !email.includes("sentry.io") &&
      !email.match(/@\d+x\.(png|jpg|webp)/i) &&
      email.length < 80
  );

  const phoneRegex = /(\+?\d[\d\s\-().]{6,}\d)/g;
  const textPhones = text.match(phoneRegex) || [];
  const telPhones = Array.from(document.querySelectorAll('a[href^="tel:"]')).map((anchor) =>
    anchor.href.replace("tel:", "").trim()
  );

  const phones = [...new Set([...textPhones, ...telPhones])]
    .filter((phone) => phone.replace(/\D/g, "").length >= 7)
    .slice(0, 5);

  const ogSiteName = document.querySelector('meta[property="og:site_name"]')?.content;
  const titleText = document.title?.split(/[|\-–]/)[0].trim();
  const company_name = ogSiteName || titleText || window.location.hostname;

  const description = (
    document.querySelector('meta[name="description"]')?.content ||
    document.querySelector('meta[property="og:description"]')?.content ||
    ""
  ).slice(0, 300);

  const links = Array.from(document.querySelectorAll("a[href]")).map((anchor) => anchor.href);
  const linkedin = links.find((link) => link.includes("linkedin.com")) || "";
  const twitter = links.find((link) => link.includes("twitter.com") || link.includes("x.com")) || "";
  const facebook = links.find((link) => link.includes("facebook.com")) || "";
  const instagram = links.find((link) => link.includes("instagram.com")) || "";

  return {
    company_name,
    domain: window.location.hostname.replace("www.", ""),
    source_url: window.location.href,
    description,
    emails,
    phones,
    linkedin,
    twitter,
    facebook,
    instagram,
    saved_at: new Date().toISOString()
  };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scan") {
    sendResponse({ success: true, data: extractLeadData() });
  }

  return true;
});
