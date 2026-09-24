(function () {
  function init() {
    if (!window.frappe || !frappe.session || frappe.session.user === "Guest") return;
    if (!frappe.boot || !frappe.boot.versions || !frappe.boot.versions.raven) return; // Raven not installed
    if (document.getElementById("raven-fab")) return;

    const css = `
      #raven-fab{position:fixed;right:24px;bottom:24px;width:56px;height:56px;border-radius:50%;
        background:#F2661B;color:#fff;border:0;font-size:24px;box-shadow:0 4px 14px rgba(0,0,0,.25);
        z-index:2000;cursor:pointer;display:flex;align-items:center;justify-content:center}
      #raven-fab:hover{transform:scale(1.05)}
      #raven-panel{position:fixed;right:24px;bottom:92px;width:420px;height:620px;max-height:calc(100vh - 120px);
        background:var(--card-bg,#fff);border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,.3);
        z-index:2000;overflow:hidden;display:none;flex-direction:column}
      #raven-panel.open{display:flex}
      #raven-panel .rp-head{display:flex;align-items:center;justify-content:space-between;
        padding:8px 12px;background:#16232E;color:#fff;font-weight:600}
      #raven-panel .rp-head button{background:none;border:0;color:#fff;font-size:16px;cursor:pointer;margin-left:8px}
      #raven-panel iframe{flex:1;border:0;width:100%}
      @media (max-width:600px){#raven-panel{right:0;bottom:0;width:100%;height:100%;max-height:100%;border-radius:0}}
    `;
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);

    const fab = document.createElement("button");
    fab.id = "raven-fab";
    fab.title = "Team Chat";
    fab.textContent = "💬";
    document.body.appendChild(fab);

    const panel = document.createElement("div");
    panel.id = "raven-panel";
    panel.innerHTML =
      '<div class="rp-head"><span>Team Chat</span><span>' +
      '<button class="rp-full" title="Open full screen">⤢</button>' +
      '<button class="rp-close" title="Close">✕</button></span></div>';
    document.body.appendChild(panel);

    let loaded = false;
    fab.addEventListener("click", function () {
      if (!loaded) {
        const f = document.createElement("iframe");
        f.src = "/raven";
        f.allow = "clipboard-write; notifications";
        panel.appendChild(f);
        loaded = true;
      }
      panel.classList.toggle("open");
    });
    panel.querySelector(".rp-close").addEventListener("click", function () { panel.classList.remove("open"); });
    panel.querySelector(".rp-full").addEventListener("click", function () { window.open("/raven", "_blank"); });
  }

  if (window.jQuery) jQuery(document).on("app_ready", init);
  document.addEventListener("DOMContentLoaded", function () { setTimeout(init, 1500); });
})();
