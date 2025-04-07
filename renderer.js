// Elementos DOM
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');
const printerSelect = document.getElementById('printer-select');
const saveSettingsBtn = document.getElementById('save-settings');
const previewReceiptBtn = document.getElementById('preview-receipt');
const printReceiptBtn = document.getElementById('print-receipt');
const previewInvoiceBtn = document.getElementById('preview-invoice');
const printInvoiceBtn = document.getElementById('print-invoice');
const addItemBtn = document.getElementById('add-item');
const invoiceItems = document.getElementById('invoice-items');
const invoiceTax = document.getElementById('invoice-tax');
const invoiceSubtotal = document.getElementById('invoice-subtotal');
const invoiceTotal = document.getElementById('invoice-total');
const previewModal = document.getElementById('preview-modal');
const previewContainer = document.getElementById('preview-container');
const modalPrintBtn = document.getElementById('modal-print');
const closeModalBtn = document.querySelector('.close');

// Variables globales
let currentPrinters = [];
let currentPreviewType = '';
let itemCounter = 1;

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
  // Cargar impresoras
  await loadPrinters();
  
  // Cargar configuración guardada
  await loadSettings();
  
  // Establecer fecha actual en los formularios
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('receipt-date').value = today;
  document.getElementById('invoice-date').value = today;
  
  // Inicializar cálculos de factura
  updateInvoiceCalculations();
});

// Cambio de pestañas
tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    // Remover clase activa de todos los botones y paneles
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabPanes.forEach(pane => pane.classList.remove('active'));
    
    // Agregar clase activa al botón clickeado y su panel correspondiente
    button.classList.add('active');
    const tabId = button.getAttribute('data-tab');
    document.getElementById(tabId).classList.add('active');
  });
});

// Cargar impresoras disponibles
async function loadPrinters() {
  try {
    currentPrinters = await window.electronAPI.getPrinters();
    
    // Limpiar select
    printerSelect.innerHTML = '<option value="">Seleccionar impresora...</option>';
    
    // Agregar impresoras al select
    currentPrinters.forEach(printer => {
      const option = document.createElement('option');
      option.value = printer.name;
      option.textContent = printer.name;
      printerSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error al cargar impresoras:', error);
    alert('No se pudieron cargar las impresoras. Por favor, intente nuevamente.');
  }
}

// Cargar configuración guardada
async function loadSettings() {
  try {
    const settings = await window.electronAPI.getSettings();
    
    if (settings) {
      document.getElementById('business-name').value = settings.businessName || '';
      document.getElementById('business-address').value = settings.businessAddress || '';
      document.getElementById('business-phone').value = settings.businessPhone || '';
      document.getElementById('business-email').value = settings.businessEmail || '';
      
      if (settings.printerName) {
        printerSelect.value = settings.printerName;
      }
    }
  } catch (error) {
    console.error('Error al cargar configuración:', error);
  }
}

// Guardar configuración
saveSettingsBtn.addEventListener('click', async () => {
  const settings = {
    businessName: document.getElementById('business-name').value,
    businessAddress: document.getElementById('business-address').value,
    businessPhone: document.getElementById('business-phone').value,
    businessEmail: document.getElementById('business-email').value,
    printerName: printerSelect.value
  };
  
  try {
    await window.electronAPI.saveSettings(settings);
    alert('Configuración guardada correctamente.');
  } catch (error) {
    console.error('Error al guardar configuración:', error);
    alert('Error al guardar la configuración. Por favor, intente nuevamente.');
  }
});

// Agregar nuevo ítem a la factura
addItemBtn.addEventListener('click', () => {
  itemCounter++;
  
  const newItem = document.createElement('div');
  newItem.className = 'invoice-item';
  newItem.innerHTML = `
    <div class="form-row">
      <div class="form-group">
        <label for="item-description-${itemCounter}">Descripción:</label>
        <input type="text" id="item-description-${itemCounter}" class="item-description" required>
      </div>
      
      <div class="form-group">
        <label for="item-quantity-${itemCounter}">Cantidad:</label>
        <input type="number" id="item-quantity-${itemCounter}" class="item-quantity" min="1" value="1" required>
      </div>
      
      <div class="form-group">
        <label for="item-price-${itemCounter}">Precio Unitario:</label>
        <input type="number" id="item-price-${itemCounter}" class="item-price" step="0.01" required>
      </div>
      
      <div class="form-group">
        <label for="item-total-${itemCounter}">Total:</label>
        <input type="number" id="item-total-${itemCounter}" class="item-total" step="0.01" readonly>
      </div>
    </div>
    <button type="button" class="remove-item">Eliminar</button>
  `;
  
  invoiceItems.appendChild(newItem);
  
  // Agregar eventos a los nuevos campos
  const newQuantityInput = document.getElementById(`item-quantity-${itemCounter}`);
  const newPriceInput = document.getElementById(`item-price-${itemCounter}`);
  const newTotalInput = document.getElementById(`item-total-${itemCounter}`);
  const removeButton = newItem.querySelector('.remove-item');
  
  newQuantityInput.addEventListener('input', () => updateItemTotal(newQuantityInput, newPriceInput, newTotalInput));
  newPriceInput.addEventListener('input', () => updateItemTotal(newQuantityInput, newPriceInput, newTotalInput));
  removeButton.addEventListener('click', () => {
    newItem.remove();
    updateInvoiceCalculations();
  });
});

// Actualizar total de un ítem
function updateItemTotal(quantityInput, priceInput, totalInput) {
  const quantity = parseFloat(quantityInput.value) || 0;
  const price = parseFloat(priceInput.value) || 0;
  const total = quantity * price;
  
  totalInput.value = total.toFixed(2);
  updateInvoiceCalculations();
}

// Actualizar cálculos de la factura
function updateInvoiceCalculations() {
  // Calcular subtotal
  let subtotal = 0;
  document.querySelectorAll('.item-total').forEach(input => {
    subtotal += parseFloat(input.value) || 0;
  });
  
  // Actualizar subtotal
  invoiceSubtotal.value = subtotal.toFixed(2);
  
  // Calcular impuesto
  const taxRate = parseFloat(invoiceTax.value) || 0;
  const taxAmount = subtotal * (taxRate / 100);
  
  // Calcular total
  const total = subtotal + taxAmount;
  invoiceTotal.value = total.toFixed(2);
}

// Eventos para cálculos de factura
invoiceTax.addEventListener('input', updateInvoiceCalculations);

// Inicializar cálculos para el primer ítem
const firstQuantityInput = document.getElementById('item-quantity-1');
const firstPriceInput = document.getElementById('item-price-1');
const firstTotalInput = document.getElementById('item-total-1');

firstQuantityInput.addEventListener('input', () => updateItemTotal(firstQuantityInput, firstPriceInput, firstTotalInput));
firstPriceInput.addEventListener('input', () => updateItemTotal(firstQuantityInput, firstPriceInput, firstTotalInput));

// Vista previa de recibo
previewReceiptBtn.addEventListener('click', () => {
  const receiptNumber = document.getElementById('receipt-number').value;
  const receiptDate = document.getElementById('receipt-date').value;
  const receiptCustomer = document.getElementById('receipt-customer').value;
  const receiptAmount = document.getElementById('receipt-amount').value;
  const receiptConcept = document.getElementById('receipt-concept').value;
  
  if (!receiptNumber || !receiptDate || !receiptCustomer || !receiptAmount || !receiptConcept) {
    alert('Por favor, complete todos los campos del recibo.');
    return;
  }
  
  // Obtener configuración del negocio
  const businessName = document.getElementById('business-name').value;
  const businessAddress = document.getElementById('business-address').value;
  const businessPhone = document.getElementById('business-phone').value;
  
  // Generar HTML del recibo
  const receiptHTML = generateReceiptHTML(
    businessName,
    businessAddress,
    businessPhone,
    receiptNumber,
    receiptDate,
    receiptCustomer,
    receiptAmount,
    receiptConcept
  );
  
  // Mostrar vista previa
  showPreview('receipt', receiptHTML);
});

// Vista previa de factura
previewInvoiceBtn.addEventListener('click', () => {
  const invoiceNumber = document.getElementById('invoice-number').value;
  const invoiceDate = document.getElementById('invoice-date').value;
  const invoiceCustomer = document.getElementById('invoice-customer').value;
  const invoiceCustomerId = document.getElementById('invoice-customer-id').value;
  const invoiceSubtotalValue = invoiceSubtotal.value;
  const invoiceTaxValue = invoiceTax.value;
  const invoiceTotalValue = invoiceTotal.value;
  
  if (!invoiceNumber || !invoiceDate || !invoiceCustomer || invoiceSubtotalValue === '0.00') {
    alert('Por favor, complete todos los campos de la factura y agregue al menos un producto.');
    return;
  }
  
  // Obtener configuración del negocio
  const businessName = document.getElementById('business-name').value;
  const businessAddress = document.getElementById('business-address').value;
  const businessPhone = document.getElementById('business-phone').value;
  
  // Obtener ítems de la factura
  const items = [];
  document.querySelectorAll('.invoice-item').forEach(itemElement => {
    const description = itemElement.querySelector('.item-description').value;
    const quantity = itemElement.querySelector('.item-quantity').value;
    const price = itemElement.querySelector('.item-price').value;
    const total = itemElement.querySelector('.item-total').value;
    
    if (description && quantity && price) {
      items.push({ description, quantity, price, total });
    }
  });
  
  // Generar HTML de la factura
  const invoiceHTML = generateInvoiceHTML(
    businessName,
    businessAddress,
    businessPhone,
    invoiceNumber,
    invoiceDate,
    invoiceCustomer,
    invoiceCustomerId,
    items,
    invoiceSubtotalValue,
    invoiceTaxValue,
    invoiceTotalValue
  );
  
  // Mostrar vista previa
  showPreview('invoice', invoiceHTML);
});

// Mostrar vista previa
function showPreview(type, html) {
  currentPreviewType = type;
  previewContainer.innerHTML = html;
  previewModal.style.display = 'block';
}

// Cerrar modal
closeModalBtn.addEventListener('click', () => {
  previewModal.style.display = 'none';
});

// Cerrar modal al hacer clic fuera del contenido
window.addEventListener('click', (event) => {
  if (event.target === previewModal) {
    previewModal.style.display = 'none';
  }
});

// Imprimir desde el modal
modalPrintBtn.addEventListener('click', async () => {
  const printerName = printerSelect.value;
  
  if (!printerName) {
    alert('Por favor, seleccione una impresora en la configuración.');
    return;
  }
  
  const content = previewContainer.innerHTML;
  
  try {
    const result = await window.electronAPI.printContent({
      content,
      printerName,
      silent: true
    });
    
    if (result.success) {
      alert('Documento enviado a la impresora correctamente.');
      previewModal.style.display = 'none';
    } else {
      alert(`Error al imprimir: ${result.error}`);
    }
  } catch (error) {
    console.error('Error al imprimir:', error);
    alert('Error al imprimir. Por favor, intente nuevamente.');
  }
});

// Imprimir recibo directamente
printReceiptBtn.addEventListener('click', () => {
  previewReceiptBtn.click();
  setTimeout(() => {
    modalPrintBtn.click();
  }, 500);
});

// Imprimir factura directamente
printInvoiceBtn.addEventListener('click', () => {
  previewInvoiceBtn.click();
  setTimeout(() => {
    modalPrintBtn.click();
  }, 500);
});

// Generar HTML del recibo
function generateReceiptHTML(businessName, businessAddress, businessPhone, number, date, customer, amount, concept) {
  const formattedDate = new Date(date).toLocaleDateString();
  const formattedAmount = parseFloat(amount).toFixed(2);
  
  return `
    <div class="receipt-preview">
      <div class="receipt-header">
        <h2>${businessName || 'Mi Negocio'}</h2>
        <p>${businessAddress || 'Dirección del negocio'}</p>
        <p>Tel: ${businessPhone || 'Teléfono'}</p>
        <h3>RECIBO DE PAGO</h3>
        <p>No. ${number}</p>
        <p>Fecha: ${formattedDate}</p>
      </div>
      
      <div class="receipt-body">
        <p><strong>Cliente:</strong> ${customer}</p>
        <p><strong>Monto:</strong> $${formattedAmount}</p>
        <p><strong>Concepto:</strong> ${concept}</p>
      </div>
      
      <div class="receipt-footer">
        <p>Gracias por su pago</p>
        <div class="signature-line">
          <p>____________________________</p>
          <p>Firma Autorizada</p>
        </div>
      </div>
    </div>
  `;
}

// Generar HTML de la factura
function generateInvoiceHTML(businessName, businessAddress, businessPhone, number, date, customer, customerId, items, subtotal, taxRate, total) {
  const formattedDate = new Date(date).toLocaleDateString();
  
  // Generar filas de ítems
  let itemsHTML = '';
  items.forEach(item => {
    itemsHTML += `
      <tr>
        <td>${item.description}</td>
        <td>${item.quantity}</td>
        <td>$${parseFloat(item.price).toFixed(2)}</td>
        <td>$${parseFloat(item.total).toFixed(2)}</td>
      </tr>
    `;
  });
  
  return `
    <div class="invoice-preview">
      <div class="invoice-header">
        <h2>${businessName || 'Mi Negocio'}</h2>
        <p>${businessAddress || 'Dirección del negocio'}</p>
        <p>Tel: ${businessPhone || 'Teléfono'}</p>
        <h3>FACTURA</h3>
        <p>No. ${number}</p>
        <p>Fecha: ${formattedDate}</p>
      </div>
      
      <div class="invoice-client">
        <p><strong>Cliente:</strong> ${customer}</p>
        ${customerId ? `<p><strong>ID/NIT:</strong> ${customerId}</p>` : ''}
      </div>
      
      <div class="invoice-items">
        <table>
          <thead>
            <tr>
              <th>Descripción</th>
              <th>Cantidad</th>
              <th>Precio Unit.</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" class="text-right"><strong>Subtotal:</strong></td>
              <td>$${parseFloat(subtotal).toFixed(2)}</td>
            </tr>
            <tr>
              <td colspan="3" class="text-right"><strong>Impuesto (${taxRate}%):</strong></td>
              <td>$${(parseFloat(subtotal) * parseFloat(taxRate) / 100).toFixed(2)}</td>
            </tr>
            <tr>
              <td colspan="3" class="text-right"><strong>Total:</strong></td>
              <td>$${parseFloat(total).toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <div class="invoice-footer">
        <p>Gracias por su compra</p>
        <div class="signature-line">
          <p>____________________________</p>
          <p>Firma Autorizada</p>
        </div>
      </div>
    </div>
  `;
}
