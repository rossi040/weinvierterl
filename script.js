document.addEventListener('DOMContentLoaded', function() {
  // Update database initialization to include categories
  let db = {
    customers: JSON.parse(localStorage.getItem('customers')) || [],
    items: JSON.parse(localStorage.getItem('items')) || [],
    invoices: JSON.parse(localStorage.getItem('invoices')) || [],
    manufacturers: JSON.parse(localStorage.getItem('manufacturers')) || [],
    categories: JSON.parse(localStorage.getItem('categories')) || [
      { id: 1, name: 'Hardware', description: 'Computer Hardware' },
      { id: 2, name: 'Software', description: 'Computer Software' },
      { id: 3, name: 'Service', description: 'Dienstleistungen' },
      { id: 4, name: 'Other', description: 'Sonstige Artikel' }
    ],
    settings: JSON.parse(localStorage.getItem('settings')) || {
      lastInvoiceNumber: 0,
      lastArticleNumber: 0,
      company: {
        name: '',
        address: '',
        contact: '',
        taxId: '',
        phone: '',
        email: ''
      },
      vat: {
        default: 19,
        reduced: 7
      }
    }
  };

  // Update save function to include categories
  function saveDB() {
    localStorage.setItem('customers', JSON.stringify(db.customers));
    localStorage.setItem('items', JSON.stringify(db.items));
    localStorage.setItem('invoices', JSON.stringify(db.invoices));
    localStorage.setItem('manufacturers', JSON.stringify(db.manufacturers));
    localStorage.setItem('categories', JSON.stringify(db.categories));
    localStorage.setItem('settings', JSON.stringify(db.settings));
  }

  // Tab Management
  document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
      button.classList.add('active');
      document.getElementById(button.dataset.tab).classList.add('active');
      
      if (button.dataset.tab === 'dashboard') {
        updateDashboardStats();
        updateRecentInvoices();
        updateLowStockItems();
      } else if (button.dataset.tab === 'items') {
        refreshItemTable();
      }
    });
  });

  // Enhanced Customer Management
  const customerForm = document.getElementById('customer-form');
  const addCustomerBtn = document.getElementById('add-customer-btn');
  const saveCustomerBtn = document.getElementById('save-customer');
  const cancelCustomerBtn = document.getElementById('cancel-customer');
  let editingCustomerId = null;

  function refreshCustomerTable() {
    const tbody = document.querySelector('#customers-table tbody');
    tbody.innerHTML = '';
    db.customers.forEach(customer => {
      const row = document.createElement('tr');
      const address = formatAddress(customer);
      const contact = formatContact(customer);
      row.innerHTML = `
        <td>${customer.firstname} ${customer.lastname}</td>
        <td>${customer.company || '-'}</td>
        <td>${address}</td>
        <td>${contact}</td>
        <td>
          <button class="action-btn" onclick="editCustomer(${customer.id})">Bearbeiten</button>
          <button class="action-btn delete-btn" onclick="deleteCustomer(${customer.id})">Löschen</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  function formatAddress(customer) {
    let address = `${customer.street}`;
    if (customer.stairs) address += `, Stiege ${customer.stairs}`;
    if (customer.floor) address += `, ${customer.floor}. Stock`;
    if (customer.door) address += `, Tür ${customer.door}`;
    address += `\n${customer.postal} ${customer.city}\n${customer.country}`;
    return address;
  }

  function formatContact(customer) {
    let contact = [];
    if (customer.phone) contact.push(`Tel: ${customer.phone}`);
    if (customer.mobile) contact.push(`Mobil: ${customer.mobile}`);
    if (customer.email) contact.push(`E-Mail: ${customer.email}`);
    return contact.join('\n');
  }

  window.editCustomer = function(customerId) {
    const customer = db.customers.find(c => c.id === customerId);
    if (customer) {
      document.getElementById('new-customer-firstname').value = customer.firstname || '';
      document.getElementById('new-customer-lastname').value = customer.lastname || '';
      document.getElementById('new-customer-company').value = customer.company || '';
      document.getElementById('new-customer-country').value = customer.country || '';
      document.getElementById('new-customer-postal').value = customer.postal || '';
      document.getElementById('new-customer-city').value = customer.city || '';
      document.getElementById('new-customer-street').value = customer.street || '';
      document.getElementById('new-customer-stairs').value = customer.stairs || '';
      document.getElementById('new-customer-floor').value = customer.floor || '';
      document.getElementById('new-customer-door').value = customer.door || '';
      document.getElementById('new-customer-phone').value = customer.phone || '';
      document.getElementById('new-customer-mobile').value = customer.mobile || '';
      document.getElementById('new-customer-email').value = customer.email || '';
      document.getElementById('new-customer-birthday').value = customer.birthday || '';
      document.getElementById('new-customer-notes').value = customer.notes || '';
      
      customerForm.classList.remove('hidden');
      editingCustomerId = customerId;
      saveCustomerBtn.textContent = 'Aktualisieren';
    }
  };

  window.deleteCustomer = function(customerId) {
    if (confirm('Möchten Sie diesen Kunden wirklich löschen?')) {
      // Check if customer is used in any invoices
      const customerInvoices = db.invoices.filter(inv => inv.customerId === customerId);
      if (customerInvoices.length > 0) {
        alert('Dieser Kunde kann nicht gelöscht werden, da bereits Rechnungen für ihn existieren.');
        return;
      }
      
      db.customers = db.customers.filter(c => c.id !== customerId);
      saveDB();
      refreshCustomerTable();
    }
  };

  addCustomerBtn.addEventListener('click', () => {
    editingCustomerId = null;
    document.getElementById('new-customer-firstname').value = '';
    document.getElementById('new-customer-lastname').value = '';
    document.getElementById('new-customer-company').value = '';
    document.getElementById('new-customer-country').value = '';
    document.getElementById('new-customer-postal').value = '';
    document.getElementById('new-customer-city').value = '';
    document.getElementById('new-customer-street').value = '';
    document.getElementById('new-customer-stairs').value = '';
    document.getElementById('new-customer-floor').value = '';
    document.getElementById('new-customer-door').value = '';
    document.getElementById('new-customer-phone').value = '';
    document.getElementById('new-customer-mobile').value = '';
    document.getElementById('new-customer-email').value = '';
    document.getElementById('new-customer-birthday').value = '';
    document.getElementById('new-customer-notes').value = '';
    customerForm.classList.remove('hidden');
    saveCustomerBtn.textContent = 'Speichern';
  });

  saveCustomerBtn.addEventListener('click', () => {
    const customerData = {
      firstname: document.getElementById('new-customer-firstname').value,
      lastname: document.getElementById('new-customer-lastname').value,
      company: document.getElementById('new-customer-company').value,
      country: document.getElementById('new-customer-country').value,
      postal: document.getElementById('new-customer-postal').value,
      city: document.getElementById('new-customer-city').value,
      street: document.getElementById('new-customer-street').value,
      stairs: document.getElementById('new-customer-stairs').value,
      floor: document.getElementById('new-customer-floor').value,
      door: document.getElementById('new-customer-door').value,
      phone: document.getElementById('new-customer-phone').value,
      mobile: document.getElementById('new-customer-mobile').value,
      email: document.getElementById('new-customer-email').value,
      birthday: document.getElementById('new-customer-birthday').value,
      notes: document.getElementById('new-customer-notes').value
    };
    
    if (!customerData.firstname || !customerData.lastname || !customerData.street || !customerData.postal || !customerData.city || !customerData.country) {
      alert('Bitte füllen Sie alle erforderlichen Felder aus.');
      return;
    }

    if (editingCustomerId) {
      const customerIndex = db.customers.findIndex(c => c.id === editingCustomerId);
      if (customerIndex !== -1) {
        db.customers[customerIndex] = {
          ...db.customers[customerIndex],
          ...customerData
        };
      }
    } else {
      db.customers.push({
        id: Date.now(),
        ...customerData
      });
    }
    
    saveDB();
    refreshCustomerTable();
    customerForm.classList.add('hidden');
    editingCustomerId = null;
    
    // Clear form
    document.querySelectorAll('#customer-form input, #customer-form textarea').forEach(input => {
      input.value = '';
    });
    
    saveCustomerBtn.textContent = 'Speichern';
  });

  cancelCustomerBtn.addEventListener('click', () => {
    customerForm.classList.add('hidden');
    editingCustomerId = null;
    document.getElementById('new-customer-firstname').value = '';
    document.getElementById('new-customer-lastname').value = '';
    document.getElementById('new-customer-company').value = '';
    document.getElementById('new-customer-country').value = '';
    document.getElementById('new-customer-postal').value = '';
    document.getElementById('new-customer-city').value = '';
    document.getElementById('new-customer-street').value = '';
    document.getElementById('new-customer-stairs').value = '';
    document.getElementById('new-customer-floor').value = '';
    document.getElementById('new-customer-door').value = '';
    document.getElementById('new-customer-phone').value = '';
    document.getElementById('new-customer-mobile').value = '';
    document.getElementById('new-customer-email').value = '';
    document.getElementById('new-customer-birthday').value = '';
    document.getElementById('new-customer-notes').value = '';
    saveCustomerBtn.textContent = 'Speichern';
  });

  // Item Management
  const itemForm = document.getElementById('item-form');
  const addItemBtn = document.getElementById('add-item-btn');
  const saveItemBtn = document.getElementById('save-item');
  const cancelItemBtn = document.getElementById('cancel-item');
  const imagePreview = document.getElementById('item-image-preview');
  let editingItemId = null;

  function refreshItemTable(filteredItems = db.items) {
    const itemsContainer = document.querySelector('.article-grid');
    itemsContainer.innerHTML = '';
    
    const tbody = document.querySelector('#items-table tbody');
    tbody.innerHTML = '';

    filteredItems.forEach(item => {
      const card = document.createElement('div');
      card.className = 'article-card';
      const manufacturer = item.manufacturerId ? 
        db.manufacturers.find(m => m.id === item.manufacturerId)?.name || '-' : 
        '-';
      
      card.innerHTML = `
        ${item.image ? 
          `<img src="${item.image}" alt="${item.name}" class="article-image">` :
          `<div class="article-image-placeholder">
            <svg width="50" height="50" viewBox="0 0 24 24" fill="#ccc">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
          </div>`
        }
        <div class="article-details">
          <div class="article-title">${item.name}</div>
          <div class="article-number">Art.Nr.: ${item.articleNumber || '-'}</div>
          <div class="article-manufacturer">Hersteller: ${manufacturer}</div>
          <div class="article-price">${item.price.toFixed(2)} €</div>
          <div class="article-stock">Bestand: ${item.stock || 0} Stück</div>
          <div class="article-description">${item.description || '-'}</div>
          <div class="article-actions">
            <button class="action-btn" onclick="editItem(${item.id})">Bearbeiten</button>
            <button class="action-btn delete-btn" onclick="deleteItem(${item.id})">Löschen</button>
          </div>
        </div>
      `;
      itemsContainer.appendChild(card);

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>
          ${item.image ? 
            `<img src="${item.image}" alt="${item.name}">` : 
            '<div class="no-image">Kein Bild</div>'}
        </td>
        <td>${item.articleNumber || '-'}</td>
        <td>${item.name}</td>
        <td>${manufacturer}</td>
        <td>${item.description || '-'}</td>
        <td>${item.purchasePrice ? item.purchasePrice.toFixed(2) + ' €' : '-'}</td>
        <td>${item.price.toFixed(2)} €</td>
        <td>${item.stock || 0}</td>
        <td>
          <button class="action-btn" onclick="editItem(${item.id})">Bearbeiten</button>
          <button class="action-btn delete-btn" onclick="deleteItem(${item.id})">Löschen</button>
        </td>
      `;
      tbody.appendChild(row);
    });

    let currentView = 'grid';
    document.querySelector('.article-grid').style.display = currentView === 'grid' ? 'grid' : 'none';
    document.querySelector('#items-table').style.display = currentView === 'table' ? 'table' : 'none';
  }

  document.getElementById('item-image').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        imagePreview.src = e.target.result;
        imagePreview.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    }
  });

  function populateManufacturerSelect() {
    const manufacturerSelect = document.getElementById('new-item-manufacturer');
    manufacturerSelect.innerHTML = '<option value="">-- Hersteller auswählen --</option>';
    db.manufacturers.forEach(manufacturer => {
      manufacturerSelect.innerHTML += `<option value="${manufacturer.id}">${manufacturer.name}</option>`;
    });
  }

  function resetItemForm() {
    document.getElementById('new-item-name').value = '';
    document.getElementById('new-item-article-number').value = '';
    document.getElementById('new-item-purchase-price').value = '';
    document.getElementById('new-item-price').value = '';
    document.getElementById('new-item-stock').value = '';
    document.getElementById('new-item-description').value = '';
    document.getElementById('item-image').value = '';
    imagePreview.src = '';
    imagePreview.classList.add('hidden');
    
    // Make article number field readonly when creating new item
    const articleNumberField = document.getElementById('new-item-article-number');
    if (!editingItemId) {
      articleNumberField.value = 'Wird automatisch vergeben';
      articleNumberField.readOnly = true;
    } else {
      articleNumberField.readOnly = false;
    }
    
    editingItemId = null;
  }

  function generateArticleNumber() {
    db.settings.lastArticleNumber++;
    saveDB();
    return `ART-${db.settings.lastArticleNumber.toString().padStart(4, '0')}`;
  }

  addItemBtn.addEventListener('click', () => {
    editingItemId = null;
    populateManufacturerSelect();
    document.getElementById('new-item-name').value = '';
    const articleNumberField = document.getElementById('new-item-article-number');
    articleNumberField.value = 'Wird automatisch vergeben';
    articleNumberField.readOnly = true;
    document.getElementById('new-item-manufacturer').value = '';
    document.getElementById('new-item-purchase-price').value = '';
    document.getElementById('new-item-price').value = '';
    document.getElementById('new-item-stock').value = '';
    document.getElementById('new-item-description').value = '';
    document.getElementById('item-image').value = '';
    imagePreview.src = '';
    imagePreview.classList.add('hidden');
    itemForm.classList.remove('hidden');
    saveItemBtn.textContent = 'Speichern';
  });

  saveItemBtn.addEventListener('click', () => {
    const name = document.getElementById('new-item-name').value;
    const articleNumber = editingItemId ? 
      document.getElementById('new-item-article-number').value : 
      generateArticleNumber();
    const manufacturerId = document.getElementById('new-item-manufacturer').value;
    const purchasePrice = parseFloat(document.getElementById('new-item-purchase-price').value);
    const price = parseFloat(document.getElementById('new-item-price').value);
    const stock = parseInt(document.getElementById('new-item-stock').value) || 0;
    const description = document.getElementById('new-item-description').value;
    const image = imagePreview.classList.contains('hidden') ? '' : imagePreview.src;
    const category = document.getElementById('new-item-category').value;

    if (!name || !price) {
      alert('Bitte füllen Sie mindestens die Bezeichnung und den Verkaufspreis aus.');
      return;
    }

    const itemData = {
      name,
      articleNumber,
      manufacturerId: manufacturerId || null,
      purchasePrice: !isNaN(purchasePrice) ? purchasePrice : null,
      price,
      stock,
      description,
      image,
      category: category || null
    };

    if (editingItemId) {
      const index = db.items.findIndex(i => i.id === editingItemId);
      if (index !== -1) {
        db.items[index] = {
          ...db.items[index],
          ...itemData
        };
      }
    } else {
      db.items.push({
        id: Date.now(),
        ...itemData
      });
    }

    saveDB();
    refreshItemTable();
    itemForm.classList.add('hidden');
    resetItemForm();
    saveItemBtn.textContent = 'Speichern';
  });

  cancelItemBtn.addEventListener('click', () => {
    itemForm.classList.add('hidden');
    resetItemForm();
  });

  window.editItem = function(itemId) {
    const item = db.items.find(i => i.id === itemId);
    if (item) {
      editingItemId = itemId;
      populateManufacturerSelect();
      document.getElementById('new-item-name').value = item.name;
      const articleNumberField = document.getElementById('new-item-article-number');
      articleNumberField.value = item.articleNumber;
      articleNumberField.readOnly = true; 
      document.getElementById('new-item-manufacturer').value = item.manufacturerId || '';
      document.getElementById('new-item-purchase-price').value = item.purchasePrice || '';
      document.getElementById('new-item-price').value = item.price;
      document.getElementById('new-item-stock').value = item.stock || '';
      document.getElementById('new-item-description').value = item.description || '';
      document.getElementById('new-item-category').value = item.category || '';
      
      if (item.image) {
        imagePreview.src = item.image;
        imagePreview.classList.remove('hidden');
      } else {
        imagePreview.classList.add('hidden');
      }
      
      itemForm.classList.remove('hidden');
      saveItemBtn.textContent = 'Aktualisieren';
    }
  };

  window.deleteItem = function(itemId) {
    if (confirm('Möchten Sie diesen Artikel wirklich löschen?')) {
      // Check if item is used in any invoices
      const itemInInvoices = db.invoices.some(invoice => 
        invoice.items.some(item => item.id === itemId)
      );
      
      if (itemInInvoices) {
        alert('Dieser Artikel kann nicht gelöscht werden, da er bereits in Rechnungen verwendet wurde.');
        return;
      }
      
      db.items = db.items.filter(i => i.id !== itemId);
      saveDB();
      refreshItemTable();
    }
  };

  document.getElementById('items').insertAdjacentHTML('afterbegin', `
    <div class="article-search">
      <input type="text" id="article-search" placeholder="Artikel suchen...">
      <div class="view-toggle">
        <button class="active" data-view="grid">Kachelansicht</button>
        <button data-view="table">Tabellenansicht</button>
      </div>
    </div>
    <div class="article-grid"></div>
  `);

  let currentView = 'grid';
  document.querySelector('.view-toggle').addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
      document.querySelectorAll('.view-toggle button').forEach(btn => btn.classList.remove('active'));
      e.target.classList.add('active');
      
      currentView = e.target.dataset.view;
      document.querySelector('.article-grid').style.display = currentView === 'grid' ? 'grid' : 'none';
      document.querySelector('#items-table').style.display = currentView === 'table' ? 'table' : 'none';
      
      // Refresh the current view
      refreshItemTable();
    }
  });

  document.getElementById('article-search').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const cards = document.querySelectorAll('.article-card');
    const rows = document.querySelectorAll('#items-table tbody tr');
    
    [...cards, ...rows].forEach(element => {
      const text = element.textContent.toLowerCase();
      element.style.display = text.includes(searchTerm) ? '' : 'none';
    });
  });

  // Initial refresh of item table
  refreshItemTable();

  // Manufacturer Management
  const manufacturerForm = document.getElementById('manufacturer-form');
  const addManufacturerBtn = document.getElementById('add-manufacturer-btn');
  const saveManufacturerBtn = document.getElementById('save-manufacturer');
  const cancelManufacturerBtn = document.getElementById('cancel-manufacturer');
  let editingManufacturerId = null;

  function refreshManufacturerTable() {
    const tbody = document.querySelector('#manufacturers-table tbody');
    tbody.innerHTML = '';
    db.manufacturers.forEach(manufacturer => {
      const row = document.createElement('tr');
      const address = formatManufacturerAddress(manufacturer);
      const contact = formatManufacturerContact(manufacturer);
      row.innerHTML = `
        <td>${manufacturer.name}</td>
        <td>${manufacturer.contact || '-'}</td>
        <td>${address}</td>
        <td>${contact}</td>
        <td>
          <button class="action-btn" onclick="editManufacturer(${manufacturer.id})">Bearbeiten</button>
          <button class="action-btn delete-btn" onclick="deleteManufacturer(${manufacturer.id})">Löschen</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  function formatManufacturerAddress(manufacturer) {
    let address = [];
    if (manufacturer.street) address.push(manufacturer.street);
    if (manufacturer.postal || manufacturer.city) {
      address.push(`${manufacturer.postal || ''} ${manufacturer.city || ''}`);
    }
    if (manufacturer.country) address.push(manufacturer.country);
    return address.join('\n') || '-';
  }

  function formatManufacturerContact(manufacturer) {
    let contact = [];
    if (manufacturer.phone) contact.push(`Tel: ${manufacturer.phone}`);
    if (manufacturer.email) contact.push(`E-Mail: ${manufacturer.email}`);
    if (manufacturer.website) contact.push(`Web: ${manufacturer.website}`);
    return contact.join('\n') || '-';
  }

  window.editManufacturer = function(manufacturerId) {
    const manufacturer = db.manufacturers.find(m => m.id === manufacturerId);
    if (manufacturer) {
      document.getElementById('new-manufacturer-name').value = manufacturer.name || '';
      document.getElementById('new-manufacturer-contact').value = manufacturer.contact || '';
      document.getElementById('new-manufacturer-country').value = manufacturer.country || '';
      document.getElementById('new-manufacturer-postal').value = manufacturer.postal || '';
      document.getElementById('new-manufacturer-city').value = manufacturer.city || '';
      document.getElementById('new-manufacturer-street').value = manufacturer.street || '';
      document.getElementById('new-manufacturer-phone').value = manufacturer.phone || '';
      document.getElementById('new-manufacturer-email').value = manufacturer.email || '';
      document.getElementById('new-manufacturer-website').value = manufacturer.website || '';
      document.getElementById('new-manufacturer-notes').value = manufacturer.notes || '';
      
      manufacturerForm.classList.remove('hidden');
      editingManufacturerId = manufacturerId;
      saveManufacturerBtn.textContent = 'Aktualisieren';
    }
  };

  window.deleteManufacturer = function(manufacturerId) {
    if (confirm('Möchten Sie diesen Hersteller wirklich löschen?')) {
      // Check if manufacturer is referenced by any items
      const manufacturerItems = db.items.filter(item => item.manufacturerId === manufacturerId);
      if (manufacturerItems.length > 0) {
        alert('Dieser Hersteller kann nicht gelöscht werden, da noch Artikel von diesem Hersteller existieren.');
        return;
      }
      
      db.manufacturers = db.manufacturers.filter(m => m.id !== manufacturerId);
      saveDB();
      refreshManufacturerTable();
    }
  };

  addManufacturerBtn.addEventListener('click', () => {
    editingManufacturerId = null;
    document.getElementById('new-manufacturer-name').value = '';
    document.getElementById('new-manufacturer-contact').value = '';
    document.getElementById('new-manufacturer-country').value = '';
    document.getElementById('new-manufacturer-postal').value = '';
    document.getElementById('new-manufacturer-city').value = '';
    document.getElementById('new-manufacturer-street').value = '';
    document.getElementById('new-manufacturer-phone').value = '';
    document.getElementById('new-manufacturer-email').value = '';
    document.getElementById('new-manufacturer-website').value = '';
    document.getElementById('new-manufacturer-notes').value = '';
    manufacturerForm.classList.remove('hidden');
    saveManufacturerBtn.textContent = 'Speichern';
  });

  saveManufacturerBtn.addEventListener('click', () => {
    const manufacturerData = {
      name: document.getElementById('new-manufacturer-name').value,
      contact: document.getElementById('new-manufacturer-contact').value,
      country: document.getElementById('new-manufacturer-country').value,
      postal: document.getElementById('new-manufacturer-postal').value,
      city: document.getElementById('new-manufacturer-city').value,
      street: document.getElementById('new-manufacturer-street').value,
      phone: document.getElementById('new-manufacturer-phone').value,
      email: document.getElementById('new-manufacturer-email').value,
      website: document.getElementById('new-manufacturer-website').value,
      notes: document.getElementById('new-manufacturer-notes').value
    };
    
    if (!manufacturerData.name) {
      alert('Bitte geben Sie mindestens den Namen des Herstellers ein.');
      return;
    }

    if (editingManufacturerId) {
      const index = db.manufacturers.findIndex(m => m.id === editingManufacturerId);
      if (index !== -1) {
        db.manufacturers[index] = {
          ...db.manufacturers[index],
          ...manufacturerData
        };
      }
    } else {
      db.manufacturers.push({
        id: Date.now(),
        ...manufacturerData
      });
    }
    
    saveDB();
    refreshManufacturerTable();
    manufacturerForm.classList.add('hidden');
    editingManufacturerId = null;
  });

  cancelManufacturerBtn.addEventListener('click', () => {
    manufacturerForm.classList.add('hidden');
    editingManufacturerId = null;
  });

  // Initialize manufacturer table
  refreshManufacturerTable();

  // Add company data handling
  const saveCompanyDataBtn = document.getElementById('save-company-data');
  
  function loadCompanyData() {
    document.getElementById('company-name').value = db.settings.company.name || '';
    document.getElementById('company-address').value = db.settings.company.address || '';
    document.getElementById('company-contact').value = db.settings.company.contact || '';
    document.getElementById('company-tax-id').value = db.settings.company.taxId || '';
    document.getElementById('company-phone').value = db.settings.company.phone || '';
    document.getElementById('company-email').value = db.settings.company.email || '';
  }

  saveCompanyDataBtn.addEventListener('click', () => {
    db.settings.company = {
      name: document.getElementById('company-name').value,
      address: document.getElementById('company-address').value,
      contact: document.getElementById('company-contact').value,
      taxId: document.getElementById('company-tax-id').value,
      phone: document.getElementById('company-phone').value,
      email: document.getElementById('company-email').value
    };
    saveDB();
    alert('Firmendaten wurden gespeichert');
  });

  // Add VAT settings handling
  const saveVatSettingsBtn = document.getElementById('save-vat-settings');
  
  function loadVatSettings() {
    document.getElementById('default-vat').value = db.settings.vat.default || 19;
    document.getElementById('reduced-vat').value = db.settings.vat.reduced || 7;
  }

  saveVatSettingsBtn.addEventListener('click', () => {
    const defaultVat = parseFloat(document.getElementById('default-vat').value);
    const reducedVat = parseFloat(document.getElementById('reduced-vat').value);
    
    if (!isNaN(defaultVat) && !isNaN(reducedVat)) {
      db.settings.vat = {
        default: defaultVat,
        reduced: reducedVat
      };
      saveDB();
      alert('MwSt-Einstellungen wurden gespeichert');
      
      // Update VAT dropdown in invoice form
      document.getElementById('vat').value = defaultVat;
    } else {
      alert('Bitte geben Sie gültige MwSt-Sätze ein');
    }
  });

  // Invoice Management
  const invoiceForm = document.getElementById('invoice-form');
  const newInvoiceBtn = document.getElementById('new-invoice-btn');
  const saveInvoiceBtn = document.getElementById('save-invoice');
  const cancelInvoiceBtn = document.getElementById('cancel-invoice');
  const customerSelect = document.getElementById('customer-select');
  const itemSelect = document.getElementById('item-select');
  const addItemToInvoiceBtn = document.getElementById('add-item');
  const itemRows = document.getElementById('item-rows');
  
  let currentInvoiceItems = [];

  function generateInvoiceNumber() {
    db.settings.lastInvoiceNumber++;
    saveDB();
    return `RE-${new Date().getFullYear()}-${db.settings.lastInvoiceNumber.toString().padStart(4, '0')}`;
  }

  function populateCustomerSelect() {
    customerSelect.innerHTML = '<option value="">-- Kunde auswählen --</option>';
    db.customers.forEach(customer => {
      customerSelect.innerHTML += `<option value="${customer.id}">${customer.firstname} ${customer.lastname}${customer.company ? ' - ' + customer.company : ''}</option>`;
    });
  }

  function populateItemSelect() {
    itemSelect.innerHTML = '<option value="">-- Artikel auswählen --</option>';
    db.items.forEach(item => {
      itemSelect.innerHTML += `<option value="${item.id}">${item.name} (${item.price.toFixed(2)} €)</option>`;
    });
  }

  function updateInvoiceTotals() {
    const vatRate = parseFloat(document.getElementById('vat').value) / 100;
    const grossTotal = currentInvoiceItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const netTotal = grossTotal / (1 + vatRate);
    const vatAmount = grossTotal - netTotal;

    document.getElementById('subtotal').value = netTotal.toFixed(2) + ' €';
    document.getElementById('vat-amount').value = vatAmount.toFixed(2) + ' €';
    document.getElementById('total').value = grossTotal.toFixed(2) + ' €';
  }

  function refreshInvoiceItemsTable() {
    itemRows.innerHTML = '';
    currentInvoiceItems.forEach((item, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${item.name}</td>
        <td><input type="number" value="${item.quantity}" min="1" onchange="updateItemQuantity(${index}, this.value)"></td>
        <td>${item.price.toFixed(2)} €</td>
        <td>${(item.price * item.quantity).toFixed(2)} €</td>
        <td><button class="action-btn delete-btn" onclick="removeInvoiceItem(${index})">Entfernen</button></td>
      `;
      itemRows.appendChild(row);
    });
    updateInvoiceTotals();
  }

  window.updateItemQuantity = function(index, quantity) {
    currentInvoiceItems[index].quantity = parseInt(quantity);
    refreshInvoiceItemsTable();
  };

  window.removeInvoiceItem = function(index) {
    currentInvoiceItems.splice(index, 1);
    refreshInvoiceItemsTable();
  };

  customerSelect.addEventListener('change', () => {
    const selectedCustomer = db.customers.find(c => c.id == customerSelect.value);
    if (selectedCustomer) {
      document.getElementById('customer-name').value = selectedCustomer.firstname + ' ' + selectedCustomer.lastname;
      document.getElementById('customer-address').value = formatAddress(selectedCustomer);
    } else {
      document.getElementById('customer-name').value = '';
      document.getElementById('customer-address').value = '';
    }
  });

  addItemToInvoiceBtn.addEventListener('click', () => {
    const selectedItem = db.items.find(i => i.id == itemSelect.value);
    if (selectedItem) {
      currentInvoiceItems.push({
        id: selectedItem.id,
        name: selectedItem.name,
        price: selectedItem.price,
        quantity: 1
      });
      refreshInvoiceItemsTable();
    }
  });

  newInvoiceBtn.addEventListener('click', () => {
    currentInvoiceItems = [];
    document.getElementById('invoice-number').value = generateInvoiceNumber();
    document.getElementById('invoice-date').value = new Date().toISOString().split('T')[0];
    populateCustomerSelect();
    populateItemSelect();
    refreshInvoiceItemsTable();
    invoiceForm.classList.remove('hidden');
    document.getElementById('vat').value = db.settings.vat.default;
    
    // Add company info to the invoice form
    const companyInfo = document.createElement('div');
    companyInfo.className = 'invoice-company-info';
    companyInfo.innerHTML = `
      <strong>${db.settings.company.name}</strong><br>
      ${db.settings.company.address.replace(/\n/g, '<br>')}<br>
      ${db.settings.company.contact}<br>
      Steuernummer: ${db.settings.company.taxId}<br>
      Tel: ${db.settings.company.phone}<br>
      Email: ${db.settings.company.email}
    `;
    
    const invoiceHeader = document.querySelector('.invoice-header');
    invoiceHeader.insertBefore(companyInfo, invoiceHeader.firstChild);
  });

  saveInvoiceBtn.addEventListener('click', () => {
    const selectedCustomer = db.customers.find(c => c.id == customerSelect.value);
    if (!selectedCustomer || currentInvoiceItems.length === 0) {
      alert('Bitte wählen Sie einen Kunden aus und fügen Sie mindestens einen Artikel hinzu.');
      return;
    }

    const vatRate = parseFloat(document.getElementById('vat').value) / 100;
    const grossTotal = currentInvoiceItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const netTotal = grossTotal / (1 + vatRate);
    const vatAmount = grossTotal - netTotal;

    const invoice = {
      id: Date.now(),
      number: document.getElementById('invoice-number').value,
      date: document.getElementById('invoice-date').value,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.firstname + ' ' + selectedCustomer.lastname,
      customerAddress: formatAddress(selectedCustomer),
      items: currentInvoiceItems,
      subtotal: netTotal,
      vatRate: vatRate,
      vatAmount: vatAmount,
      total: grossTotal
    };

    db.invoices.push(invoice);
    saveDB();
    refreshInvoiceTable();
    invoiceForm.classList.add('hidden');
  });

  cancelInvoiceBtn.addEventListener('click', () => {
    invoiceForm.classList.add('hidden');
  });

  function refreshInvoiceTable() {
    const tbody = document.querySelector('#invoices-table tbody');
    tbody.innerHTML = '';
    db.invoices.forEach(invoice => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${invoice.number}</td>
        <td>${new Date(invoice.date).toLocaleDateString()}</td>
        <td>${invoice.customerName}</td>
        <td>${invoice.total.toFixed(2)} €</td>
        <td>
          <button class="action-btn" onclick="viewInvoice(${invoice.id})">Ansehen</button>
          <button class="action-btn delete-btn" onclick="deleteInvoice(${invoice.id})">Löschen</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  document.getElementById('vat').addEventListener('change', updateInvoiceTotals);

  // Load company data when page loads
  loadCompanyData();

  // Load VAT settings when page loads
  loadVatSettings();

  // Initialize tables and forms
  refreshCustomerTable();
  refreshItemTable();
  refreshInvoiceTable();
  refreshManufacturerTable();

  // Add search and filter functionality for items
  const searchInput = document.getElementById('article-search');
  const categoryFilter = document.getElementById('category-filter');
  
  function filterItems() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCategory = categoryFilter.value;
    
    const filteredItems = db.items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm) || 
                          item.description?.toLowerCase().includes(searchTerm) ||
                          item.articleNumber?.toLowerCase().includes(searchTerm);
      const matchesCategory = !selectedCategory || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
    
    refreshItemTable(filteredItems);
  }

  searchInput?.addEventListener('input', filterItems);
  categoryFilter?.addEventListener('change', filterItems);

  // Initialize category management
  function initializeCategoryManagement() {
    // Update item form to include category selection if not already present
    const existingCategorySelect = document.getElementById('new-item-category');
    if (!existingCategorySelect) {
      const categorySelectDiv = document.createElement('div');
      categorySelectDiv.className = 'item-form-group';
      categorySelectDiv.innerHTML = `
        <label for="new-item-category">Kategorie:</label>
        <select id="new-item-category" class="category-select">
          <option value="">-- Kategorie auswählen --</option>
        </select>
      `;
      
      const itemFormGrid = document.querySelector('#item-form .item-form-grid');
      if (itemFormGrid) {
        itemFormGrid.insertBefore(
          categorySelectDiv,
          itemFormGrid.querySelector('.item-form-group:last-child')
        );
      }
    }

    // Initialize category table
    refreshCategoryTable();
  }

  function refreshCategoryTable() {
    const tbody = document.querySelector('#categories-table tbody');
    tbody.innerHTML = '';
    db.categories.forEach(category => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${category.name}</td>
        <td>${category.description || '-'}</td>
        <td>
          <button class="action-btn" onclick="editCategory(${category.id})">Bearbeiten</button>
          <button class="action-btn delete-btn" onclick="deleteCategory(${category.id})">Löschen</button>
        </td>
      `;
      tbody.appendChild(row);
    });

    // Update category selects in item form
    const categorySelects = document.querySelectorAll('.category-select');
    categorySelects.forEach(select => {
      select.innerHTML = '<option value="">-- Kategorie auswählen --</option>';
      db.categories.forEach(category => {
        select.innerHTML += `<option value="${category.id}">${category.name}</option>`;
      });
    });
  }

  window.editCategory = function(categoryId) {
    const category = db.categories.find(c => c.id === categoryId);
    if (category) {
      document.getElementById('new-category-name').value = category.name;
      document.getElementById('new-category-description').value = category.description || '';
      document.getElementById('category-form').classList.remove('hidden');
      editingCategoryId = categoryId;
      document.getElementById('save-category').textContent = 'Aktualisieren';
    }
  };

  window.deleteCategory = function(categoryId) {
    if (confirm('Möchten Sie diese Kategorie wirklich löschen?')) {
      // Check if category is used by any items
      const itemsWithCategory = db.items.filter(item => item.categoryId === categoryId);
      if (itemsWithCategory.length > 0) {
        alert('Diese Kategorie kann nicht gelöscht werden, da sie von Artikeln verwendet wird.');
        return;
      }
      
      db.categories = db.categories.filter(c => c.id !== categoryId);
      saveDB();
      refreshCategoryTable();
    }
  };

  // Category form handling
  let editingCategoryId = null;
  
  document.getElementById('add-category-btn').addEventListener('click', () => {
    editingCategoryId = null;
    document.getElementById('new-category-name').value = '';
    document.getElementById('new-category-description').value = '';
    document.getElementById('category-form').classList.remove('hidden');
    document.getElementById('save-category').textContent = 'Speichern';
  });

  document.getElementById('save-category').addEventListener('click', () => {
    const name = document.getElementById('new-category-name').value;
    const description = document.getElementById('new-category-description').value;

    if (!name) {
      alert('Bitte geben Sie einen Namen für die Kategorie ein.');
      return;
    }

    if (editingCategoryId) {
      const index = db.categories.findIndex(c => c.id === editingCategoryId);
      if (index !== -1) {
        db.categories[index] = {
          ...db.categories[index],
          name,
          description
        };
      }
    } else {
      db.categories.push({
        id: Date.now(),
        name,
        description
      });
    }

    saveDB();
    refreshCategoryTable();
    document.getElementById('category-form').classList.add('hidden');
    editingCategoryId = null;
  });

  document.getElementById('cancel-category').addEventListener('click', () => {
    document.getElementById('category-form').classList.add('hidden');
    editingCategoryId = null;
  });

  // Call initialization function at the end of the main DOMContentLoaded event
  initializeCategoryManagement();

  function initializeDashboard() {
    updateDashboardStats();
    updateRecentInvoices();
    updateLowStockItems();
    
    // Refresh dashboard every 5 minutes
    setInterval(updateDashboardStats, 300000);
  }

  function updateDashboardStats() {
    // Calculate revenue for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const revenue = db.invoices
      .filter(invoice => new Date(invoice.date) >= thirtyDaysAgo)
      .reduce((sum, invoice) => sum + invoice.total, 0);
    
    document.getElementById('revenue-30-days').textContent = 
      `€${revenue.toFixed(2)}`;

    // Count active customers (customers with invoices)
    const activeCustomers = new Set(
      db.invoices.map(invoice => invoice.customerId)
    ).size;
    
    document.getElementById('total-customers').textContent = 
      activeCustomers.toString();

    // Calculate total inventory value
    const inventoryValue = db.items.reduce(
      (sum, item) => sum + (item.purchasePrice || 0) * (item.stock || 0), 
      0
    );
    
    document.getElementById('inventory-value').textContent = 
      `€${inventoryValue.toFixed(2)}`;

    // Count open invoices (placeholder - implement actual logic based on your needs)
    const openInvoices = db.invoices.length;
    document.getElementById('open-invoices').textContent = 
      openInvoices.toString();
    
    const openAmount = db.invoices.reduce(
      (sum, invoice) => sum + invoice.total,
      0
    );
    document.getElementById('open-invoices-amount').textContent = 
      `€${openAmount.toFixed(2)}`;
  }

  function updateRecentInvoices() {
    const tbody = document.querySelector('#recent-invoices-table tbody');
    tbody.innerHTML = '';

    // Get last 5 invoices
    const recentInvoices = [...db.invoices]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    recentInvoices.forEach(invoice => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${invoice.number}</td>
        <td>${new Date(invoice.date).toLocaleDateString()}</td>
        <td>${invoice.customerName}</td>
        <td>€${invoice.total.toFixed(2)}</td>
        <td><span class="status-badge status-good">Bezahlt</span></td>
      `;
      tbody.appendChild(row);
    });
  }

  function updateLowStockItems() {
    const tbody = document.querySelector('#low-stock-table tbody');
    tbody.innerHTML = '';

    // Get items with low stock (less than 5 units)
    const lowStockItems = db.items
      .filter(item => (item.stock || 0) < 5)
      .slice(0, 5);

    lowStockItems.forEach(item => {
      const row = document.createElement('tr');
      const status = item.stock === 0 ? 'status-low' : 'status-medium';
      row.innerHTML = `
        <td>${item.name}</td>
        <td>${item.stock || 0}</td>
        <td>5</td>
        <td><span class="status-badge ${status}">
          ${item.stock === 0 ? 'Nicht verfügbar' : 'Nachbestellen'}
        </span></td>
      `;
      tbody.appendChild(row);
    });
  }

  // Initialize dashboard when page loads
  initializeDashboard();
});

window.viewInvoice = function(invoiceId) {
  const invoice = db.invoices.find(i => i.id === invoiceId);
  if (!invoice) return;

  const customer = db.customers.find(c => c.id === invoice.customerId);
  if (!customer) return;

  // Create modal dialog for invoice view
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  `;

  const content = document.createElement('div');
  content.style.cssText = `
    background: white;
    padding: 20px;
    border-radius: 8px;
    max-width: 800px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
  `;

  // Format items table
  const itemsTable = invoice.items.map(item => `
    <tr>
      <td>${item.name}</td>
      <td>${item.quantity}</td>
      <td>${item.price.toFixed(2)} €</td>
      <td>${(item.price * item.quantity).toFixed(2)} €</td>
    </tr>
  `).join('');

  content.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: start;">
      <div>
        <h2>Rechnung ${invoice.number}</h2>
        <p>Datum: ${new Date(invoice.date).toLocaleDateString()}</p>
      </div>
      <div style="text-align: right;">
        <strong>${db.settings.company.name}</strong><br>
        ${db.settings.company.address.replace(/\n/g, '<br>')}<br>
        ${db.settings.company.contact}<br>
        Steuernummer: ${db.settings.company.taxId}
      </div>
    </div>
    
    <div style="margin: 20px 0;">
      <strong>Kunde:</strong><br>
      ${invoice.customerName}<br>
      ${invoice.customerAddress.replace(/\n/g, '<br>')}
    </div>

    <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
      <thead>
        <tr>
          <th style="text-align: left;">Artikel</th>
          <th style="text-align: left;">Menge</th>
          <th style="text-align: left;">Preis (€)</th>
          <th style="text-align: left;">Gesamt (€)</th>
        </tr>
      </thead>
      <tbody>
        ${itemsTable}
      </tbody>
    </table>

    <div style="margin-top: 20px; text-align: right;">
      <p>Nettobetrag: ${invoice.subtotal.toFixed(2)} €</p>
      <p>MwSt. (${(invoice.vatRate * 100).toFixed(0)}%): ${invoice.vatAmount.toFixed(2)} €</p>
      <p><strong>Gesamtbetrag: ${invoice.total.toFixed(2)} €</strong></p>
    </div>

    <div style="margin-top: 20px; text-align: center;">
      <button onclick="this.closest('.modal').remove()" style="padding: 10px 20px;">Schließen</button>
    </div>
  `;

  modal.classList.add('modal');
  modal.appendChild(content);
  document.body.appendChild(modal);

  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
};

window.deleteInvoice = function(invoiceId) {
  if (confirm('Möchten Sie diese Rechnung wirklich löschen?')) {
    db.invoices = db.invoices.filter(i => i.id !== invoiceId);
    saveDB();
    refreshInvoiceTable();
  }
};