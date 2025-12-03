// master-data.js - WITH SORTING & PAGINATION

let allItems = [];
let filteredItems = [];
let currentPage = 1;
let entriesPerPage = 10;
let sortColumn = 'item_code';
let sortDirection = 'asc';

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initializeMasterData();
});

async function initializeMasterData() {
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Action buttons
    document.getElementById('btnAddItem').addEventListener('click', openItemModal);
    document.getElementById('btnImportExcel').addEventListener('click', openImportModal);

    // Search functionality
    document.getElementById('searchInput').addEventListener('input', function() {
        filterItems(this.value);
    });

    // Entries per page
    document.getElementById('entriesPerPage').addEventListener('change', function() {
        entriesPerPage = this.value === 'all' ? 'all' : parseInt(this.value);
        currentPage = 1;
        renderItems();
    });

    // Sortable headers
    document.querySelectorAll('.sortable').forEach(header => {
        header.addEventListener('click', function() {
            const column = this.dataset.column;
            handleSort(column);
        });
    });

    // Setup modals
    setupModals();

    // Load items
    await loadItems();
}

async function loadItems() {
    try {
        const response = await API.masterItems.getAll();
        if (response.success) {
            allItems = response.data;
            filteredItems = [...allItems];
            sortItems();
            renderItems();
        }
    } catch (error) {
        showAlert('Failed to load items: ' + error.message, 'error');
    }
}

function filterItems(searchTerm = '') {
    if (!searchTerm) {
        filteredItems = [...allItems];
    } else {
        const term = searchTerm.toLowerCase();
        filteredItems = allItems.filter(item => 
            item.item_code.toLowerCase().includes(term) ||
            item.item_name.toLowerCase().includes(term) ||
            (item.category && item.category.toLowerCase().includes(term)) ||
            (item.description && item.description.toLowerCase().includes(term))
        );
    }
    currentPage = 1;
    sortItems();
    renderItems();
}

function handleSort(column) {
    if (sortColumn === column) {
        // Toggle direction
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        // New column, default to ascending
        sortColumn = column;
        sortDirection = 'asc';
    }
    
    // Update header UI
    document.querySelectorAll('.sortable').forEach(header => {
        header.classList.remove('asc', 'desc');
    });
    const activeHeader = document.querySelector(`[data-column="${column}"]`);
    activeHeader.classList.add(sortDirection);
    
    sortItems();
    renderItems();
}

function sortItems() {
    filteredItems.sort((a, b) => {
        let aVal = a[sortColumn];
        let bVal = b[sortColumn];
        
        // Handle null/undefined values
        if (!aVal) aVal = '';
        if (!bVal) bVal = '';
        
        // Convert to lowercase for string comparison
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        
        // Date comparison
        if (sortColumn === 'created_at') {
            aVal = new Date(a[sortColumn]);
            bVal = new Date(b[sortColumn]);
        }
        
        if (sortDirection === 'asc') {
            return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        } else {
            return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
        }
    });
}

function renderItems() {
    const tbody = document.getElementById('itemsTableBody');
    
    if (filteredItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading">No items found</td></tr>';
        updatePaginationInfo(0, 0, 0);
        renderPaginationButtons(0);
        return;
    }

    // Pagination logic
    const totalItems = filteredItems.length;
    let itemsToShow, startIndex, endIndex;
    
    if (entriesPerPage === 'all') {
        itemsToShow = filteredItems;
        startIndex = 0;
        endIndex = totalItems;
    } else {
        const totalPages = Math.ceil(totalItems / entriesPerPage);
        if (currentPage > totalPages) currentPage = totalPages;
        
        startIndex = (currentPage - 1) * entriesPerPage;
        endIndex = Math.min(startIndex + entriesPerPage, totalItems);
        itemsToShow = filteredItems.slice(startIndex, endIndex);
    }

    tbody.innerHTML = itemsToShow.map(item => `
        <tr>
            <td>${item.item_code}</td>
            <td>${item.item_name}</td>
            <td>${item.category || '-'}</td>
            <td>${item.description || '-'}</td>
            <td>${formatDate(item.created_at)}</td>
        </tr>
    `).join('');
    
    updatePaginationInfo(startIndex + 1, endIndex, totalItems);
    
    if (entriesPerPage !== 'all') {
        renderPaginationButtons(Math.ceil(totalItems / entriesPerPage));
    } else {
        document.getElementById('paginationButtons').innerHTML = '';
    }
}

function updatePaginationInfo(start, end, total) {
    const info = document.getElementById('paginationInfo');
    if (total === 0) {
        info.textContent = 'Showing 0 to 0 of 0 entries';
    } else {
        info.textContent = `Showing ${start} to ${end} of ${total} entries`;
    }
}

function renderPaginationButtons(totalPages) {
    const container = document.getElementById('paginationButtons');
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let buttons = [];
    
    // Previous button
    buttons.push(`
        <button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
            Previous
        </button>
    `);
    
    // Page numbers
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    
    if (endPage - startPage < maxButtons - 1) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }
    
    if (startPage > 1) {
        buttons.push(`<button onclick="changePage(1)">1</button>`);
        if (startPage > 2) {
            buttons.push(`<button disabled>...</button>`);
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        buttons.push(`
            <button onclick="changePage(${i})" class="${i === currentPage ? 'active' : ''}">
                ${i}
            </button>
        `);
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            buttons.push(`<button disabled>...</button>`);
        }
        buttons.push(`<button onclick="changePage(${totalPages})">${totalPages}</button>`);
    }
    
    // Next button
    buttons.push(`
        <button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
            Next
        </button>
    `);
    
    container.innerHTML = buttons.join('');
}

function changePage(page) {
    const totalPages = Math.ceil(filteredItems.length / entriesPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderItems();
    
    // Scroll to top of table
    document.querySelector('.table-container').scrollIntoView({ behavior: 'smooth' });
}

function openItemModal() {
    document.getElementById('itemForm').reset();
    document.getElementById('itemModal').style.display = 'block';
}

function openImportModal() {
    document.getElementById('importForm').reset();
    document.getElementById('importModal').style.display = 'block';
}

function setupModals() {
    // Item Modal
    const itemModal = document.getElementById('itemModal');
    const itemForm = document.getElementById('itemForm');
    
    document.getElementById('btnCancelItem').addEventListener('click', () => {
        itemModal.style.display = 'none';
    });

    itemForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const data = {
            item_code: document.getElementById('itemCode').value,
            item_name: document.getElementById('itemName').value,
            category: document.getElementById('itemCategory').value,
            description: document.getElementById('itemDescription').value
        };

        try {
            const response = await API.masterItems.create(data);
            if (response.success) {
                showAlert('Item created successfully!');
                itemModal.style.display = 'none';
                await loadItems();
            }
        } catch (error) {
            showAlert('Failed to create item: ' + error.message, 'error');
        }
    });

    // Import Modal
    const importModal = document.getElementById('importModal');
    const importForm = document.getElementById('importForm');
    
    document.getElementById('btnCancelImport').addEventListener('click', () => {
        importModal.style.display = 'none';
    });

    importForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const fileInput = document.getElementById('excelFile');
        const file = fileInput.files[0];
        
        if (!file) {
            showAlert('Please select a file', 'error');
            return;
        }

        try {
            const response = await API.masterItems.importExcel(file);
            if (response.success) {
                showAlert('Data imported successfully!');
                importModal.style.display = 'none';
                await loadItems();
            }
        } catch (error) {
            showAlert('Failed to import data: ' + error.message, 'error');
        }
    });

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === itemModal) itemModal.style.display = 'none';
        if (e.target === importModal) importModal.style.display = 'none';
    });

    // Close buttons
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
}

async function handleLogout() {
    try {
        await API.auth.logout();
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        auth.logout();
    }
}