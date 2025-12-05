// =========================================================
// MASTER DATA - JAVASCRIPT (FULL VERSION)
// =========================================================

// Data Dummy (bisa diganti API)
let dataList = [
    { id: 1, vipno: "VIP001", date: "2025-01-10", branch: "Jakarta", status: "Active" },
    { id: 2, vipno: "VIP002", date: "2025-01-11", branch: "Bandung", status: "Inactive" },
    { id: 3, vipno: "VIP003", date: "2025-01-12", branch: "Surabaya", status: "Active" }
];

// Table State
let currentPage = 1;
let rowsPerPage = 5;
let currentSort = { column: null, direction: null };

// =========================================================
// RENDER TABLE
// =========================================================
function renderTable() {
    const tbody = document.querySelector("#dataTable tbody");
    tbody.innerHTML = "";

    let filtered = [...dataList];

    // Search
    const search = document.getElementById("searchBox").value.toLowerCase();
    filtered = filtered.filter(row =>
        row.vipno.toLowerCase().includes(search) ||
        row.branch.toLowerCase().includes(search) ||
        row.status.toLowerCase().includes(search)
    );

    // Sorting
    if (currentSort.column) {
        filtered.sort((a, b) => {
            let x = a[currentSort.column];
            let y = b[currentSort.column];

            if (typeof x === "string") x = x.toLowerCase();
            if (typeof y === "string") y = y.toLowerCase();

            if (x < y) return currentSort.direction === "asc" ? -1 : 1;
            if (x > y) return currentSort.direction === "asc" ? 1 : -1;
            return 0;
        });
    }

    // Pagination
    const start = (currentPage - 1) * rowsPerPage;
    const paginated = filtered.slice(start, start + rowsPerPage);

    paginated.forEach((row, index) => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${start + index + 1}</td>
            <td>${row.vipno}</td>
            <td>${row.date}</td>
            <td>${row.branch}</td>
            <td><span class="status ${row.status.toLowerCase()}">${row.status}</span></td>
            <td>
                <button class="btn small edit" onclick="openEditModal(${row.id})">Edit</button>
                <button class="btn small delete" onclick="confirmDelete(${row.id})">Delete</button>
            </td>
        `;

        tbody.appendChild(tr);
    });

    renderPagination(filtered.length);
}

// =========================================================
// SORTING
// =========================================================
function sortTable(column) {
    const ths = document.querySelectorAll("th.sortable");

    ths.forEach(th => th.classList.remove("asc", "desc"));

    if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === "asc" ? "desc" : "asc";
    } else {
        currentSort.column = column;
        currentSort.direction = "asc";
    }

    const activeTh = document.querySelector(`th[data-column="${column}"]`);
    activeTh.classList.add(currentSort.direction);

    renderTable();
}

// =========================================================
// PAGINATION
// =========================================================
function renderPagination(totalRows) {
    const pageCount = Math.ceil(totalRows / rowsPerPage);
    const container = document.getElementById("pagination");
    container.innerHTML = "";

    for (let i = 1; i <= pageCount; i++) {
        const btn = document.createElement("button");
        btn.className = "page-btn";
        if (i === currentPage) btn.classList.add("active");
        btn.innerText = i;
        btn.onclick = () => {
            currentPage = i;
            renderTable();
        };
        container.appendChild(btn);
    }
}

// =========================================================
// ADD DATA MODAL
// =========================================================
function openAddModal() {
    document.getElementById("modalAdd").style.display = "flex";
}

function closeAddModal() {
    document.getElementById("modalAdd").style.display = "none";
    document.getElementById("formAdd").reset();
}

function saveData() {
    const vipno = document.getElementById("addVipno").value.trim();
    const date = document.getElementById("addDate").value;
    const branch = document.getElementById("addBranch").value;
    const status = document.getElementById("addStatus").value;

    if (!vipno || !date || !branch || !status) {
        alert("Semua field wajib diisi!");
        return;
    }

    const newItem = {
        id: dataList.length ? dataList[dataList.length - 1].id + 1 : 1,
        vipno,
        date,
        branch,
        status
    };

    dataList.push(newItem);
    closeAddModal();
    renderTable();
}

// =========================================================
// EDIT DATA
// =========================================================
function openEditModal(id) {
    const item = dataList.find(x => x.id === id);

    document.getElementById("editId").value = item.id;
    document.getElementById("editVipno").value = item.vipno;
    document.getElementById("editDate").value = item.date;
    document.getElementById("editBranch").value = item.branch;
    document.getElementById("editStatus").value = item.status;

    document.getElementById("modalEdit").style.display = "flex";
}

function closeEditModal() {
    document.getElementById("modalEdit").style.display = "none";
}

function updateData() {
    const id = parseInt(document.getElementById("editId").value);
    const vipno = document.getElementById("editVipno").value.trim();
    const date = document.getElementById("editDate").value;
    const branch = document.getElementById("editBranch").value;
    const status = document.getElementById("editStatus").value;

    if (!vipno || !date || !branch || !status) {
        alert("Semua field wajib diisi!");
        return;
    }

    const index = dataList.findIndex(x => x.id === id);
    dataList[index] = { id, vipno, date, branch, status };

    closeEditModal();
    renderTable();
}

// =========================================================
// DELETE CONFIRMATION
// =========================================================
function confirmDelete(id) {
    if (confirm("Yakin ingin menghapus data ini?")) {
        dataList = dataList.filter(x => x.id !== id);
        renderTable();
    }
}

// =========================================================
// IMPORT MODAL
// =========================================================
function openImportModal() {
    document.getElementById("modalImport").style.display = "flex";
}

function closeImportModal() {
    document.getElementById("modalImport").style.display = "none";
    document.getElementById("fileImport").value = "";
}

function uploadExcel() {
    const file = document.getElementById("fileImport").files[0];

    if (!file) {
        alert("Pilih file terlebih dahulu!");
        return;
    }

    alert("Import berhasil (simulasi).");
    closeImportModal();
}

// =========================================================
// INITIAL LOAD
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
    renderTable();
    document.getElementById("searchBox").addEventListener("input", renderTable);
});
