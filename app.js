// ==========================================
// 0. ตั้งค่า Google Apps Script Web App URL
// ==========================================
const API_URL = "https://script.google.com/macros/s/AKfycbye3mAfj40ndasJtGfUNULFveY7qkysknRtoiydz-EVoiiSuZ68uDhH0EfXUXmw3ihB/exec";

// ==========================================
// 1. ระบบ ภาษา (i18n) และ State หลัก
// ==========================================
const dict = {
  th: {
    subTitle: "ระบบจองห้องประชุม",
    navRoomsStatus: "สถานะห้องประชุม",
    navSettings: "ตั้งค่าระบบ",
    sidebarTitle: "ห้องประชุมทั้งหมด",
    prev: "‹ ย้อนหลัง",
    next: "ถัดไป ›",
    today: "วันนี้",
    noRooms: "ไม่มีห้องประชุม กรุณาเพิ่มในเมนูตั้งค่า",
    selectRoomPrompt: "กรุณาเลือกหรือเพิ่มห้องประชุมจากเมนูตั้งค่า",
    cap: "คน",
    modalBkTitle: "จองห้องประชุม",
    lblTopic: "หัวข้อการประชุม",
    lblBooker: "ชื่อผู้จอง",
    lblStart: "เวลาเริ่ม",
    lblEnd: "เวลาสิ้นสุด",
    btnCancel: "ยกเลิก",
    btnConfirm: "ยืนยันการจอง",
    modalDetailTitle: "รายละเอียดการจอง",
    btnDeleteBk: "ลบรายการจอง",
    btnClose: "ปิด",
    modalSettingTitle: "ตั้งค่าระบบ",
    lblCompany: "ชื่อบริษัท / องค์กร",
    lblLogo: "โลโก้บริษัท (Logo)",
    lblBg: "ภาพพื้นหลัง (Background)",
    lblStartHour: "เวลาเริ่มทำการ",
    lblEndHour: "เวลาสิ้นสุดทำการ",
    lblManageRooms: "จัดการห้องประชุม",
    btnAddRoom: "เพิ่มห้องใหม่",
    btnSave: "บันทึกการตั้งค่า",
    lblRoomImg: "รูปภาพห้องประชุม",
    lblRoomName: "ชื่อห้องประชุม",
    lblCap: "ความจุ (คน)",
    lblLoc: "สถานที่ / ชั้น",
    lblSlotDuration: "ระยะเวลาช่วงการจอง",
    btnSaveRoom: "บันทึกห้องประชุม",
    homeTimelineTitle: "ตารางการใช้งานห้องประชุมวันนี้",
    btnGoBook: "จองห้องนี้",
    statusFree: "ว่างทั้งวัน",
    statusBusy: "จองแล้ว",
    fillAll: "กรุณากรอกข้อมูลให้ครบถ้วน",
    conflictErr: "ช่วงเวลานี้มีการจองซ้ำซ้อน กรุณาเลือกเวลาอื่น",
    saved: "บันทึกเรียบร้อย",
    deleted: "ลบเรียบร้อย",
    lblDate: "วันที่",
    lblTime: "เวลา"
  },
  en: {
    subTitle: "Room Booking System",
    navRoomsStatus: "Rooms Status",
    navSettings: "Settings",
    sidebarTitle: "MEETING ROOMS",
    prev: "‹ Prev",
    next: "Next ›",
    today: "Today",
    noRooms: "No rooms available. Please add in Settings.",
    selectRoomPrompt: "Please select or add a room from Settings.",
    cap: "persons",
    modalBkTitle: "Book a Room",
    lblTopic: "Meeting Subject",
    lblBooker: "Booked By",
    lblStart: "Start Time",
    lblEnd: "End Time",
    btnCancel: "Cancel",
    btnConfirm: "Confirm Booking",
    modalDetailTitle: "Booking Details",
    btnDeleteBk: "Delete Booking",
    btnClose: "Close",
    modalSettingTitle: "System Settings",
    lblCompany: "Company / Organization Name",
    lblLogo: "Company Logo",
    lblBg: "Background Image",
    lblStartHour: "Operating Start Time",
    lblEndHour: "Operating End Time",
    lblManageRooms: "Manage Rooms",
    btnAddRoom: "Add Room",
    btnSave: "Save Settings",
    lblRoomImg: "Room Photo",
    lblRoomName: "Room Name",
    lblCap: "Capacity",
    lblLoc: "Location / Floor",
    lblSlotDuration: "Time Slot Interval",
    btnSaveRoom: "Save Room",
    homeTimelineTitle: "Daily Schedule Overview",
    btnGoBook: "Book Room",
    statusFree: "Available All Day",
    statusBusy: "Booked",
    fillAll: "Please fill in all fields",
    conflictErr: "Time slot conflict. Please choose another time.",
    saved: "Saved successfully",
    deleted: "Deleted successfully",
    lblDate: "Date",
    lblTime: "Time"
  }
};

let state = {
  lang: localStorage.getItem('cfg_lang') || 'th',
  currentView: 'home',
  companyName: localStorage.getItem('cfg_companyName') || 'IA103',
  logo: localStorage.getItem('cfg_logo') || '',
  bg: localStorage.getItem('cfg_bg') || '',
  startHour: parseInt(localStorage.getItem('cfg_startHour')) || 8,
  endHour: parseInt(localStorage.getItem('cfg_endHour')) || 19,
  rooms: [],
  bookings: [],
  selectedRoomId: null,
  selectedDate: fmtDate(new Date()),
  editingRoomId: null,
  pendingSlot: null,
  activeDetailId: null
};

// ==========================================
// 2. Helper Functions
// ==========================================
function saveConfig() {
  localStorage.setItem('cfg_lang', state.lang);
  localStorage.setItem('cfg_companyName', state.companyName);
  localStorage.setItem('cfg_logo', state.logo);
  localStorage.setItem('cfg_bg', state.bg);
  localStorage.setItem('cfg_startHour', state.startHour);
  localStorage.setItem('cfg_endHour', state.endHour);
}

function t(key) { return dict[state.lang][key] || key; }

function setLanguage(lang) {
  state.lang = lang;
  saveConfig();
  updateI18nTexts();
  renderSidebar();
  renderMain();
  if (state.activeDetailId) openBookingDetail(state.activeDetailId);
}

function updateI18nTexts() {
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
  const activeBtn = document.getElementById(state.lang === 'th' ? 'langTH' : 'langEN');
  if (activeBtn) activeBtn.classList.add('active');
  
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.getAttribute('data-i18n');
    if (dict[state.lang][k]) el.textContent = dict[state.lang][k];
  });
}

function fmtDate(d) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

function generateTimeSlots(step = 30) {
  const slots = [];
  for (let m = state.startHour * 60; m <= state.endHour * 60; m += step) {
    const h = String(Math.floor(m / 60)).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    slots.push(`${h}:${mm}`);
  }
  return slots;
}
function timeToMin(t) { const [h, m] = String(t).split(':').map(Number); return h * 60 + m; }

function showToast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg; el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2000);
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

function applyBranding() {
  const compEl = document.getElementById('displayCompanyName');
  if (compEl) compEl.textContent = state.companyName;
  
  const logoContainer = document.getElementById('displayLogo');
  if (logoContainer) {
    if (state.logo) {
      logoContainer.innerHTML = `<img src="${state.logo}">`;
    } else {
      logoContainer.innerHTML = `<svg class="icon" style="width:28px;height:28px;"><use href="#icon-door"></use></svg>`;
    }
  }

  const bgOverlay = document.getElementById('bgOverlay');
  if (bgOverlay) {
    bgOverlay.style.backgroundImage = state.bg ? `url('${state.bg}')` : 'none';
  }
}

// ==========================================
// 3. Render UI
// ==========================================
function renderSidebar() {
  const homeBtn = document.getElementById('btnNavHome');
  if (homeBtn) {
    if (state.currentView === 'home') homeBtn.classList.add('active');
    else homeBtn.classList.remove('active');
  }

  const list = document.getElementById('roomList');
  if (!list) return;
  
  if (state.rooms.length === 0) {
    list.innerHTML = `<p style="font-size:12px; color:var(--ink-soft); text-align:center; padding:20px;">${t('noRooms')}</p>`;
    return;
  }
  
  list.innerHTML = state.rooms.map(r => `
    <div class="room-card ${state.currentView === 'room' && String(r.id) === String(state.selectedRoomId) ? 'active' : ''}" onclick="selectRoom('${r.id}')">
      <div class="room-thumb" style="${r.image ? `background-image:url('${r.image}')` : ''}">
        ${r.image ? '' : '<svg class="icon"><use href="#icon-door"></use></svg>'}
      </div>
      <div class="room-info">
        <div class="room-name">${escapeHtml(r.name)}</div>
        <div class="room-meta">
          <svg class="icon" style="width:13px;height:13px;stroke-width:2;"><use href="#icon-users"></use></svg>
          <span>${r.capacity || '-'} ${t('cap')} · ${escapeHtml(r.location || '')}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function selectRoom(id) {
  state.selectedRoomId = String(id);
  state.currentView = 'room';
  renderSidebar();
  renderMain();
}

function switchView(view) {
  state.currentView = view;
  renderSidebar();
  renderMain();
}

function renderMain() {
  const main = document.getElementById('mainArea');
  if (!main) return;
  
  if (state.currentView === 'home') {
    renderHomeView(main);
    return;
  }

  const room = state.rooms.find(r => String(r.id) === String(state.selectedRoomId));
  if (!room) {
    main.innerHTML = `<div style="text-align:center; margin:auto; color:var(--ink-soft);">${t('selectRoomPrompt')}</div>`;
    return;
  }

  main.innerHTML = `
    <div class="schedule-controls">
      <div class="date-nav">
        <button class="btn btn-glass btn-sm" onclick="shiftDate(-1)">${t('prev')}</button>
        <div class="glass-date-input">
          <svg class="icon" style="margin-right:6px;"><use href="#icon-calendar"></use></svg>
          <input type="date" id="dateInput" value="${state.selectedDate}" onchange="changeDate(this.value)">
        </div>
        <button class="btn btn-glass btn-sm" onclick="shiftDate(1)">${t('next')}</button>
        <button class="btn btn-glass btn-sm" onclick="changeDate('${fmtDate(new Date())}')">${t('today')}</button>
      </div>
    </div>

    <div class="booking-layout-grid">
      <div class="schedule-card">
        <table class="grid" id="scheduleGrid"></table>
      </div>

      <div class="room-preview-col">
        <div class="room-preview-img" style="${room.image ? `background-image:url('${room.image}')` : ''}">
          ${!room.image ? '<svg class="icon" style="width:32px;height:32px;"><use href="#icon-door"></use></svg>' : ''}
        </div>
        <div class="room-preview-details">
          <h3>${escapeHtml(room.name)}</h3>
          <div class="detail-item">
            <svg class="icon"><use href="#icon-location"></use></svg>
            <span>${escapeHtml(room.location || '-')}</span>
          </div>
          <div class="detail-item">
            <svg class="icon"><use href="#icon-users"></use></svg>
            <span>${room.capacity || '-'} ${t('cap')}</span>
          </div>
          <div class="detail-item">
            <svg class="icon"><use href="#icon-clock"></use></svg>
            <span>${room.step || 30} mins slot</span>
          </div>
        </div>
      </div>
    </div>
  `;
  renderGrid(room);
}

function renderHomeView(main) {
  const dayBookings = state.bookings.filter(b => String(b.date).trim() === String(state.selectedDate).trim());
  
  const scaleHours = [];
  for (let h = state.startHour; h <= state.endHour; h++) {
    scaleHours.push(String(h).padStart(2, '0') + ':00');
  }
  const timeScaleHtml = `
    <div class="timeline-time-scale">
      ${scaleHours.map(t => `<span>${t}</span>`).join('')}
    </div>
  `;
  
  const roomRows = state.rooms.map(room => {
    const rBookings = dayBookings.filter(b => String(b.roomId) === String(room.id));    
    return `
      <div class="timeline-row">
        <div class="timeline-room-header">
          <div class="timeline-room-title">
            <svg class="icon"><use href="#icon-door"></use></svg>
            ${escapeHtml(room.name)}
            <span style="font-size:12px; font-weight:normal; color:var(--ink-soft);">(${room.capacity} ${t('cap')})</span>
          </div>
          <button class="btn btn-glass btn-sm" onclick="selectRoom('${room.id}')">${t('btnGoBook')}</button>
        </div>
        ${timeScaleHtml}
        <div class="timeline-bar">
          ${renderTimelineSegments(rBookings)}
        </div>
      </div>
    `;
  }).join('');

  main.innerHTML = `
    <div class="schedule-controls" style="margin-bottom:10px;">
      <h2 style="font-size:18px; font-weight:700;">${t('homeTimelineTitle')}</h2>
      <div class="date-nav">
        <button class="btn btn-glass btn-sm" onclick="shiftDate(-1)">${t('prev')}</button>
        <div class="glass-date-input">
          <svg class="icon" style="margin-right:6px;"><use href="#icon-calendar"></use></svg>
          <input type="date" value="${state.selectedDate}" onchange="changeDate(this.value)">
        </div>
        <button class="btn btn-glass btn-sm" onclick="shiftDate(1)">${t('next')}</button>
        <button class="btn btn-glass btn-sm" onclick="changeDate('${fmtDate(new Date())}')">${t('today')}</button>
      </div>
    </div>
    <div class="home-timeline-container">
      ${roomRows || `<p style="text-align:center; padding:40px; color:var(--ink-soft);">${t('noRooms')}</p>`}
    </div>
  `;
}

function renderTimelineSegments(bookings) {
  if (bookings.length === 0) {
    return `<div class="timeline-segment free" style="width:100%;">${t('statusFree')}</div>`;
  }
  
  const startDay = state.startHour * 60;
  const endDay = state.endHour * 60;
  const totalMins = endDay - startDay;

  let html = '';
  let currentMin = startDay;

  bookings.sort((a, b) => timeToMin(a.start) - timeToMin(b.start)).forEach(b => {
    const bStart = timeToMin(b.start);
    const bEnd = timeToMin(b.end);

    if (bStart > currentMin) {
      const freeW = ((bStart - currentMin) / totalMins) * 100;
      html += `<div class="timeline-segment free" style="width:${freeW}%;"></div>`;
    }

    const busyW = ((bEnd - bStart) / totalMins) * 100;
    html += `<div class="timeline-segment busy" style="width:${busyW}%;" title="${b.start}-${b.end}">${t('statusBusy')}</div>`;
    currentMin = bEnd;
  });

  if (currentMin < endDay) {
    const freeW = ((endDay - currentMin) / totalMins) * 100;
    html += `<div class="timeline-segment free" style="width:${freeW}%;"></div>`;
  }

  return html;
}

function shiftDate(delta) {
  const d = new Date(state.selectedDate + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  state.selectedDate = fmtDate(d);
  renderMain();
}

function changeDate(val) {
  state.selectedDate = val;
  renderMain();
}

function renderGrid(room) {
  const step = Number(room.step) || 30;
  const slots = generateTimeSlots(step).slice(0, -1);
  const dayBookings = state.bookings
    .filter(b => String(b.roomId) === String(room.id) && String(b.date).trim() === String(state.selectedDate).trim())
    .sort((a, b) => timeToMin(a.start) - timeToMin(b.start));
    
  const bookingByStart = {};
  dayBookings.forEach((b, idx) => {
    b._colorIdx = idx % 2;
    bookingByStart[b.start] = b;
  });

  let skip = 0;
  const rows = slots.map(slot => {
    let cell;
    if (skip > 0) {
      skip--;
      cell = '';
    } else {
      const b = bookingByStart[slot];
      if (b) {
        const span = Math.round((timeToMin(b.end) - timeToMin(b.start)) / step);
        skip = span - 1;
        cell = `<td rowspan="${span}" class="booked-slot color-${b._colorIdx}" onclick="openBookingDetail('${b.id}')">
          <div class="booking-title">${escapeHtml(b.title)}</div>
          <div class="booking-meta">
            <span><svg class="icon"><use href="#icon-clock"></use></svg> ${b.start} - ${b.end}</span>
            <span>👤 ${escapeHtml(b.bookedBy)}</span>
          </div>
        </td>`;
      } else {
        cell = `<td class="empty-slot" onclick="openBookingModal('${room.id}', '${slot}')"></td>`;
      }
    }
    return `<tr><td class="time-label">${slot}</td>${cell}</tr>`;
  }).join('');

  const gridEl = document.getElementById('scheduleGrid');
  if (gridEl) gridEl.innerHTML = rows;
}

// ==========================================
// 4. Modal Booking & Action
// ==========================================
function openBookingModal(roomId, startSlot) {
  const room = state.rooms.find(r => String(r.id) === String(roomId));
  const step = room ? (Number(room.step) || 30) : 30;

  state.pendingSlot = { roomId: String(roomId), step };
  document.getElementById('bkTitle').value = '';
  document.getElementById('bkBy').value = '';
  document.getElementById('bkError').classList.remove('show');

  const slots = generateTimeSlots(step);
  const startSel = document.getElementById('bkStart');
  const endSel = document.getElementById('bkEnd');

  startSel.innerHTML = slots.slice(0, -1).map(s => `<option value="${s}" ${s === startSlot ? 'selected' : ''}>${s}</option>`).join('');
  
  function updateEndOptions() {
    const curStart = startSel.value;
    const availableEnds = slots.filter(s => timeToMin(s) > timeToMin(curStart));
    endSel.innerHTML = availableEnds.map((s, i) => `<option value="${s}" ${i === 0 ? 'selected' : ''}>${s}</option>`).join('');
  }
  
  startSel.onchange = updateEndOptions;
  updateEndOptions();

  document.getElementById('bookingOverlay').classList.add('open');
}

document.getElementById('bkSave').onclick = () => {
  const title = document.getElementById('bkTitle').value.trim();
  const by = document.getElementById('bkBy').value.trim();
  const start = document.getElementById('bkStart').value;
  const end = document.getElementById('bkEnd').value;
  const errEl = document.getElementById('bkError');

  if (!title || !by) {
    errEl.textContent = t('fillAll');
    errEl.classList.add('show');
    return;
  }

  const startMin = timeToMin(start);
  const endMin = timeToMin(end);

  const conflict = state.bookings.some(b => 
    String(b.roomId) === String(state.pendingSlot.roomId) &&
    String(b.date).trim() === String(state.selectedDate).trim() &&
    !(endMin <= timeToMin(b.start) || startMin >= timeToMin(b.end))
  );

  if (conflict) {
    errEl.textContent = t('conflictErr');
    errEl.classList.add('show');
    return;
  }

  const newBooking = {
    id: String(uid()),
    roomId: String(state.pendingSlot.roomId),
    date: String(state.selectedDate),
    start, end, title, bookedBy: by
  };

  showToast('กำลังบันทึกข้อมูล...');

  // ใช้ POST ร่วมกับ mode: 'no-cors' เพื่อแก้ไขปัญหา CORS กับ Google Apps Script
  fetch(API_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'addBooking',
      booking: newBooking
    })
  })
  .then(() => {
    state.bookings.push(newBooking);
    document.getElementById('bookingOverlay').classList.remove('open');
    renderMain();
    showToast(t('saved'));
  })
  .catch(err => {
    console.error(err);
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ');
  });
};

document.getElementById('bookingModalClose').onclick = () => document.getElementById('bookingOverlay').classList.remove('open');
document.getElementById('bkCancel').onclick = () => document.getElementById('bookingOverlay').classList.remove('open');

function openBookingDetail(bookingId) {
  state.activeDetailId = String(bookingId);
  const b = state.bookings.find(x => String(x.id) === String(bookingId));
  if (!b) return;
  const room = state.rooms.find(r => String(r.id) === String(b.roomId));

  document.getElementById('detailBody').innerHTML = `
    <div style="font-size:14px; line-height:1.8;">
      <p><strong>${t('lblTopic')}:</strong> ${escapeHtml(b.title)}</p>
      <p><strong>${t('lblBooker')}:</strong> ${escapeHtml(b.bookedBy)}</p>
      <p><strong>${t('lblRoomName')}:</strong> ${escapeHtml(room ? room.name : '')}</p>
      <p><strong>${t('lblDate')}:</strong> ${b.date}</p>
      <p><strong>${t('lblTime')}:</strong> ${b.start} - ${b.end}</p>
    </div>
  `;
  document.getElementById('detailOverlay').classList.add('open');
}

document.getElementById('detailDelete').onclick = () => {
  if (!confirm('Confirm delete?')) return;
  const bookingId = state.activeDetailId;
  showToast('กำลังลบข้อมูล...');

  fetch(API_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'deleteBooking',
      id: bookingId
    })
  })
  .then(() => {
    state.bookings = state.bookings.filter(b => String(b.id) !== String(bookingId));
    document.getElementById('detailOverlay').classList.remove('open');
    renderMain();
    showToast(t('deleted'));
  })
  .catch(err => {
    console.error(err);
    showToast('เกิดข้อผิดพลาดในการลบข้อมูล');
  });
};

document.getElementById('detailModalClose').onclick = () => document.getElementById('detailOverlay').classList.remove('open');
document.getElementById('detailClose').onclick = () => document.getElementById('detailOverlay').classList.remove('open');

// ==========================================
// 5. Settings & Room Operations
// ==========================================
document.getElementById('btnOpenSettings').onclick = () => {
  document.getElementById('cfgCompanyName').value = state.companyName;
  
  const startSel = document.getElementById('cfgStartHour');
  const endSel = document.getElementById('cfgEndHour');
  
  let hourOpts = '';
  for (let i = 0; i <= 24; i++) {
    const h = String(i).padStart(2, '0') + ':00';
    hourOpts += `<option value="${i}">${h}</option>`;
  }
  startSel.innerHTML = hourOpts;
  endSel.innerHTML = hourOpts;
  
  startSel.value = state.startHour;
  endSel.value = state.endHour;

  renderSettingRoomList();
  document.getElementById('settingOverlay').classList.add('open');
};

document.getElementById('settingModalClose').onclick = () => document.getElementById('settingOverlay').classList.remove('open');

function renderSettingRoomList() {
  const container = document.getElementById('settingRoomList');
  if (!container) return;
  container.innerHTML = state.rooms.map(r => `
    <div class="setting-room-item">
      <span><strong>${escapeHtml(r.name)}</strong> (${r.capacity} ${t('cap')} / ${r.step || 30}m)</span>
      <div style="display:flex; gap:6px;">
        <button class="btn btn-glass btn-sm" onclick="editRoom('${r.id}')"><svg class="icon"><use href="#icon-edit"></use></svg></button>
        <button class="btn btn-danger btn-sm" onclick="deleteRoom('${r.id}')"><svg class="icon"><use href="#icon-trash"></use></svg></button>
      </div>
    </div>
  `).join('');
}

function fileToBase64(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

document.getElementById('btnSaveSettings').onclick = async () => {
  state.companyName = document.getElementById('cfgCompanyName').value.trim() || 'IA103';
  state.startHour = parseInt(document.getElementById('cfgStartHour').value);
  state.endHour = parseInt(document.getElementById('cfgEndHour').value);

  const logoFile = document.getElementById('cfgLogoInput').files[0];
  if (logoFile) state.logo = await fileToBase64(logoFile);

  const bgFile = document.getElementById('cfgBgInput').files[0];
  if (bgFile) state.bg = await fileToBase64(bgFile);

  saveConfig();
  applyBranding();
  document.getElementById('settingOverlay').classList.remove('open');
  renderMain();
  showToast(t('saved'));
};

document.getElementById('btnNewRoom').onclick = () => {
  state.editingRoomId = null;
  document.getElementById('roomModalTitle').textContent = t('btnAddRoom');
  document.getElementById('roomName').value = '';
  document.getElementById('roomCapacity').value = '';
  document.getElementById('roomLocation').value = '';
  document.getElementById('roomSlotStep').value = '30';
  document.getElementById('roomEditOverlay').classList.add('open');
};

function editRoom(id) {
  const r = state.rooms.find(x => String(x.id) === String(id));
  if (!r) return;
  state.editingRoomId = String(id);
  document.getElementById('roomModalTitle').textContent = 'Edit Room';
  document.getElementById('roomName').value = r.name;
  document.getElementById('roomCapacity').value = r.capacity;
  document.getElementById('roomLocation').value = r.location;
  document.getElementById('roomSlotStep').value = r.step || 30;
  document.getElementById('roomEditOverlay').classList.add('open');
}

function deleteRoom(id) {
  if (!confirm('Delete room?')) return;
  state.rooms = state.rooms.filter(r => String(r.id) !== String(id));
  state.bookings = state.bookings.filter(b => String(b.roomId) !== String(id));
  if (String(state.selectedRoomId) === String(id)) state.selectedRoomId = state.rooms[0]?.id || null;
  saveConfig();
  renderSettingRoomList();
  renderSidebar();
  renderMain();
  showToast(t('deleted'));
}

document.getElementById('roomEditSave').onclick = async () => {
  const name = document.getElementById('roomName').value.trim();
  const capacity = document.getElementById('roomCapacity').value;
  const location = document.getElementById('roomLocation').value.trim();
  const step = parseInt(document.getElementById('roomSlotStep').value) || 30;
  const imgFile = document.getElementById('roomImageInput').files[0];

  if (!name) return alert('Name required');

  let imgBase64 = '';
  if (imgFile) imgBase64 = await fileToBase64(imgFile);

  if (state.editingRoomId) {
    const r = state.rooms.find(x => String(x.id) === String(state.editingRoomId));
    if (r) {
      r.name = name; r.capacity = capacity; r.location = location; r.step = step;
      if (imgBase64) r.image = imgBase64;
    }
  } else {
    const newRoom = { id: String(uid()), name, capacity, location, step, image: imgBase64 };
    state.rooms.push(newRoom);
    if (!state.selectedRoomId) state.selectedRoomId = newRoom.id;
  }

  saveConfig();
  renderSettingRoomList();
  renderSidebar();
  renderMain();
  document.getElementById('roomEditOverlay').classList.remove('open');
  showToast(t('saved'));
};

document.getElementById('roomEditModalClose').onclick = () => document.getElementById('roomEditOverlay').classList.remove('open');
document.getElementById('roomEditCancel').onclick = () => document.getElementById('roomEditOverlay').classList.remove('open');

// ==========================================
// 6. Fetch Data & Initialize
// ==========================================
function fetchCloudData() {
  fetch(`${API_URL}?action=getData`)
    .then(res => res.json())
    .then(data => {
      if (data && data.rooms) {
        state.rooms = data.rooms.map(r => ({ ...r, id: String(r.id) }));
      }
      if (data && data.bookings) {
        state.bookings = data.bookings.map(b => ({ ...b, id: String(b.id), roomId: String(b.roomId) }));
      }

      if (state.rooms.length > 0 && !state.selectedRoomId) {
        state.selectedRoomId = String(state.rooms[0].id);
      }
      renderSidebar();
      renderMain();
    })
    .catch(err => {
      console.warn('Cloud Fetch Fallback Active:', err);
      renderSidebar();
      renderMain();
    });
}

function init() {
  updateI18nTexts();
  applyBranding();
  fetchCloudData();
  setInterval(fetchCloudData, 10000);
}

document.addEventListener('DOMContentLoaded', init);
