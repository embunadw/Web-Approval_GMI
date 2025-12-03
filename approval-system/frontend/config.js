// config.js 

const CONFIG = {
    API_BASE_URL: 'http://127.0.0.1:8000/api',
    TOKEN_KEY: 'auth_token',
    USER_KEY: 'user_data'
};

console.log('Config loaded:', CONFIG);

// Fungsi Helper 
const storage = {
    set: (key, value) => {
        localStorage.setItem(key, JSON.stringify(value));
    },
    get: (key) => {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    },
    remove: (key) => {
        localStorage.removeItem(key);
    },
    clear: () => {
        localStorage.clear();
    }
};

const auth = {
    getToken: () => storage.get(CONFIG.TOKEN_KEY),
    setToken: (token) => storage.set(CONFIG.TOKEN_KEY, token),
    getUser: () => storage.get(CONFIG.USER_KEY),
    setUser: (user) => storage.set(CONFIG.USER_KEY, user),
    logout: () => {
        storage.clear();
        window.location.href = 'index.html';
    },
    isAuthenticated: () => !!auth.getToken(),
    
    // UPDATED: Role check fungsi
    isUser: () => {
        const user = auth.getUser();
        return user && user.role === 'user';
    },
    isLeader: () => {
        const user = auth.getUser();
        return user && user.role === 'leader';
    },
    isspv: () => {
        const user = auth.getUser();
        return user && user.role === 'spv';
    },
    isManager: () => {
        const user = auth.getUser();
        return user && user.role === 'manager';
    },
    getRole: () => {
        const user = auth.getUser();
        return user ? user.role : null;
    }
};

// Check authentication
const checkAuth = () => {
    if (!auth.isAuthenticated()) {
        window.location.href = 'index.html';
    }
};

// Utility functions
const showError = (elementId, message) => {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.classList.add('show');
        setTimeout(() => {
            element.classList.remove('show');
        }, 5000);
    }
};

const showAlert = (message, type = 'success') => {
    const alertDiv = document.createElement('div');
    alertDiv.className = type === 'success' ? 'success-message' : 'error-message show';
    alertDiv.textContent = message;
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '20px';
    alertDiv.style.right = '20px';
    alertDiv.style.zIndex = '9999';
    alertDiv.style.minWidth = '300px';
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// UPDATED: Status badge dengan support multi-level
const getStatusBadge = (status) => {
    const badges = {
        pending: '<span class="badge pending">Pending</span>',
        approved: '<span class="badge approved">Approved</span>',
        rejected: '<span class="badge rejected">Rejected</span>'
    };
    return badges[status] || status;
};

// UPDATED: Role badge dengan SPV dan Manager
const getRoleBadge = (role) => {
    const badges = {
        user: '<span class="badge user">User</span>',
        leader: '<span class="badge leader">Leader</span>',
        spv: '<span class="badge spv">SPV</span>',
        manager: '<span class="badge manager">Manager</span>'
    };
    return badges[role] || role;
};

// NEW: Get approval level badge
const getApprovalLevelBadge = (level) => {
    const badges = {
        leader: '<span class="badge-level leader-level">Leader Review</span>',
        spv: '<span class="badge-level spv-level">spv Review</span>',
        manager: '<span class="badge-level manager-level">Manager Review</span>',
        completed: '<span class="badge-level completed-level">Completed</span>'
    };
    return badges[level] || level;
};


const getApprovalProgress = (request) => {
    const steps = [
        {
            name: 'Leader',
            status: request.leader_status || 'pending',
            approver: request.leader_approver?.name,
            date: request.leader_approved_at
        },
        {
            name: 'spv',
            status: request.spv_status || 'pending',
            approver: request.spv_approver?.name,
            date: request.spv_approved_at
        },
        {
            name: 'Manager',
            status: request.manager_status || 'pending',
            approver: request.manager_approver?.name,
            date: request.manager_approved_at
        }
    ];

    let html = '<div class="approval-progress">';
    
    steps.forEach((step, index) => {
        const isActive = request.current_approval_level === step.name.toLowerCase();
        const statusClass = step.status || 'pending';
        const activeClass = isActive ? 'active' : '';
        
        html += `
            <div class="approval-step ${statusClass} ${activeClass}">
                <div class="step-header">
                    <span class="step-number">${index + 1}</span>
                    <span class="step-name">${step.name}</span>
                </div>
                <div class="step-status">
                    ${getStatusBadge(step.status || 'pending')}
                </div>
                ${step.approver ? `
                    <div class="step-approver">
                        <small>by ${step.approver}</small>
                    </div>
                ` : ''}
                ${step.date ? `
                    <div class="step-date">
                        <small>${formatDate(step.date)}</small>
                    </div>
                ` : ''}
            </div>
        `;
        
        if (index < steps.length - 1) {
            html += '<div class="step-arrow">→</div>';
        }
    });
    
    html += '</div>';
    return html;
};

// NEW: cek kalo user bisa approve request
const canApproveRequest = (request) => {
    const user = auth.getUser();
    if (!user) return false;

    const role = user.role;
    const currentLevel = request.current_approval_level;

    if (role === 'leader' && currentLevel === 'leader') return true;
    if (role === 'spv' && currentLevel === 'spv') return true;
    if (role === 'manager' && currentLevel === 'manager') return true;

    return false;
};

console.log('All config functions loaded (Multi-level support)');