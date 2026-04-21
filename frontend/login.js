const ROLES = {
    admin: { username: 'admin', password: 'admin123' },
    user:  { username: 'user',  password: 'user123'  }
};

function selectRole(role) {
    const btnAdmin = document.getElementById('btnAdmin');
    const btnUser  = document.getElementById('btnUser');

    btnAdmin.className = 'role-btn' + (role === 'admin' ? ' active-admin' : '');
    btnUser.className  = 'role-btn' + (role === 'user'  ? ' active-user'  : '');

    const cred = ROLES[role];
    document.getElementById('username').value = cred.username;
    document.getElementById('password').value = cred.password;

    const errEl = document.getElementById('loginError');
    if (errEl) errEl.style.display = 'none';
}

function togglePassword() {
    const pw   = document.getElementById('password');
    const icon = document.getElementById('pwToggleIcon');
    if (pw.type === 'password') {
        pw.type = 'text';
        icon.className = 'bi bi-eye-slash';
    } else {
        pw.type = 'password';
        icon.className = 'bi bi-eye';
    }
}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    selectRole('admin');
});
