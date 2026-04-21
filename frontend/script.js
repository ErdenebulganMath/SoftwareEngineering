const API_URL = 'http://localhost:5000/api';

// ─────────────────────────────────────────────
// USER SIDE
// ─────────────────────────────────────────────

let userCourses = [];

async function loadUserCourses() {
    const display = document.getElementById('course-display');
    try {
        const res = await fetch(`${API_URL}/courses`);
        if (!res.ok) throw new Error('Server error');
        userCourses = await res.json();
        updateUserStats(userCourses);
        renderUserCourses(userCourses);
    } catch (err) {
        display.innerHTML = `
            <div class="col-12 text-center py-5 text-danger">
                <i class="bi bi-exclamation-circle fs-1"></i>
                <p class="mt-2">Мэдээлэл ачаалахад алдаа гарлаа. Backend ажиллаж байгаа эсэхийг шалгана уу.</p>
            </div>`;
    }
}

function updateUserStats(courses) {
    const totalEl = document.getElementById('user-stat-total');
    const minEl = document.getElementById('user-stat-min');
    if (totalEl) totalEl.textContent = courses.length;
    if (minEl && courses.length > 0) {
        const min = Math.min(...courses.map(c => parseFloat(c.price)));
        minEl.textContent = formatPrice(min);
    }
}

function renderUserCourses(courses) {
    const display = document.getElementById('course-display');
    const noResults = document.getElementById('no-results');
    const badge = document.getElementById('course-count-badge');

    if (badge) badge.textContent = courses.length;

    if (courses.length === 0) {
        display.innerHTML = '';
        if (noResults) {
            const kw = document.getElementById('userSearchInput')?.value || '';
            document.getElementById('search-keyword').textContent = kw;
            noResults.classList.remove('d-none');
        }
        return;
    }

    if (noResults) noResults.classList.add('d-none');

    display.innerHTML = courses.map(c => `
        <div class="col-md-4">
            <div class="card course-card shadow-sm h-100 border-0">
                <div class="card-body d-flex flex-column p-4">
                    <div class="mb-3">
                        <span class="course-badge">
                            <i class="bi bi-book"></i>Хичээл
                        </span>
                    </div>
                    <h5 class="fw-bold mb-2">${escapeHtml(c.title)}</h5>
                    <p class="text-muted small flex-grow-1">${escapeHtml(c.description)}</p>
                    <div class="mt-auto pt-3 d-flex justify-content-between align-items-center">
                        <span class="price-tag">${formatPrice(c.price)}</span>
                        <div class="d-flex gap-2">
                            <button class="course-btn course-btn-outline"
                                    onclick='openCourseDetail(${JSON.stringify(c)})'>
                                <i class="bi bi-info-circle"></i>Дэлгэрэнгүй
                            </button>
                            <button class="course-btn course-btn-primary"
                                    onclick='enrollCourse(${JSON.stringify(c)})'>
                                <i class="bi bi-play-fill"></i>Суралцах
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function filterUserCourses() {
    const query = document.getElementById('userSearchInput')?.value.toLowerCase() || '';
    const sort = document.getElementById('sortSelect')?.value || 'default';

    let filtered = userCourses.filter(c =>
        c.title.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query)
    );

    if (sort === 'price-asc') {
        filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    } else if (sort === 'price-desc') {
        filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    } else if (sort === 'name-asc') {
        filtered.sort((a, b) => a.title.localeCompare(b.title));
    }

    renderUserCourses(filtered);
}

function clearSearch() {
    const input = document.getElementById('userSearchInput');
    if (input) input.value = '';
    filterUserCourses();
}

function openCourseDetail(course) {
    document.getElementById('detail-title').textContent = course.title;
    document.getElementById('detail-description').textContent = course.description;
    document.getElementById('detail-price').textContent = formatPrice(course.price);
    document.getElementById('enrollBtn').onclick = () => {
        const detailModal = bootstrap.Modal.getInstance(document.getElementById('courseDetailModal'));
        if (detailModal) detailModal.hide();
        enrollCourse(course);
    };
    const modal = new bootstrap.Modal(document.getElementById('courseDetailModal'));
    modal.show();
}

function enrollCourse(course) {
    document.getElementById('enrolled-course-name').textContent = course.title;
    const modal = new bootstrap.Modal(document.getElementById('enrollSuccessModal'));
    modal.show();
}

// ─────────────────────────────────────────────
// ADMIN SIDE
// ─────────────────────────────────────────────

let allCourses = [];

async function loadAdminCourses() {
    const tbody = document.getElementById('admin-course-list');
    try {
        const res = await fetch(`${API_URL}/courses`);
        if (!res.ok) throw new Error('Server error');
        allCourses = await res.json();
        renderAdminTable(allCourses);
        updateStats(allCourses);
    } catch (err) {
        tbody.innerHTML = `
            <tr><td colspan="5" class="text-center py-4 text-danger">
                <i class="bi bi-exclamation-circle me-1"></i>Backend холбогдоогүй байна.
            </td></tr>`;
    }
}

function renderAdminTable(courses) {
    const tbody = document.getElementById('admin-course-list');
    const countEl = document.getElementById('table-count');
    if (countEl) countEl.textContent = courses.length;
    if (courses.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="5" class="text-center py-5 text-muted">
                <i class="bi bi-inbox fs-2"></i><br>Хичээл байхгүй байна.
            </td></tr>`;
        return;
    }
    tbody.innerHTML = courses.map((c, i) => `
        <tr>
            <td class="ps-4 text-muted">${i + 1}</td>
            <td><strong>${escapeHtml(c.title)}</strong></td>
            <td class="text-muted small" style="max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ${escapeHtml(c.description)}
            </td>
            <td><span class="price-badge">${formatPrice(c.price)}</span></td>
            <td class="text-end pe-4">
                <button class="btn btn-sm btn-outline-primary action-btn me-1" onclick='editCourse(${JSON.stringify(c)})'>
                    <i class="bi bi-pencil"></i> Засах
                </button>
                <button class="btn btn-sm btn-outline-danger action-btn" onclick="confirmDelete(${c.id}, '${escapeHtml(c.title)}')">
                    <i class="bi bi-trash"></i> Устгах
                </button>
            </td>
        </tr>
    `).join('');
}

function updateStats(courses) {
    const total = courses.length;
    const prices = courses.map(c => parseFloat(c.price));
    const avg = total > 0 ? (prices.reduce((a, b) => a + b, 0) / total) : 0;
    const max = total > 0 ? Math.max(...prices) : 0;
    const min = total > 0 ? Math.min(...prices) : 0;
    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-avg').textContent = formatPrice(avg);
    document.getElementById('stat-max').textContent = formatPrice(max);
    const minEl = document.getElementById('stat-min');
    if (minEl) minEl.textContent = total > 0 ? formatPrice(min) : '—';
}

function filterTable() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const filtered = allCourses.filter(c =>
        c.title.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query)
    );
    renderAdminTable(filtered);
    const note = document.getElementById('table-filter-note');
    if (note) note.textContent = query ? `"${query}" — ${filtered.length} үр дүн` : '';
}

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const btn = e.target.querySelector('button[type=submit]');

    const errEl = document.getElementById('loginError');
    if (errEl) errEl.style.display = 'none';
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Нэвтэрч байна...';

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({ username, password })
        });

        if (res.ok) {
            const data = await res.json();
            window.location.href = data.role === 'admin' ? 'admin.html' : 'index.html';
        } else {
            showLoginError("Нэвтрэх нэр эсвэл нууц үг буруу байна!");
        }
    } catch {
        showLoginError("Серверт холбогдоход алдаа гарлаа.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Нэвтрэх';
    }
}

function showLoginError(msg) {
    const el = document.getElementById('loginError');
    const text = document.getElementById('loginErrorText');
    if (!el) return;
    if (text) text.textContent = msg;
    el.style.display = 'flex';
}

// ─────────────────────────────────────────────
// CRUD
// ─────────────────────────────────────────────

async function saveCourse() {
    const id = document.getElementById('courseId').value;
    const title = document.getElementById('title').value.trim();
    const desc = document.getElementById('desc').value.trim();
    const price = document.getElementById('price').value;

    if (!title || !desc || price === '') {
        showToast('Бүх талбарыг бөглөнө үү!', 'danger');
        return;
    }

    const data = { title, description: desc, price: parseFloat(price) };
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/courses/${id}` : `${API_URL}/courses`;

    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify(data)
        });

        if (!res.ok) throw new Error();
        showToast(id ? 'Хичээл амжилттай шинэчлэгдлээ!' : 'Хичээл амжилттай нэмэгдлээ!', 'success');
        resetForm();
        loadAdminCourses();
    } catch {
        showToast('Хадгалахад алдаа гарлаа.', 'danger');
    }
}

let pendingDeleteId = null;

function confirmDelete(id, name) {
    pendingDeleteId = id;
    document.getElementById('deleteCourseName').textContent = name;
    const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
    document.getElementById('confirmDeleteBtn').onclick = async () => {
        modal.hide();
        await deleteCourse(pendingDeleteId);
    };
    modal.show();
}

async function deleteCourse(id) {
    try {
        const res = await fetch(`${API_URL}/courses/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
        showToast('Хичээл устгагдлаа.', 'success');
        loadAdminCourses();
    } catch {
        showToast('Устгахад алдаа гарлаа.', 'danger');
    }
}

function editCourse(c) {
    document.getElementById('courseId').value = c.id;
    document.getElementById('title').value = c.title;
    document.getElementById('desc').value = c.description;
    document.getElementById('price').value = c.price;
    document.getElementById('formTitle').innerHTML =
        '<i class="bi bi-pencil-square me-2 text-warning"></i>Хичээл засах';
    document.getElementById('cancelBtn').classList.remove('d-none');
    document.getElementById('title').focus();
}

function resetForm() {
    document.getElementById('courseId').value = '';
    document.getElementById('title').value = '';
    document.getElementById('desc').value = '';
    document.getElementById('price').value = '';
    document.getElementById('formTitle').innerHTML =
        '<i class="bi bi-plus-circle me-2 text-primary"></i>Шинэ хичээл нэмэх';
    document.getElementById('cancelBtn').classList.add('d-none');
}

function logout() {
    window.location.href = 'index.html';
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function showToast(message, type = 'success') {
    const el = document.getElementById('toastMsg');
    const text = document.getElementById('toastText');
    if (!el) return;
    el.className = `toast align-items-center border-0 text-bg-${type}`;
    text.textContent = message;
    bootstrap.Toast.getOrCreateInstance(el, { delay: 3000 }).show();
}

function formatPrice(value) {
    return Number(value).toLocaleString('mn-MN') + '₮';
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
