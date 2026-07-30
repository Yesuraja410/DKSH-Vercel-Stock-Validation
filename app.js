// Global State Object
const state = {
    lazada: null,
    shopee: null,
    tiktok: null,
    excelReport: null,
    reportFilename: null,
    activeMarketplace: null,
    selectedActionFilter: "All",
    searchQuery: "",
    currentPage: 1,
    pageSize: 50
};

// DOM Elements
const elements = {
    form: document.getElementById('validation-form'),
    btnRun: document.getElementById('btn-run'),
    loadingOverlay: document.getElementById('loading-overlay'),
    connectionBadge: document.getElementById('connection-badge'),
    
    // Tab links & panels
    tabLinks: document.querySelectorAll('.tab-link'),
    tabPanels: document.querySelectorAll('.tab-panel'),
    
    // Validation tab elements
    valEmptyState: document.getElementById('validation-empty-state'),
    valResultsArea: document.getElementById('validation-results-area'),
    subTabsContainer: document.getElementById('marketplace-sub-tabs'),
    channelDisplay: document.getElementById('channel-display-container'),
    
    // Downloads tab elements
    dlEmptyState: document.getElementById('download-empty-state'),
    dlActiveState: document.getElementById('download-active-state'),
    reportNameLbl: document.getElementById('report-name-lbl'),
    btnDownloadExcel: document.getElementById('btn-download-excel'),
    
    // Buffer val group
    bufferType: document.getElementById('buffer_type'),
    bufferValGroup: document.getElementById('buffer-val-group'),
    bufferValLabel: document.getElementById('buffer-val-label'),
    bufferValInput: document.getElementById('buffer_val')
};

// Initialize listeners
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initUploaders();
    initBufferToggle();
    initCountryToggle();
    initFormSubmit();
    initDownloadButton();
});

// Country Selector Header Suffix Handler
function initCountryToggle() {
    const countrySelect = document.getElementById('country');
    if (countrySelect) {
        countrySelect.addEventListener('change', (e) => {
            const val = e.target.value;
            document.querySelectorAll('.country-lbl').forEach(lbl => {
                lbl.textContent = val;
            });
        });
    }
}

// 1. Navigation Tab Switching
function initTabs() {
    elements.tabLinks.forEach(link => {
        link.addEventListener('click', () => {
            const tabId = link.getAttribute('data-tab');
            
            // Toggle links active
            elements.tabLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Toggle panels active
            elements.tabPanels.forEach(panel => {
                panel.classList.remove('active');
                if (panel.id === tabId) {
                    panel.classList.add('active');
                }
            });
        });
    });
}

// 2. Drag & Drop Upload Handlers
function initUploaders() {
    const uploaders = document.querySelectorAll('.file-uploader');
    
    uploaders.forEach(uploader => {
        const fieldName = uploader.getAttribute('data-field');
        const dropzone = document.getElementById(`drop-${fieldName}`);
        const fileInput = document.getElementById(`input-${fieldName}`);
        const infoLabel = document.getElementById(`info-${fieldName}`);
        
        // Click to upload trigger
        dropzone.addEventListener('click', () => fileInput.click());
        
        // File selection event
        fileInput.addEventListener('change', () => {
            handleFileSelection(fileInput.files[0], dropzone, infoLabel, uploader);
        });
        
        // Drag events
        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.classList.add('dragover');
            }, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.classList.remove('dragover');
            }, false);
        });
        
        // Drop file event
        dropzone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const file = dt.files[0];
            
            if (file) {
                fileInput.files = dt.files;
                handleFileSelection(file, dropzone, infoLabel, uploader);
            }
        });
    });
}

function handleFileSelection(file, dropzone, infoLabel, uploader) {
    if (file) {
        infoLabel.textContent = `${file.name} (${formatBytes(file.size)})`;
        infoLabel.classList.add('filled');
        dropzone.classList.add('has-file');
        uploader.setAttribute('data-has-file', 'true');
    } else {
        infoLabel.textContent = "No file selected";
        infoLabel.classList.remove('filled');
        dropzone.classList.remove('has-file');
        uploader.removeAttribute('data-has-file');
    }
}

function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// 3. Buffer Toggle Layout
function initBufferToggle() {
    elements.bufferType.addEventListener('change', () => {
        const val = elements.bufferType.value;
        if (val === 'None') {
            elements.bufferValGroup.style.display = 'none';
        } else {
            elements.bufferValGroup.style.display = 'block';
            if (val === 'Inventory Buffer') {
                elements.bufferValLabel.innerHTML = '<i class="fa-solid fa-calculator"></i> REDUCE QUANTITY (QTY)';
                elements.bufferValInput.step = '1';
                elements.bufferValInput.min = '0';
            } else {
                elements.bufferValLabel.innerHTML = '<i class="fa-solid fa-percent"></i> REDUCE PERCENTAGE (%)';
                elements.bufferValInput.step = '0.5';
                elements.bufferValInput.min = '0';
                elements.bufferValInput.max = '100';
            }
        }
    });
}

// 4. Form Submit & Validation Execution
function initFormSubmit() {
    elements.form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Check mandatory fields
        const allFile = document.getElementById('input-all_file').files[0];
        const tcInv = document.getElementById('input-tc_inventory').files[0];
        
        if (!allFile || !tcInv) {
            alert("Please upload the mandatory reference files (TC All File and TC Inventory) first.");
            return;
        }
        
        // Show loading state
        elements.loadingOverlay.style.display = 'flex';
        elements.connectionBadge.className = "badge loading";
        elements.connectionBadge.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processing...';
        
        // Build FormData
        const formData = new FormData();
        formData.append('all_file', allFile);
        formData.append('tc_inventory', tcInv);
        
        const lazada = document.getElementById('input-lazada').files[0];
        if (lazada) formData.append('lazada', lazada);
        
        const shopeeStock = document.getElementById('input-shopee_stock').files[0];
        if (shopeeStock) formData.append('shopee_stock', shopeeStock);
        
        const shopeeStatus = document.getElementById('input-shopee_status').files[0];
        if (shopeeStatus) formData.append('shopee_status', shopeeStatus);
        
        const tiktokActive = document.getElementById('input-tiktok_active').files[0];
        if (tiktokActive) formData.append('tiktok_active', tiktokActive);
        
        const tiktokInactive = document.getElementById('input-tiktok_inactive').files[0];
        if (tiktokInactive) formData.append('tiktok_inactive', tiktokInactive);
        
        formData.append('country', document.getElementById('country').value);
        formData.append('buffer_type', elements.bufferType.value);
        formData.append('buffer_val', elements.bufferValInput.value);
        
        try {
            // Call API
            const response = await fetch('/api/validate', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || "An unknown server error occurred during validation.");
            }
            
            // Populate State
            state.lazada = data.lazada;
            state.shopee = data.shopee;
            state.tiktok = data.tiktok;
            state.excelReport = data.excel_report;
            state.reportFilename = data.report_filename;
            state.selectedActionFilter = "All";
            state.searchQuery = "";
            
            // Toggle Display Panels
            elements.valEmptyState.style.display = 'none';
            elements.valResultsArea.style.display = 'block';
            
            elements.dlEmptyState.style.display = 'none';
            elements.dlActiveState.style.display = 'block';
            elements.reportNameLbl.textContent = state.reportFilename;
            
            // Render sub tabs and select first active channel
            renderMarketplaceSubTabs();
            
        } catch (error) {
            console.error(error);
            alert(`❌ Validation Failed:\n${error.message}`);
        } finally {
            elements.loadingOverlay.style.display = 'none';
            elements.connectionBadge.className = "badge offline";
            elements.connectionBadge.innerHTML = '<i class="fa-solid fa-circle"></i> Ready';
        }
    });
}

// 5. Render Sub Tabs for Channels (Lazada, Shopee, TikTok)
function renderMarketplaceSubTabs() {
    elements.subTabsContainer.innerHTML = '';
    let firstActive = null;
    
    if (state.lazada) {
        createSubTabButton("Lazada", "fa-shopping-bag");
        if (!firstActive) firstActive = "Lazada";
    }
    
    if (state.shopee) {
        createSubTabButton("Shopee", "fa-cubes");
        if (!firstActive) firstActive = "Shopee";
    }
    
    if (state.tiktok) {
        createSubTabButton("TikTok", "fa-tiktok");
        if (!firstActive) firstActive = "TikTok";
    }
    
    if (firstActive) {
        switchMarketplaceTab(firstActive);
    } else {
        elements.channelDisplay.innerHTML = '<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><h3>No Channels Processed</h3><p>Upload Lazada, Shopee, or TikTok files to inspect mismatches.</p></div>';
    }
}

function createSubTabButton(name, icon) {
    const btn = document.createElement('button');
    btn.className = 'sub-tab-link';
    btn.setAttribute('data-channel', name);
    btn.innerHTML = `<i class="fa-solid ${icon}"></i> ${name}`;
    btn.addEventListener('click', () => switchMarketplaceTab(name));
    elements.subTabsContainer.appendChild(btn);
}

function switchMarketplaceTab(channelName) {
    state.activeMarketplace = channelName;
    state.selectedActionFilter = "All";
    state.searchQuery = "";
    state.currentPage = 1;
    
    // Toggle active link styling
    const links = document.querySelectorAll('.sub-tab-link');
    links.forEach(l => {
        if (l.getAttribute('data-channel') === channelName) {
            l.classList.add('active');
        } else {
            l.classList.remove('active');
        }
    });
    
    renderChannelData();
}

// 6. Render Data Cards, Remark metrics and Table grids
function renderChannelData() {
    const channel = state.activeMarketplace;
    const data = channel === "Lazada" ? state.lazada : (channel === "Shopee" ? state.shopee : state.tiktok);
    
    if (!data || data.length === 0) {
        elements.channelDisplay.innerHTML = `<div class="empty-state"><i class="fa-solid fa-inbox"></i><h3>Empty Results</h3><p>No mismatch records were found for ${channel}.</p></div>`;
        return;
    }
    
    const mpLabel = channel;
    const mpStockCol = `MP Stock (${channel})`;
    const mpStatusCol = `MP Status (${channel})`;
    
    // Tally totals
    const totalRecords = data.length;
    const allGoodCount = data.filter(r => r['Action Required'] === 'All Good').length;
    const mismatchCount = totalRecords - allGoodCount;
    
    // Tally Action Required counts
    const actionCounts = {};
    data.forEach(r => {
        const action = r['Action Required'] || 'Unknown';
        actionCounts[action] = (actionCounts[action] || 0) + 1;
    });
    
    // Create metric summaries layout
    let metricsHtml = `
        <div class="metric-summary-grid">
            <div class="metric-card total">
                <span class="metric-val">${totalRecords}</span>
                <span class="metric-lbl">Total items validated</span>
            </div>
            <div class="metric-card matched">
                <span class="metric-val" style="color: var(--green);">${allGoodCount}</span>
                <span class="metric-lbl">All Good (Matched)</span>
            </div>
            <div class="metric-card mismatch">
                <span class="metric-val" style="color: var(--red);">${mismatchCount}</span>
                <span class="metric-lbl">Mismatches (Action)</span>
            </div>
        </div>
    `;
    
    // Remarks Grid
    metricsHtml += `<div class="remarks-summary-title">Summary of Remarks</div><div class="remarks-grid">`;
    for (const [remark, val] of Object.entries(actionCounts)) {
        metricsHtml += `
            <div class="remark-metric">
                <span class="remark-val">${val}</span>
                <span class="remark-lbl">${remark}</span>
            </div>
        `;
    }
    metricsHtml += `</div>`;
    
    // Filter controls
    const uniqueActions = ["All", ...new Set(data.map(r => r['Action Required']).filter(Boolean))];
    let filterOptionsHtml = uniqueActions.map(a => `<option value="${a}" ${state.selectedActionFilter === a ? 'selected' : ''}>${a}</option>`).join('');
    
    metricsHtml += `
        <div class="grid-controls">
            <div class="search-wrapper">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input type="text" id="grid-search" placeholder="Search by SKU or Product ID..." value="${state.searchQuery}">
            </div>
            <div class="filter-wrapper">
                <span>Filter Remarks:</span>
                <select id="grid-filter-action">
                    ${filterOptionsHtml}
                </select>
            </div>
        </div>
    `;
    
    // Table frame
    metricsHtml += `
        <div class="table-container">
            <table class="data-table" id="validation-data-table">
                <thead>
                    <tr>
                        <th>Product ID</th>
                        <th>SKU</th>
                        <th>MP Status</th>
                        <th>TC Status</th>
                        <th>Status Check</th>
                        <th>MP Stock</th>
                        <th>TC Stock</th>
                        <th>Reserved</th>
                        <th>Max 0</th>
                        <th>Stock Check</th>
                        <th>QTY Diff</th>
                        <th>Action Required</th>
                    </tr>
                </thead>
                <tbody id="table-rows-body">
                    <!-- Rows rendered dynamically -->
                </tbody>
            </table>
        </div>
        <div class="pagination-controls" id="pagination-controls-area"></div>
    `;
    
    elements.channelDisplay.innerHTML = metricsHtml;
    
    // Render rows and bind grid input listeners
    renderGridRows();
    bindGridControls();
}

function renderGridRows() {
    const channel = state.activeMarketplace;
    const data = channel === "Lazada" ? state.lazada : (channel === "Shopee" ? state.shopee : state.tiktok);
    const tbody = document.getElementById('table-rows-body');
    const paginationContainer = document.getElementById('pagination-controls-area');
    
    if (!tbody || !data) return;
    
    const mpStatusCol = `MP Status (${channel})`;
    const mpStockCol = `MP Stock (${channel})`;
    
    // Filter data
    const filtered = data.filter(row => {
        // 1. Search Query filter (matches SKU or Product ID)
        const q = state.searchQuery.toLowerCase();
        const skuMatch = String(row['SKU'] || '').toLowerCase().includes(q);
        const pidMatch = String(row['Product ID'] || '').toLowerCase().includes(q);
        const searchPass = !q || skuMatch || pidMatch;
        
        // 2. Action dropdown filter
        const actionPass = state.selectedActionFilter === "All" || row['Action Required'] === state.selectedActionFilter;
        
        return searchPass && actionPass;
    });
    
    // Pagination calculations
    const totalRecords = filtered.length;
    const totalPages = Math.ceil(totalRecords / state.pageSize) || 1;
    
    // Bounds check
    if (state.currentPage > totalPages) {
        state.currentPage = totalPages;
    }
    if (state.currentPage < 1) {
        state.currentPage = 1;
    }
    
    // Slice data
    const startIdx = (state.currentPage - 1) * state.pageSize;
    const endIdx = startIdx + state.pageSize;
    const pageData = filtered.slice(startIdx, endIdx);
    
    if (pageData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="12" style="padding: 20px; font-style: italic; color: var(--text-secondary);">No records match the active search/filters.</td></tr>`;
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }
    
    tbody.innerHTML = pageData.map(row => {
        const isGood = row['Action Required'] === 'All Good';
        const actionBadgeClass = isGood ? 'table-badge good' : 'table-badge action';
        
        const statusOk = row['Status Check'] === true || String(row['Status Check']).toLowerCase() === 'true';
        const statusBadgeClass = statusOk ? 'table-badge status-ok' : 'table-badge status-mismatch';
        
        const stockOk = row['Stock Check'] === true || String(row['Stock Check']).toLowerCase() === 'true';
        const stockBadgeClass = stockOk ? 'table-badge status-ok' : 'table-badge status-mismatch';
        
        return `
            <tr>
                <td style="font-weight: 500;">${row['Product ID'] || '-'}</td>
                <td style="text-align: left; font-family: monospace;">${row['SKU'] || '-'}</td>
                <td>${row[mpStatusCol] || '-'}</td>
                <td>${row['TC Status'] || '-'}</td>
                <td><span class="${statusBadgeClass}">${statusOk ? 'OK' : 'MISMATCH'}</span></td>
                <td>${row[mpStockCol] !== undefined ? row[mpStockCol] : '-'}</td>
                <td>${row['TC Stock'] !== undefined ? row['TC Stock'] : '-'}</td>
                <td>${row['Reserved Stock'] !== undefined ? row['Reserved Stock'] : '-'}</td>
                <td>${row['Max 0'] || 'No'}</td>
                <td><span class="${stockBadgeClass}">${stockOk ? 'MATCH' : 'MISMATCH'}</span></td>
                <td style="font-weight: 600;">${row['QTY Difference'] !== undefined ? row['QTY Difference'] : '-'}</td>
                <td><span class="${actionBadgeClass}">${row['Action Required'] || '-'}</span></td>
            </tr>
        `;
    }).join('');
    
    // Render pagination controls
    if (paginationContainer) {
        paginationContainer.innerHTML = `
            <button id="btn-prev-page" class="btn-page" ${state.currentPage === 1 ? 'disabled' : ''}>
                <i class="fa-solid fa-chevron-left"></i> Prev
            </button>
            <span id="page-info">Page ${state.currentPage} of ${totalPages}</span>
            <button id="btn-next-page" class="btn-page" ${state.currentPage === totalPages ? 'disabled' : ''}>
                Next <i class="fa-solid fa-chevron-right"></i>
            </button>
        `;
        
        // Bind button clicks
        document.getElementById('btn-prev-page').addEventListener('click', () => {
            if (state.currentPage > 1) {
                state.currentPage--;
                renderGridRows();
            }
        });
        
        document.getElementById('btn-next-page').addEventListener('click', () => {
            if (state.currentPage < totalPages) {
                state.currentPage++;
                renderGridRows();
            }
        });
    }
}

function bindGridControls() {
    const searchInput = document.getElementById('grid-search');
    const filterSelect = document.getElementById('grid-filter-action');
    
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            state.searchQuery = searchInput.value;
            state.currentPage = 1;
            renderGridRows();
        });
    }
    
    if (filterSelect) {
        filterSelect.addEventListener('change', () => {
            state.selectedActionFilter = filterSelect.value;
            state.currentPage = 1;
            renderGridRows();
        });
    }
}

// 7. Excel Download Handler
function initDownloadButton() {
    elements.btnDownloadExcel.addEventListener('click', () => {
        if (!state.excelReport) return;
        
        // Decode base64 string to Blob bytes
        const byteCharacters = atob(state.excelReport);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        // Trigger browser anchor download
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = state.reportFilename || "DKSH_Validation_Report.xlsx";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}
