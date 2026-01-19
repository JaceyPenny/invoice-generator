// Initialize invoice on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeInvoice();
    setupEventListeners();
    updateAddressBookUI();
});

// Initialize invoice number and date
function initializeInvoice() {
    // Set invoice date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('invoiceDate').value = today;

    // Initialize invoice number from localStorage
    let invoiceNumber = localStorage.getItem('lastInvoiceNumber');
    if (invoiceNumber === null) {
        invoiceNumber = 1;
    } else {
        invoiceNumber = parseInt(invoiceNumber) + 1;
    }
    localStorage.setItem('lastInvoiceNumber', invoiceNumber.toString());
    document.getElementById('invoiceNumber').value = invoiceNumber;

    // Load my information from localStorage (empty on first load)
    const savedMyName = localStorage.getItem('myName');
    const savedMyAddress = localStorage.getItem('myAddress');
    if (savedMyName) {
        document.getElementById('myName').value = savedMyName;
    }
    if (savedMyAddress) {
        document.getElementById('myAddress').value = savedMyAddress;
    }

    // Add first item row
    addItemRow();
}

// Setup event listeners
function setupEventListeners() {
    // Add item button
    document.getElementById('addItemBtn').addEventListener('click', addItemRow);

    // Print/PDF button
    document.getElementById('printBtn').addEventListener('click', generatePDF);

    // Clear form button
    document.getElementById('clearBtn').addEventListener('click', function() {
        if (confirm('Are you sure you want to clear the form? This will not reset the invoice number.')) {
            document.getElementById('invoiceForm').reset();
            // Clear items table
            document.getElementById('itemsTableBody').innerHTML = '';
            // Clear address book selection
            document.getElementById('addressBookSelect').value = '';
            // Reinitialize
            initializeInvoice();
        }
    });

    // Address book select
    const addressBookSelect = document.getElementById('addressBookSelect');
    if (addressBookSelect) {
        addressBookSelect.addEventListener('change', function() {
            const selectedName = this.value;
            if (selectedName) {
                const addressData = loadClientAddress(selectedName);
                if (addressData) {
                    fillClientForm(addressData);
                }
            }
        });
    }

    // Save my name and address to localStorage when changed
    const myNameInput = document.getElementById('myName');
    const myAddressInput = document.getElementById('myAddress');
    
    if (myNameInput) {
        myNameInput.addEventListener('input', function() {
            localStorage.setItem('myName', this.value);
        });
        myNameInput.addEventListener('blur', function() {
            localStorage.setItem('myName', this.value);
        });
    }
    
    if (myAddressInput) {
        myAddressInput.addEventListener('input', function() {
            localStorage.setItem('myAddress', this.value);
        });
        myAddressInput.addEventListener('blur', function() {
            localStorage.setItem('myAddress', this.value);
        });
    }
}

// Add a new item row to the table
function addItemRow() {
    const tbody = document.getElementById('itemsTableBody');
    const row = document.createElement('tr');
    
    row.innerHTML = `
        <td><input type="text" class="item-description" placeholder="Item description"></td>
        <td><input type="number" class="item-qty" min="0" step="0.01" value="1" placeholder="Qty"></td>
        <td><input type="number" class="item-unit-price" min="0" step="0.01" value="0.00" placeholder="0.00"></td>
        <td class="item-total">$0.00</td>
        <td><button type="button" class="remove-btn">Remove</button></td>
    `;
    
    tbody.appendChild(row);
    
    // Add event listeners to the new row
    const qtyInput = row.querySelector('.item-qty');
    const unitPriceInput = row.querySelector('.item-unit-price');
    const removeBtn = row.querySelector('.remove-btn');
    
    qtyInput.addEventListener('input', calculateItemTotal);
    unitPriceInput.addEventListener('input', calculateItemTotal);
    removeBtn.addEventListener('click', function() {
        row.remove();
        calculateBalanceDue();
    });
    
    // Calculate initial total
    calculateItemTotal.call(qtyInput);
}

// Calculate total for a single item
function calculateItemTotal() {
    const row = this.closest('tr');
    const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
    const unitPrice = parseFloat(row.querySelector('.item-unit-price').value) || 0;
    const total = qty * unitPrice;
    
    row.querySelector('.item-total').textContent = formatCurrency(total);
    
    // Update balance due
    calculateBalanceDue();
}

// Calculate total balance due (sum of all items)
function calculateBalanceDue() {
    const rows = document.querySelectorAll('#itemsTableBody tr');
    let total = 0;
    
    rows.forEach(row => {
        const totalText = row.querySelector('.item-total').textContent;
        const value = parseFloat(totalText.replace(/[^0-9.-]/g, '')) || 0;
        total += value;
    });
    
    document.getElementById('balanceDue').textContent = formatCurrency(total);
}

// Format number as currency
function formatCurrency(amount) {
    return '$' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Generate PDF invoice
function generatePDF() {
    // Validate form
    const form = document.getElementById('invoiceForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    // Get all form values
    const myName = document.getElementById('myName').value;
    const myAddress = document.getElementById('myAddress').value;
    const invoiceDate = document.getElementById('invoiceDate').value;
    const invoiceNumber = document.getElementById('invoiceNumber').value;
    const clientName = document.getElementById('clientName').value;
    const clientCompany = document.getElementById('clientCompany').value;
    const clientAddress = document.getElementById('clientAddress').value;
    const clientPhone = document.getElementById('clientPhone').value;
    const clientEmail = document.getElementById('clientEmail').value;
    const balanceDue = document.getElementById('balanceDue').textContent;

    // Format date
    const dateObj = new Date(invoiceDate);
    const formattedDate = dateObj.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    // Verify html2pdf is loaded
    if (typeof html2pdf === 'undefined') {
        alert('PDF library not loaded. Please refresh the page and try again.');
        return;
    }

    // Build items HTML
    let itemsHTML = '';
    const rows = document.querySelectorAll('#itemsTableBody tr');
    rows.forEach(row => {
        const description = row.querySelector('.item-description').value || '';
        const qty = row.querySelector('.item-qty').value || '0';
        const unitPrice = parseFloat(row.querySelector('.item-unit-price').value) || 0;
        const total = parseFloat(row.querySelector('.item-total').textContent.replace(/[^0-9.-]/g, '')) || 0;
        
        if (description.trim() || qty !== '0' || unitPrice !== 0) {
            itemsHTML += `
                <tr>
                    <td>${escapeHtml(description)}</td>
                    <td style="text-align: right;">${qty}</td>
                    <td style="text-align: right;">${formatCurrency(unitPrice)}</td>
                    <td style="text-align: right;">${formatCurrency(total)}</td>
                </tr>
            `;
        }
    });

    // Create a temporary visible element for PDF generation
    const tempDiv = document.createElement('div');
    tempDiv.id = 'temp-pdf-container';
    // Position at top-left of viewport for proper capture
    tempDiv.style.position = 'fixed';
    tempDiv.style.left = '0px';
    tempDiv.style.top = '0px';
    tempDiv.style.width = '816px'; // 8.5in at 96 DPI
    tempDiv.style.height = 'auto';
    tempDiv.style.backgroundColor = '#ffffff';
    tempDiv.style.overflow = 'visible';
    tempDiv.style.zIndex = '-1'; // Behind everything
    tempDiv.style.pointerEvents = 'none'; // Don't interfere with user interaction
    
    tempDiv.innerHTML = `
        <div class="invoice-pdf" style="width: 816px; min-height: 1056px; padding: 72px; background: white; color: #333; box-sizing: border-box; margin: 0;">
            <div class="invoice-header">
                <div class="invoice-title">INVOICE</div>
                <div class="invoice-meta">
                    <div><strong>Invoice #:</strong> <span>${escapeHtml(invoiceNumber)}</span></div>
                    <div><strong>Date:</strong> <span>${escapeHtml(formattedDate)}</span></div>
                </div>
            </div>
            
            <div class="invoice-addresses">
                <div class="invoice-from">
                    <div class="address-label">From:</div>
                    <div class="address-name">${escapeHtml(myName)}</div>
                    <div class="address-details">${formatMultilineAddress(myAddress)}</div>
                </div>
                <div class="invoice-to">
                    <div class="address-label">Bill To:</div>
                    <div class="address-name">${escapeHtml(clientName)}</div>
                    ${clientCompany ? `<div class="address-company">${escapeHtml(clientCompany)}</div>` : ''}
                    <div class="address-details">${formatMultilineAddress(clientAddress)}</div>
                    ${formatContactInfo(clientPhone, clientEmail)}
                </div>
            </div>
            
            <table class="invoice-items-table">
                <thead>
                    <tr>
                        <th class="col-desc">Description</th>
                        <th class="col-qty">Qty</th>
                        <th class="col-price">Unit Price</th>
                        <th class="col-total">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHTML}
                </tbody>
            </table>
            
            <div class="invoice-footer">
                <div class="invoice-total">
                    <div class="total-row">
                        <span class="total-label">Balance Due:</span>
                        <span class="total-amount">${escapeHtml(balanceDue)}</span>
                    </div>
                </div>
                <div class="invoice-payment">
                    <strong>Payment Instructions:</strong> Due upon receipt
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(tempDiv);
    
    // Wait for rendering and ensure layout is calculated
    setTimeout(() => {
        const targetElement = tempDiv.querySelector('.invoice-pdf');
        
        // Force layout calculation
        void targetElement.offsetHeight;
        void tempDiv.offsetHeight;
        
        // Get bounding rect to ensure we capture from top
        const rect = targetElement.getBoundingClientRect();
        const contentHeight = Math.ceil(Math.max(rect.height, targetElement.scrollHeight, 1056));
        const contentWidth = 816; // 8.5in at 96 DPI
        
        console.log('Element position:', rect.left, rect.top, 'Size:', rect.width, rect.height);
        console.log('Content dimensions:', contentWidth, 'x', contentHeight);
        console.log('Scroll position:', window.scrollX, window.scrollY);
        
        // Configure PDF options - simplified
        const opt = {
            margin: [0, 0, 0, 0],
            filename: `Invoice_${invoiceNumber}_${invoiceDate}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2,
                useCORS: true,
                letterRendering: false, // Try false for better compatibility
                logging: true, // Enable to see what's happening
                backgroundColor: '#ffffff',
                removeContainer: false,
                scrollX: -rect.left,
                scrollY: -rect.top,
                width: contentWidth,
                height: contentHeight,
                windowWidth: contentWidth,
                windowHeight: contentHeight,
                x: 0,
                y: 0
            },
            jsPDF: { 
                unit: 'in', 
                format: 'letter', 
                orientation: 'portrait'
            }
        };

        // Use the promise-based API with proper error handling
        const worker = html2pdf().set(opt).from(targetElement);
        
        worker.save().then(() => {
            // Remove temporary element
            if (document.body.contains(tempDiv)) {
                document.body.removeChild(tempDiv);
            }
            console.log('PDF generated successfully');
            
            // Save my name and address to localStorage after successful PDF generation
            if (myName) {
                localStorage.setItem('myName', myName);
            }
            if (myAddress) {
                localStorage.setItem('myAddress', myAddress);
            }
            
            // Save client address to address book after successful PDF generation
            if (clientName && clientAddress) {
                saveClientAddress(clientName, {
                    name: clientName,
                    company: clientCompany,
                    address: clientAddress,
                    phone: clientPhone,
                    email: clientEmail
                });
            }
        }).catch((error) => {
            // Remove temporary element
            if (document.body.contains(tempDiv)) {
                document.body.removeChild(tempDiv);
            }
            console.error('Error generating PDF:', error);
            alert('Error generating PDF: ' + (error.message || 'Unknown error'));
        });
    }, 300);
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Helper function to format multiline address with proper <br> tags
function formatMultilineAddress(address) {
    if (!address) return '';
    return escapeHtml(address).replace(/\n/g, '<br>');
}

// Helper function to format contact info with phone and email on separate lines
function formatContactInfo(phone, email) {
    let html = '';
    if (phone || email) {
        html = '<div class="address-contact">';
        if (phone) {
            html += `<div>Phone: ${escapeHtml(phone)}</div>`;
        }
        if (email) {
            html += `<div>Email: ${escapeHtml(email)}</div>`;
        }
        html += '</div>';
    }
    return html;
}

// Address book functions
function saveClientAddress(clientName, addressData) {
    try {
        const addressBook = getAddressBook();
        addressBook[clientName] = addressData;
        localStorage.setItem('clientAddressBook', JSON.stringify(addressBook));
        updateAddressBookUI();
    } catch (error) {
        console.error('Error saving address:', error);
    }
}

function getAddressBook() {
    try {
        const stored = localStorage.getItem('clientAddressBook');
        return stored ? JSON.parse(stored) : {};
    } catch (error) {
        console.error('Error reading address book:', error);
        return {};
    }
}

function loadClientAddress(clientName) {
    const addressBook = getAddressBook();
    return addressBook[clientName] || null;
}

function updateAddressBookUI() {
    const addressBook = getAddressBook();
    const select = document.getElementById('addressBookSelect');
    if (!select) return;
    
    // Clear existing options except the first one
    select.innerHTML = '<option value="">Select a saved address...</option>';
    
    // Add saved addresses
    Object.keys(addressBook).sort().forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
    });
}

function fillClientForm(addressData) {
    if (!addressData) return;
    
    document.getElementById('clientName').value = addressData.name || '';
    document.getElementById('clientCompany').value = addressData.company || '';
    document.getElementById('clientAddress').value = addressData.address || '';
    document.getElementById('clientPhone').value = addressData.phone || '';
    document.getElementById('clientEmail').value = addressData.email || '';
}
