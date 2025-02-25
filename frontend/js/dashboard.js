document.addEventListener('DOMContentLoaded', async function() {
    // Check if user is admin
    const username = localStorage.getItem('username');
    if (!username) {
        alert('Please log in first');
        window.location.href = 'login.html';
        return;
    }

    try {
        // Verify admin status
        const userResponse = await fetch(`http://localhost:3000/auth/getUserId?username=${username}`);
        if (!userResponse.ok) {
            throw new Error('Failed to fetch user data');
        }
        const userData = await userResponse.json();
        
        if (!userData.isAdmin) {
            alert('Unauthorized access');
            window.location.href = 'index.html';
            return;
        }

        // Load dashboard data
        const response = await fetch('http://localhost:3000/analytics/dashboard');
        if (!response.ok) {
            throw new Error(`Failed to fetch dashboard data: ${response.status}`);
        }
        const data = await response.json();

        console.log('Dashboard data received:', data);

        // Update summary cards
        updateSummaryCards(data);

        // Create chart containers
        createChartContainers();

        // Render all charts if data exists
        if (data.topUsers && data.topUsers.length > 0) {
            renderTopUsersChart(data.topUsers);
            if (data.dailyScans) renderDailyScanActivity(data.dailyScans);
            if (data.documentTopics) renderTopicsChart(data.documentTopics);
            renderStatsTable(data);
        } else {
            showNoDataMessages();
        }

        // Initialize filters
        initializeFilters(data);

    } catch (error) {
        console.error('Error loading dashboard:', error);
        alert(`Error loading analytics data: ${error.message}`);
    }
});

function updateSummaryCards(data) {
    // Update total scans
    const totalScansElement = document.getElementById('totalScansToday');
    if (totalScansElement) {
        totalScansElement.textContent = data.todayStats.totalScans;
    }

    // Update total credits used
    const totalCreditsElement = document.getElementById('totalCreditsUsed');
    if (totalCreditsElement) {
        totalCreditsElement.textContent = data.todayStats.creditsUsed;
    }
}

function createChartContainers() {
    const chartIds = ['dailyScansChart', 'topUsersChart', 'topicsChart'];
    chartIds.forEach(id => {
        const div = document.getElementById(id);
        if (div) div.innerHTML = '<canvas></canvas>';
    });
}

function renderTopUsersChart(userData) {
    if (!userData || userData.length === 0) return;

    const canvas = document.querySelector('#topUsersChart canvas');
    const ctx = canvas.getContext('2d');
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: userData.map(user => user.username),
            datasets: [{
                label: 'Total Scans',
                data: userData.map(user => user.totalScans),
                backgroundColor: 'rgba(54, 162, 235, 0.5)'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function renderDailyScanActivity(dailyScans) {
    const canvas = document.querySelector('#dailyScansChart canvas');
    const ctx = canvas.getContext('2d');
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dailyScans.map(scan => scan.date),
            datasets: [{
                label: 'Number of Scans',
                data: dailyScans.map(scan => scan.count),
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function renderTopicsChart(topics) {
    const canvas = document.querySelector('#topicsChart canvas');
    const ctx = canvas.getContext('2d');
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: topics.map(topic => topic.name),
            datasets: [{
                data: topics.map(topic => topic.count),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 206, 86, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(153, 102, 255, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

function renderStatsTable(data) {
    const tbody = document.getElementById('statsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    data.topUsers.forEach(user => {
        const creditInfo = data.creditStats.find(stat => stat.username === user.username);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.username}</td>
            <td>${user.todayScans || 0}</td>
            <td>${user.totalScans || 0}</td>
            <td>${creditInfo?.dailyCreditsUsed || 0}</td>
            <td>${formatDate(user.lastScanDate) || 'Never'}</td>
        `;
        tbody.appendChild(row);
    });
}

function initializeFilters(data) {
    const dateFilter = document.getElementById('dateFilter');
    const sortFilter = document.getElementById('sortFilter');

    // Set default date to today
    dateFilter.value = new Date().toISOString().split('T')[0];

    // Add event listeners
    dateFilter.addEventListener('change', () => filterData(data));
    sortFilter.addEventListener('change', () => filterData(data));
}

function filterData(data) {
    const dateFilter = document.getElementById('dateFilter').value;
    const sortFilter = document.getElementById('sortFilter').value;
    
    let filteredData = {...data};
    
    // Filter by date
    if (dateFilter) {
        filteredData.topUsers = data.topUsers.filter(user => 
            user.lastScanDate?.includes(dateFilter)
        );
    }

    // Sort data
    switch(sortFilter) {
        case 'scans':
            filteredData.topUsers.sort((a, b) => (b.totalScans || 0) - (a.totalScans || 0));
            break;
        case 'recent':
            filteredData.topUsers.sort((a, b) => new Date(b.lastScanDate) - new Date(a.lastScanDate));
            break;
    }

    renderStatsTable(filteredData);
}

function formatDate(dateString) {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function showNoDataMessages() {
    const chartIds = ['dailyScansChart', 'topUsersChart', 'topicsChart'];
    chartIds.forEach(id => {
        const div = document.getElementById(id);
        if (div) div.innerHTML = 'No data available';
    });
}

// Add these functions to handle exports
function exportToCSV() {
    try {
        const table = document.getElementById('statsTable');
        let csv = [];
        
        // Get headers
        const headers = [];
        const headerCells = table.querySelectorAll('thead th');
        headerCells.forEach(cell => headers.push(cell.textContent));
        csv.push(headers.join(','));
        
        // Get data rows
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const rowData = [];
            row.querySelectorAll('td').forEach(cell => {
                rowData.push(`"${cell.textContent.replace(/"/g, '""')}"`);
            });
            csv.push(rowData.join(','));
        });
        
        // Create and download CSV file
        const csvContent = csv.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const date = new Date().toISOString().split('T')[0];
        
        link.href = URL.createObjectURL(blob);
        link.download = `scan_history_${date}.csv`;
        link.click();
    } catch (error) {
        console.error('Error exporting CSV:', error);
        alert('Error generating CSV file. Please try again.');
    }
}

function exportToPDF() {
    try {
        const element = document.querySelector('.data-table-section');
        const date = new Date().toISOString().split('T')[0];
        const opt = {
            margin: 1,
            filename: `scan_history_${date}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
        };
        
        // Use html2pdf library
        html2pdf().set(opt).from(element).save();
    } catch (error) {
        console.error('Error exporting PDF:', error);
        alert('Error generating PDF file. Please try again.');
    }
}

// Add event listeners
document.getElementById('exportCSV').addEventListener('click', exportToCSV);
document.getElementById('exportPDF').addEventListener('click', exportToPDF);

// Add more chart rendering functions... 