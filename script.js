// ====================================================================
// 1. HELPER FUNCTIONS (MATH LOGIC)
// ====================================================================

function ipToNum(ip) {
  if (!ip) return 0;
  const parts = ip.split(".");
  if (parts.length !== 4) return 0;
  const num =
    BigInt(parseInt(parts[0])) * 16777216n +
    BigInt(parseInt(parts[1])) * 65536n +
    BigInt(parseInt(parts[2])) * 256n +
    BigInt(parseInt(parts[3]));
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

function typeWriter(
  text,
  elementId,
  typeSpeed = 50,
  deleteSpeed = 30,
  waitTime = 2000
) {
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

  slider.addEventListener("input", function () {
    numberInput.value = this.value;
  });

  numberInput.addEventListener("input", function () {
    let val = parseInt(this.value);
    if (isNaN(val)) val = parseInt(slider.min);
    if (val > parseInt(slider.max)) slider.value = slider.max;
    else slider.value = val;
  });
}

// ====================================================================
// 2. UI & LOGIC
// ====================================================================

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    document.body.classList.remove("loading-active"); // Cho phép cuộn lại
    document.body.classList.add("loaded"); // Kích hoạt hiệu ứng hiện nội dung
  }, 1500); // 1500ms = 1.5 giây

  updateInputArea();
  updateInputArea();
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") {
    document.body.classList.add("light-mode");
  }
});

function toggleTheme() {
  document.body.classList.toggle("light-mode");
  localStorage.setItem(
    "theme",
    document.body.classList.contains("light-mode") ? "light" : "dark"
  );
}

function updateInputArea() {
  const modeElement = document.querySelector('input[name="mode"]:checked');
  if (!modeElement) return;

  const mode = modeElement.value;
  const inputArea = document.getElementById("input-area");

  // Kích hoạt hiệu ứng gõ lặp lại
  typeWriter("system@netcalc:~$ Ready for input...", "output-area");

  const lookupArea = document.getElementById("subnet-n-lookup");
  if (lookupArea) lookupArea.remove();

  let html = "";

  if (mode === "num_host") {
    html = `
            <h2><i class="fa-solid fa-desktop"></i> Host Details</h2>
            <p>Major Network (CIDR):</p>
            <input type="text" id="network-base" placeholder="e.g. 192.168.1.0/24">
            <p>Hosts per Subnet (Minimum):</p>
            <div class="slider-container">
                <input type="number" id="hosts-needed" class="slider-number-input" min="2" max="8000" value="50">
                <input type="range" id="hosts-needed-slider" min="2" max="8000" value="50" step="1">
            </div>
            <button onclick="calculateFLSM('num_host')">CALCULATE</button>
        `;
  } else if (mode === "num_subnet") {
    html = `
            <h2><i class="fa-solid fa-sitemap"></i> Subnet Details</h2>
            <p>Major Network (CIDR):</p>
            <input type="text" id="network-base" placeholder="e.g. 172.16.0.0/16">
            <p>Number of Subnets Needed:</p>
            <div class="slider-container">
                <input type="number" id="subnets-needed" class="slider-number-input" min="2" max="1024" value="4">
                <input type="range" id="subnets-needed-slider" min="2" max="1024" value="4" step="1">
            </div>
            <button onclick="calculateFLSM('num_subnet')">CALCULATE</button>
        `;
  } else if (mode === "vlsm") {
    html = `
            <h2><i class="fa-solid fa-layer-group"></i> VLSM Config</h2>
            <p>Major Network Address:</p>
            <input type="text" id="network-base-vlsm" placeholder="e.g. 10.0.0.0/8">
            <div id="vlsm-requests">
                <p>Subnet Requirements:</p>
            </div>
            <button onclick="addVLSMEntry()" style="background: linear-gradient(90deg, #3b82f6, #00f2ff); margin-bottom: 15px;">+ Add Subnet</button>
            <button onclick="calculateVLSM()">CALCULATE VLSM</button>
        `;
  }

  inputArea.innerHTML = html;

  if (mode === "num_host")
    setupSyncedInputs("hosts-needed-slider", "hosts-needed");
  if (mode === "num_subnet")
    setupSyncedInputs("subnets-needed-slider", "subnets-needed");
  if (mode === "vlsm") addVLSMEntry();
}

function addVLSMEntry() {
  const requestsDiv = document.getElementById("vlsm-requests");
  const newEntry = document.createElement("div");
  newEntry.className = "vlsm-entry";

  const uniqueId = Date.now() + Math.random().toString(36).substr(2, 9);
  const sliderId = `vlsm-slider-${uniqueId}`;
  const inputId = `vlsm-input-${uniqueId}`;

  newEntry.innerHTML = `
        <input type="text" placeholder="Name (e.g. Sales)" class="vlsm-name">
        <div class="slider-container">
            <input type="number" id="${inputId}" class="slider-number-input vlsm-hosts" min="2" value="10">
            <input type="range" id="${sliderId}" min="2" max="4000" value="10" step="1">
        </div>
        <button onclick="this.parentNode.remove()">Del</button>
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

  const baseInput = document.getElementById("network-base").value.trim();
  const outputDiv = document.getElementById("output-area");

  const oldLookup = document.getElementById("subnet-n-lookup");
  if (oldLookup) oldLookup.remove();

  if (!baseInput.includes("/")) {
    outputDiv.innerHTML =
      '<span style="color:var(--danger)">ERROR: Invalid format. Use IP/CIDR (e.g. 192.168.1.0/24)</span>';
    return;
  }

  const [ipBaseStr, baseCidrStr] = baseInput.split("/");
  const baseCidr = parseInt(baseCidrStr);
  const baseNetworkNum = getNetworkAddress(ipBaseStr, baseCidr);
  const normalizedIP = numToIp(baseNetworkNum);

  if (baseCidr < 0 || baseCidr > 32) {
    outputDiv.innerHTML =
      '<span style="color:var(--danger)">ERROR: Invalid CIDR (0-32)</span>';
    return;
  }

  let neededValue, newCidr;

  if (mode === "num_subnet") {
    neededValue = parseInt(document.getElementById("subnets-needed").value);
    const borrowedBits = Math.ceil(Math.log2(neededValue));
    newCidr = baseCidr + borrowedBits;
  } else if (mode === "num_host") {
    neededValue = parseInt(document.getElementById("hosts-needed").value);
    const hostBits = Math.ceil(Math.log2(neededValue + 2));
    newCidr = 32 - hostBits;
  }

  if (newCidr > 32) {
    outputDiv.innerHTML = `<span style="color:var(--danger)">ERROR: Request too large (Mask /${newCidr} > /32).</span>`;
    return;
  }
  if (newCidr < baseCidr) {
    outputDiv.innerHTML = `<span style="color:var(--danger)">ERROR: Request smaller than original network.</span>`;
    return;
  }

  const newMask = cidrToMask(newCidr);
  const totalNewSubnets = Math.pow(2, newCidr - baseCidr);
  const hostBits = 32 - newCidr;
  const usableHosts = hostBits > 1 ? Math.pow(2, hostBits) - 2 : 0;

  let html = `<div style="font-family: 'Fira Code', monospace;">`;
  html += `<strong>CALCULATION RESULTS:</strong><br>`;
  html += `---------------------------------<br>`;
  html += `Major Network:  <span style="color:var(--primary)">${normalizedIP}/${baseCidr}</span><br>`;
  html += `New Mask:       <span style="color:var(--accent)">${newMask} (/${newCidr})</span><br>`;
  html += `Total Subnets:  ${totalNewSubnets.toLocaleString("en-US")}<br>`;
  html += `Hosts/Subnet:   ${usableHosts.toLocaleString("en-US")}<br><br>`;

  html += `<strong>FIRST 5 SUBNETS:</strong><br>`;
  html += `<table><tr><th>ID</th><th>Network Address</th><th>Usable Range</th><th>Broadcast</th></tr>`;

  const blockSize = Math.pow(2, 32 - newCidr);

  for (let i = 0; i < Math.min(5, totalNewSubnets); i++) {
    let currentNetNum = baseNetworkNum + i * blockSize;
    let broadcastNum = currentNetNum + blockSize - 1;
    html += `<tr>
            <td>${i + 1}</td>
            <td>${numToIp(currentNetNum)}/${newCidr}</td>
            <td>${numToIp(currentNetNum + 1)} - ${numToIp(
      broadcastNum - 1
    )}</td>
            <td>${numToIp(broadcastNum)}</td>
        </tr>`;
  }
  html += `</table>`;

  if (totalNewSubnets > 5) html += `<br>... (Use Lookup Tool below for more)`;
  html += `</div>`;

  outputDiv.innerHTML = html;
  addNthSubnetLookup(baseNetworkNum, newCidr, totalNewSubnets, blockSize);
}

function calculateVLSM() {
  stopTypingEffect(); // Dừng typing

  const baseInput = document.getElementById("network-base-vlsm").value.trim();
  const outputDiv = document.getElementById("output-area");
  const requestElements = document.querySelectorAll(".vlsm-entry");

  if (!baseInput.includes("/")) {
    outputDiv.innerHTML =
      '<span style="color:var(--danger)">ERROR: Invalid IP format.</span>';
    return;
  }

  const [ipBaseStr, baseCidrStr] = baseInput.split("/");
  const baseCidr = parseInt(baseCidrStr);
  let currentNetworkNum = getNetworkAddress(ipBaseStr, baseCidr);
  const maxIP = currentNetworkNum + Math.pow(2, 32 - baseCidr);

  const requests = Array.from(requestElements)
    .map((el) => ({
      name: el.querySelector(".vlsm-name").value || "Unnamed",
      hosts: parseInt(el.querySelector(".vlsm-hosts").value),
    }))
    .filter((req) => !isNaN(req.hosts) && req.hosts > 0);

  if (requests.length === 0) {
    outputDiv.innerHTML =
      '<span style="color:var(--danger)">WARNING: Please add at least 1 subnet requirement.</span>';
    return;
  }

  requests.sort((a, b) => b.hosts - a.hosts);

  let html = `<div style="font-family: 'Fira Code', monospace;">`;
  html += `<strong>VLSM TABLE (Optimized):</strong><br>`;
  html += `MAJOR NETWORK: <span style="color:var(--primary)">${numToIp(
    currentNetworkNum
  )}/${baseCidr}</span><br>`;
  html += `<table><tr><th>Name</th><th>Hosts</th><th>CIDR</th><th>Network ID</th><th>Range IP</th><th>Broadcast</th></tr>`;

  let errorFlag = false;

  requests.forEach((req) => {
    const hostBits = Math.ceil(Math.log2(req.hosts + 2));
    const newCidr = 32 - hostBits;
    const blockSize = Math.pow(2, hostBits);

    if (currentNetworkNum + blockSize > maxIP) {
      html += `<tr><td>${req.name}</td><td>${req.hosts}</td><td colspan="4" style="color:var(--danger)">OUT OF IP SPACE!</td></tr>`;
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
}

function addNthSubnetLookup(baseNetworkNum, newCidr, totalSubnets, blockSize) {
  const inputArea = document.getElementById("input-area");
  const existingLookup = document.getElementById("subnet-n-lookup");
  if (existingLookup) existingLookup.remove();

  const lookupHtml = `
        <div class="container" id="subnet-n-lookup" style="margin-top: 30px; border-color: var(--accent);">
            <h2>🔍 Subnet Lookup Tool</h2>
            <p>Find Subnet #N (Range: 1 - ${totalSubnets.toLocaleString(
              "en-US"
            )}):</p>
            <div class="slider-container">
                <input type="number" id="subnet-index" class="slider-number-input" min="1" max="${totalSubnets}" value="1">
                <input type="range" id="subnet-index-slider" min="1" max="${totalSubnets}" value="1" step="1">
            </div>
            <button onclick="calculateNthSubnet(${baseNetworkNum}, ${blockSize}, ${newCidr}, ${totalSubnets})">SEARCH</button>
            <div id="nth-subnet-result" style="display: none; margin-top: 15px;"></div>
        </div>
    `;
  inputArea.insertAdjacentHTML("afterend", lookupHtml);
  setupSyncedInputs("subnet-index-slider", "subnet-index");
}

function calculateNthSubnet(baseNetworkNum, blockSize, newCidr, max) {
  let n = parseInt(document.getElementById("subnet-index").value);
  if (isNaN(n) || n < 1) n = 1;
  if (n > max) n = max;

  const net = baseNetworkNum + (n - 1) * blockSize;
  const broad = net + blockSize - 1;
  const firstIp = net + 1;
  const lastIp = broad - 1;

  document.getElementById("nth-subnet-result").style.display = "block";
  document.getElementById("nth-subnet-result").innerHTML = `
        <strong>Result for Subnet #${n}:</strong><br>
        Network ID: <span style="color: var(--primary)">${numToIp(
          net
        )}</span><br>
        Range IP:   ${numToIp(firstIp)} ➝ ${numToIp(lastIp)}<br>
        Broadcast:  ${numToIp(broad)}
    `;
}
