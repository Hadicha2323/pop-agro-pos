// ===== SANANI CHIQARISH =====
document.getElementById('currentDate').textContent = new Date().toLocaleString('uz-UZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
});

// ===== SOZLAMLARNI YUKLASH =====
function loadSettings() {
    var settings = JSON.parse(localStorage.getItem('shopSettings')) || {
        shopName: 'Pop Agro POSS',
        shopOwner: '',
        shopPhone: '+998 77 727 2113',
        shopAddress: '',
        receiptTitle: 'Pop Agro POSS',
        receiptFooter: '🌟 Rahmat! Xaridingiz uchun tashakkur!',
        receiptWebsite: 'www.popagro.uz',
        defaultDiscount: 10
    };
    
    document.getElementById('shopName').value = settings.shopName || '';
    document.getElementById('shopOwner').value = settings.shopOwner || '';
    document.getElementById('shopPhone').value = settings.shopPhone || '';
    document.getElementById('shopAddress').value = settings.shopAddress || '';
    document.getElementById('receiptTitle').value = settings.receiptTitle || 'Pop Agro POSS';
    document.getElementById('receiptFooter').value = settings.receiptFooter || '🌟 Rahmat! Xaridingiz uchun tashakkur!';
    document.getElementById('receiptWebsite').value = settings.receiptWebsite || 'www.popagro.uz';
    document.getElementById('defaultDiscount').value = settings.defaultDiscount || 10;
    
    updatePreview(settings);
}

// ===== CHEK PREVYU YANGILASH =====
function updatePreview(settings) {
    document.getElementById('previewTitle').textContent = settings.receiptTitle || 'Pop Agro POSS';
    document.getElementById('previewShop').textContent = settings.shopName || 'Do\'kon nomi';
    document.getElementById('previewPhone').textContent = '📞 ' + (settings.shopPhone || '+998 90 123 45 67');
    document.getElementById('previewAddress').textContent = '📍 ' + (settings.shopAddress || 'Manzil');
    document.getElementById('previewFooter').innerHTML = '<p class="thankyou">' + (settings.receiptFooter || '🌟 Rahmat!') + '</p><p>' + (settings.receiptWebsite || 'www.popagro.uz') + '</p>';
}

// ===== DO'KON MA'LUMOTLARINI SAQLASH =====
document.getElementById('shopForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    var settings = JSON.parse(localStorage.getItem('shopSettings')) || {};
    settings.shopName = document.getElementById('shopName').value.trim();
    settings.shopOwner = document.getElementById('shopOwner').value.trim();
    settings.shopPhone = document.getElementById('shopPhone').value.trim();
    settings.shopAddress = document.getElementById('shopAddress').value.trim();
    
    localStorage.setItem('shopSettings', JSON.stringify(settings));
    updatePreview(settings);
    
    alert('✅ Do\'kon ma\'lumotlari saqlandi!');
});

// ===== CHEK SOZLAMALARINI SAQLASH =====
document.getElementById('receiptForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    var settings = JSON.parse(localStorage.getItem('shopSettings')) || {};
    settings.receiptTitle = document.getElementById('receiptTitle').value.trim();
    settings.receiptFooter = document.getElementById('receiptFooter').value.trim();
    settings.receiptWebsite = document.getElementById('receiptWebsite').value.trim();
    settings.defaultDiscount = parseInt(document.getElementById('defaultDiscount').value) || 10;
    
    localStorage.setItem('shopSettings', JSON.stringify(settings));
    updatePreview(settings);
    
    alert('✅ Chek sozlamalari saqlandi!');
});

// ===== REAL VAQTDA PREVYU YANGILASH =====
document.querySelectorAll('#shopForm input, #receiptForm input').forEach(function(input) {
    input.addEventListener('input', function() {
        var settings = JSON.parse(localStorage.getItem('shopSettings')) || {};
        settings.shopName = document.getElementById('shopName').value.trim() || 'Do\'kon nomi';
        settings.shopPhone = document.getElementById('shopPhone').value.trim() || '+998 90 123 45 67';
        settings.shopAddress = document.getElementById('shopAddress').value.trim() || 'Manzil';
        settings.receiptTitle = document.getElementById('receiptTitle').value.trim() || 'Pop Agro POSS';
        settings.receiptFooter = document.getElementById('receiptFooter').value.trim() || '🌟 Rahmat!';
        settings.receiptWebsite = document.getElementById('receiptWebsite').value.trim() || 'www.popagro.uz';
        updatePreview(settings);
    });
});

// ===== BOSHLANG'ICH =====
loadSettings();
