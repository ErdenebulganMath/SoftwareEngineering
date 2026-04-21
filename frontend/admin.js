document.addEventListener('DOMContentLoaded', loadAdminCourses);

function clearAdminSearch() {
    const input = document.getElementById('searchInput');
    input.value = '';
    filterTable();
}
