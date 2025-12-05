// dashboard.js - UPDATED for Multi-level Approval

let allRequests = [];
let currentFilter = 'all';
let currentRequestId = null;
let currentAction = null;
let sortColumn = 'created_at';
let sortDirection = 'desc';

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initializeDashboard();
});

async function initializeDashboard() {
    const user = auth.getUser();
    
    // Display user info
    document.getElementById('userName').textContent = user.name;
    document.getElementById('userRole').innerHTML = getRoleBadge(user.role);

    // Hide New Request button for non-users
    if (!auth.isUser()) {
        document.getElementById("btnNewRequest").style.display = "none";
    }

    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Action buttons
    document.getElementById('btnNewRequest').addEventListener('click', openRequestModal);
    document.getElementById('btnMasterData').addEventListener('click', () => {
        window.location.href = 'master-data.html';
    });

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.status;
            renderRequests();
        });
    });

    // Sortable headers
    document.querySelectorAll('.sortable').forEach(header => {
        header.addEventListener('click', function() {
            const column = this.dataset.column;
            handleSort(column);
        });
    });

    // Modal controls
    setupModals();

    // Load data
    await loadRequests();
    await loadMasterItems();
}

async function loadRequests() {
    try {
        const response = await API.requests.getAll();
        if (response.success) {
            allRequests = response.data;
            updateStats();
            sortRequests();
            renderRequests();
        }
    } catch (error) {
        showAlert('Failed to load requests: ' + error.message, 'error');
    }
}

function handleSort(column) {
    if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = column;
        sortDirection = 'asc';
    }
    
    document.querySelectorAll('.sortable').forEach(header => {
        header.classList.remove('asc', 'desc');
    });
    const activeHeader = document.querySelector(`[data-column="${column}"]`);
    activeHeader.classList.add(sortDirection);
    
    sortRequests();
    renderRequests();
}

function sortRequests() {
    allRequests.sort((a, b) => {
        let aVal, bVal;
        
        switch(sortColumn) {
            case 'id':
                aVal = a.id;
                bVal = b.id;
                break;
            case 'title':
                aVal = a.title.toLowerCase();
                bVal = b.title.toLowerCase();
                break;
            case 'item':
                aVal = a.item ? a.item.item_name.toLowerCase() : '';
                bVal = b.item ? b.item.item_name.toLowerCase() : '';
                break;
            case 'quantity':
                aVal = a.quantity;
                bVal = b.quantity;
                break;
            case 'user':
                aVal = a.user.name.toLowerCase();
                bVal = b.user.name.toLowerCase();
                break;
            case 'status':
                aVal = a.status;
                bVal = b.status;
                break;
            case 'created_at':
                aVal = new Date(a.created_at);
                bVal = new Date(b.created_at);
                break;
            default:
                aVal = a[sortColumn];
                bVal = b[sortColumn];
        }
        
        if (sortDirection === 'asc') {
            return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        } else {
            return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
        }
    });
}

function updateStats() {
    const total = allRequests.length;
    const pending = allRequests.filter(r => r.status === 'pending').length;
    const approved = allRequests.filter(r => r.status === 'approved').length;
    const rejected = allRequests.filter(r => r.status === 'rejected').length;

    document.getElementById('totalRequests').textContent = total;
    document.getElementById('pendingRequests').textContent = pending;
    document.getElementById('approvedRequests').textContent = approved;
    document.getElementById('rejectedRequests').textContent = rejected;
}

function renderRequests() {
    const tbody = document.getElementById('requestsTableBody');
    const filteredRequests = currentFilter === 'all' 
        ? allRequests 
        : allRequests.filter(r => r.status === currentFilter);

    if (filteredRequests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="loading">No requests found</td></tr>';
        return;
    }

    tbody.innerHTML = filteredRequests.map(request => {
        const canApprove = canApproveRequest(request);
        const currentLevel = request.current_approval_level || 'leader';
        
        return `
            <tr>
                <td>#${request.id}</td>
                <td>${request.title}</td>
                <td>${request.item ? request.item.item_name : 'N/A'}</td>
                <td>${request.quantity}</td>
                <td>${request.user.name}</td>
                <td>${getApprovalLevelBadge(currentLevel)}</td>
                <td>${getStatusBadge(request.status)}</td>
                <td>${formatDate(request.created_at)}</td>
                <td>
                    <button class="btn btn-secondary" onclick="viewDetail(${request.id})">View</button>
                    ${canApprove && request.status === 'pending' ? `
                        <button class="btn btn-success" onclick="approveRequest(${request.id})">Approve</button>
                        <button class="btn btn-danger" onclick="rejectRequest(${request.id})">Reject</button>
                    ` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

async function viewDetail(id) {
    try {
        const response = await API.requests.getById(id);
        if (response.success) {
            const request = response.data;
            const currentLevel = request.current_approval_level || 'leader';
            
            let detailHTML = `
                <div class="detail-row">
                    <div class="detail-label">Request ID:</div>
                    <div class="detail-value">#${request.id}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Title:</div>
                    <div class="detail-value">${request.title}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Description:</div>
                    <div class="detail-value">${request.description || '-'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Item:</div>
                    <div class="detail-value">${request.item ? request.item.item_name : 'N/A'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Quantity:</div>
                    <div class="detail-value">${request.quantity}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Requestor:</div>
                    <div class="detail-value">${request.user.name}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Overall Status:</div>
                    <div class="detail-value">${getStatusBadge(request.status)}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Created At:</div>
                    <div class="detail-value">${formatDate(request.created_at)}</div>
                </div>
            `;

            // Show current approval level for pending requests
            if (request.status === 'pending') {
                detailHTML += `
                    <div class="current-level-info">
                        <strong>📍 Current Approval Level:</strong> ${getApprovalLevelBadge(currentLevel)}
                    </div>
                `;
            }

            // Approval Progress Timeline
            detailHTML += `
                <div style="margin-top: 20px;">
                    <h3 style="margin-bottom: 10px;">Approval Progress</h3>
                    ${getApprovalProgress(request)}
                </div>
            `;

            // Show rejection info if rejected
            if (request.status === 'rejected') {
                const rejectionReason = request.leader_rejection_reason || 
                                       request.SPV_rejection_reason || 
                                       request.manager_rejection_reason || 
                                       request.rejection_reason;
                const rejectedBy = request.leader_status === 'rejected' ? 'Leader' :
                                  request.SPV_status === 'rejected' ? 'SPV' :
                                  request.manager_status === 'rejected' ? 'Manager' : 'N/A';
                
                detailHTML += `
                    <div class="detail-row" style="background: #fef1f0; padding: 10px; border-radius: 4px; margin-top: 15px;">
                        <div class="detail-label" style="color: #f44336;"><strong>Rejected By:</strong></div>
                        <div class="detail-value">${rejectedBy}</div>
                    </div>
                    <div class="detail-row" style="background: #fef1f0; padding: 10px; border-radius: 4px;">
                        <div class="detail-label" style="color: #f44336;"><strong>Rejection Reason:</strong></div>
                        <div class="detail-value">${rejectionReason || '-'}</div>
                    </div>
                `;
            }
            
            document.getElementById('requestDetail').innerHTML = detailHTML;
            document.getElementById('detailModal').style.display = 'block';
        }
    } catch (error) {
        showAlert('Failed to load request detail: ' + error.message, 'error');
    }
}

async function loadMasterItems() {
    try {
        const response = await API.masterItems.getAll();
        if (response.success) {
            const select = document.getElementById('requestItem');
            select.innerHTML = '<option value="">Select Item</option>' + 
                response.data.map(item => 
                    `<option value="${item.id}">${item.item_name} (${item.item_code})</option>`
                ).join('');
        }
    } catch (error) {
        console.error('Failed to load items:', error);
    }
}

function openRequestModal() {
    document.getElementById('requestForm').reset();
    document.getElementById('requestModal').style.display = 'block';
}

function setupModals() {
    // Request Modal
    const requestModal = document.getElementById('requestModal');
    const requestForm = document.getElementById('requestForm');
    
    document.getElementById('btnCancelRequest').addEventListener('click', () => {
        requestModal.style.display = 'none';
    });

    requestForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const data = {
            title: document.getElementById('requestTitle').value,
            description: document.getElementById('requestDescription').value,
            item_id: document.getElementById('requestItem').value,
            quantity: document.getElementById('requestQuantity').value
        };

        try {
            const response = await API.requests.create(data);
            if (response.success) {
                showAlert('Request created successfully!');
                requestModal.style.display = 'none';
                await loadRequests();
            }
        } catch (error) {
            showAlert('Failed to create request: ' + error.message, 'error');
        }
    });

    // Detail Modal
    const detailModal = document.getElementById('detailModal');
    detailModal.querySelector('.close').addEventListener('click', () => {
        detailModal.style.display = 'none';
    });

    // Approval Modal
    const approvalModal = document.getElementById('approvalModal');
    
    document.getElementById('btnCancelApproval').addEventListener('click', () => {
        approvalModal.style.display = 'none';
    });

    document.getElementById('btnConfirmAction').addEventListener('click', handleApprovalAction);

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === requestModal) requestModal.style.display = 'none';
        if (e.target === detailModal) detailModal.style.display = 'none';
        if (e.target === approvalModal) approvalModal.style.display = 'none';
    });

    // Close buttons
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
}

function approveRequest(id) {
    currentRequestId = id;
    currentAction = 'approve';
    
    const user = auth.getUser();
    const roleName = user.role.toUpperCase();
    
    document.getElementById('approvalTitle').textContent = `Approve Request (${roleName})`;
    document.getElementById('approvalMessage').textContent = 
        `Are you sure you want to approve this request as ${roleName}?`;
    document.getElementById('rejectionReasonGroup').style.display = 'none';
    document.getElementById('approvalModal').style.display = 'block';
}

function rejectRequest(id) {
    currentRequestId = id;
    currentAction = 'reject';
    
    const user = auth.getUser();
    const roleName = user.role.toUpperCase();
    
    document.getElementById('approvalTitle').textContent = `Reject Request (${roleName})`;
    document.getElementById('approvalMessage').textContent = 
        `You are about to reject this request as ${roleName}. Please provide a reason:`;
    document.getElementById('rejectionReasonGroup').style.display = 'block';
    document.getElementById('rejectionReason').value = '';
    document.getElementById('approvalModal').style.display = 'block';
}

async function handleApprovalAction() {
    if (currentAction === 'approve') {
        try {
            const response = await API.requests.approve(currentRequestId);
            if (response.success) {
                showAlert(response.message || 'Request approved successfully!');
                document.getElementById('approvalModal').style.display = 'none';
                await loadRequests();
            }
        } catch (error) {
            showAlert('Failed to approve request: ' + error.message, 'error');
        }
    } else if (currentAction === 'reject') {
        const reason = document.getElementById('rejectionReason').value;
        if (!reason.trim()) {
            showAlert('Please provide a rejection reason', 'error');
            return;
        }
        
        try {
            const response = await API.requests.reject(currentRequestId, reason);
            if (response.success) {
                showAlert(response.message || 'Request rejected successfully!');
                document.getElementById('approvalModal').style.display = 'none';
                await loadRequests();
            }
        } catch (error) {
            showAlert('Failed to reject request: ' + error.message, 'error');
        }
    }
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

console.log('Dashboard.js loaded (Multi-level Approval)');