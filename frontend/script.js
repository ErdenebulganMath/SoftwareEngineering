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
renderUserCourses(userCourses);
    } catch (err) {
        display.innerHTML = `
            <div class="col-12 text-center py-5 text-danger">
                <i class="bi bi-exclamation-circle fs-1"></i>
                <p class="mt-2">Мэдээлэл ачаалахад алдаа гарлаа. Backend ажиллаж байгаа эсэхийг шалгана уу.</p>
            </div>`;
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
                        <button class="course-btn course-btn-outline"
                                onclick='openCourseDetail(${JSON.stringify(c)})'>
                            <i class="bi bi-info-circle"></i>Дэлгэрэнгүй
                        </button>
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
    loadUserLessons(course.id);
    const modal = new bootstrap.Modal(document.getElementById('courseDetailModal'));
    modal.show();
}

async function loadUserLessons(courseId) {
    const container = document.getElementById('detail-lessons');
    if (!container) return;
    container.innerHTML = '<div class="text-center text-muted py-2 small"><div class="spinner-border spinner-border-sm me-1"></div>Ачааллаж байна...</div>';
    try {
        const res = await fetch(`${API_URL}/courses/${courseId}/lessons`);
        if (!res.ok) throw new Error();
        const lessons = await res.json();
        if (lessons.length === 0) {
            container.innerHTML = '<p class="text-muted small mb-0">Материал байхгүй байна.</p>';
            return;
        }
        container.innerHTML = lessons.map(l => {
            const icon = l.file_type === 'video' ? 'bi-play-circle-fill text-danger' :
                         l.file_type === 'pdf'   ? 'bi-file-pdf-fill text-danger' :
                                                   'bi-file-earmark-fill text-primary';
            return `
                <div class="d-flex align-items-center gap-2 py-2 border-bottom">
                    <i class="bi ${icon} fs-5 flex-shrink-0"></i>
                    <span class="flex-grow-1 small fw-semibold">${escapeHtml(l.title)}</span>
                    <a href="${API_URL}/uploads/${l.file_path}" target="_blank"
                       class="btn btn-sm btn-outline-primary py-0 px-2 flex-shrink-0">
                        <i class="bi bi-eye me-1"></i>Нээх
                    </a>
                </div>`;
        }).join('');
    } catch {
        container.innerHTML = '<p class="text-muted small mb-0">Материал ачаалахад алдаа гарлаа.</p>';
    }
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
            <td>
                <strong class="course-name-link" onclick='openCourseInfoModal(${JSON.stringify(c)})'>
                    ${escapeHtml(c.title)}
                </strong>
            </td>
            <td class="text-muted small" style="max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ${escapeHtml(c.description)}
            </td>
            <td><span class="price-badge">${formatPrice(c.price)}</span></td>
            <td class="text-end pe-4">
                <button class="btn btn-sm btn-outline-success action-btn me-1"
                        onclick='openMaterialModal(${c.id}, "${escapeHtml(c.title)}")'
                        title="Материал оруулах">
                    <i class="bi bi-collection-play"></i>
                </button>
                <button class="btn btn-sm btn-outline-primary action-btn me-1"
                        onclick='editCourse(${JSON.stringify(c)})'
                        title="Засах">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger action-btn"
                        onclick="confirmDelete(${c.id}, '${escapeHtml(c.title)}')"
                        title="Устгах">
                    <i class="bi bi-trash"></i>
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
            localStorage.setItem('userRole', data.role);
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
    localStorage.removeItem('userRole');
    window.location.href = 'login.html';
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

// ─────────────────────────────────────────────
// COURSE INFO MODAL (ADMIN)
// ─────────────────────────────────────────────

function openCourseInfoModal(course) {
    document.getElementById('infoTitle').textContent = course.title;
    document.getElementById('infoDesc').textContent = course.description;
    document.getElementById('infoPrice').textContent = formatPrice(course.price);
    document.getElementById('infoCount').textContent = '—';

    const d = course.created_at ? new Date(course.created_at) : null;
    document.getElementById('infoDate').textContent = d
        ? d.toLocaleDateString('mn-MN', { year: 'numeric', month: 'short', day: 'numeric' })
        : '—';

    document.getElementById('infoEditBtn').onclick = () => {
        bootstrap.Modal.getInstance(document.getElementById('courseInfoModal')).hide();
        editCourse(course);
    };
    document.getElementById('infoMaterialBtn').onclick = () => {
        bootstrap.Modal.getInstance(document.getElementById('courseInfoModal')).hide();
        setTimeout(() => openMaterialModal(course.id, course.title), 350);
    };

    new bootstrap.Modal(document.getElementById('courseInfoModal')).show();
    loadInfoLessons(course.id);
}

async function loadInfoLessons(courseId) {
    const container = document.getElementById('infoLessons');
    container.innerHTML = '<div class="text-center py-4"><div class="spinner-border spinner-border-sm text-primary"></div></div>';
    try {
        const res = await fetch(`${API_URL}/courses/${courseId}/lessons`);
        if (!res.ok) throw new Error();
        const lessons = await res.json();
        document.getElementById('infoCount').textContent = lessons.length + ' файл';

        if (lessons.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="bi bi-inbox fs-2 d-block mb-2"></i>
                    <div class="small">Материал байхгүй байна.</div>
                    <div class="small text-muted mt-1">«Материал оруулах» товч дарж файл нэмнэ үү.</div>
                </div>`;
            return;
        }

        container.innerHTML = lessons.map(l => {
            const icon = l.file_type === 'video' ? 'bi-play-circle-fill text-danger' :
                         l.file_type === 'pdf'   ? 'bi-file-pdf-fill text-danger' :
                                                   'bi-file-earmark-fill text-primary';
            const typeLabel = l.file_type === 'video' ? 'Видео' :
                              l.file_type === 'pdf'   ? 'PDF'   : 'Файл';
            return `
                <div class="d-flex align-items-center gap-3 py-2 border-bottom">
                    <i class="bi ${icon} fs-4 flex-shrink-0"></i>
                    <div class="flex-grow-1" style="min-width:0;">
                        <div class="fw-semibold small text-truncate">${escapeHtml(l.title)}</div>
                        <div class="text-muted" style="font-size:.72rem;">${typeLabel} · ${escapeHtml(l.original_name)}</div>
                    </div>
                    <a href="${API_URL}/uploads/${l.file_path}" target="_blank"
                       class="btn btn-sm btn-outline-primary py-0 px-2 flex-shrink-0" title="Нээх">
                        <i class="bi bi-eye"></i>
                    </a>
                </div>`;
        }).join('');
    } catch {
        document.getElementById('infoCount').textContent = '—';
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="bi bi-wifi-off text-danger fs-2 d-block mb-2"></i>
                <p class="text-muted small mb-2">Backend холбогдоогүй байна.</p>
                <button class="btn btn-sm btn-outline-primary" onclick="loadInfoLessons(${courseId})">
                    <i class="bi bi-arrow-clockwise me-1"></i>Дахин оролдох
                </button>
            </div>`;
    }
}

// ─────────────────────────────────────────────
// MATERIALS / LESSONS (ADMIN)
// ─────────────────────────────────────────────

function openMaterialModal(courseId, courseTitle) {
    document.getElementById('materialCourseId').value = courseId;
    document.getElementById('materialCourseTitle').textContent = courseTitle;
    document.getElementById('lessonTitle').value = '';
    document.getElementById('lessonFile').value = '';
    document.getElementById('uploadProgress').classList.add('d-none');
    document.getElementById('uploadProgressBar').style.width = '0%';
    loadLessonsForModal(courseId);
    new bootstrap.Modal(document.getElementById('materialModal')).show();
}

async function loadLessonsForModal(courseId) {
    const container = document.getElementById('lessonsList');
    container.innerHTML = '<div class="text-center text-muted py-3"><div class="spinner-border spinner-border-sm text-primary"></div></div>';
    try {
        const res = await fetch(`${API_URL}/courses/${courseId}/lessons`);
        if (!res.ok) throw new Error();
        const lessons = await res.json();
        if (lessons.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="bi bi-inbox fs-2 d-block mb-2"></i>
                    <div class="small">Материал байхгүй байна.</div>
                </div>`;
            return;
        }
        container.innerHTML = '<div class="list-group list-group-flush">' + lessons.map(l => {
            const icon = l.file_type === 'video' ? 'bi-play-circle-fill text-danger' :
                         l.file_type === 'pdf'   ? 'bi-file-pdf-fill text-danger' :
                                                   'bi-file-earmark-fill text-primary';
            const typeLabel = l.file_type === 'video' ? 'Видео' :
                              l.file_type === 'pdf'   ? 'PDF'   : 'Файл';
            return `
                <div class="list-group-item d-flex align-items-center gap-3 px-0 py-2">
                    <i class="bi ${icon} fs-4 flex-shrink-0"></i>
                    <div class="flex-grow-1" style="min-width:0;">
                        <div class="fw-semibold small text-truncate">${escapeHtml(l.title)}</div>
                        <div class="text-muted" style="font-size:.72rem;">${typeLabel} · ${escapeHtml(l.original_name)}</div>
                    </div>
                    <div class="d-flex gap-1 flex-shrink-0">
                        <a href="${API_URL}/uploads/${l.file_path}" target="_blank"
                           class="btn btn-sm btn-outline-secondary py-0 px-2" title="Нээх">
                            <i class="bi bi-eye"></i>
                        </a>
                        <button class="btn btn-sm btn-outline-danger py-0 px-2" title="Устгах"
                                onclick="deleteLesson(${l.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>`;
        }).join('') + '</div>';
    } catch {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="bi bi-wifi-off text-danger fs-2 d-block mb-2"></i>
                <p class="text-muted small mb-2">Backend холбогдоогүй байна.</p>
                <button class="btn btn-sm btn-outline-primary" onclick="loadLessonsForModal(${courseId})">
                    <i class="bi bi-arrow-clockwise me-1"></i>Дахин оролдох
                </button>
            </div>`;
    }
}

function uploadLesson() {
    const courseId = document.getElementById('materialCourseId').value;
    const title    = document.getElementById('lessonTitle').value.trim();
    const fileInput = document.getElementById('lessonFile');
    const file = fileInput.files[0];

    if (!title) { showToast('Гарчиг оруулна уу!', 'danger'); return; }
    if (!file)  { showToast('Файл сонгоно уу!',   'danger'); return; }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('file', file);

    const progressWrap = document.getElementById('uploadProgress');
    const progressBar  = document.getElementById('uploadProgressBar');
    progressWrap.classList.remove('d-none');
    progressBar.style.width = '0%';
    progressBar.textContent = '0%';

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/courses/${courseId}/lessons`);

    xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            progressBar.style.width = pct + '%';
            progressBar.textContent = pct + '%';
        }
    };

    xhr.onload = () => {
        progressWrap.classList.add('d-none');
        if (xhr.status === 201) {
            showToast('Файл амжилттай оруулагдлаа!', 'success');
            document.getElementById('lessonTitle').value = '';
            document.getElementById('lessonFile').value = '';
            loadLessonsForModal(courseId);
        } else {
            let msg = 'Файл оруулахад алдаа гарлаа.';
            try { msg = JSON.parse(xhr.responseText).error || msg; } catch {}
            showToast(msg, 'danger');
        }
    };

    xhr.onerror = () => {
        progressWrap.classList.add('d-none');
        showToast('Серверт холбогдоход алдаа гарлаа.', 'danger');
    };

    xhr.send(formData);
}

async function deleteLesson(lessonId) {
    if (!confirm('Энэ файлыг устгах уу?')) return;
    try {
        const res = await fetch(`${API_URL}/lessons/${lessonId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
        showToast('Файл устгагдлаа.', 'success');
        loadLessonsForModal(document.getElementById('materialCourseId').value);
    } catch {
        showToast('Устгахад алдаа гарлаа.', 'danger');
    }
}
