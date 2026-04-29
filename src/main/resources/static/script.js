// ===== GLOBAL DATA =====
const API_BASE_URL = "http://localhost:8080/api/seating";
let seatingData = [];
let branches = [];
let debarred = [];
let roomConfigs = [];
let currentSession = "Morning";
let allocationChart = null;

// ===== ON LOAD =====
window.onload = async function () {
    const roleSelect = document.getElementById("role");

    if (roleSelect) {
        updateRoleTheme(roleSelect.value);
        roleSelect.addEventListener("change", function () {
            updateRoleTheme(roleSelect.value);
        });
    }

    // Load session first
    currentSession = localStorage.getItem("currentSession") || "Morning";
    const sessionRadio = document.getElementById(currentSession.toLowerCase());
    if (sessionRadio) sessionRadio.checked = true;

    // Load from LocalStorage (session-prefixed)
    await loadSessionData();

    await syncWithBackend();

    displayBranches();
    displayDebarred();
    displayUnallocated();
    loadRoomInputs();
    displayRoomLayout();
    updateSummary();
    loadStudentBranches();
};

function getUserPrefix() {
    const userJson = localStorage.getItem("loggedInUser");
    if (!userJson) return "";
    const user = JSON.parse(userJson);
    return user.user + "_" + currentSession.toLowerCase() + "_";
}

function getTeacherUsername() {
    const userJson = localStorage.getItem("loggedInUser");
    if (!userJson) return "unknown";
    const user = JSON.parse(userJson);
    return user.user;
}

async function loadSessionData() {
    const prefix = getUserPrefix();
    branches = JSON.parse(localStorage.getItem(prefix + "branches")) || [];
    debarred = JSON.parse(localStorage.getItem(prefix + "debarred")) || [];
    roomConfigs = JSON.parse(localStorage.getItem(prefix + "roomConfigs")) || [];
    seatingData = JSON.parse(localStorage.getItem(prefix + "seatingData")) || [];
    const unallocated = JSON.parse(localStorage.getItem(prefix + "unallocated")) || [];
    // No need to set global 'unallocated' here, as it's computed or loaded by prefix later

    const releaseTimeInput = document.getElementById("releaseTime");
    if (releaseTimeInput) {
        releaseTimeInput.value = localStorage.getItem(prefix + "releaseTime") || "";
    }
}

function saveToSessionStorage(key, data) {
    const prefix = getUserPrefix();
    localStorage.setItem(prefix + key, JSON.stringify(data));
    
    // Invalidate seating if branches or rooms change
    if (key === "branches" || key === "roomConfigs") {
        localStorage.removeItem(prefix + "seatingData");
        localStorage.removeItem(prefix + "unallocated");
        seatingData = [];
    }
}

async function syncWithBackend() {
    const teacher = getTeacherUsername();
    try {
        const branchRes = await fetch(`${API_BASE_URL}/branches?session=${currentSession}&teacher=${teacher}`);
        if (branchRes.ok) {
            const backendBranches = await branchRes.json();
            if (backendBranches.length > 0) branches = backendBranches;
        }

        const roomRes = await fetch(`${API_BASE_URL}/rooms?session=${currentSession}&teacher=${teacher}`);
        if (roomRes.ok) {
            const backendRooms = await roomRes.json();
            if (backendRooms.length > 0) roomConfigs = backendRooms;
        }
    } catch (e) {
        console.warn("Backend not available, using local data.");
    }
}

function updateRoleTheme(role) {
    if (!document.body.classList.contains("auth-page")) return;

    if (role === "teacher") {
        document.body.style.background = "linear-gradient(135deg, #0f172a, #7c3aed, #0f172a)";
    } else {
        document.body.style.background = "linear-gradient(135deg, #0f172a, #0891b2, #0f172a)";
    }
}

// ===== LOGIN =====
async function login() {
    let role = document.getElementById("role").value;
    let username = document.getElementById("username").value.trim();
    let password = document.getElementById("password").value.trim();
    let errorBox = document.getElementById("error");

    errorBox.innerText = "";

    // Teacher Admin Default (for testing)
    if (role === "teacher" && username === "admin" && password === "admin") {
        localStorage.setItem("loggedInUser", JSON.stringify({ user: "admin", role: "teacher" }));
        window.location.href = "teacher.html";
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL.replace("/seating", "/users")}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password, role })
        });

        const data = await response.json();

        if (data.success) {
            localStorage.setItem("loggedInUser", JSON.stringify({
                user: data.user.username,
                role: data.user.role
            }));

            if (data.user.role === "teacher") {
                window.location.href = "teacher.html";
            } else {
                window.location.href = "student.html";
            }
        } else {
            errorBox.innerText = data.message || "Invalid username, password, or role!";
        }
    } catch (e) {
        errorBox.innerText = "Backend connection failed.";
    }
}

function checkAccess(pageRole) {
    let loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));

    if (!loggedInUser) {
        window.location.href = "index.html";
        return;
    }

    if (loggedInUser.role !== pageRole) {
        alert("Access denied.");
        window.location.href = "index.html";
    }
}

function logout() {
    localStorage.removeItem("loggedInUser");
    window.location.href = "index.html";
}

// ===== SIGNUP =====
async function signup() {
    let role = document.getElementById("role").value;
    let username = document.getElementById("newUser").value.trim();
    let password = document.getElementById("newPass").value.trim();
    let msg = document.getElementById("msg");

    if (username === "" || password === "") {
        msg.innerText = "Please fill all fields.";
        msg.style.color = "#fecaca";
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL.replace("/seating", "/users")}/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password, role })
        });

        const data = await response.json();

        if (data.success) {
            msg.innerText = data.message;
            msg.style.color = "#86efac";
            document.getElementById("newUser").value = "";
            document.getElementById("newPass").value = "";
        } else {
            msg.innerText = data.message;
            msg.style.color = "#fecaca";
        }
    } catch (e) {
        msg.innerText = "Backend connection failed.";
        msg.style.color = "#fecaca";
    }
}

function goToSignup() {
    window.location.href = "signup.html";
}

function goToLogin() {
    window.location.href = "index.html";
}

// ===== SESSION MANAGEMENT =====
async function saveSession() {
    const sessionRadios = document.getElementsByName("session");
    for (const radio of sessionRadios) {
        if (radio.checked) {
            currentSession = radio.value;
            break;
        }
    }
    localStorage.setItem("currentSession", currentSession);
    
    // Reload local data for the new session
    await loadSessionData();
    
    // Sync with backend to ensure we have the latest session data for this teacher
    await syncWithBackend();
    
    // Refresh UI
    displayBranches();
    displayDebarred();
    displayUnallocated();
    loadRoomInputs();
    displayRoomLayout();
    updateSummary();
}

// ===== RELEASE TIMER =====
function saveReleaseTime() {
    const timeValue = document.getElementById("releaseTime").value;
    const msg = document.getElementById("timerMsg");
    if (!timeValue) {
        msg.innerText = "Please select a time.";
        msg.style.color = "#fecaca";
        return;
    }
    
    const prefix = getUserPrefix();
    localStorage.setItem(prefix + "releaseTime", timeValue);
    
    msg.innerText = "Timer set successfully!";
    msg.style.color = "#86efac";
    setTimeout(() => msg.innerText = "", 3000);
}

function clearReleaseTime() {
    const prefix = getUserPrefix();
    localStorage.removeItem(prefix + "releaseTime");
    document.getElementById("releaseTime").value = "";
    const msg = document.getElementById("timerMsg");
    msg.innerText = "Timer cleared!";
    msg.style.color = "#86efac";
    setTimeout(() => msg.innerText = "", 3000);
}

// ===== PASSWORD TOGGLE =====
function togglePassword(id) {
    let input = document.getElementById(id);
    input.type = input.type === "password" ? "text" : "password";
}

// ===== ROOM SETUP =====
function createRoomInputs() {
    const numRoomsInput = document.getElementById("numRooms");
    const container = document.getElementById("roomInputsContainer");
    const roomMsg = document.getElementById("roomMsg");
    if (!numRoomsInput || !container) return;

    const numRooms = parseInt(numRoomsInput.value);
    container.innerHTML = "";

    if (isNaN(numRooms) || numRooms <= 0) {
        if (roomMsg) {
            roomMsg.innerText = "Enter a valid number of rooms.";
            roomMsg.style.color = "#fecaca";
        }
        return;
    }

    for (let i = 0; i < numRooms; i++) {
        const row = document.createElement("div");
        row.className = "room-input-row";
        const existing = roomConfigs[i] || {};

        row.innerHTML = `
            <div>
                <label for="roomName${i}">Room Name</label>
                <input
                    type="text"
                    id="roomName${i}"
                    placeholder="e.g. Room A"
                    value="${existing.name || `Room ${String.fromCharCode(65 + i)}`}"
                >
            </div>

            <div>
                <label for="roomRows${i}">Rows</label>
                <input
                    type="number"
                    id="roomRows${i}"
                    placeholder="e.g. 5"
                    min="1"
                    value="${existing.rows || ""}"
                >
            </div>

            <div>
                <label for="roomCols${i}">Columns</label>
                <input
                    type="number"
                    id="roomCols${i}"
                    placeholder="e.g. 6"
                    min="1"
                    value="${existing.cols || ""}"
                >
            </div>
        `;

        container.appendChild(row);
    }

    if (roomMsg) {
        roomMsg.innerText = "Room input boxes created.";
        roomMsg.style.color = "#86efac";
    }
}

function saveRoomSetup() {
    const numRooms = parseInt(document.getElementById("numRooms")?.value);
    const roomMsg = document.getElementById("roomMsg");

    if (isNaN(numRooms) || numRooms <= 0) {
        if (roomMsg) {
            roomMsg.innerText = "Enter a valid number of rooms first.";
            roomMsg.style.color = "#fecaca";
        }
        return;
    }

    const newConfigs = [];

    for (let i = 0; i < numRooms; i++) {
        const name = document.getElementById(`roomName${i}`)?.value.trim();
        const rows = parseInt(document.getElementById(`roomRows${i}`)?.value);
        const cols = parseInt(document.getElementById(`roomCols${i}`)?.value);

        if (!name || isNaN(rows) || isNaN(cols) || rows <= 0 || cols <= 0) {
            if (roomMsg) {
                roomMsg.innerText = `Please fill valid details for room ${i + 1}.`;
                roomMsg.style.color = "#fecaca";
            }
            return;
        }

        newConfigs.push({
            name,
            rows,
            cols,
            seatCount: rows * cols
        });
    }

    roomConfigs = newConfigs;
    saveToSessionStorage("roomConfigs", roomConfigs);

    const teacher = getTeacherUsername();
    fetch(`${API_BASE_URL}/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            session: currentSession,
            teacher: teacher,
            configs: roomConfigs
        })
    });

    if (roomMsg) {
        roomMsg.innerText = "Room setup saved successfully.";
        roomMsg.style.color = "#86efac";
    }

    updateSummary();
}

function loadRoomInputs() {
    const numRoomsInput = document.getElementById("numRooms");
    const container = document.getElementById("roomInputsContainer");
    if (!numRoomsInput || !container) return;

    if (roomConfigs.length > 0) {
        numRoomsInput.value = roomConfigs.length;
        createRoomInputs();
    }
}

// ===== BRANCH MANAGEMENT =====
function saveBranch() {
    let name = document.getElementById("branchName").value.trim().toUpperCase();
    let start = parseInt(document.getElementById("startRoll").value);
    let end = parseInt(document.getElementById("endRoll").value);
    let msg = document.getElementById("branchMsg");

    if (!name || isNaN(start) || isNaN(end)) {
        msg.innerText = "Please fill all fields correctly.";
        msg.style.color = "#fecaca";
        return;
    }

    if (start > end) {
        msg.innerText = "Start roll cannot be greater than end roll.";
        msg.style.color = "#fecaca";
        return;
    }

    let alreadyExists = branches.some(b =>
        b.name === name && b.start === start && b.end === end
    );

    if (alreadyExists) {
        msg.innerText = "This branch range is already saved.";
        msg.style.color = "#fecaca";
        return;
    }

    branches.push({ name, startRoll: start, endRoll: end });
    saveToSessionStorage("branches", branches);

    const teacher = getTeacherUsername();
    fetch(`${API_BASE_URL}/branches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            session: currentSession,
            teacher: teacher,
            branches: branches
        })
    });

    msg.innerText = "Branch saved successfully!";
    msg.style.color = "#86efac";

    document.getElementById("branchName").value = "";
    document.getElementById("startRoll").value = "";
    document.getElementById("endRoll").value = "";

    displayBranches();
    updateSummary();
}

function displayBranches() {
    let list = document.getElementById("branchList");
    if (!list) return;

    list.innerHTML = "";

    if (branches.length === 0) {
        list.innerHTML = "<li>No branches added yet.</li>";
        return;
    }

    branches.forEach((b, index) => {
        list.innerHTML += `
            <li>
                <strong>${b.name}</strong> — Roll ${b.startRoll} to ${b.endRoll}
                <button onclick="deleteBranch(${index})" class="danger-btn">Delete</button>
            </li>
        `;
    });
}

function deleteBranch(index) {
    if (!confirm("Are you sure you want to delete this branch?")) return;

    branches.splice(index, 1);
    saveToSessionStorage("branches", branches);

    displayBranches();
    updateSummary();
}

// ===== DEBARRED =====
function addDebar() {
    let roll = parseInt(document.getElementById("debarRoll").value);

    if (isNaN(roll)) return;
    if (debarred.includes(roll)) return;

    debarred.push(roll);
    saveToSessionStorage("debarred", debarred);

    document.getElementById("debarRoll").value = "";
    displayDebarred();
    updateSummary();
}

function displayDebarred() {
    let list = document.getElementById("debarList");
    if (!list) return;

    list.innerHTML = "";

    if (debarred.length === 0) {
        list.innerHTML = "<li>No debarred students.</li>";
        return;
    }

    debarred.forEach((r) => {
        list.innerHTML += `<li>Roll No: ${r}</li>`;
    });
}

// ===== STUDENT GENERATION =====
function generateStudentsFromBranches() {
    let students = [];

    for (let b of branches) {
        for (let r = b.startRoll; r <= b.endRoll; r++) {
            if (debarred.includes(r)) continue;
            students.push({ roll: r, branch: b.name });
        }
    }

    return students;
}

function groupStudentsByBranch(students) {
    const branchMap = {};

    students.forEach(student => {
        if (!branchMap[student.branch]) {
            branchMap[student.branch] = [];
        }
        branchMap[student.branch].push(student);
    });

    // sort each branch by roll no for consistency
    for (let branch in branchMap) {
        branchMap[branch].sort((a, b) => a.roll - b.roll);
    }

    return branchMap;
}

function getBranchPriority(branchMap) {
    let branches = Object.keys(branchMap)
        .filter(branch => branchMap[branch].length > 0);
    
    // Shuffle to randomize selection for branches of the same size
    for (let i = branches.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [branches[i], branches[j]] = [branches[j], branches[i]];
    }

    // Sort by largest remaining (Roundtable rule)
    return branches.sort((a, b) => branchMap[b].length - branchMap[a].length);
}

function pickBestStudent(branchMap, leftStudent, topStudent) {
    const orderedBranches = getBranchPriority(branchMap);

    // 1st priority: avoid same branch as left and top
    for (let branch of orderedBranches) {
        const sameAsLeft = leftStudent && leftStudent.branch === branch;
        const sameAsTop = topStudent && topStudent.branch === branch;

        if (!sameAsLeft && !sameAsTop) {
            return branchMap[branch].shift();
        }
    }

    // 2nd priority: avoid same branch as left
    for (let branch of orderedBranches) {
        const sameAsLeft = leftStudent && leftStudent.branch === branch;

        if (!sameAsLeft) {
            return branchMap[branch].shift();
        }
    }

    // 3rd priority: avoid same branch as top
    for (let branch of orderedBranches) {
        const sameAsTop = topStudent && topStudent.branch === branch;

        if (!sameAsTop) {
            return branchMap[branch].shift();
        }
    }

    // last fallback: take from largest remaining branch
    if (orderedBranches.length > 0) {
        return branchMap[orderedBranches[0]].shift();
    }

    return null;
}

function createSmartRoomSeats(room, branchMap) {
    const roomSeats = new Array(room.rows * room.cols).fill(null);

    for (let row = 0; row < room.rows; row++) {
        for (let col = 0; col < room.cols; col++) {
            const index = row * room.cols + col;

            const leftStudent = col > 0 ? roomSeats[index - 1] : null;
            const topStudent = row > 0 ? roomSeats[(row - 1) * room.cols + col] : null;

            const chosenStudent = pickBestStudent(branchMap, leftStudent, topStudent);
            roomSeats[index] = chosenStudent || null;
        }
    }

    return roomSeats;
}

function getRemainingStudents(branchMap) {
    let remaining = [];

    for (let branch in branchMap) {
        remaining = remaining.concat(branchMap[branch]);
    }

    return remaining;
}

// ===== SEATING GENERATION =====
async function generateSeatingAdvanced() {
    const storedRooms = JSON.parse(localStorage.getItem("roomConfigs")) || [];

    if (storedRooms.length === 0) {
        alert("Please create and save room setup first.");
        return;
    }

    let students = generateStudentsFromBranches();

    if (students.length === 0) {
        alert("No students available.");
        return;
    }

    if (branches.length < 3) {
        if (!confirm("You have fewer than 3 branches. It may be harder to ensure students from the same branch are not sitting near each other. Continue?")) {
            return;
        }
    }

    const branchMap = groupStudentsByBranch(students);
    
    // Call backend DAA algorithm
    try {
        const response = await fetch(`${API_BASE_URL}/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                branches: branches,
                roomConfigs: storedRooms,
                debarred: debarred
            })
        });

        if (response.ok) {
            const data = await response.json();
            seatingData = data.seatingData;
            const unallocatedStudents = data.unallocated;

            saveToSessionStorage("seatingData", seatingData);
            saveToSessionStorage("unallocated", unallocatedStudents);
            localStorage.setItem("unallocated", JSON.stringify(unallocatedStudents));

            displayRoomLayout();
            displayUnallocated();
            updateSummary();

            if (unallocatedStudents.length > 0) {
                alert(unallocatedStudents.length + " students could not be allocated.");
            } else {
                alert("Smart seating generated successfully (via Backend).");
            }
            return;
        }
    } catch (e) {
        console.error("Backend generation failed, falling back to local.", e);
    }

    // Fallback to local logic
    const newSeating = [];
    const localBranchMap = groupStudentsByBranch(students);

    for (let room of storedRooms) {
        const roomSeats = createSmartRoomSeats(room, localBranchMap);

        newSeating.push({
            roomName: room.name,
            rows: room.rows,
            cols: room.cols,
            seatCount: room.seatCount,
            seats: roomSeats
        });
    }

    const unallocatedStudents = getRemainingStudents(localBranchMap);

    seatingData = newSeating;
    saveToSessionStorage("seatingData", seatingData);
    saveToSessionStorage("unallocated", unallocatedStudents);
    localStorage.setItem("unallocated", JSON.stringify(unallocatedStudents));

    displayRoomLayout();
    displayUnallocated();
    updateSummary();

    if (unallocatedStudents.length > 0) {
        alert(unallocatedStudents.length + " students could not be allocated.");
    } else {
        alert("Smart seating generated successfully.");
    }
}
// ===== TEACHER ROOM LAYOUT =====
function displayRoomLayout() {
    const layout = document.getElementById("roomLayout");
    if (!layout) return;

    const data = seatingData || [];
    layout.innerHTML = "";

    if (data.length === 0) {
        layout.innerHTML = `<div class="list-box">No seating generated yet.</div>`;
        return;
    }

    data.forEach((room, roomIndex) => {
        const roomCard = document.createElement("div");
        roomCard.className = "room-card";

        const header = document.createElement("div");
        header.className = "room-card-header";
        header.innerHTML = `
            <div>
                <div class="room-card-title">${room.roomName}</div>
                <div class="room-card-meta">${room.rows} rows × ${room.cols} columns = ${room.seatCount} seats</div>
            </div>
        `;

        const seatContainer = document.createElement("div");
        seatContainer.className = "room-seats";
        seatContainer.style.gridTemplateColumns = `repeat(${room.cols}, 1fr)`;

        room.seats.forEach((student, seatIndex) => {
            const seat = document.createElement("div");
            seat.className = "seat-mini" + (student ? "" : " empty");
            seat.textContent = seatIndex + 1;
            seat.title = student
                ? `Seat ${seatIndex + 1}: ${student.roll} (${student.branch})`
                : `Seat ${seatIndex + 1}: Empty`;

            seat.addEventListener("click", function () {
                showSeatDetails(roomIndex, seatIndex);
            });

            seatContainer.appendChild(seat);
        });

        roomCard.appendChild(header);
        roomCard.appendChild(seatContainer);
        layout.appendChild(roomCard);
    });
}

function showSeatDetails(roomIndex, seatIndex) {
    const data = JSON.parse(localStorage.getItem("seatingData")) || [];
    const room = data[roomIndex];
    if (!room) return;

    const student = room.seats[seatIndex];

    if (student) {
        alert(
            `Room: ${room.roomName}\nSeat No: ${seatIndex + 1}\nStudent Roll: ${student.roll}\nBranch: ${student.branch}`
        );
    } else {
        alert(
            `Room: ${room.roomName}\nSeat No: ${seatIndex + 1}\nThis seat is empty.`
        );
    }
}

// ===== UNALLOCATED =====
function displayUnallocated(branchFilter = null) {
    let list = document.getElementById("unallocatedList");
    let subtitle = document.getElementById("unallocatedSubtitle");
    let resetBtn = document.getElementById("resetFilterBtn");
    if (!list) return;

    const prefix = getUserPrefix();
    let data = JSON.parse(localStorage.getItem(prefix + "unallocated")) || [];
    
    if (branchFilter) {
        data = data.filter(s => s.branch === branchFilter);
        subtitle.innerText = `Showing unallocated students for: ${branchFilter}`;
        if (resetBtn) resetBtn.style.display = "block";
    } else {
        subtitle.innerText = "Students left out because total seats were not enough.";
        if (resetBtn) resetBtn.style.display = "none";
    }

    list.innerHTML = "";

    if (data.length === 0) {
        list.innerHTML = branchFilter 
            ? `<li>No unallocated students in ${branchFilter}.</li>`
            : "<li>All students have been allocated.</li>";
        return;
    }

    data.forEach((s) => {
        list.innerHTML += `<li>${s.roll} (${s.branch})</li>`;
    });
}

// ===== SUMMARY =====
function updateSummary() {
    const summary = document.getElementById("summaryCards");
    if (!summary) return;

    const totalStudents = generateStudentsFromBranches().length;
    const totalRooms = roomConfigs.length;
    const totalSeats = roomConfigs.reduce((sum, room) => sum + Number(room.seatCount || 0), 0);
    
    const prefix = getUserPrefix();
    const unallocated = (JSON.parse(localStorage.getItem(prefix + "unallocated")) || []).length;

    summary.innerHTML = `
        <div class="summary-card">
            <h3>Total Rooms</h3>
            <p>${totalRooms}</p>
        </div>
        <div class="summary-card">
            <h3>Total Seats</h3>
            <p>${totalSeats}</p>
        </div>
        <div class="summary-card">
            <h3>Students</h3>
            <p>${totalStudents}</p>
        </div>
        <div class="summary-card">
            <h3>Unallocated</h3>
            <p>${unallocated}</p>
        </div>
    `;

    updateStatsRects();
    updateAllocationChart();
}

function updateStatsRects() {
    const rectsContainer = document.getElementById("statsRectangles");
    if (!rectsContainer) return;

    const totalStudentsCount = generateStudentsFromBranches().length;
    const prefix = getUserPrefix();
    const unallocated = JSON.parse(localStorage.getItem(prefix + "unallocated")) || [];
    
    // Group unallocated by branch
    const unallocatedMap = {};
    unallocated.forEach(s => {
        unallocatedMap[s.branch] = (unallocatedMap[s.branch] || 0) + 1;
    });

    let html = `
        <div class="stat-rect" style="background: rgba(99, 102, 241, 0.2); border-color: #6366f1;">
            <h4>Total Students</h4>
            <span>${totalStudentsCount}</span>
        </div>
    `;

    const branchColors = ["#f59e0b", "#ef4444", "#10b981", "#8b5cf6", "#ec4899"];
    Object.keys(unallocatedMap).forEach((branch, i) => {
        const color = branchColors[i % branchColors.length];
        html += `
            <div class="stat-rect" style="background: ${color}33; border-color: ${color};">
                <h4>Unallocated ${branch}</h4>
                <span>${unallocatedMap[branch]}</span>
            </div>
        `;
    });

    rectsContainer.innerHTML = html;
}

function updateAllocationChart() {
    const ctx = document.getElementById("allocationChart")?.getContext("2d");
    if (!ctx) return;

    const students = generateStudentsFromBranches();
    const totalStudentsCount = students.length;
    const prefix = getUserPrefix();
    const unallocated = JSON.parse(localStorage.getItem(prefix + "unallocated")) || [];
    const allocatedCount = totalStudentsCount - unallocated.length;

    // Group unallocated by branch
    const unallocatedMap = {};
    unallocated.forEach(s => {
        unallocatedMap[s.branch] = (unallocatedMap[s.branch] || 0) + 1;
    });

    const labels = ["Allocated"];
    const data = [allocatedCount];
    const colors = ["#22c55e"]; // Success green for allocated

    const branchColors = ["#f59e0b", "#ef4444", "#10b981", "#8b5cf6", "#ec4899"];
    Object.keys(unallocatedMap).forEach((branch, i) => {
        labels.push(`Unallocated ${branch}`);
        data.push(unallocatedMap[branch]);
        colors.push(branchColors[i % branchColors.length]);
    });

    if (allocationChart) {
        allocationChart.destroy();
    }

    if (totalStudentsCount === 0) return;

    allocationChart = new Chart(ctx, {
        type: "pie",
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderColor: "rgba(255, 255, 255, 0.1)",
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const label = labels[index];
                    console.log("Pie chart clicked:", label);
                    if (label.startsWith("Unallocated ")) {
                        const branch = label.replace("Unallocated ", "");
                        displayUnallocated(branch);
                    } else {
                        displayUnallocated(); 
                    }
                }
            },
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        color: "#fff",
                        font: { size: 12 }
                    }
                }
            }
        }
    });
}

// ===== STUDENT SEARCH =====
function findSeat() {
    const roll = document.getElementById("searchRoll").value.trim();
    const branch = document.getElementById("studentBranch").value.trim();
    const result = document.getElementById("result");
    const studentRoomView = document.getElementById("studentRoomView");

    if (branch === "" || roll === "") {
        result.innerText = "Please select branch and enter roll number.";
        if (studentRoomView) {
            studentRoomView.innerHTML = `<p class="empty-room-text">Enter your branch and roll number to view your classroom.</p>`;
        }
        return;
    }
    // Search through all keys in localStorage to find matching seating data across all teachers
    let found = false;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes("seatingData")) {
            // Determine session based on the key name
            let sessionName = "Unknown";
            if (key.toLowerCase().includes("morning")) sessionName = "Morning";
            if (key.toLowerCase().includes("afternoon")) sessionName = "Afternoon";

            const data = JSON.parse(localStorage.getItem(key)) || [];

            for (let r = 0; r < data.length; r++) {
                for (let c = 0; c < data[r].seats.length; c++) {
                    const student = data[r].seats[c];

                    if (
                        student &&
                        String(student.roll) === roll &&
                        student.branch === branch
                    ) {
                        found = true;
                        
                        // Check if a timer is set
                        const prefix = key.replace("seatingData", "");
                        const releaseTimeStr = localStorage.getItem(prefix + "releaseTime");
                        
                        if (releaseTimeStr) {
                            const releaseTime = new Date();
                            const [hours, minutes] = releaseTimeStr.split(":");
                            releaseTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                            
                            const now = new Date();
                            if (now < releaseTime) {
                                const diffMs = releaseTime - now;
                                const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                                const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                                
                                let timeStr = "";
                                if (diffHrs > 0) timeStr += `${diffHrs} hour${diffHrs > 1 ? 's' : ''} `;
                                timeStr += `${diffMins} min${diffMins !== 1 ? 's' : ''}`;
                                
                                result.innerHTML = `
                                    <div style="font-weight: 700; color: #f59e0b; margin-bottom: 5px;">Exam Found, but locked!</div>
                                    <div class="session-badge" style="background: #f59e0b;">${sessionName} Session</div>
                                    <div>Your room will be visible in: <strong style="color:white;">${timeStr}</strong></div>
                                `;
                                if (studentRoomView) {
                                    studentRoomView.innerHTML = `<p class="empty-room-text" style="color:#f59e0b;">Seating layout is currently locked by the teacher until ${releaseTimeStr}.</p>`;
                                }
                                return;
                            }
                        }

                        result.innerHTML = `
                            <div style="font-weight: 700; color: #86efac; margin-bottom: 5px;">Exam Found!</div>
                            <div class="session-badge">${sessionName} Session</div>
                            <div>Branch: ${branch} | Classroom: ${data[r].roomName} | Seat No: ${c + 1}</div>
                        `;
                        renderStudentRoom(data[r], c);
                        return;
                    }
                }
            }
        }
    }

    if (!found) {
        result.innerText = "Seat not found for this branch and roll number in any session.";
        if (studentRoomView) {
            studentRoomView.innerHTML = `<p class="empty-room-text">No classroom found for this branch and roll number.</p>`;
        }
    }
}

function renderStudentRoom(room, highlightedSeatIndex) {
    const studentRoomView = document.getElementById("studentRoomView");
    if (!studentRoomView) return;

    let seatsHTML = "";

    room.seats.forEach((student, index) => {
        let classes = "seat-mini";

        if (!student) {
            classes += " empty";
        }

        if (index === highlightedSeatIndex) {
            classes += " highlight-seat";
        }

        seatsHTML += `
            <div class="${classes}" title="Seat ${index + 1}">
                ${index + 1}
            </div>
        `;
    });

    studentRoomView.innerHTML = `
        <div class="student-room-card">
            <div class="student-room-header">
                <div>
                    <div class="student-room-title">${room.roomName}</div>
                    <div class="student-room-meta">${room.rows} rows × ${room.cols} columns = ${room.seatCount} seats</div>
                </div>
            </div>

            <div class="room-seats" style="grid-template-columns: repeat(${room.cols}, 1fr);">
                ${seatsHTML}
            </div>
        </div>
    `;
}

// ===== CLEAR DATA =====
function clearAllData() {
    const teacher = getTeacherUsername();
    if (!confirm(`This will delete ALL session data for ${teacher}. Your login info will be kept. Are you sure?`)) return;

    const sessions = ["morning_", "afternoon_"];
    sessions.forEach(session => {
        const prefix = teacher + "_" + session;
        localStorage.removeItem(prefix + "branches");
        localStorage.removeItem(prefix + "debarred");
        localStorage.removeItem(prefix + "roomConfigs");
        localStorage.removeItem(prefix + "seatingData");
        localStorage.removeItem(prefix + "unallocated");
        localStorage.removeItem(prefix + "releaseTime");
    });
    
    localStorage.removeItem("unallocated"); // Global fallback

    branches = [];
    debarred = [];
    seatingData = [];
    roomConfigs = [];

    displayBranches();
    displayDebarred();
    displayUnallocated();
    displayRoomLayout();
    updateSummary();

    const studentRoomView = document.getElementById("studentRoomView");
    if (studentRoomView) {
        studentRoomView.innerHTML = `<p class="empty-room-text">Search your roll number to view your classroom.</p>`;
    }

    alert("Session data cleared successfully.");
}

function loadStudentBranches() {
    const branchSelect = document.getElementById("studentBranch");
    if (!branchSelect) return;

    let allBranches = [];
    
    // Find all branches across all teachers and sessions
    for (let key in localStorage) {
        if (key.endsWith("_branches")) {
            const branches = JSON.parse(localStorage.getItem(key)) || [];
            allBranches = allBranches.concat(branches);
        }
    }

    branchSelect.innerHTML = `<option value="">Select branch</option>`;

    const uniqueBranches = [...new Set(allBranches.map(b => b.name))];

    uniqueBranches.forEach(branch => {
        branchSelect.innerHTML += `<option value="${branch}">${branch}</option>`;
    });
}

// Redundant onload removed
