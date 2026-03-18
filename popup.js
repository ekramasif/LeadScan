const $ = (id) => document.getElementById(id);
const show = (id) => $(id).classList.remove("hidden");
const hide = (id) => $(id).classList.add("hidden");

function getLeads() {
  return new Promise((resolve) => chrome.storage.local.get(["leads"], (result) => resolve(result.leads || [])));
}

function setLeads(leads) {
  return new Promise((resolve) => chrome.storage.local.set({ leads }, resolve));
}

async function refreshCount() {
  const leads = await getLeads();
  $("saved-count").textContent = leads.length;
}

let currentData = null;

async function doScan() {
  hide("scan-results");
  hide("state-empty");
  show("state-loading");

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  function handleResponse(response) {
    hide("state-loading");
    if (response?.success) {
      renderScan(response.data);
      return;
    }

    show("state-empty");
  }

  chrome.tabs.sendMessage(tab.id, { action: "scan" }, (response) => {
    if (chrome.runtime.lastError) {
      chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] }, () => {
        chrome.tabs.sendMessage(tab.id, { action: "scan" }, handleResponse);
      });
      return;
    }

    handleResponse(response);
  });
}

function renderScan(data) {
  currentData = data;

  const hasContent =
    data.emails.length ||
    data.phones.length ||
    data.linkedin ||
    data.twitter ||
    data.facebook ||
    data.instagram;

  if (!hasContent) {
    show("state-empty");
    return;
  }

  $("res-company").textContent = data.company_name || "-";
  $("res-domain").textContent = data.domain || "";
  $("res-desc").textContent = data.description || "";

  $("email-badge").textContent = data.emails.length;
  $("res-emails").innerHTML = data.emails.length
    ? data.emails.map((email) => `<span class="chip chip-blue" title="${email}">${email}</span>`).join("")
    : '<span class="none">None found</span>';

  $("phone-badge").textContent = data.phones.length;
  $("res-phones").innerHTML = data.phones.length
    ? data.phones.map((phone) => `<span class="chip chip-green">${phone}</span>`).join("")
    : '<span class="none">None found</span>';

  const socials = [
    ["LinkedIn", data.linkedin],
    ["Twitter/X", data.twitter],
    ["Facebook", data.facebook],
    ["Instagram", data.instagram]
  ].filter(([, url]) => url);

  $("res-social").innerHTML = socials.length
    ? socials
        .map(([name, url]) => `<a class="social-chip" href="${url}" target="_blank" rel="noreferrer">${name}</a>`)
        .join("")
    : '<span class="none">None found</span>';

  hide("save-msg");
  show("scan-results");
}

async function saveLead() {
  if (!currentData) {
    return;
  }

  const leads = await getLeads();
  if (leads.some((lead) => lead.domain === currentData.domain)) {
    showMsg("Already saved.", "#d97706");
    return;
  }

  leads.unshift(currentData);
  await setLeads(leads);
  await refreshCount();
  showMsg("Lead saved.", "#16a34a");
}

function showMsg(text, color) {
  const element = $("save-msg");
  element.textContent = text;
  element.style.color = color;
  show("save-msg");
  setTimeout(() => hide("save-msg"), 2000);
}

function copyEmails() {
  if (!currentData?.emails?.length) {
    return;
  }

  navigator.clipboard.writeText(currentData.emails.join("\n")).then(() => {
    $("btn-copy-email").textContent = "Copied";
    setTimeout(() => {
      $("btn-copy-email").textContent = "Copy Emails";
    }, 1500);
  });
}

async function renderSavedTab() {
  const leads = await getLeads();
  $("saved-total").textContent = `${leads.length} lead${leads.length !== 1 ? "s" : ""} saved`;

  if (!leads.length) {
    show("saved-empty");
    $("saved-list").innerHTML = "";
    return;
  }

  hide("saved-empty");
  $("saved-list").innerHTML = leads
    .map(
      (lead, index) => `
        <div class="lead-card">
          <div class="lead-name">${lead.company_name || lead.domain}</div>
          <div class="lead-domain">${lead.domain}</div>
          ${lead.emails.length ? `<div class="lead-info email">${lead.emails.slice(0, 2).join(" | ")}</div>` : ""}
          ${lead.phones.length ? `<div class="lead-info phone">${lead.phones[0]}</div>` : ""}
          <button class="btn-remove" data-i="${index}">Remove</button>
        </div>
      `
    )
    .join("");

  document.querySelectorAll(".btn-remove").forEach((button) =>
    button.addEventListener("click", async (event) => {
      const nextLeads = await getLeads();
      nextLeads.splice(parseInt(event.target.dataset.i, 10), 1);
      await setLeads(nextLeads);
      await refreshCount();
      renderSavedTab();
    })
  );
}

async function exportCSV() {
  const leads = await getLeads();
  if (!leads.length) {
    return;
  }

  const headers = [
    "Company",
    "Domain",
    "Emails",
    "Phones",
    "LinkedIn",
    "Twitter",
    "Facebook",
    "Instagram",
    "Source URL",
    "Saved At"
  ];

  const rows = leads.map((lead) => [
    lead.company_name || "",
    lead.domain || "",
    (lead.emails || []).join(" | "),
    (lead.phones || []).join(" | "),
    lead.linkedin || "",
    lead.twitter || "",
    lead.facebook || "",
    lead.instagram || "",
    lead.source_url || "",
    lead.saved_at || ""
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `leadscan-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function clearAll() {
  if (!confirm("Delete all saved leads?")) {
    return;
  }

  await setLeads([]);
  await refreshCount();
  renderSavedTab();
}

function switchTab(tab) {
  if (tab === "scan") {
    show("tab-scan");
    hide("tab-saved");
    $("btn-tab-scan").classList.add("active");
    $("btn-tab-saved").classList.remove("active");
    return;
  }

  hide("tab-scan");
  show("tab-saved");
  $("btn-tab-saved").classList.add("active");
  $("btn-tab-scan").classList.remove("active");
  renderSavedTab();
}

document.addEventListener("DOMContentLoaded", async () => {
  await refreshCount();

  $("btn-scan").addEventListener("click", doScan);
  $("btn-save").addEventListener("click", saveLead);
  $("btn-copy-email").addEventListener("click", copyEmails);
  $("btn-export").addEventListener("click", exportCSV);
  $("btn-clear-all").addEventListener("click", clearAll);
  $("btn-tab-scan").addEventListener("click", () => switchTab("scan"));
  $("btn-tab-saved").addEventListener("click", () => switchTab("saved"));
});
