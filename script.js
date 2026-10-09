// ==========================================
// 1. ตั้งค่า GOOGLE APPS SCRIPT WEB APP URL
// ==========================================
// เปลี่ยน URL ตรงนี้เป็น URL ของ Google Apps Script ของคุณ
const GOOGLE_SCRIPT_URL = "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";

let itemsData = [];
let currentFilter = 'ALL';

// ==========================================
// 2. ระบบสลับธีม กลางวัน / กลางคืน (Nature Day/Night Mode)
// ==========================================
const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeIcon = document.getElementById('themeIcon');
const themeText = document.getElementById('themeText');

const savedTheme = localStorage.getItem('natureTheme') || 'day';
if (savedTheme === 'night') {
    enableNightMode();
} else {
    enableDayMode();
}

themeToggleBtn.addEventListener('click', () => {
    if (document.body.classList.contains('night-mode')) {
        enableDayMode();
    } else {
        enableNightMode();
    }
});

function enableDayMode() {
    document.body.classList.remove('night-mode');
    document.body.classList.add('day-mode');
    themeIcon.className = 'fa-solid fa-sun';
    themeText.textContent = 'โหมดกลางวัน';
    localStorage.setItem('natureTheme', 'day');
}

function enableNightMode() {
    document.body.classList.remove('day-mode');
    document.body.classList.add('night-mode');
    themeIcon.className = 'fa-solid fa-moon';
    themeText.textContent = 'โหมดกลางคืน';
    localStorage.setItem('natureTheme', 'night');
}

// ==========================================
// 3. จัดการแบบฟอร์มและการส่งข้อมูลไปยัง Google Sheet
// ==========================================
const lostFoundForm = document.getElementById('lostFoundForm');
const submitBtn = document.getElementById('submitBtn');

lostFoundForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        type: document.getElementById('type').value,
        itemName: document.getElementById('itemName').value,
        category: document.getElementById('category').value,
        date: document.getElementById('date').value,
        location: document.getElementById('location').value,
        contact: document.getElementById('contact').value,
        details: document.getElementById('details').value,
        timestamp: new Date().toLocaleString('th-TH')
    };

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังบันทึก...';

    if (GOOGLE_SCRIPT_URL && GOOGLE_SCRIPT_URL !== "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE") {
        try {
            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            alert('บันทึกข้อมูลสำเร็จ!');
            lostFoundForm.reset();
            fetchDataFromSheets();
        } catch (error) {
            console.error('Error:', error);
            alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        }
    } else {
        // ข้อมูลจำลองเมื่อยังไม่ได้ระบุ Google Sheet URL
        itemsData.unshift(formData);
        renderItems(itemsData);
        lostFoundForm.reset();
        alert('บันทึกข้อมูลตัวอย่างในระบบแล้ว (โปรดตั้งค่า Google Script URL เพื่อใช้ข้อมูลจริง)');
    }

    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> บันทึกข้อมูล';
});

// ==========================================
// 4. ดึงข้อมูลจาก Google Sheets
// ==========================================
async function fetchDataFromSheets() {
    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL === "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE") {
        // ข้อมูลตัวอย่างเริ่มต้น
        itemsData = [
            {
                type: 'LOST',
                itemName: 'กระเป๋าสตางค์หนังสีน้ำตาล',
                category: 'กระเป๋า/กระเป๋าสตางค์',
                date: '2026-10-08',
                location: 'ม้านั่งใต้ต้นไม้ สวนสาธารณะ',
                contact: '081-234-5678',
                details: 'มีบัตรประชาชนและบัตรเอทีเอ็ม'
            },
            {
                type: 'FOUND',
                itemName: 'กุญแจรถยนต์ Honda',
                category: 'อื่นๆ',
                date: '2026-10-09',
                location: 'ลานจอดรถ อาคาร B',
                contact: 'Line ID: nature_staff',
                details: 'พวงกุญแจรูปใบไม้'
            }
        ];
        renderItems(itemsData);
        return;
    }

    const loading = document.getElementById('loading');
    loading.classList.remove('hidden');

    try {
        const response = await fetch(GOOGLE_SCRIPT_URL);
        const data = await response.json();
        itemsData = data;
        renderItems(itemsData);
    } catch (error) {
        console.error('Error fetching data:', error);
    } finally {
        loading.classList.add('hidden');
    }
}

// ==========================================
// 5. แสดงผลรายการ (Render Cards & Filter)
// ==========================================
function renderItems(data) {
    const container = document.getElementById('itemsContainer');
    const searchVal = document.getElementById('searchInput').value.toLowerCase();

    const filtered = data.filter(item => {
        const matchFilter = (currentFilter === 'ALL') || (item.type === currentFilter);
        const matchSearch = item.itemName.toLowerCase().includes(searchVal) || 
                            item.location.toLowerCase().includes(searchVal) ||
                            item.category.toLowerCase().includes(searchVal);
        return matchFilter && matchSearch;
    });

    if (filtered.length === 0) {
        container.innerHTML = '<p style="text-align:center; color: var(--text-secondary); padding:2rem;">ไม่พบรายการข้อมูล</p>';
        return;
    }

    container.innerHTML = filtered.map(item => `
        <div class="item-card ${item.type}">
            <div class="item-top">
                <span class="item-title">${escapeHtml(item.itemName)}</span>
                <span class="badge ${item.type}">${item.type === 'LOST' ? 'ตามหาของหาย' : 'แจ้งพบของ'}</span>
            </div>
            <div class="item-info">
                <p><i class="fa-solid fa-folder"></i> ${escapeHtml(item.category)}</p>
                <p><i class="fa-solid fa-calendar"></i> ${escapeHtml(item.date)}</p>
                <p><i class="fa-solid fa-location-dot"></i> ${escapeHtml(item.location)}</p>
                <p><i class="fa-solid fa-phone"></i> ${escapeHtml(item.contact)}</p>
            </div>
            ${item.details ? `<div class="item-details"><i class="fa-solid fa-circle-info"></i> ${escapeHtml(item.details)}</div>` : ''}
        </div>
    `).join('');
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentFilter = e.target.getAttribute('data-filter');
        renderItems(itemsData);
    });
});

document.getElementById('searchInput').addEventListener('input', () => {
    renderItems(itemsData);
});

fetchDataFromSheets();