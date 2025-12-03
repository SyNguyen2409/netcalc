// ====================================================================
// 1. HELPER FUNCTIONS (MATH LOGIC)
// ====================================================================

function ipToNum(ip) {
    if (!ip) return 0;
    const parts = ip.split(".");
    if (parts.length !== 4) return 0;
    const num =
        BigInt(parseInt(parts[0])) * 16777216n + BigInt(parseInt(parts[1])) * 65536n + BigInt(parseInt(parts[2])) * 256n + BigInt(parseInt(parts[3]));
    return Number(num);
}

function numToIp(num) {
    if (num < 0) return "Err";
    const part1 = Math.floor(num / 16777216) % 256;
    const part2 = Math.floor(num / 65536) % 256;
    const part3 = Math.floor(num / 256) % 256;
    const part4 = num % 256;
    return `${part1}.${part2}.${part3}.${part4}`;
}

function getNetworkAddress(ip, cidr) {
    const ipNum = ipToNum(ip);
    const blockSize = Math.pow(2, 32 - cidr);
    return ipNum - (ipNum % blockSize);
}

function cidrToMask(cidr) {
    if (cidr === 0) return "0.0.0.0";
    const maskNum = Math.pow(2, 32) - Math.pow(2, 32 - cidr);
    return numToIp(maskNum);
}

// --- TYPING EFFECT ENGINE (LOOPING) ---
let typingTimeout; // Biến toàn cục để kiểm soát tiến trình

function typeWriter(text, elementId, typeSpeed = 50, deleteSpeed = 30, waitTime = 2000) {
    const element = document.getElementById(elementId);
    if (!element) return;

    // Reset trạng thái
    clearTimeout(typingTimeout);
    element.innerHTML = "";
    element.classList.add("typing-cursor"); // Bật con trỏ nhấp nháy

    let i = 0;
    let isDeleting = false;

    function loop() {
        const currentString = element.innerHTML;

        if (!isDeleting && i < text.length) {
            // ĐANG GÕ CHỮ
            element.innerHTML += text.charAt(i);
            i++;
            typingTimeout = setTimeout(loop, typeSpeed);
        } else if (!isDeleting && i === text.length) {
            // GÕ XONG -> ĐỢI 1 CHÚT
            isDeleting = true;
            typingTimeout = setTimeout(loop, waitTime);
        } else if (isDeleting && currentString.length > 0) {
            // ĐANG XÓA LÙI (BACKSPACE)
            element.innerHTML = currentString.substring(0, currentString.length - 1);
            typingTimeout = setTimeout(loop, deleteSpeed);
        } else {
            // XÓA XONG -> GÕ LẠI TỪ ĐẦU
            isDeleting = false;
            i = 0;
            typingTimeout = setTimeout(loop, 500);
        }
    }

    loop();
}

// Hàm dừng hiệu ứng khi bấm nút tính toán
function stopTypingEffect() {
    clearTimeout(typingTimeout);
    const output = document.getElementById("output-area");
    if (output) output.classList.remove("typing-cursor");
}

function setupSyncedInputs(sliderId, numberId) {
    const slider = document.getElementById(sliderId);
    const numberInput = document.getElementById(numberId);
    if (!slider || !numberInput) return;

    // Ensure number input min/max reflect slider attributes
    const min = parseInt(slider.min || 0);
    const max = parseInt(slider.max || 10000);

    slider.addEventListener("input", function () {
        numberInput.value = this.value;
    });

    numberInput.addEventListener("input", function () {
        let val = parseInt(this.value);
        if (isNaN(val)) val = min;
        if (val > max) {
            numberInput.value = max;
            slider.value = max;
        } else if (val < min) {
            numberInput.value = min;
            slider.value = min;
        } else {
            slider.value = val;
        }
    });
}

// ====================================================================
// 2. UI & LOGIC
// ====================================================================

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        document.body.classList.remove("loading-active");
        document.body.classList.add("loaded");
    }, 1500);

    // gọi các hàm khởi tạo an toàn sau khi DOM đã sẵn sàng
    if (typeof loadLanguagePreference === "function") loadLanguagePreference(); // Load saved language preference (nếu có)
    if (typeof updateUIText === "function") updateUIText(); // Update UI với ngôn ngữ hiện tại
    updateInputArea(); // chỉ gọi 1 lần
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") document.body.classList.add("light-mode");
});

function toggleTheme() {
    document.body.classList.toggle("light-mode");
    localStorage.setItem("theme", document.body.classList.contains("light-mode") ? "light" : "dark");
}

function updateInputArea() {
    const modeElement = document.querySelector('input[name="mode"]:checked');
    if (!modeElement) return;

    const mode = modeElement.value;
    const inputArea = document.getElementById("input-area");
    if (!inputArea) return;

    // Kích hoạt hiệu ứng gõ lặp lại
    typeWriter(typeof getTranslation === "function" ? getTranslation("readyForInput") : "system@netcalc:~$ Ready for input...", "output-area");

    const lookupArea = document.getElementById("subnet-n-lookup");
    if (lookupArea) lookupArea.remove();

    let html = "";

    if (mode === "num_host") {
        html = `
            <h2><i class="fa-solid fa-desktop"></i> ${typeof getTranslation === "function" ? getTranslation("hostDetails") : "Host Details"}</h2>
            <p>${typeof getTranslation === "function" ? getTranslation("majorNetwork") : "Major Network (CIDR)"}:</p>
            <input type="text" id="network-base" placeholder="e.g. 192.168.1.0/24">
            <p>${typeof getTranslation === "function" ? getTranslation("hostsPerSubnet") : "Hosts per Subnet (Minimum)"}:</p>
            <div class="slider-container">
                <input type="number" id="hosts-needed" class="slider-number-input" min="2" max="8000" value="50">
                <input type="range" id="hosts-needed-slider" min="2" max="1024" value="50" step="1">
            </div>
            <button onclick="calculateFLSM('num_host')">${typeof getTranslation === "function" ? getTranslation("calculate") : "Calculate"}</button>
        `;
    } else if (mode === "num_subnet") {
        html = `
            <h2><i class="fa-solid fa-sitemap"></i> ${typeof getTranslation === "function" ? getTranslation("subnetDetails") : "Subnet Details"}</h2>
            <p>${typeof getTranslation === "function" ? getTranslation("majorNetwork") : "Major Network (CIDR)"}:</p>
            <input type="text" id="network-base" placeholder="e.g. 172.16.0.0/16">
            <p>${typeof getTranslation === "function" ? getTranslation("numSubnetsNeeded") : "Number of Subnets Needed"}:</p>
            <div class="slider-container">
                <input type="number" id="subnets-needed" class="slider-number-input" min="2" max="1024" value="4">
                <input type="range" id="subnets-needed-slider" min="2" max="1024" value="4" step="1">
            </div>
            <button onclick="calculateFLSM('num_subnet')">${typeof getTranslation === "function" ? getTranslation("calculate") : "Calculate"}</button>
        `;
    } else if (mode === "vlsm") {
        html = `
            <h2><i class="fa-solid fa-layer-group"></i> ${typeof getTranslation === "function" ? getTranslation("vlsmConfig") : "VLSM Config"}</h2>
            <p>${typeof getTranslation === "function" ? getTranslation("majorNetworkAddress") : "Major Network Address"}:</p>
            <input type="text" id="network-base-vlsm" placeholder="e.g. 10.0.0.0/8">
            <div id="vlsm-requests">
                <p>${typeof getTranslation === "function" ? getTranslation("subnetRequirements") : "Subnet Requirements"}:</p>
            </div>
            <button onclick="addVLSMEntry()" style="background: linear-gradient(90deg, #3b82f6, #00f2ff); margin-bottom: 15px;">${
                typeof getTranslation === "function" ? getTranslation("addSubnet") : "+ Add subnet"
            }</button>
            <button onclick="calculateVLSM()">${typeof getTranslation === "function" ? getTranslation("calculateVlsm") : "Calculate VLSM"}</button>
        `;
    }

    inputArea.innerHTML = html;

    if (mode === "num_host") setupSyncedInputs("hosts-needed-slider", "hosts-needed");
    if (mode === "num_subnet") setupSyncedInputs("subnets-needed-slider", "subnets-needed");
    if (mode === "vlsm") addVLSMEntry();
}

function addVLSMEntry() {
    const requestsDiv = document.getElementById("vlsm-requests");
    if (!requestsDiv) return;
    const newEntry = document.createElement("div");
    newEntry.className = "vlsm-entry";

    const uniqueId = Date.now() + Math.random().toString(36).substr(2, 9);
    const sliderId = `vlsm-slider-${uniqueId}`;
    const inputId = `vlsm-input-${uniqueId}`;

    newEntry.innerHTML = `
        <input type="text" placeholder="${
            typeof getTranslation === "function" ? getTranslation("nameExample") : "Name (e.g. Sales)"
        }" class="vlsm-name">
        <div class="slider-container">
            <input type="number" id="${inputId}" class="slider-number-input vlsm-hosts" min="2" value="10">
            <input type="range" id="${sliderId}" class="slider-number-input-line vlsm-hosts" min="2" max="1024" value="10" step="1">
        </div>
        <button onclick="this.parentNode.remove()">${typeof getTranslation === "function" ? getTranslation("delete") : "Del"}</button>
    `;
    requestsDiv.appendChild(newEntry);
    setupSyncedInputs(sliderId, inputId);
}

// ====================================================================
// 3. CORE LOGIC
// ====================================================================

function calculateFLSM(mode) {
    // Dừng hiệu ứng gõ chữ ngay lập tức
    stopTypingEffect();

    const baseInputEl = document.getElementById("network-base");
    const outputDiv = document.getElementById("output-area");
    if (!outputDiv) return;

    const baseInput = baseInputEl ? baseInputEl.value.trim() : "";
    const oldLookup = document.getElementById("subnet-n-lookup");
    if (oldLookup) oldLookup.remove();

    if (!baseInput || !baseInput.includes("/")) {
        outputDiv.innerHTML = `<span style="color:var(--danger)">${
            typeof getTranslation === "function" ? getTranslation("invalidFormat") : "Invalid network format"
        }</span>`;
        return;
    }

    const [ipBaseStr, baseCidrStr] = baseInput.split("/");
    const baseCidr = parseInt(baseCidrStr);
    if (isNaN(baseCidr) || baseCidr < 0 || baseCidr > 32) {
        outputDiv.innerHTML = `<span style="color:var(--danger)">${
            typeof getTranslation === "function" ? getTranslation("invalidCidr") : "Invalid CIDR"
        }</span>`;
        return;
    }

    const baseNetworkNum = getNetworkAddress(ipBaseStr, baseCidr);
    const normalizedIP = numToIp(baseNetworkNum);

    let neededValue, newCidr;

    if (mode === "num_subnet") {
        const subEl = document.getElementById("subnets-needed");
        neededValue = subEl ? parseInt(subEl.value) : NaN;
        if (isNaN(neededValue) || neededValue < 1) {
            outputDiv.innerHTML = `<span style="color:var(--danger)">${
                typeof getTranslation === "function" ? getTranslation("invalidRequest") : "Invalid number of subnets"
            }</span>`;
            return;
        }
        const borrowedBits = Math.ceil(Math.log2(neededValue));
        newCidr = baseCidr + borrowedBits;
    } else if (mode === "num_host") {
        const hostEl = document.getElementById("hosts-needed");
        neededValue = hostEl ? parseInt(hostEl.value) : NaN;
        if (isNaN(neededValue) || neededValue < 1) {
            outputDiv.innerHTML = `<span style="color:var(--danger)">${
                typeof getTranslation === "function" ? getTranslation("invalidRequest") : "Invalid number of hosts"
            }</span>`;
            return;
        }
        const hostBits = Math.ceil(Math.log2(neededValue + 2));
        newCidr = 32 - hostBits;
    } else {
        outputDiv.innerHTML = `<span style="color:var(--danger)">Unknown mode</span>`;
        return;
    }

    if (newCidr > 32) {
        outputDiv.innerHTML = `<span style="color:var(--danger)">${
            typeof getTranslation === "function" ? getTranslation("requestTooLarge", newCidr) : "Request too large"
        }</span>`;
        return;
    }

    // Nếu newCidr < baseCidr nghĩa là user yêu cầu "mạng lớn hơn mạng gốc" -> invalid
    if (newCidr < baseCidr) {
        outputDiv.innerHTML = `<span style="color:var(--danger)">${
            typeof getTranslation === "function" ? getTranslation("invalidRequest") : "Requested subnet is larger than base network"
        }</span>`;
        return;
    }

    const newMask = cidrToMask(newCidr);
    const totalNewSubnets = Math.pow(2, newCidr - baseCidr);
    const hostBits = 32 - newCidr;
    const usableHosts = hostBits > 1 ? Math.pow(2, hostBits) - 2 : 0;

    let html = `<div style="font-family: 'Fira Code', monospace;">`;
    html += `<strong>${typeof getTranslation === "function" ? getTranslation("calculationResults") : "Calculation results"}</strong><br>`;
    html += `---------------------------------<br>`;
    html += `${
        typeof getTranslation === "function" ? getTranslation("majorNetworkLabel") : "Major network"
    }:  <span style="color:var(--primary)">${normalizedIP}/${baseCidr}</span><br>`;
    html += `${
        typeof getTranslation === "function" ? getTranslation("newMask") : "New mask"
    }:       <span style="color:var(--accent)">${newMask} (/${newCidr})</span><br>`;
    html += `${typeof getTranslation === "function" ? getTranslation("totalSubnets") : "Total subnets"}:  ${totalNewSubnets.toLocaleString(
        "en-US"
    )}<br>`;
    html += `${typeof getTranslation === "function" ? getTranslation("hostsPerSubnetLabel") : "Hosts per subnet"}:   ${usableHosts.toLocaleString(
        "en-US"
    )}<br><br>`;

    html += `<strong>${typeof getTranslation === "function" ? getTranslation("first5Subnets") : "First 5 subnets"}</strong><br>`;
    html += `<table><tr><th>${typeof getTranslation === "function" ? getTranslation("id") : "ID"}</th><th>${
        typeof getTranslation === "function" ? getTranslation("networkAddress") : "Network"
    }</th><th>${typeof getTranslation === "function" ? getTranslation("usableRange") : "Usable range"}</th><th>${
        typeof getTranslation === "function" ? getTranslation("broadcast") : "Broadcast"
    }</th></tr>`;

    const blockSize = Math.pow(2, 32 - newCidr);

    for (let i = 0; i < Math.min(5, totalNewSubnets); i++) {
        let currentNetNum = baseNetworkNum + i * blockSize;
        let broadcastNum = currentNetNum + blockSize - 1;
        html += `<tr>
            <td>${i + 1}</td>
            <td>${numToIp(currentNetNum)}/${newCidr}</td>
            <td>${numToIp(currentNetNum + 1)} - ${numToIp(broadcastNum - 1)}</td>
            <td>${numToIp(broadcastNum)}</td>
        </tr>`;
    }
    html += `</table>`;

    if (totalNewSubnets > 5) html += `<br>... (Use Lookup Tool below for more)`;
    html += `</div>`;

    outputDiv.innerHTML = html;

    // ⭐ Save full output HTML so we can restore exactly later
    if (typeof saveHistory === "function") {
        saveHistory(
            mode === "num_host" ? "host" : "subnet",
            `FLSM: ${ipBaseStr}/${baseCidr}`,
            `Thành công: /${newCidr} (${totalNewSubnets.toLocaleString()} subnets)`,
            outputDiv.innerHTML // <-- fullHTML
        );
    }

    addNthSubnetLookup(baseNetworkNum, newCidr, totalNewSubnets, blockSize);
}

function calculateVLSM() {
    stopTypingEffect(); // Dừng typing

    const baseInputEl = document.getElementById("network-base-vlsm");
    const outputDiv = document.getElementById("output-area");
    if (!outputDiv) return;
    const baseInput = baseInputEl ? baseInputEl.value.trim() : "";

    const requestElements = document.querySelectorAll(".vlsm-entry");

    if (!baseInput || !baseInput.includes("/")) {
        outputDiv.innerHTML = `<span style="color:var(--danger)">${
            typeof getTranslation === "function" ? getTranslation("invalidIpFormat") : "Invalid IP format"
        }</span>`;
        return;
    }

    const [ipBaseStr, baseCidrStr] = baseInput.split("/");
    const baseCidr = parseInt(baseCidrStr);
    if (isNaN(baseCidr) || baseCidr < 0 || baseCidr > 32) {
        outputDiv.innerHTML = `<span style="color:var(--danger)">${
            typeof getTranslation === "function" ? getTranslation("invalidCidr") : "Invalid CIDR"
        }</span>`;
        return;
    }

    let currentNetworkNum = getNetworkAddress(ipBaseStr, baseCidr);
    const maxIP = currentNetworkNum + Math.pow(2, 32 - baseCidr);

    const requests = Array.from(requestElements)
        .map((el) => ({
            name: el.querySelector(".vlsm-name") ? el.querySelector(".vlsm-name").value || "Unnamed" : "Unnamed",
            hosts: el.querySelector(".vlsm-hosts") ? parseInt(el.querySelector(".vlsm-hosts").value) : NaN,
        }))
        .filter((req) => !isNaN(req.hosts) && req.hosts > 0);

    if (requests.length === 0) {
        outputDiv.innerHTML = `<span style="color:var(--danger)">${
            typeof getTranslation === "function" ? getTranslation("noSubnetsWarning") : "No subnets specified"
        }</span>`;
        return;
    }

    requests.sort((a, b) => b.hosts - a.hosts);

    let html = `<div style="font-family: 'Fira Code', monospace;">`;
    html += `<strong>${typeof getTranslation === "function" ? getTranslation("vlsmTable") : "VLSM result"}</strong><br>`;
    html += `${
        typeof getTranslation === "function" ? getTranslation("majorNetworkUpper") : "Major network"
    }: <span style="color:var(--primary)">${numToIp(currentNetworkNum)}/${baseCidr}</span><br>`;
    html += `<table><tr><th>${typeof getTranslation === "function" ? getTranslation("name") : "Name"}</th><th>${
        typeof getTranslation === "function" ? getTranslation("hosts") : "Hosts"
    }</th><th>${typeof getTranslation === "function" ? getTranslation("cidr") : "CIDR"}</th><th>${
        typeof getTranslation === "function" ? getTranslation("networkId") : "Network ID"
    }</th><th>${typeof getTranslation === "function" ? getTranslation("rangeIp") : "Range"}</th><th>${
        typeof getTranslation === "function" ? getTranslation("broadcast") : "Broadcast"
    }</th></tr>`;

    let errorFlag = false;

    requests.forEach((req) => {
        const hostBits = Math.ceil(Math.log2(req.hosts + 2));
        const newCidr = 32 - hostBits;
        const blockSize = Math.pow(2, hostBits);

        if (currentNetworkNum + blockSize > maxIP) {
            html += `<tr><td>${req.name}</td><td>${req.hosts}</td><td colspan="4" style="color:var(--danger)">${
                typeof getTranslation === "function" ? getTranslation("outOfSpace") : "Out of space"
            }</td></tr>`;
            errorFlag = true;
            return;
        }

        const broadcastNum = currentNetworkNum + blockSize - 1;
        const firstIp = currentNetworkNum + 1;
        const lastIp = broadcastNum - 1;

        html += `<tr>
            <td>${req.name}</td>
            <td>${req.hosts}</td>
            <td>/${newCidr}</td>
            <td>${numToIp(currentNetworkNum)}</td>
            <td>${numToIp(firstIp)} - ${numToIp(lastIp)}</td>
            <td>${numToIp(broadcastNum)}</td>
        </tr>`;

        currentNetworkNum += blockSize;
    });

    html += `</table></div>`;
    outputDiv.innerHTML = html;

    if (typeof saveHistory === "function") {
        saveHistory(
            "vlsm",
            `VLSM: ${ipBaseStr}/${baseCidrStr}`,
            `Chia ${requests.length} mạng con`,
            outputDiv.innerHTML // <-- fullHTML
        );
    }

    if (errorFlag) {
        outputDiv.innerHTML += `<br><span style="color:var(--danger)">${
            typeof getTranslation === "function" ? getTranslation("notEnoughSpace") : "Not enough space in base network"
        }</span>`;
    } else {
        outputDiv.innerHTML += `<br><span style="color:var(--success)">${
            typeof getTranslation === "function" ? getTranslation("successAllFulfilled") : "All requests fulfilled"
        }</span>`;
    }
}

function addNthSubnetLookup(baseNetworkNum, newCidr, totalSubnets, blockSize) {
    const inputArea = document.getElementById("input-area");
    if (!inputArea) return;
    const existingLookup = document.getElementById("subnet-n-lookup");
    if (existingLookup) existingLookup.remove();

    const lookupHtml = `
        <div class="container" id="subnet-n-lookup" style="margin-top: 30px; border-color: var(--accent);">
            <h2>🔍 Subnet Lookup Tool</h2>
            <p>Find Subnet #N (Range: 1 - ${totalSubnets.toLocaleString("en-US")}):</p>
            <div class="slider-container">
                <input type="number" id="subnet-index" class="slider-number-input" min="1" max="${totalSubnets}" value="1">
                <input type="range" id="subnet-index-slider" min="1" max="${totalSubnets}" value="1" step="1">
            </div>
            <button id="subnet-lookup-btn">SEARCH</button>
            <div id="nth-subnet-result" style="display: none; margin-top: 15px;"></div>
        </div>
    `;
    inputArea.insertAdjacentHTML("afterend", lookupHtml);
    setupSyncedInputs("subnet-index-slider", "subnet-index");

    // bind button after it's in DOM
    const btn = document.getElementById("subnet-lookup-btn");
    if (btn) {
        btn.addEventListener("click", () => calculateNthSubnet(baseNetworkNum, blockSize, newCidr, totalSubnets));
    }
}

function calculateNthSubnet(baseNetworkNum, blockSize, newCidr, max) {
    const idxEl = document.getElementById("subnet-index");
    if (!idxEl) return;
    let n = parseInt(idxEl.value);
    if (isNaN(n) || n < 1) n = 1;
    if (n > max) n = max;

    const net = baseNetworkNum + (n - 1) * blockSize;
    const broad = net + blockSize - 1;
    const firstIp = net + 1;
    const lastIp = broad - 1;

    const resEl = document.getElementById("nth-subnet-result");
    if (!resEl) return;
    resEl.style.display = "block";
    resEl.innerHTML = `
        <strong>Result for Subnet #${n}:</strong><br>
        Network ID: <span style="color: var(--primary)">${numToIp(net)}</span><br>
        Range IP:   ${numToIp(firstIp)} ➝ ${numToIp(lastIp)}<br>
        Broadcast:  ${numToIp(broad)}
    `;
}

window.onscroll = function () {
    var button = document.getElementById("scrollToTopBtn");
    if (!button) return;
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        button.classList.add("show");
    } else {
        button.classList.remove("show");
    }
};

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
}

// ====================================================================
// 4. QUẢN LÝ LỊCH SỬ (HISTORY MANAGER)
// ====================================================================

// Note: Do NOT query DOM elements at top-level; query them when needed (after DOMContentLoaded)
// and always guard against null.

function toggleHistory() {
    const sidebar = document.getElementById("history-sidebar");
    const overlay = document.getElementById("history-overlay");
    // If elements missing, try to show toast and return
    if (!sidebar || !overlay) {
        showToast(typeof getTranslation === "function" ? getTranslation("historyMissing") : "History UI not found", "error");
        return;
    }

    sidebar.classList.toggle("open");
    overlay.classList.toggle("active");

    // Khóa / mở khóa cuộn trang chính
    if (sidebar.classList.contains("open")) {
        document.body.classList.add("no-scroll");
    } else {
        document.body.classList.remove("no-scroll");
    }

    loadHistory();
}

// Hàm lưu lịch sử (Gọi hàm này khi tính toán xong)
// type: 'host', 'subnet', hoặc 'vlsm' (để hiện màu border)
function saveHistory(type, title, detail, fullHTML = "") {
    try {
        const history = JSON.parse(localStorage.getItem("netcalc_history") || "[]");

        const newItem = {
            id: Date.now(),
            type: type,
            title: title,
            detail: detail,
            fullHTML: fullHTML, // <-- lưu thêm
            time: new Date().toLocaleTimeString(),
        };

        history.unshift(newItem);
        if (history.length > 50) history.pop();
        localStorage.setItem("netcalc_history", JSON.stringify(history));
    } catch (e) {
        console.error("saveHistory error:", e);
    }
}

// Hàm đọc và hiển thị lịch sử ra HTML
// Hàm đọc và hiển thị lịch sử ra HTML
function loadHistory() {
    const list = document.getElementById("history-list");
    if (!list) return;
    let history = [];
    try {
        history = JSON.parse(localStorage.getItem("netcalc_history") || "[]");
    } catch (e) {
        history = [];
    }

    if (!history.length) {
        list.innerHTML = `<p class="empty-msg">Chưa có lịch sử tính toán.</p>`;
        return;
    }

    list.innerHTML = "";
    history.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = `history-item ${item.type}`;
        div.style.animationDelay = `${index * 30}ms`;

        const left = document.createElement("div");
        left.className = "history-left";
        const time = document.createElement("div");
        time.className = "item-time";
        time.textContent = item.time;
        const title = document.createElement("div");
        title.className = "item-title";
        title.textContent = item.title;
        const detail = document.createElement("div");
        detail.className = "item-detail";
        detail.textContent = item.detail;

        left.appendChild(time);
        left.appendChild(title);
        left.appendChild(detail);

        // ⭐ NÚT XOÁ MỚI (icon từ Uiverse.io)
        const btn = document.createElement("button");
        btn.className = "delete-button delete-one";
        btn.setAttribute("aria-label", "Delete item");
        btn.innerHTML = `
            <svg class="trash-svg" viewBox="0 -10 64 74" xmlns="http://www.w3.org/2000/svg">
                <g id="trash-can">
                    <rect x="16" y="24" width="32" height="30" rx="3" ry="3" fill="#e74c3c"></rect>
                    <g transform-origin="12 18" id="lid-group">
                        <rect x="12" y="12" width="40" height="6" rx="2" ry="2" fill="#c0392b"></rect>
                        <rect x="26" y="8" width="12" height="4" rx="2" ry="2" fill="#c0392b"></rect>
                    </g>
                </g>
            </svg>
        `;

        btn.addEventListener("click", (ev) => {
            ev.stopPropagation();
            deleteHistoryItem(item.id);
        });

        div.appendChild(left);
        div.appendChild(btn);

        div.addEventListener("click", () => restoreHistoryItem(item));
        list.appendChild(div);
    });
}

function deleteHistoryItem(id) {
    try {
        let history = JSON.parse(localStorage.getItem("netcalc_history") || "[]");
        history = history.filter((h) => h.id !== id);
        localStorage.setItem("netcalc_history", JSON.stringify(history));
        loadHistory();
        showToast("Đã xóa mục lịch sử", "success");
    } catch (e) {
        console.error(e);
    }
}

function restoreHistoryItem(item) {
    const outputDiv = document.getElementById("output-area");
    if (!outputDiv) return;

    if (item.fullHTML) {
        outputDiv.innerHTML = item.fullHTML;
    } else {
        outputDiv.innerHTML = `<div><strong>${item.title}</strong><br>${item.detail}</div>`;
    }

    // đóng sidebar
    const sidebar = document.getElementById("history-sidebar");
    const overlay = document.getElementById("history-overlay");
    if (sidebar && overlay && sidebar.classList.contains("open")) toggleHistory();

    // ⭐ THÊM THÔNG BÁO THÀNH CÔNG
    showToast("Khôi phục lịch sử thành công!");
    // hoặc: displayNotification("Khôi phục lịch sử thành công!");
}

// Xóa toàn bộ lịch sử
function clearHistory() {
    const raw = localStorage.getItem("netcalc_history");
    if (!raw || JSON.parse(raw).length === 0) {
        showToast("Không có lịch sử để xóa!", "error");
        return;
    }
    localStorage.removeItem("netcalc_history");
    loadHistory();
    showToast("Đã xóa toàn bộ lịch sử!", "success");
}

function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast-modern ${type}`;

    const iconSuccess = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="toast-svg">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    `;

    const iconError = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="toast-svg">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3m0 4h.01m-.01-14a9 9 0 100 18 9 9 0 000-18z" />
        </svg>
    `;

    toast.innerHTML = `
        <div class="toast-icon">
            ${type === "success" ? iconSuccess : iconError}
        </div>
        <div class="toast-text">${message}</div>
        <div class="toast-progress"></div>
    `;

    document.body.appendChild(toast);

    // show animation
    setTimeout(() => toast.classList.add("show"), 10);

    // shake if error
    if (type === "error") {
        setTimeout(() => toast.classList.add("shake"), 180);
    }

    // auto remove
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 350);
    }, 3000);
}
