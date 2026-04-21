document.addEventListener('DOMContentLoaded', function () {
    if (localStorage.getItem('userRole') !== 'admin') {
        window.location.href = 'login.html';
        return;
    }
    loadAdminCourses();
});

function clearAdminSearch() {
    const input = document.getElementById('searchInput');
    input.value = '';
    filterTable();
}
