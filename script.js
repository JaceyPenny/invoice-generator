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

    // Display the last invoice number (don't increment yet)
    let invoiceNumber = localStorage.getItem('lastInvoiceNumber');
    if (invoiceNumber === null) {
        invoiceNumber = 1;
    } else {
        invoiceNumber = parseInt(invoiceNumber);
    }
    document.getElementById('invoiceNumber').value = invoiceNumber;

    // Load my information from localStorage (empty on first load)
    const savedMyName = localStorage.getItem('myName');
    const savedMyAddress = localStorage.getItem('myAddress');
    const savedMyPhone = localStorage.getItem('myPhone');
    const savedMyEmail = localStorage.getItem('myEmail');
    const savedChecksPayableName = localStorage.getItem('checksPayableName');
    if (savedMyName) {
        document.getElementById('myName').value = savedMyName;
    }
    if (savedMyAddress) {
        document.getElementById('myAddress').value = savedMyAddress;
    }
    if (savedMyPhone) {
        document.getElementById('myPhone').value = savedMyPhone;
    }
    if (savedMyEmail) {
        document.getElementById('myEmail').value = savedMyEmail;
    }
    if (savedChecksPayableName) {
        document.getElementById('checksPayableName').value = savedChecksPayableName;
    }

    // Add one empty item row to start
    addItemRow();
}

// Setup event listeners
function setupEventListeners() {
    // Add item button
    document.getElementById('addItemBtn').addEventListener('click', function() {
        addItemRow();
    });

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

    // Save my name, address, phone, email, and checks payable name to localStorage when changed
    const myNameInput = document.getElementById('myName');
    const myAddressInput = document.getElementById('myAddress');
    const myPhoneInput = document.getElementById('myPhone');
    const myEmailInput = document.getElementById('myEmail');
    const checksPayableNameInput = document.getElementById('checksPayableName');
    
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

    if (myPhoneInput) {
        myPhoneInput.addEventListener('input', function() {
            localStorage.setItem('myPhone', this.value);
        });
        myPhoneInput.addEventListener('blur', function() {
            localStorage.setItem('myPhone', this.value);
        });
    }

    if (myEmailInput) {
        myEmailInput.addEventListener('input', function() {
            localStorage.setItem('myEmail', this.value);
        });
        myEmailInput.addEventListener('blur', function() {
            localStorage.setItem('myEmail', this.value);
        });
    }

    if (checksPayableNameInput) {
        checksPayableNameInput.addEventListener('input', function() {
            localStorage.setItem('checksPayableName', this.value);
        });
        checksPayableNameInput.addEventListener('blur', function() {
            localStorage.setItem('checksPayableName', this.value);
        });
    }

    // Save invoice number to localStorage when manually changed
    const invoiceNumberInput = document.getElementById('invoiceNumber');
    if (invoiceNumberInput) {
        invoiceNumberInput.addEventListener('blur', function() {
            const value = parseInt(this.value);
            if (!isNaN(value) && value > 0) {
                localStorage.setItem('lastInvoiceNumber', value.toString());
            }
        });
    }

    // Address book management modal
    const manageAddressesBtn = document.getElementById('manageAddressesBtn');
    const addressBookModal = document.getElementById('addressBookModal');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const modalCancelBtn = document.getElementById('modalCancelBtn');
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');

    if (manageAddressesBtn) {
        manageAddressesBtn.addEventListener('click', openAddressBookModal);
    }

    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeAddressBookModal);
    }

    if (modalCancelBtn) {
        modalCancelBtn.addEventListener('click', closeAddressBookModal);
    }

    if (deleteSelectedBtn) {
        deleteSelectedBtn.addEventListener('click', deleteSelectedAddresses);
    }

    // Close modal when clicking outside
    if (addressBookModal) {
        addressBookModal.addEventListener('click', function(e) {
            if (e.target === addressBookModal) {
                closeAddressBookModal();
            }
        });
    }

    // Close modal on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (addressBookModal && addressBookModal.classList.contains('show')) {
                closeAddressBookModal();
            }
            const prefillModal = document.getElementById('prefillItemsModal');
            if (prefillModal && prefillModal.classList.contains('show')) {
                closePrefillItemsModal();
            }
            const copyModal = document.getElementById('prefillCopyModal');
            if (copyModal && copyModal.classList.contains('show')) {
                closePrefillCopyModal();
            }
        }
    });

    // Pre-fill items modal
    const prefillItemsBtn = document.getElementById('prefillItemsBtn');
    const prefillItemsModal = document.getElementById('prefillItemsModal');
    const prefillModalCloseBtn = document.getElementById('prefillModalCloseBtn');
    const prefillCancelBtn = document.getElementById('prefillCancelBtn');
    const prefillApplyBtn = document.getElementById('prefillApplyBtn');

    if (prefillItemsBtn) {
        prefillItemsBtn.addEventListener('click', openPrefillItemsModal);
    }

    if (prefillModalCloseBtn) {
        prefillModalCloseBtn.addEventListener('click', closePrefillItemsModal);
    }

    if (prefillCancelBtn) {
        prefillCancelBtn.addEventListener('click', closePrefillItemsModal);
    }

    if (prefillApplyBtn) {
        prefillApplyBtn.addEventListener('click', applyPrefillItems);
    }

    // Close pre-fill modal when clicking outside
    if (prefillItemsModal) {
        prefillItemsModal.addEventListener('click', function(e) {
            if (e.target === prefillItemsModal) {
                closePrefillItemsModal();
            }
        });
    }

    // Pre-fill copy modal
    const prefillCopyBtn = document.getElementById('prefillCopyBtn');
    const prefillCopyModal = document.getElementById('prefillCopyModal');
    const copyModalCloseBtn = document.getElementById('copyModalCloseBtn');
    const copyCancelBtn = document.getElementById('copyCancelBtn');
    const copyApplyBtn = document.getElementById('copyApplyBtn');

    if (prefillCopyBtn) {
        prefillCopyBtn.addEventListener('click', openPrefillCopyModal);
    }

    if (copyModalCloseBtn) {
        copyModalCloseBtn.addEventListener('click', closePrefillCopyModal);
    }

    if (copyCancelBtn) {
        copyCancelBtn.addEventListener('click', closePrefillCopyModal);
    }

    if (copyApplyBtn) {
        copyApplyBtn.addEventListener('click', applyPrefillCopyItems);
    }

    // Close copy modal when clicking outside
    if (prefillCopyModal) {
        prefillCopyModal.addEventListener('click', function(e) {
            if (e.target === prefillCopyModal) {
                closePrefillCopyModal();
            }
        });
    }
}

// Add a new item row to the table
function addItemRow(description = '', qty = 1, unitPrice = 0.00) {
    const tbody = document.getElementById('itemsTableBody');
    const row = document.createElement('tr');
    row.draggable = false; // Only drag handle should initiate drag
    row.classList.add('draggable-row');
    
    // Escape HTML for the description value attribute
    const escapedDescription = description.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    
    row.innerHTML = `
        <td class="drag-handle" title="Drag to reorder">⋮⋮</td>
        <td><input type="text" class="item-description" placeholder="Item description" value="${escapedDescription}"></td>
        <td><input type="number" class="item-qty" min="0" step="0.01" value="${qty}" placeholder="Qty"></td>
        <td><input type="number" class="item-unit-price" min="0" step="0.01" value="${unitPrice}" placeholder="0.00"></td>
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
    
    // Set up drag and drop
    setupDragAndDrop(row);
    
    // Calculate initial total
    calculateItemTotal.call(qtyInput);
}

// Global variable to track the dragged row
let draggedRow = null;

// Setup drag and drop for a row
function setupDragAndDrop(row) {
    const dragHandle = row.querySelector('.drag-handle');
    
    // Only enable dragging when mousedown on drag handle
    if (dragHandle) {
        dragHandle.addEventListener('mousedown', function(e) {
            row.draggable = true;
        });
        
        // Disable dragging on mouseup on the handle (click without drag)
        dragHandle.addEventListener('mouseup', function(e) {
            row.draggable = false;
        });
    }
    
    row.addEventListener('dragstart', function(e) {
        draggedRow = this;
        this.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);
    });
    
    row.addEventListener('dragend', function(e) {
        this.classList.remove('dragging');
        this.draggable = false; // Disable dragging after drop
        // Remove all drag-over classes
        document.querySelectorAll('#itemsTableBody tr').forEach(r => {
            r.classList.remove('drag-over');
        });
        draggedRow = null;
    });
    
    row.addEventListener('dragover', function(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        e.dataTransfer.dropEffect = 'move';
        
        if (draggedRow && this !== draggedRow) {
            const tbody = this.parentElement;
            const rows = Array.from(tbody.querySelectorAll('tr'));
            const draggedIndex = rows.indexOf(draggedRow);
            const targetIndex = rows.indexOf(this);
            
            if (draggedIndex < targetIndex) {
                tbody.insertBefore(draggedRow, this.nextSibling);
            } else {
                tbody.insertBefore(draggedRow, this);
            }
        }
        return false;
    });
    
    row.addEventListener('dragenter', function(e) {
        if (this !== draggedRow) {
            this.classList.add('drag-over');
        }
    });
    
    row.addEventListener('dragleave', function(e) {
        this.classList.remove('drag-over');
    });
    
    row.addEventListener('drop', function(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }
        this.classList.remove('drag-over');
        return false;
    });
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

    // Get the current invoice number from the field (may have been manually set)
    let invoiceNumber = parseInt(document.getElementById('invoiceNumber').value);
    
    // Validate the invoice number
    if (isNaN(invoiceNumber) || invoiceNumber < 1) {
        // If invalid, get from localStorage or default to 1
        const storedNumber = localStorage.getItem('lastInvoiceNumber');
        invoiceNumber = storedNumber ? parseInt(storedNumber) : 1;
        document.getElementById('invoiceNumber').value = invoiceNumber;
    }
    
    // Use this number for the PDF (don't increment yet - increment after successful generation)

    // Get all form values
    const myName = document.getElementById('myName').value;
    const myAddress = document.getElementById('myAddress').value;
    const myPhone = document.getElementById('myPhone').value;
    const myEmail = document.getElementById('myEmail').value;
    const checksPayableName = document.getElementById('checksPayableName').value;
    const invoiceDate = document.getElementById('invoiceDate').value;
    const clientName = document.getElementById('clientName').value;
    const clientCompany = document.getElementById('clientCompany').value;
    const clientAddress = document.getElementById('clientAddress').value;
    const clientPhone = document.getElementById('clientPhone').value;
    const clientEmail = document.getElementById('clientEmail').value;
    const caseInfo = document.getElementById('caseInfo').value;
    const balanceDue = document.getElementById('balanceDue').textContent;

    // Format date - parse in local timezone to avoid day shift
    const [year, month, day] = invoiceDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day); // month is 0-indexed
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
                    ${formatContactInfo(myPhone, myEmail)}
                </div>
                <div class="invoice-to">
                    <div class="address-label">Bill To:</div>
                    <div class="address-name">${escapeHtml(clientName)}</div>
                    ${clientCompany ? `<div class="address-company">${escapeHtml(clientCompany)}</div>` : ''}
                    <div class="address-details">${formatMultilineAddress(clientAddress)}</div>
                    ${formatContactInfo(clientPhone, clientEmail)}
                </div>
            </div>
            
            ${caseInfo ? `<div class="invoice-case-info"><strong>Case Information:</strong> ${formatMultilineAddress(caseInfo)}</div>` : ''}
            
            <table class="invoice-items-table">
                <thead>
                    <tr>
                        <th class="col-desc">Description</th>
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
                    <strong>Payment Instructions:</strong> Due upon receipt.${checksPayableName ? ` Please make checks payable to ${escapeHtml(checksPayableName)}.` : ''}
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
        const filename = `Invoice_${invoiceNumber}_${invoiceDate}.pdf`;
        
        // Generate PDF as blob and show file picker
        worker.outputPdf('blob').then((pdfBlob) => {
            // Remove temporary element
            if (document.body.contains(tempDiv)) {
                document.body.removeChild(tempDiv);
            }
            
            // Try to use File System Access API for file picker (Chrome/Edge)
            if ('showSaveFilePicker' in window) {
                saveFileWithPicker(pdfBlob, filename).then(() => {
                    handleSuccessfulPDFGeneration();
                }).catch((error) => {
                    // User cancelled or error - fall back to direct download
                    if (error.name !== 'AbortError') {
                        console.warn('File picker failed, falling back to direct download:', error);
                        downloadFileDirectly(pdfBlob, filename);
                        handleSuccessfulPDFGeneration();
                    }
                });
            } else {
                // Fall back to direct download for browsers without File System Access API
                downloadFileDirectly(pdfBlob, filename);
                handleSuccessfulPDFGeneration();
            }
        }).catch((error) => {
            // Remove temporary element
            if (document.body.contains(tempDiv)) {
                document.body.removeChild(tempDiv);
            }
            console.error('Error generating PDF:', error);
            alert('Error generating PDF: ' + (error.message || 'Unknown error'));
        });

        // Helper function to handle successful PDF generation
        function handleSuccessfulPDFGeneration() {
            console.log('PDF generated successfully');
            
            // Increment invoice number after successful PDF generation
            invoiceNumber = invoiceNumber + 1;
            localStorage.setItem('lastInvoiceNumber', invoiceNumber.toString());
            document.getElementById('invoiceNumber').value = invoiceNumber;
            
            // Save my name, address, phone, and email to localStorage after successful PDF generation
            if (myName) {
                localStorage.setItem('myName', myName);
            }
            if (myAddress) {
                localStorage.setItem('myAddress', myAddress);
            }
            if (myPhone) {
                localStorage.setItem('myPhone', myPhone);
            }
            if (myEmail) {
                localStorage.setItem('myEmail', myEmail);
            }
            if (checksPayableName) {
                localStorage.setItem('checksPayableName', checksPayableName);
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
        }
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
        const client = addressBook[name];
        const option = document.createElement('option');
        option.value = name;
        // Display as "Client Name | Company Name" if company exists
        option.textContent = client.company ? `${name} | ${client.company}` : name;
        select.appendChild(option);
    });
}

// Address book modal functions
function openAddressBookModal() {
    const modal = document.getElementById('addressBookModal');
    const addressList = document.getElementById('addressList');
    const noAddressesMsg = document.getElementById('noAddressesMsg');
    const deleteBtn = document.getElementById('deleteSelectedBtn');
    
    // Get addresses and populate the list
    const addressBook = getAddressBook();
    const sortedNames = Object.keys(addressBook).sort();
    
    // Clear previous list
    addressList.innerHTML = '';
    
    if (sortedNames.length === 0) {
        noAddressesMsg.style.display = 'block';
        addressList.style.display = 'none';
    } else {
        noAddressesMsg.style.display = 'none';
        addressList.style.display = 'flex';
        
        sortedNames.forEach(name => {
            const client = addressBook[name];
            const item = document.createElement('label');
            item.className = 'address-item';
            item.innerHTML = `
                <input type="checkbox" value="${escapeHtml(name)}" class="address-checkbox">
                <div class="address-item-details">
                    <div class="address-item-name">${escapeHtml(name)}</div>
                    ${client.company ? `<div class="address-item-company">${escapeHtml(client.company)}</div>` : ''}
                </div>
            `;
            addressList.appendChild(item);
        });
        
        // Add event listeners for checkboxes to enable/disable delete button
        addressList.querySelectorAll('.address-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', updateDeleteButtonState);
        });
    }
    
    // Reset delete button state
    deleteBtn.disabled = true;
    
    // Show modal
    modal.classList.add('show');
}

function closeAddressBookModal() {
    const modal = document.getElementById('addressBookModal');
    modal.classList.remove('show');
}

function updateDeleteButtonState() {
    const deleteBtn = document.getElementById('deleteSelectedBtn');
    const checkboxes = document.querySelectorAll('.address-checkbox:checked');
    deleteBtn.disabled = checkboxes.length === 0;
}

function deleteSelectedAddresses() {
    const checkboxes = document.querySelectorAll('.address-checkbox:checked');
    const selectedNames = Array.from(checkboxes).map(cb => cb.value);
    
    if (selectedNames.length === 0) return;
    
    const confirmMsg = selectedNames.length === 1 
        ? `Are you sure you want to delete "${selectedNames[0]}"?`
        : `Are you sure you want to delete ${selectedNames.length} addresses?`;
    
    if (!confirm(confirmMsg)) return;
    
    // Get current address book and remove selected
    const addressBook = getAddressBook();
    selectedNames.forEach(name => {
        delete addressBook[name];
    });
    
    // Save updated address book
    localStorage.setItem('clientAddressBook', JSON.stringify(addressBook));
    
    // Update the dropdown and refresh the modal
    updateAddressBookUI();
    openAddressBookModal(); // Refresh the modal content
}

function fillClientForm(addressData) {
    if (!addressData) return;
    
    document.getElementById('clientName').value = addressData.name || '';
    document.getElementById('clientCompany').value = addressData.company || '';
    document.getElementById('clientAddress').value = addressData.address || '';
    document.getElementById('clientPhone').value = addressData.phone || '';
    document.getElementById('clientEmail').value = addressData.email || '';
}

// Pre-fill items modal functions
function openPrefillItemsModal() {
    const modal = document.getElementById('prefillItemsModal');
    
    // Set default deposition date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('depoDate').value = today;
    
    // Reset other fields to defaults
    document.getElementById('depoName').value = '';
    document.getElementById('depoPages').value = '0';
    document.getElementById('depoRate').value = '5.50';
    document.getElementById('depoCopies').value = '0';
    document.getElementById('depoCopyRate').value = '0.95';
    document.getElementById('depoExtra').value = '';
    document.getElementById('appearanceHours').value = '3';
    document.getElementById('appearanceRate').value = '49.50';
    document.getElementById('exhibitsBW').value = '0';
    document.getElementById('exhibitsBWRate').value = '0.25';
    document.getElementById('exhibitsColor').value = '0';
    document.getElementById('exhibitsColorRate').value = '1.00';
    
    modal.classList.add('show');
}

function closePrefillItemsModal() {
    const modal = document.getElementById('prefillItemsModal');
    modal.classList.remove('show');
}

function applyPrefillItems() {
    // Get form values
    const depoDate = document.getElementById('depoDate').value;
    const depoName = document.getElementById('depoName').value.trim();
    const depoPages = parseInt(document.getElementById('depoPages').value) || 0;
    const depoRate = parseFloat(document.getElementById('depoRate').value) || 0;
    const depoCopies = parseInt(document.getElementById('depoCopies').value) || 0;
    const depoCopyRate = parseFloat(document.getElementById('depoCopyRate').value) || 0;
    const depoExtra = document.getElementById('depoExtra').value.trim();
    
    const appearanceHours = parseFloat(document.getElementById('appearanceHours').value) || 0;
    const appearanceRate = parseFloat(document.getElementById('appearanceRate').value) || 0;
    
    const exhibitsBW = parseInt(document.getElementById('exhibitsBW').value) || 0;
    const exhibitsBWRate = parseFloat(document.getElementById('exhibitsBWRate').value) || 0;
    const exhibitsColor = parseInt(document.getElementById('exhibitsColor').value) || 0;
    const exhibitsColorRate = parseFloat(document.getElementById('exhibitsColorRate').value) || 0;
    
    // Clear existing items
    const tbody = document.getElementById('itemsTableBody');
    tbody.innerHTML = '';
    
    // 1. Add Deposition item
    let depoDescription = 'DEPOSITION';
    if (depoDate) {
        // Format date as MM/DD/YY
        const [year, month, day] = depoDate.split('-');
        const shortYear = year.slice(-2);
        depoDescription += ` ${month}/${day}/${shortYear}`;
    }
    if (depoName) {
        depoDescription += ` - ${depoName}`;
    }
    if (depoPages > 0) {
        depoDescription += ` - ${depoPages} pages`;
    }
    if (depoExtra) {
        depoDescription += ` - ${depoExtra}`;
    }
    // Calculate final page rate: base rate + (copies * copy rate)
    const finalDepoRate = depoRate + (depoCopies * depoCopyRate);
    addItemRow(depoDescription, depoPages, finalDepoRate);
    
    // 2. Add Appearance Fee item
    const billedHours = Math.max(appearanceHours, 3); // Minimum 3 hours
    let appearanceDescription;
    if (appearanceHours <= 3) {
        appearanceDescription = 'Appearance Fee - 3h minimum';
    } else {
        appearanceDescription = `Appearance Fee - ${appearanceHours}h @ $${appearanceRate.toFixed(2)}/h`;
    }
    addItemRow(appearanceDescription, billedHours, appearanceRate);
    
    // 3. Add Exhibits item (only if there are any exhibits)
    if (exhibitsBW > 0 || exhibitsColor > 0) {
        let exhibitsDescription;
        if (exhibitsBW > 0 && exhibitsColor > 0) {
            exhibitsDescription = `Exhibits ${exhibitsBW} BW / ${exhibitsColor} Color`;
        } else if (exhibitsBW > 0) {
            exhibitsDescription = `Exhibits ${exhibitsBW} BW`;
        } else {
            exhibitsDescription = `Exhibits ${exhibitsColor} Color`;
        }
        const exhibitsTotal = (exhibitsBW * exhibitsBWRate) + (exhibitsColor * exhibitsColorRate);
        addItemRow(exhibitsDescription, 1, exhibitsTotal);
    }
    
    // Recalculate totals
    calculateBalanceDue();
    
    // Close modal
    closePrefillItemsModal();
}

// Pre-fill copy modal functions
function openPrefillCopyModal() {
    const modal = document.getElementById('prefillCopyModal');
    
    // Set default deposition date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('copyDepoDate').value = today;
    
    // Reset other fields to defaults
    document.getElementById('copyDepoName').value = '';
    document.getElementById('copyDepoPages').value = '0';
    document.getElementById('copyDepoRate').value = '2.25';
    document.getElementById('copyDepoExtra').value = '';
    document.getElementById('copyExhibitsBW').value = '0';
    document.getElementById('copyExhibitsBWRate').value = '0.25';
    document.getElementById('copyExhibitsColor').value = '0';
    document.getElementById('copyExhibitsColorRate').value = '1.00';
    
    modal.classList.add('show');
}

function closePrefillCopyModal() {
    const modal = document.getElementById('prefillCopyModal');
    modal.classList.remove('show');
}

function applyPrefillCopyItems() {
    // Get form values
    const depoDate = document.getElementById('copyDepoDate').value;
    const depoName = document.getElementById('copyDepoName').value.trim();
    const depoPages = parseInt(document.getElementById('copyDepoPages').value) || 0;
    const depoRate = parseFloat(document.getElementById('copyDepoRate').value) || 0;
    const depoExtra = document.getElementById('copyDepoExtra').value.trim();
    
    const exhibitsBW = parseInt(document.getElementById('copyExhibitsBW').value) || 0;
    const exhibitsBWRate = parseFloat(document.getElementById('copyExhibitsBWRate').value) || 0;
    const exhibitsColor = parseInt(document.getElementById('copyExhibitsColor').value) || 0;
    const exhibitsColorRate = parseFloat(document.getElementById('copyExhibitsColorRate').value) || 0;
    
    // Clear existing items
    const tbody = document.getElementById('itemsTableBody');
    tbody.innerHTML = '';
    
    // 1. Add Copy of Deposition item
    let depoDescription = 'COPY OF DEPOSITION';
    if (depoDate) {
        // Format date as MM/DD/YY
        const [year, month, day] = depoDate.split('-');
        const shortYear = year.slice(-2);
        depoDescription += ` ${month}/${day}/${shortYear}`;
    }
    if (depoName) {
        depoDescription += ` - ${depoName}`;
    }
    if (depoPages > 0) {
        depoDescription += ` - ${depoPages} pages`;
    }
    if (depoExtra) {
        depoDescription += ` - ${depoExtra}`;
    }
    addItemRow(depoDescription, depoPages, depoRate);
    
    // 2. Add Exhibits item (only if there are any exhibits)
    if (exhibitsBW > 0 || exhibitsColor > 0) {
        let exhibitsDescription;
        if (exhibitsBW > 0 && exhibitsColor > 0) {
            exhibitsDescription = `Exhibits ${exhibitsBW} BW / ${exhibitsColor} Color`;
        } else if (exhibitsBW > 0) {
            exhibitsDescription = `Exhibits ${exhibitsBW} BW`;
        } else {
            exhibitsDescription = `Exhibits ${exhibitsColor} Color`;
        }
        const exhibitsTotal = (exhibitsBW * exhibitsBWRate) + (exhibitsColor * exhibitsColorRate);
        addItemRow(exhibitsDescription, 1, exhibitsTotal);
    }
    
    // Recalculate totals
    calculateBalanceDue();
    
    // Close modal
    closePrefillCopyModal();
}

// Save file using File System Access API (shows file picker)
async function saveFileWithPicker(blob, filename) {
    const fileHandle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{
            description: 'PDF files',
            accept: {
                'application/pdf': ['.pdf']
            }
        }]
    });
    
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
}

// Fallback: Download file directly (for browsers without File System Access API)
function downloadFileDirectly(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
