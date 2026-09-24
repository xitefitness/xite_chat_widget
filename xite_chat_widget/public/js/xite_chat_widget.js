(function () {
  const UNREAD_METHODS = [
    "raven.api.raven_message.get_unread_count_for_channels",
    "raven.api.raven_channel.get_unread_count_for_channels"
  ];
  let unreadMethod = null;
  let pollTimer = null;

  function init() {
    if (!window.frappe || !frappe.session || frappe.session.user === "Guest") return;
    if (!frappe.boot || !frappe.boot.versions || !frappe.boot.versions.raven) return;
    if (document.getElementById("raven-fab")) return;

    const css = `
      #raven-fab{position:fixed;right:24px;bottom:24px;width:56px;height:56px;border-radius:50%;
        background:#F2661B;color:#fff;border:0;font-size:24px;box-shadow:0 4px 14px rgba(0,0,0,.25);
        z-index:2000;cursor:pointer;display:flex;align-items:center;justify-content:center}
      #raven-fab:hover{transform:scale(1.05)}
      #raven-badge{position:absolute;top:-4px;right:-4px;min-width:22px;height:22px;padding:0 6px;
        border-radius:11px;background:#D92D20;color:#fff;font-size:12px;font-weight:700;line-height:22px;
        text-align:center;border:2px solid #fff;display:none;font-family:inherit}
      #raven-badge.show{display:block}
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
    fab.innerHTML = '💬<span id="raven-badge"></span>';
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
      if (!panel.classList.contains("open")) refreshUnread();
    });
    panel.querySelector(".rp-close").addEventListener("click", function () {
      panel.classList.remove("open");
      refreshUnread();
    });
    panel.querySelector(".rp-full").addEventListener("click", function () { window.open("/raven", "_blank"); });

    refreshUnread();
    pollTimer = setInterval(refreshUnread, 30000);

    if (frappe.realtime && frappe.realtime.on) {
      ["raven:unread_channel_count_updated", "message_created", "raven:new_message"].forEach(function (ev) {
        frappe.realtime.on(ev, function () { setTimeout(refreshUnread, 800); });
      });
    }
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) refreshUnread();
    });
  }

  function sumUnread(data) {
    if (!data) return 0;
    let list = Array.isArray(data) ? data : (data.channels || data.message || []);
    if (!Array.isArray(list)) return 0;
    return list.reduce(function (t, c) { return t + (parseInt(c.unread_count, 10) || 0); }, 0);
  }

  function setBadge(n) {
    const b = document.getElementById("raven-badge");
    if (!b) return;
    if (n > 0) {
      b.textContent = n > 99 ? "99+" : String(n);
      b.classList.add("show");
    } else {
      b.classList.remove("show");
    }
  }

  function callMethod(method) {
    return fetch("/api/method/" + method, {
      method: "GET",
      credentials: "same-origin",
      headers: { "Accept": "application/json", "X-Frappe-CSRF-Token": frappe.csrf_token || "" }
    }).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    }).then(function (j) { return j && j.message; });
  }

  function refreshUnread() {
    if (unreadMethod === false) return;
    const tryList = unreadMethod ? [unreadMethod] : UNREAD_METHODS.slice();
    (function next() {
      const m = tryList.shift();
      if (!m) { if (!unreadMethod) { unreadMethod = false; clearInterval(pollTimer); } return; }
      callMethod(m).then(function (data) {
        unreadMethod = m;
        setBadge(sumUnread(data));
      }).catch(function () { if (!unreadMethod) next(); });
    })();
  }

  if (window.jQuery) jQuery(document).on("app_ready", init);
  document.addEventListener("DOMContentLoaded", function () { setTimeout(init, 1500); });
})();
