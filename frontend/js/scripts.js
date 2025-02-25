console.log("scripts.js loaded");

function showAlert() {
    alert("Welcome to the Document Scanning System!");
}

// Function to manage credit requests
async function manageRequest(requestId, action) {
    try {
        // Show loading state or disable buttons if needed
        const button = event.target;
        const originalText = button.innerHTML;
        button.disabled = true;
        button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Processing...`;

        console.log(`Managing request ${requestId} with action: ${action}`); // Debug log

        const response = await fetch(`http://localhost:3000/credit-requests/manage/${requestId}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action })
        });

        let data;
        try {
            // Parse JSON response only once and store it
            const responseText = await response.text();
            console.log('Raw response:', responseText); // Debug log
            
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Error parsing JSON:', parseError);
                throw new Error('Invalid response format from server');
            }
        } catch (error) {
            console.error('Error reading response:', error);
            throw new Error('Failed to read server response');
        }

        if (!response.ok) {
            throw new Error(data?.message || 'Failed to manage request');
        }

        // Show success message
        alert(data.message || `Request ${action}ed successfully`);
        
        // Remove the managed request from the UI
        const requestElement = button.closest('.credit-request-item');
        if (requestElement) {
            requestElement.remove();
        }

        // Check if there are any remaining requests
        const creditRequestsContainer = document.getElementById('creditRequests');
        if (creditRequestsContainer && !creditRequestsContainer.querySelector('.credit-request-item')) {
            creditRequestsContainer.innerHTML = '<p class="no-requests">No pending credit requests found.</p>';
        }

    } catch (error) {
        console.error('Error managing request:', error);
        alert('Error processing request: ' + (error.message || 'Unknown error occurred'));
    } finally {
        // Reset button state if it exists
        if (button) {
            button.disabled = false;
            button.innerHTML = originalText;
        }
    }
}

// Define handleCreditRequest function
async function handleCreditRequest(e) {
    e.preventDefault();
    const creditAmount = document.getElementById('creditAmount').value;
    const MAX_ALLOWED_CREDITS = 3;

    if (creditAmount > MAX_ALLOWED_CREDITS) {
        alert(`Cannot request more than ${MAX_ALLOWED_CREDITS} credits`);
        return;
    }

    const userId = localStorage.getItem('userId');

    console.log("Submitting credit request...");

    try {
        const response = await fetch('http://localhost:3000/credit-requests/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, amount: creditAmount })
        });

        const data = await response.json();
        
        if (response.ok) {
            alert('Credit request submitted successfully! An admin will review your request.');
        } else {
            throw new Error(data.message || 'Failed to submit credit request');
        }

        const requestMessageElement = document.getElementById('requestMessage');
        if (requestMessageElement) {
            requestMessageElement.innerText = data.message;
        }

        // Close the modal after submission
        const creditRequestModal = document.getElementById('creditRequestModal');
        if (creditRequestModal) {
            creditRequestModal.style.display = 'none';
        }
    } catch (error) {
        console.error('Error submitting credit request:', error);
        alert('Error submitting credit request: ' + error.message);
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    // Check if we are on the scan management page
    if (window.location.pathname.includes('scanManagement.html')) {
        try {
            const userId = localStorage.getItem('userId');
            const username = localStorage.getItem('username');

            if (!username) {
                console.error('Username is not found in localStorage');
                alert('Please log in first');
                window.location.href = 'login.html';
                return;
            }

            // Display username
            const usernameElement = document.getElementById('username');
            if (usernameElement) {
                usernameElement.innerText = username;
            }

            // Fetch user scan count
            const fetchUserData = async () => {
                try {
                    const username = localStorage.getItem('username');
                    console.log('Fetching user data for:', username);

                    if (!username) {
                        throw new Error('No username found in localStorage');
                    }

                    const response = await fetch(`http://localhost:3000/auth/getUserId?username=${username}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        }
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                    }

                    const userData = await response.json();
                    console.log('Received user data:', userData);

                    // Update UI with user data
                    const scanCountElement = document.getElementById('scanCount');
                    if (scanCountElement) {
                        scanCountElement.innerText = `${userData.dailyCreditsUsed || 0} / ${userData.maxDailyCredits || 3}`;
                    }

                    const scanLimitElement = document.getElementById('scanLimit');
                    if (scanLimitElement) {
                        scanLimitElement.innerText = userData.maxDailyCredits || 3;
                    }

                } catch (error) {
                    console.error('Detailed error fetching user data:', error);
                    // Only show alert if we're not redirecting
                    if (!error.message.includes('No username found')) {
                        alert('Error connecting to server. Please try again later.');
                    }
                }
            };

            // Load user data and documents
            fetchUserData();
            loadUserDocuments();

        } catch (error) {
            console.error('Error in page initialization:', error);
            alert('Error initializing page. Please refresh or try again later.');
        }
    }

    // Check if we are on the upload page
    if (window.location.pathname.includes('upload.html')) {
        try {
            const userId = localStorage.getItem('userId');
            const username = localStorage.getItem('username');
            const isAdmin = localStorage.getItem('isAdmin') === 'true';

            if (!username) {
                console.error('Username is not found in localStorage');
                alert('Please log in first');
                window.location.href = 'login.html';
                return;
            }

            // Redirect admin users to login page
            if (isAdmin) {
                alert('Administrators do not have access to document scanning. Please login with a regular user account.');
                // Clear localStorage
                localStorage.clear();
                window.location.href = 'login.html';
                return;
            }

            // Display username and user information only once
            const usernameElement = document.getElementById('username');
            if (usernameElement) {
                usernameElement.innerText = username;
            }

            // Fetch user credit data
            try {
                const response = await fetch(`http://localhost:3000/auth/getUserId?username=${username}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch user data');
                }
                const userData = await response.json();
                
                // Display credit count
                const scanCountElement = document.getElementById('scanCount');
                if (scanCountElement) {
                    scanCountElement.innerText = `${userData.dailyCreditsUsed || 0} / ${userData.maxDailyCredits || 3}`;
                }

                // Update scan limit display
                const scanLimitElement = document.getElementById('scanLimit');
                if (scanLimitElement) {
                    scanLimitElement.innerText = userData.maxDailyCredits || 3;
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
                alert('Error connecting to server. Please ensure the server is running and try again.');
            }

            // Load user's documents
            loadUserDocuments();

            // Add this at the beginning of your DOMContentLoaded event listener for the upload page
            const fileInput = document.getElementById('fileInput');
            const uploadForm = document.getElementById('uploadForm');
            const uploadStatus = document.getElementById('uploadStatus');

            uploadForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                try {
                    const file = fileInput.files[0];
                    if (!file) {
                        alert('Please select a file first');
                        return;
                    }

                    // Show upload status
                    uploadStatus.textContent = 'Reading file...';
                    uploadStatus.style.display = 'block';
                    uploadStatus.className = 'upload-status loading';

                    // Read file content
                    const reader = new FileReader();
                    reader.onload = async (e) => {
                        const fileContent = e.target.result;
                        const userId = localStorage.getItem('userId');

                        if (!userId) {
                            throw new Error('User not logged in');
                        }

                        uploadStatus.textContent = 'Uploading document...';

                        try {
                            console.log('Sending upload request:', {
                                userId,
                                contentLength: fileContent.length
                            });

                            const response = await fetch('http://localhost:3000/documents/scanUpload', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    userId: userId,
                                    fileContent: fileContent
                                })
                            });

                            const data = await response.json();
                            console.log('Upload response:', data);

                            if (!response.ok) {
                                throw new Error(data.message || 'Upload failed');
                            }

                            // Update UI for success
                            uploadStatus.textContent = 'Document uploaded successfully!';
                            uploadStatus.className = 'upload-status success';

                            // Update credit display
                            const scanCountElement = document.getElementById('scanCount');
                            if (scanCountElement) {
                                scanCountElement.innerText = `${data.dailyCreditsUsed} / ${data.maxDailyCredits}`;
                            }

                            // Clear the file input
                            fileInput.value = '';

                            // Redirect after short delay
                            setTimeout(() => {
                                window.location.href = 'scanManagement.html';
                            }, 2000);

                        } catch (error) {
                            console.error('Upload error:', error);
                            uploadStatus.textContent = `Upload failed: ${error.message}`;
                            uploadStatus.className = 'upload-status error';
                        }
                    };

                    reader.onerror = () => {
                        uploadStatus.textContent = 'Error reading file';
                        uploadStatus.className = 'upload-status error';
                    };

                    reader.readAsText(file);

                } catch (error) {
                    console.error('Error in upload process:', error);
                    uploadStatus.textContent = 'Upload failed. Please try again.';
                    uploadStatus.className = 'upload-status error';
                }
            });

            // Request Additional Credits Button
            const requestCreditsButton = document.getElementById('requestCreditsButton');
            const creditRequestModal = document.getElementById('creditRequestModal');
            const closeModalButton = document.getElementById('closeModal');

            // Show the modal when the button is clicked
            requestCreditsButton.addEventListener('click', () => {
                creditRequestModal.style.display = 'block';
            });

            // Close the modal
            closeModalButton.addEventListener('click', () => {
                creditRequestModal.style.display = 'none';
            });

            // Credit Request Form
            const creditRequestForm = document.getElementById('creditRequestForm');
            if (creditRequestForm) {
                creditRequestForm.removeEventListener('submit', handleCreditRequest);
                creditRequestForm.addEventListener('submit', handleCreditRequest);
            }
        } catch (error) {
            console.error('Error in page initialization:', error);
            alert('Error initializing page. Please refresh or try again later.');
        }
    }

    // Registration Form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('registerUsername').value;
            const password = document.getElementById('registerPassword').value;

            const response = await fetch('http://localhost:3000/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            alert(data.message); // Display the message from the server
            if (response.ok) {
                // Redirect to login page after successful registration
                window.location.href = 'login.html';
            }
        });
    }

    // Login Form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;

            try {
                const response = await fetch('http://localhost:3000/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();
                
                if (response.ok) {
                    // Store user data
                    localStorage.setItem('userId', data.userId);
                    localStorage.setItem('username', username);

                    if (data.isAdmin) {
                        // Admin users go directly to dashboard
                        localStorage.setItem('isAdmin', 'true');
                        window.location.href = 'adminDashboard.html';
                    } else {
                        // Regular users go directly to upload page
                        localStorage.setItem('isAdmin', 'false');
                        window.location.href = 'upload.html';
                    }
                } else {
                    alert(data.message || 'Login failed. Please try again.');
                }
            } catch (error) {
                console.error('Login error:', error);
                alert('Error connecting to server. Please try again.');
            }
        });
    }

    // Find Matches Form
    const matchForm = document.getElementById('matchForm');
    const matchesContainer = document.getElementById('matchesContainer');

    if (matchForm) {
        matchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const docId = document.getElementById('matchDocId').value.trim();
            if (docId) {
                findMatches(docId);
            } else {
                console.error('Document ID is empty');
            }
        });
    }

    // Check if matchesContainer exists before accessing it
    if (matchesContainer) {
        console.log('Matches container found!');
    } else {
        console.warn('Matches container not found! This is expected if you are on a page without it.');
    }

    // Admin Registration Form
    const adminRegisterForm = document.getElementById('adminRegisterForm');
    if (adminRegisterForm) {
        adminRegisterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('adminRegisterUsername').value;
            const password = document.getElementById('adminRegisterPassword').value;
            const isAdmin = true; // Admin registration is implied

            const response = await fetch('http://localhost:3000/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, isAdmin }) // Include isAdmin in the request
            });

            const data = await response.json();
            alert(data.message);
            if (response.ok) {
                // Redirect to admin login page after successful registration
                window.location.href = 'adminLogin.html';
            }
        });
    }

    // Admin Login Form
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Get the input elements
            const usernameInput = document.getElementById('adminLoginUsername');
            const passwordInput = document.getElementById('adminLoginPassword');
            
            // Check if elements exist
            if (!usernameInput || !passwordInput) {
                console.error('Login form elements not found');
                alert('Error: Login form not properly configured');
                return;
            }

            const username = usernameInput.value;
            const password = passwordInput.value;

            try {
                const response = await fetch('http://localhost:3000/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();
                
                if (response.ok && data.isAdmin) {
                    localStorage.setItem('userId', data.userId);
                    localStorage.setItem('username', username);
                    localStorage.setItem('isAdmin', 'true');
                    window.location.href = 'adminDashboard.html';
                } else {
                    alert('Invalid admin credentials');
                }
            } catch (error) {
                console.error('Admin login error:', error);
                alert('Error connecting to server. Please try again.');
            }
        });
    }

    // Adjust User Credits Form
    const adjustCreditsForm = document.getElementById('adjustCreditsForm');
    if (adjustCreditsForm) {
        adjustCreditsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const userId = document.getElementById('userId').value;
            const creditAmount = document.getElementById('creditAmount').value;

            const adjustResponse = await fetch('http://localhost:3000/credits/adjust', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, amount: creditAmount })
            });

            const data = await adjustResponse.json();
            const adjustMessageElement = document.getElementById('adjustMessage');
            if (adjustMessageElement) {
                adjustMessageElement.innerText = data.message;
            }
        });
    }

    // Export Button
    const exportButton = document.getElementById('exportButton');
    if (exportButton) {
        exportButton.addEventListener('click', async () => {
            try {
                // Add loading state
                exportButton.classList.add('loading');
                exportButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating Report...';
                
                const userId = localStorage.getItem('userId');
                if (!userId) {
                    alert('Please log in first');
                    return;
                }

                // Fetch the report
                const response = await fetch(`http://localhost:3000/documents/export/${userId}`);
                
                if (!response.ok) {
                    throw new Error('Failed to generate report');
                }

                // Get the blob from response
                const blob = await response.blob();
                
                // Create download link
                const downloadUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = `scan_history_${Date.now()}.txt`;
                
                // Trigger download
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // Cleanup
                window.URL.revokeObjectURL(downloadUrl);

            } catch (error) {
                console.error('Error exporting report:', error);
                alert('Failed to export report. Please try again.');
            } finally {
                // Reset button state
                exportButton.classList.remove('loading');
                exportButton.innerHTML = '<i class="fas fa-download"></i> Download Scan History';
            }
        });
    }

    // Add export functions for scan history
    function exportScanHistoryToCSV() {
        try {
            const table = document.getElementById('scanHistoryTable');
            let csv = [];
            
            // Get headers
            const headers = [];
            const headerCells = table.querySelectorAll('thead th');
            headerCells.forEach(cell => {
                // Skip the Actions column
                if (cell.textContent !== 'Actions') {
                    headers.push(cell.textContent);
                }
            });
            csv.push(headers.join(','));
            
            // Get data rows
            const rows = table.querySelectorAll('tbody tr');
            rows.forEach(row => {
                const rowData = [];
                row.querySelectorAll('td').forEach(cell => {
                    // Skip the Actions column
                    if (!cell.querySelector('.action-buttons')) {
                        rowData.push(`"${cell.textContent.replace(/"/g, '""')}"`);
                    }
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

    async function exportScanHistoryToPDF() {
        try {
            // Get the table data
            const table = document.getElementById('scanHistoryTable');
            if (!table) {
                throw new Error('Table not found');
            }

            // Create PDF content with direct HTML string
            const rows = Array.from(table.querySelectorAll('tbody tr')).map(row => {
                const cells = Array.from(row.cells);
                return {
                    id: cells[0].textContent,
                    date: cells[1].textContent,
                    status: cells[2].querySelector('.status-badge').textContent.trim()
                };
            });

            // Create HTML content
            const htmlContent = `
                <div style="padding: 20px; font-family: Arial, sans-serif;">
                    <h1 style="color: #1a73e8; margin-bottom: 20px;">Scan History Report</h1>
                    <p style="color: #666; margin-bottom: 30px;">Generated on: ${new Date().toLocaleDateString()}</p>
                    
                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                        <thead>
                            <tr>
                                <th style="background: #f8f9fa; padding: 12px; border: 1px solid #ddd; text-align: left;">Document ID</th>
                                <th style="background: #f8f9fa; padding: 12px; border: 1px solid #ddd; text-align: left;">Upload Date</th>
                                <th style="background: #f8f9fa; padding: 12px; border: 1px solid #ddd; text-align: left;">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows.map(row => `
                                <tr>
                                    <td style="padding: 12px; border: 1px solid #ddd;">${row.id}</td>
                                    <td style="padding: 12px; border: 1px solid #ddd;">${row.date}</td>
                                    <td style="padding: 12px; border: 1px solid #ddd;">
                                        <span style="
                                            padding: 4px 8px;
                                            border-radius: 4px;
                                            font-size: 12px;
                                            background: ${row.status.toLowerCase() === 'completed' ? '#e6f4ea' : '#fff3e0'};
                                            color: ${row.status.toLowerCase() === 'completed' ? '#1e7e34' : '#e65100'};
                                        ">${row.status}</span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;

            // Create a temporary container
            const container = document.createElement('div');
            container.innerHTML = htmlContent;
            document.body.appendChild(container);

            // PDF options
            const opt = {
                margin: 1,
                filename: `scan_history_${new Date().toISOString().split('T')[0]}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                    scale: 2,
                    useCORS: true,
                    letterRendering: true
                },
                jsPDF: { 
                    unit: 'in', 
                    format: 'a4', 
                    orientation: 'landscape'
                }
            };

            // Generate PDF
            await html2pdf().set(opt).from(container).save();

            // Cleanup
            document.body.removeChild(container);

        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert('Error generating PDF file. Please try again.');
        }
    }

    // Add event listeners when the page loads
    const exportCSVBtn = document.getElementById('exportCSV');
    const exportPDFBtn = document.getElementById('exportPDF');
    
    if (exportCSVBtn) {
        exportCSVBtn.addEventListener('click', exportScanHistoryToCSV);
    }
    
    if (exportPDFBtn) {
        exportPDFBtn.addEventListener('click', exportScanHistoryToPDF);
    }
});

// Function to load user's documents
async function loadUserDocuments() {
    try {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        const response = await fetch(`http://localhost:3000/documents/user/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch documents');
        
        const documents = await response.json();
        const documentsList = document.getElementById('documentsList');
        const scanHistoryBody = document.getElementById('scanHistoryBody');
        
        if (!documentsList) {
            console.error('Documents list container not found');
            return;
        }

        if (documents.length === 0) {
            documentsList.innerHTML = '<p class="no-documents">No documents uploaded yet.</p>';
            if (scanHistoryBody) {
                scanHistoryBody.innerHTML = '<tr><td colspan="4">No scan history available.</td></tr>';
            }
            return;
        }

        // Update documents list
        documentsList.innerHTML = documents.map(doc => `
            <div class="document-card">
                <div class="document-id">
                    <i class="fas fa-file-alt"></i>
                    Document ID: ${doc.id}
                    <button class="copy-id" onclick="copyToClipboard('${doc.id}')">
                        <i class="fas fa-copy"></i> Copy ID
                    </button>
                </div>
                <div class="document-date">
                    Uploaded: ${formatDate(doc.createdAt)}
                </div>
                <div class="document-actions">
                    <!-- Use both approaches for diagnosis -->
                    <button onclick="findMatches('${doc.id}')" class="button button-primary btn-sm">
                        <i class="fas fa-search"></i> Find Matches
                    </button>
                    <button onclick="showMatchingDocumentsDirectly('${doc.id}')" class="button button-secondary btn-sm">
                        <i class="fas fa-bug"></i> Debug Matches
                    </button>
                </div>
            </div>
        `).join('');

        // Create matches container if it doesn't exist
        let matchesContainer = document.getElementById('matchesContainer');
        if (!matchesContainer) {
            matchesContainer = document.createElement('div');
            matchesContainer.id = 'matchesContainer';
            matchesContainer.className = 'matches-container';
            matchesContainer.style.display = 'none';
            documentsList.parentNode.insertBefore(matchesContainer, documentsList.nextSibling);
        }

        // Update scan history table
        if (scanHistoryBody) {
            scanHistoryBody.innerHTML = documents.map(doc => `
                <tr>
                    <td>${doc.id}</td>
                    <td>${formatDate(doc.createdAt)}</td>
                    <td>
                        <span class="status-badge ${doc.status?.toLowerCase() || 'completed'}">
                            ${doc.status || 'Completed'}
                        </span>
                    </td>
                    <td class="action-buttons">
                        <button onclick="copyToClipboard('${doc.id}')" class="button button-secondary btn-sm">
                            <i class="fas fa-copy"></i> Copy ID
                        </button>
                    </td>
                </tr>
            `).join('');
        }

    } catch (error) {
        console.error('Error loading documents:', error);
        if (documentsList) {
            documentsList.innerHTML = '<p class="no-documents">Error loading documents. Please try again.</p>';
        }
        if (scanHistoryBody) {
            scanHistoryBody.innerHTML = '<tr><td colspan="4">Error loading scan history.</td></tr>';
        }
    }
}

// Helper function to format date
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Add this helper function for copying IDs
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Document ID copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

// Try this alternative way to update the matches container
function findMatches(docId) {
    console.log('Finding matches for document ID:', docId);
    
    const matchesContainer = document.getElementById('matchesContainer');
    
    if (!matchesContainer) {
        console.error('Matches container not found!');
        return;
    }

    // Show loading state
    matchesContainer.innerHTML = `
        <div style="text-align: center; padding: 30px; background: #e8f0fe; border: 2px solid #1a73e8; border-radius: 8px; margin: 30px 0;">
            <h3 style="color: #1a73e8; margin-bottom: 15px;">Finding Matches...</h3>
            <div style="font-size: 18px;">
                <i class="fas fa-spinner fa-spin"></i> Searching for matching documents...
            </div>
        </div>
    `;
    matchesContainer.style.display = 'block';

    fetch(`http://localhost:3000/documents/matches/${docId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    })
    .then(response => {
        console.log('Response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Match data received:', data);
        
        if (!data.success || !data.matches || data.matches.length === 0) {
            matchesContainer.innerHTML = `
                <div style="text-align: center; padding: 30px; background: #f8f9fa; border: 1px solid #ddd; border-radius: 8px; margin: 30px 0;">
                    <h3 style="margin-bottom: 15px;">Search Results</h3>
                    <div style="font-size: 16px; color: #666;">
                        <i class="fas fa-info-circle"></i> No matching documents found
                    </div>
                </div>
            `;
            return;
        }

        // Display matches without the "View" button
        matchesContainer.innerHTML = `
            <div style="padding: 20px; background: #fff; border: 1px solid #1a73e8; border-radius: 8px; margin: 30px 0;">
                <h3 style="color: #1a73e8; margin-bottom: 20px;">Found ${data.matches.length} Matching Documents</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">
                    ${data.matches.map(match => `
                        <div style="background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
                            <div style="margin-bottom: 15px;">
                                <div style="display: flex; justify-content: space-between;">
                                    <span>Document ID: ${match.id}</span>
                                    <span style="color: #1a73e8;">Similarity: ${match.similarity}</span>
                                </div>
                                <div style="color: #666; font-size: 0.9em;">Created: ${new Date(match.createdAt).toLocaleDateString()}</div>
                            </div>
                            <!-- Removed the View button -->
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    })
    .catch(error => {
        console.error('Error finding matches:', error);
        matchesContainer.innerHTML = `
            <div style="text-align: center; padding: 30px; background: #fde8e8; border: 1px solid #dc3545; border-radius: 8px; margin: 30px 0;">
                <h3 style="color: #dc3545;">Error</h3>
                <div style="font-size: 16px;">
                    <i class="fas fa-exclamation-circle"></i> Error finding matches: ${error.message}
                </div>
            </div>
        `;
    });
}

// Add this function to handle viewing a document
function viewDocument(docId) {
    // Implement document viewing logic here
    console.log('Viewing document:', docId);
}

// Make sure your find matches button has an event listener
document.addEventListener('DOMContentLoaded', function() {
    const findMatchesButtons = document.querySelectorAll('.find-matches-btn');
    findMatchesButtons.forEach(button => {
        button.addEventListener('click', () => {
            const docId = button.getAttribute('data-doc-id');
            findMatches(docId);
        });
    });
});

// Diagnostic function to directly add matching documents to the page
function showMatchingDocumentsDirectly(docId) {
    console.log('Direct debug for document:', docId);
    
    // First, remove any existing debug container
    const existingDebug = document.getElementById('debugMatches');
    if (existingDebug) {
        existingDebug.remove();
    }
    
    // Create a diagnostic container
    const debugContainer = document.createElement('div');
    debugContainer.id = 'debugMatches';
    debugContainer.style.cssText = 'margin: 30px; padding: 20px; background: #ffeb3b; color: black; border: 2px solid red; z-index: 9999; position: relative;';
    
    // Add it to the DOM right at the top for visibility
    const container = document.querySelector('.container');
    container.insertBefore(debugContainer, container.firstChild);
    
    // Show loading state
    debugContainer.innerHTML = '<h3>DEBUG: Loading matches...</h3>';
    
    // Log all request details
    const url = `http://localhost:3000/documents/matches/${docId}`;
    console.log('DEBUG - Fetching from URL:', url);
    
    // Fetch matches
    fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    })
    .then(response => {
        console.log('DEBUG - Response status:', response.status);
        console.log('DEBUG - Response headers:', [...response.headers.entries()]);
        return response.json();
    })
    .then(data => {
        console.log('DIRECT DEBUG - Match data:', data);
        
        // Log detailed response including structure
        debugContainer.innerHTML = `
            <h3>DEBUG: API Response</h3>
            <pre style="background:#000;color:#fff;padding:10px;overflow:auto;max-height:300px;">
            ${JSON.stringify(data, null, 2)}
            </pre>
        `;
        
        if (!data.matches || data.matches.length === 0) {
            debugContainer.innerHTML += '<h3>DEBUG: No matches found</h3>';
            return;
        }
        
        let matchesHtml = `<h3>DEBUG: Found ${data.matches.length} matches</h3><ul style="background:#fff;padding:10px;">`;
        data.matches.forEach(match => {
            matchesHtml += `<li style="margin-bottom:10px;padding:10px;border:1px solid #333;">ID: ${match.id} - Similarity: ${match.similarity} - Created: ${match.createdAt}</li>`;
        });
        matchesHtml += '</ul>';
        
        debugContainer.innerHTML += matchesHtml;
        
        // Also check the regular matches container
        const matchesContainer = document.getElementById('matchesContainer');
        if (matchesContainer) {
            debugContainer.innerHTML += `
                <h3>Matches Container Status:</h3>
                <p>Display: ${matchesContainer.style.display}</p>
                <p>Visibility: ${window.getComputedStyle(matchesContainer).visibility}</p>
                <p>Height: ${window.getComputedStyle(matchesContainer).height}</p>
                <p>Contents:</p>
                <div style="border:1px dotted red;padding:10px;">${matchesContainer.innerHTML}</div>
            `;
        } else {
            debugContainer.innerHTML += '<p>ERROR: Matches container not found!</p>';
        }
    })
    .catch(error => {
        console.error('DIRECT DEBUG - Error:', error);
        debugContainer.innerHTML = `<h3>DEBUG: Error - ${error.message}</h3>`;
    });
}

async function manageCreditRequest(requestId) {
    const response = await fetch(`http://localhost:3000/credit-requests/manage/${requestId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ /* any necessary data */ })
    });

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    const data = await response.json();
    console.log('Credit request managed:', data);
}