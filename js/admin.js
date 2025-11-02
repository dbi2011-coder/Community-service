// بيانات تسجيل الدخول الافتراضية
const ADMIN_CREDENTIALS = {
    username: "عمرو بن العاص",
    password: "10243"
};

// متغيرات عامة
let currentSortOrder = 'date';

// دوال مساعدة للتذاكر
function getTickets() {
    return JSON.parse(localStorage.getItem('supportTickets')) || [];
}

function getStatusClass(status) {
    const classes = {
        'مفتوحة': 'status-open',
        'قيد المعالجة': 'status-pending',
        'مغلقة': 'status-closed'
    };
    return classes[status] || 'status-open';
}

// دوال مساعدة أخرى
function getContents() {
    return JSON.parse(localStorage.getItem('adminContents')) || [];
}

function getContentTypeText(type) {
    const types = {
        'link': 'رابط',
        'file': 'ملف',
        'text': 'نص',
        'fileWithNote': 'ملف مع ملاحظة',
        'linkWithNote': 'رابط مع ملاحظة'
    };
    return types[type] || type;
}

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

function isValidId(id) {
    return /^\d{10}$/.test(id);
}

function isValidPhone(phone) {
    return /^05\d{8}$/.test(phone);
}

function getRatingText(rating) {
    const ratings = {
        1: '🌠 ضعيف - يحتاج تحسين',
        2: '💫 مقبول - محتوى عادي', 
        3: '⭐ جيد - مفيد ومتميز',
        4: '🌟 جيد جداً - محتوى قيم',
        5: '✨ ممتاز - إبداعي ورائع'
    };
    return ratings[rating] || 'غير معروف';
}

// إضافة الدوال المفقودة
function getStudentsData() {
    return JSON.parse(localStorage.getItem('studentsData')) || [];
}

// دوال تحميل القوائم
function loadFilesList() {
    const filesList = document.getElementById('filesList');
    if (!filesList) return;
    
    const contents = getContents();
    filesList.innerHTML = '';
    
    if (contents.length === 0) {
        filesList.innerHTML = '<p class="no-files">لا توجد محتويات مضافة</p>';
        return;
    }
    
    contents.forEach(content => {
        const fileElement = document.createElement('div');
        fileElement.className = 'file-item';
        
        let noteHtml = '';
        if ((content.type === 'fileWithNote' || content.type === 'linkWithNote') && content.note) {
            noteHtml = `<p class="file-note">ملاحظة: ${content.note}</p>`;
        }
        
        fileElement.innerHTML = `
            <div class="file-info">
                <h4>${content.title}</h4>
                <p>نوع: ${getContentTypeText(content.type)}</p>
                <p>تاريخ الإضافة: ${content.date}</p>
                ${noteHtml}
            </div>
            <button class="btn delete-btn" onclick="adminDeleteContent('${content.id}')">حذف</button>
        `;
        filesList.appendChild(fileElement);
    });
}

function loadStudentsList() {
    const studentsTableBody = document.getElementById('studentsTableBody');
    if (!studentsTableBody) return;
    
    const studentsLog = JSON.parse(localStorage.getItem('studentsLog')) || [];
    studentsTableBody.innerHTML = '';
    
    if (studentsLog.length === 0) {
        studentsTableBody.innerHTML = '<tr><td colspan="9" style="text-align: center;">لا توجد بيانات</td></tr>';
        return;
    }
    
    // تطبيق الترتيب
    let sortedLog = [...studentsLog];
    
    switch(currentSortOrder) {
        case 'name':
            sortedLog.sort((a, b) => a.studentName.localeCompare(b.studentName));
            break;
        case 'id':
            sortedLog.sort((a, b) => a.studentId.localeCompare(b.studentId));
            break;
        case 'content':
            sortedLog.sort((a, b) => a.contentTitle.localeCompare(b.contentTitle));
            break;
        case 'date':
        default:
            sortedLog.sort((a, b) => b.timestamp - a.timestamp);
            break;
    }
    
    sortedLog.forEach((log, index) => {
        const row = document.createElement('tr');
        const ratingStars = log.rating ? '★'.repeat(log.rating) + '☆'.repeat(5 - log.rating) : 'لم يتم التقييم';
        const ratingNotes = log.ratingNotes || 'لا توجد ملاحظات';
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${log.studentName}</td>
            <td>${log.studentId}</td>
            <td>${log.studentPhone || 'غير محدد'}</td>
            <td>${log.contentTitle}</td>
            <td>${log.date}</td>
            <td>${log.time}</td>
            <td>
                <div class="rating-display">
                    ${ratingStars}
                    ${log.rating ? `<span class="rating-value">${getRatingText(log.rating)}</span>` : ''}
                </div>
                ${log.ratingNotes ? `<div class="rating-notes-tooltip">ملاحظات: ${ratingNotes}</div>` : ''}
            </td>
            <td>
                <div class="action-buttons">
                    ${log.rating ? `
                        <button class="btn edit-btn" onclick="editRating('${log.studentId}', '${log.contentId}')">تعديل التقييم</button>
                        <button class="btn delete-btn" onclick="deleteRating('${log.studentId}', '${log.contentId}')">حذف التقييم</button>
                    ` : 'لا يوجد تقييم'}
                    <button class="btn delete-log-btn" onclick="deleteStudentLog(${index})" title="حذف سجل الاطلاع">
                        🗑️ حذف
                    </button>
                </div>
            </td>
        `;
        studentsTableBody.appendChild(row);
    });
}

function loadStudentsData(searchTerm = '') {
    const studentsDataTableBody = document.getElementById('studentsDataTableBody');
    if (!studentsDataTableBody) return;
    
    const studentsData = getStudentsData();
    studentsDataTableBody.innerHTML = '';
    
    let filteredStudents = studentsData;
    if (searchTerm) {
        filteredStudents = studentsData.filter(student => 
            student.name.includes(searchTerm) || 
            student.id.includes(searchTerm) ||
            student.phone.includes(searchTerm)
        );
    }
    
    if (filteredStudents.length === 0) {
        studentsDataTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">لا توجد بيانات</td></tr>';
        return;
    }
    
    filteredStudents.forEach((student, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${student.name}</td>
            <td>${student.id}</td>
            <td>${student.phone}</td>
            <td>${student.firstLogin}</td>
            <td>
                <button class="btn edit-btn" onclick="openEditStudentModal('${student.id}')">تعديل</button>
                <button class="btn delete-btn" onclick="deleteStudent('${student.id}')">حذف</button>
            </td>
        `;
        studentsDataTableBody.appendChild(row);
    });
}

// دوال إدارة التذاكر
function openTicketManagement(ticketId) {
    const tickets = getTickets();
    const ticket = tickets.find(t => t.id === ticketId);
    
    if (ticket) {
        const modal = document.getElementById('ticketManagementModal');
        const content = document.getElementById('ticketModalContent');
        const ticketIdSpan = document.getElementById('modalTicketId');
        
        if (modal && content && ticketIdSpan) {
            ticketIdSpan.textContent = `#${ticket.id}`;
            
            content.innerHTML = `
                <div class="ticket-management">
                    <div class="ticket-info">
                        <h4>معلومات التذكرة</h4>
                        <p><strong>العنوان:</strong> ${ticket.title}</p>
                        <p><strong>رقم الهوية:</strong> ${ticket.identity}</p>
                        <p><strong>الحالة:</strong> 
                            <select id="ticketStatus" class="status-select">
                                <option value="مفتوحة" ${ticket.status === 'مفتوحة' ? 'selected' : ''}>مفتوحة</option>
                                <option value="قيد المعالجة" ${ticket.status === 'قيد المعالجة' ? 'selected' : ''}>قيد المعالجة</option>
                                <option value="مغلقة" ${ticket.status === 'مغلقة' ? 'selected' : ''}>مغلقة</option>
                            </select>
                        </p>
                    </div>
                    
                    <div class="ticket-description">
                        <h4>وصف المشكلة:</h4>
                        <p>${ticket.description}</p>
                    </div>
                    
                    <div class="response-section">
                        <h4>إضافة رد</h4>
                        <textarea id="responseMessage" rows="4" placeholder="أدخل ردك هنا..."></textarea>
                        <button class="btn" onclick="addResponse('${ticket.id}')">إضافة رد</button>
                    </div>
                    
                    ${ticket.responses.length > 0 ? `
                        <div class="responses-list">
                            <h4>الردود السابقة:</h4>
                            ${ticket.responses.map((response, index) => `
                                <div class="response-item">
                                    <div class="response-header">
                                        <strong>${response.responder}</strong>
                                        <span class="response-date">${response.date}</span>
                                    </div>
                                    <p>${response.message}</p>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    <div class="modal-actions">
                        <button class="btn" onclick="updateTicketStatusAndClose('${ticket.id}')">حفظ التغييرات</button>
                        <button class="btn secondary" onclick="closeTicketModal()">إغلاق</button>
                    </div>
                </div>
            `;
            
            modal.classList.remove('hidden');
        }
    }
}

function addResponse(ticketId) {
    const responseMessage = document.getElementById('responseMessage');
    if (!responseMessage) return;
    
    const message = responseMessage.value.trim();
    
    if (!message) {
        alert('يرجى إدخال نص الرد');
        return;
    }
    
    const tickets = getTickets();
    const ticketIndex = tickets.findIndex(t => t.id === ticketId);
    
    if (ticketIndex !== -1) {
        tickets[ticketIndex].responses.push({
            responder: 'المشرف',
            message: message,
            date: new Date().toLocaleString('ar-SA')
        });
        
        tickets[ticketIndex].lastUpdate = new Date().toLocaleString('ar-SA');
        localStorage.setItem('supportTickets', JSON.stringify(tickets));
        
        responseMessage.value = '';
        openTicketManagement(ticketId);
        
        // تحديث البيانات
        if (window.loadTicketsData) {
            window.loadTicketsData();
        }
        if (window.updateTicketsStats) {
            window.updateTicketsStats();
        }
        
        alert('تم إضافة الرد بنجاح');
    }
}

function updateTicketStatusAndClose(ticketId) {
    const statusSelect = document.getElementById('ticketStatus');
    if (!statusSelect) return;
    
    const newStatus = statusSelect.value;
    const tickets = getTickets();
    const ticketIndex = tickets.findIndex(t => t.id === ticketId);
    
    if (ticketIndex !== -1) {
        tickets[ticketIndex].status = newStatus;
        tickets[ticketIndex].lastUpdate = new Date().toLocaleString('ar-SA');
        localStorage.setItem('supportTickets', JSON.stringify(tickets));
        
        // تحديث البيانات
        if (window.loadTicketsData) {
            window.loadTicketsData();
        }
        if (window.updateTicketsStats) {
            window.updateTicketsStats();
        }
        
        closeTicketModal();
        alert('تم تحديث حالة التذكرة بنجاح');
    }
}

function deleteTicket(ticketId) {
    if (confirm('هل أنت متأكد من حذف هذه التذكرة؟')) {
        const tickets = getTickets();
        const filteredTickets = tickets.filter(t => t.id !== ticketId);
        localStorage.setItem('supportTickets', JSON.stringify(filteredTickets));
        
        // تحديث البيانات
        if (window.loadTicketsData) {
            window.loadTicketsData();
        }
        if (window.updateTicketsStats) {
            window.updateTicketsStats();
        }
        
        alert('تم حذف التذكرة بنجاح');
    }
}

function closeTicketModal() {
    const modal = document.getElementById('ticketManagementModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// دوال تحميل وعرض التذاكر
function loadTicketsData(searchTerm = '') {
    const tickets = getTickets();
    const ticketsTableBody = document.getElementById('ticketsTableBody');
    
    if (!ticketsTableBody) return;
    
    ticketsTableBody.innerHTML = '';
    
    let filteredTickets = tickets;
    if (searchTerm) {
        filteredTickets = tickets.filter(ticket => 
            ticket.id.includes(searchTerm) || 
            ticket.identity.includes(searchTerm) ||
            ticket.title.includes(searchTerm)
        );
    }
    
    if (filteredTickets.length === 0) {
        ticketsTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">لا توجد تذاكر</td></tr>';
        return;
    }
    
    filteredTickets.sort((a, b) => b.createdTimestamp - a.createdTimestamp);
    
    filteredTickets.forEach(ticket => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${ticket.id}</td>
            <td>${ticket.title}</td>
            <td>${ticket.identity}</td>
            <td><span class="ticket-status ${getStatusClass(ticket.status)}">${ticket.status}</span></td>
            <td>${ticket.createdDate}</td>
            <td>
                <div class="ticket-action-buttons">
                    <button class="btn view-btn" onclick="openTicketManagement('${ticket.id}')">إدارة</button>
                    <button class="btn delete-btn" onclick="deleteTicket('${ticket.id}')">حذف</button>
                </div>
            </td>
        `;
        ticketsTableBody.appendChild(row);
    });
}

function updateTicketsStats() {
    const tickets = getTickets();
    const openCount = tickets.filter(t => t.status === 'مفتوحة').length;
    const pendingCount = tickets.filter(t => t.status === 'قيد المعالجة').length;
    const closedCount = tickets.filter(t => t.status === 'مغلقة').length;
    
    const openElement = document.getElementById('openTicketsCount');
    const pendingElement = document.getElementById('pendingTicketsCount');
    const closedElement = document.getElementById('closedTicketsCount');
    
    if (openElement) openElement.textContent = openCount;
    if (pendingElement) pendingElement.textContent = pendingCount;
    if (closedElement) closedElement.textContent = closedCount;
}

// دوال الطباعة
function printVisitorsList() {
    const studentsLog = JSON.parse(localStorage.getItem('studentsLog')) || [];
    const printWindow = window.open('', '_blank');
    
    let sortedLog = [...studentsLog];
    
    switch(currentSortOrder) {
        case 'name':
            sortedLog.sort((a, b) => a.studentName.localeCompare(b.studentName));
            break;
        case 'id':
            sortedLog.sort((a, b) => a.studentId.localeCompare(b.studentId));
            break;
        case 'content':
            sortedLog.sort((a, b) => a.contentTitle.localeCompare(b.contentTitle));
            break;
        case 'date':
        default:
            sortedLog.sort((a, b) => b.timestamp - a.timestamp);
            break;
    }
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <title>قائمة المطلعين</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { text-align: center; color: #333; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
                th { background-color: #f5f5f5; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            <h1>قائمة المطلعين - مشروع الخدمة المجتمعية</h1>
            <p>تاريخ الطباعة: ${new Date().toLocaleString('ar-SA')}</p>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>الاسم</th>
                        <th>رقم الهوية</th>
                        <th>رقم الجوال</th>
                        <th>المحتوى</th>
                        <th>التاريخ</th>
                        <th>الوقت</th>
                        <th>التقييم</th>
                        <th>الملاحظات</th>
                    </tr>
                </thead>
                <tbody>
                    ${sortedLog.map((log, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${log.studentName}</td>
                            <td>${log.studentId}</td>
                            <td>${log.studentPhone || 'غير محدد'}</td>
                            <td>${log.contentTitle}</td>
                            <td>${log.date}</td>
                            <td>${log.time}</td>
                            <td>${log.rating ? '★'.repeat(log.rating) + '☆'.repeat(5 - log.rating) : 'لم يتم التقييم'}</td>
                            <td>${log.ratingNotes || 'لا توجد ملاحظات'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
}

function printContentsList() {
    const contents = getContents();
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <title>قائمة المحتويات</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { text-align: center; color: #333; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
                th { background-color: #f5f5f5; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            <h1>قائمة المحتويات - مشروع الخدمة المجتمعية</h1>
            <p>تاريخ الطباعة: ${new Date().toLocaleString('ar-SA')}</p>
            <table>
                <thead>
                    <tr>
                        <th>العنوان</th>
                        <th>النوع</th>
                        <th>تاريخ الإضافة</th>
                    </tr>
                </thead>
                <tbody>
                    ${contents.map(content => `
                        <tr>
                            <td>${content.title}</td>
                            <td>${getContentTypeText(content.type)}</td>
                            <td>${content.date}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
}

// دوال إدارة المحتوى والزوار
function adminDeleteContent(contentId) {
    if (confirm('هل أنت متأكد من حذف هذا المحتوى؟')) {
        const contents = getContents();
        const filteredContents = contents.filter(content => content.id !== contentId);
        localStorage.setItem('adminContents', JSON.stringify(filteredContents));
        
        // تحديث الواجهة مباشرة
        loadFilesList();
        alert('تم حذف المحتوى بنجاح!');
    }
}

function openEditStudentModal(studentId) {
    const studentsData = getStudentsData();
    const student = studentsData.find(s => s.id === studentId);
    
    if (student) {
        document.getElementById('editStudentOriginalId').value = student.id;
        document.getElementById('editStudentName').value = student.name;
        document.getElementById('editStudentId').value = student.id;
        document.getElementById('editStudentPhone').value = student.phone;
        document.getElementById('editStudentModal').classList.remove('hidden');
    }
}

// إصلاح دالة حذف الزائر
function deleteStudent(studentId) {
    if (confirm('هل أنت متأكد من حذف هذا الزائر؟ سيتم حذف جميع سجلات الاطلاع الخاصة به.')) {
        try {
            // بيانات الزوار
            let studentsData = JSON.parse(localStorage.getItem('studentsData')) || [];
            studentsData = studentsData.filter(student => student.id !== studentId);
            localStorage.setItem('studentsData', JSON.stringify(studentsData));
            
            // سجلات الاطلاع
            let studentsLog = JSON.parse(localStorage.getItem('studentsLog')) || [];
            studentsLog = studentsLog.filter(log => log.studentId !== studentId);
            localStorage.setItem('studentsLog', JSON.stringify(studentsLog));
            
            // تحديث الواجهة
            loadStudentsData();
            loadStudentsList();
            
            alert('تم حذف الزائر بنجاح!');
            
        } catch (error) {
            console.error('Error deleting student:', error);
            alert('حدث خطأ أثناء حذف الزائر: ' + error.message);
        }
    }
}

function editRating(studentId, contentId) {
    const studentsLog = JSON.parse(localStorage.getItem('studentsLog')) || [];
    const logIndex = studentsLog.findIndex(log => 
        log.studentId === studentId && log.contentId === contentId
    );
    
    if (logIndex !== -1) {
        const newRating = prompt('أدخل التقييم الجديد (1-5):', studentsLog[logIndex].rating);
        if (newRating && newRating >= 1 && newRating <= 5) {
            const newNotes = prompt('أدخل الملاحظات الجديدة:', studentsLog[logIndex].ratingNotes || '');
            studentsLog[logIndex].rating = parseInt(newRating);
            studentsLog[logIndex].ratingNotes = newNotes || '';
            studentsLog[logIndex].ratingDate = new Date().toLocaleString('ar-SA');
            localStorage.setItem('studentsLog', JSON.stringify(studentsLog));
            loadStudentsList();
            alert('تم تحديث التقييم بنجاح!');
        }
    }
}

function deleteRating(studentId, contentId) {
    if (confirm('هل أنت متأكد من حذف التقييم؟')) {
        const studentsLog = JSON.parse(localStorage.getItem('studentsLog')) || [];
        const logIndex = studentsLog.findIndex(log => 
            log.studentId === studentId && log.contentId === contentId
        );
        
        if (logIndex !== -1) {
            studentsLog[logIndex].rating = 0;
            studentsLog[logIndex].ratingNotes = '';
            studentsLog[logIndex].ratingDate = '';
            localStorage.setItem('studentsLog', JSON.stringify(studentsLog));
            loadStudentsList();
            alert('تم حذف التقييم بنجاح!');
        }
    }
}

function deleteStudentLog(logIndex) {
    if (confirm('هل أنت متأكد من حذف سجل الاطلاع هذا؟')) {
        const studentsLog = JSON.parse(localStorage.getItem('studentsLog')) || [];
        
        if (logIndex >= 0 && logIndex < studentsLog.length) {
            studentsLog.splice(logIndex, 1);
            localStorage.setItem('studentsLog', JSON.stringify(studentsLog));
            loadStudentsList();
            alert('تم حذف سجل الاطلاع بنجاح!');
        }
    }
}

// التهيئة الرئيسية
document.addEventListener('DOMContentLoaded', function() {
    const adminLoginSection = document.getElementById('adminLoginSection');
    const adminPanel = document.getElementById('adminPanel');
    const adminLoginForm = document.getElementById('adminLoginForm');
    const contentType = document.getElementById('contentType');
    const uploadForm = document.getElementById('uploadForm');
    const searchStudent = document.getElementById('searchStudent');
    const editStudentForm = document.getElementById('editStudentForm');
    const cancelEdit = document.getElementById('cancelEdit');
    const closeModal = document.querySelector('.close-modal');
    const printVisitorsBtn = document.getElementById('printVisitorsBtn');
    const printContentsBtn = document.getElementById('printContentsBtn');
    const searchTickets = document.getElementById('searchTickets');
    const sortOrder = document.getElementById('sortOrder');

    // التحقق من حالة تسجيل الدخول
    checkAdminLogin();

    // التعامل مع تسجيل الدخول
    adminLoginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('adminUsername').value.trim();
        const password = document.getElementById('adminPassword').value.trim();
        
        if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
            localStorage.setItem('adminLoggedIn', 'true');
            showAdminPanel();
        } else {
            alert('اسم المستخدم أو كلمة المرور غير صحيحة');
        }
    });

    // التعامل مع تغيير نوع المحتوى
    if (contentType) {
        contentType.addEventListener('change', handleContentTypeChange);
    }

    // التعامل مع رفع المحتوى
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleUploadForm);
    }

    // أزرار الطباعة
    if (printVisitorsBtn) {
        printVisitorsBtn.addEventListener('click', printVisitorsList);
    }

    if (printContentsBtn) {
        printContentsBtn.addEventListener('click', printContentsList);
    }

    // البحث عن زائر
    if (searchStudent) {
        searchStudent.addEventListener('input', function() {
            loadStudentsData(this.value.trim());
        });
    }

    // البحث في التذاكر
    if (searchTickets) {
        searchTickets.addEventListener('input', function() {
            loadTicketsData(this.value.trim());
        });
    }

    // الترتيب في سجل المطلعين
    if (sortOrder) {
        sortOrder.addEventListener('change', function() {
            currentSortOrder = this.value;
            loadStudentsList();
        });
    }

    // إغلاق نافذة التعديل
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            document.getElementById('editStudentModal').classList.add('hidden');
        });
    }

    if (cancelEdit) {
        cancelEdit.addEventListener('click', function() {
            document.getElementById('editStudentModal').classList.add('hidden');
        });
    }

    // إغلاق النافذة عند النقر خارجها
    const editStudentModal = document.getElementById('editStudentModal');
    if (editStudentModal) {
        editStudentModal.addEventListener('click', function(e) {
            if (e.target === editStudentModal) {
                editStudentModal.classList.add('hidden');
            }
        });
    }

    // حفظ تعديلات الزائر
    if (editStudentForm) {
        editStudentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const originalId = document.getElementById('editStudentOriginalId').value;
            const name = document.getElementById('editStudentName').value.trim();
            const id = document.getElementById('editStudentId').value.trim();
            const phone = document.getElementById('editStudentPhone').value.trim();
            
            if (!name || !id || !phone) {
                alert('يرجى ملء جميع الحقول');
                return;
            }
            
            if (!isValidId(id)) {
                alert('يرجى إدخال رقم هوية صحيح (10 أرقام)');
                return;
            }
            
            if (!isValidPhone(phone)) {
                alert('يرجى إدخال رقم جوال صحيح');
                return;
            }
            
            updateStudentData(originalId, { name, id, phone });
            document.getElementById('editStudentModal').classList.add('hidden');
            loadStudentsData();
            alert('تم تحديث بيانات الزائر بنجاح!');
        });
    }

    // وظائف مساعدة
    function checkAdminLogin() {
        if (localStorage.getItem('adminLoggedIn') === 'true') {
            showAdminPanel();
        }
    }

    function showAdminPanel() {
        if (adminLoginSection) adminLoginSection.classList.add('hidden');
        if (adminPanel) adminPanel.classList.remove('hidden');
        loadFilesList();
        loadStudentsList();
        loadStudentsData();
        loadTicketsData();
        updateTicketsStats();
    }

    function handleContentTypeChange() {
        const linkInput = document.getElementById('linkInput');
        const fileInput = document.getElementById('fileInput');
        const textInput = document.getElementById('textInput');
        const fileWithNoteInput = document.getElementById('fileWithNoteInput');
        const linkWithNoteInput = document.getElementById('linkWithNoteInput');
        
        if (linkInput) linkInput.classList.add('hidden');
        if (fileInput) fileInput.classList.add('hidden');
        if (textInput) textInput.classList.add('hidden');
        if (fileWithNoteInput) fileWithNoteInput.classList.add('hidden');
        if (linkWithNoteInput) linkWithNoteInput.classList.add('hidden');
        
        switch(this.value) {
            case 'link':
                if (linkInput) linkInput.classList.remove('hidden');
                break;
            case 'file':
                if (fileInput) fileInput.classList.remove('hidden');
                break;
            case 'text':
                if (textInput) textInput.classList.remove('hidden');
                break;
            case 'fileWithNote':
                if (fileWithNoteInput) fileWithNoteInput.classList.remove('hidden');
                break;
            case 'linkWithNote':
                if (linkWithNoteInput) linkWithNoteInput.classList.remove('hidden');
                break;
        }
    }

    function handleUploadForm(e) {
        e.preventDefault();
        
        const type = contentType.value;
        const title = document.getElementById('contentTitle').value.trim();
        let content = '';
        let note = '';
        
        switch(type) {
            case 'link':
                content = document.getElementById('contentLink').value.trim();
                if (!isValidUrl(content)) {
                    alert('يرجى إدخال رابط صحيح');
                    return;
                }
                break;
            case 'file':
                const file = document.getElementById('contentFile').files[0];
                if (file) {
                    content = URL.createObjectURL(file);
                } else {
                    alert('يرجى اختيار ملف');
                    return;
                }
                break;
            case 'text':
                content = document.getElementById('contentText').value.trim();
                if (content.length < 5) {
                    alert('يرجى إدخال نص ذو محتوى');
                    return;
                }
                break;
            case 'fileWithNote':
                const fileWithNote = document.getElementById('contentFileWithNote').files[0];
                note = document.getElementById('contentNote').value.trim();
                if (fileWithNote) {
                    content = URL.createObjectURL(fileWithNote);
                } else {
                    alert('يرجى اختيار ملف');
                    return;
                }
                if (note.length < 3) {
                    alert('يرجى إدخال ملاحظة حول الملف');
                    return;
                }
                break;
            case 'linkWithNote':
                content = document.getElementById('contentLinkWithNote').value.trim();
                note = document.getElementById('contentLinkNote').value.trim();
                if (!isValidUrl(content)) {
                    alert('يرجى إدخال رابط صحيح');
                    return;
                }
                if (note.length < 3) {
                    alert('يرجى إدخال ملاحظة حول الرابط');
                    return;
                }
                break;
        }
        
        if (title && content) {
            addNewContent(type, title, content, note);
            uploadForm.reset();
        } else {
            alert('يرجى ملء جميع الحقول المطلوبة');
        }
    }

    function addNewContent(type, title, content, note = '') {
        const contents = getContents();
        const newContent = {
            id: Date.now().toString(),
            type: type,
            title: title,
            content: content,
            note: note,
            date: new Date().toLocaleString('ar-SA')
        };
        
        contents.push(newContent);
        localStorage.setItem('adminContents', JSON.stringify(contents));
        loadFilesList();
        alert('تم إضافة المحتوى بنجاح!');
    }

    function updateStudentData(originalId, newData) {
        const studentsData = getStudentsData();
        const studentIndex = studentsData.findIndex(s => s.id === originalId);
        
        if (studentIndex !== -1) {
            studentsData[studentIndex] = {
                ...studentsData[studentIndex],
                ...newData
            };
            
            if (originalId !== newData.id) {
                updateStudentsLog(originalId, newData.id, newData.name, newData.phone);
            }
            
            localStorage.setItem('studentsData', JSON.stringify(studentsData));
        }
    }

    function updateStudentsLog(oldId, newId, newName, newPhone) {
        const studentsLog = JSON.parse(localStorage.getItem('studentsLog')) || [];
        const updatedLog = studentsLog.map(log => {
            if (log.studentId === oldId) {
                return {
                    ...log,
                    studentId: newId,
                    studentName: newName,
                    studentPhone: newPhone
                };
            }
            return log;
        });
        localStorage.setItem('studentsLog', JSON.stringify(updatedLog));
        loadStudentsList();
    }

    // تحديث البيانات كل 5 ثواني
    setInterval(() => {
        loadStudentsList();
        loadStudentsData();
        loadTicketsData();
        updateTicketsStats();
    }, 5000);
});

// جعل جميع الدوال متاحة في النطاق العام
window.openTicketManagement = openTicketManagement;
window.addResponse = addResponse;
window.updateTicketStatusAndClose = updateTicketStatusAndClose;
window.deleteTicket = deleteTicket;
window.closeTicketModal = closeTicketModal;
window.loadTicketsData = loadTicketsData;
window.updateTicketsStats = updateTicketsStats;
window.printVisitorsList = printVisitorsList;
window.printContentsList = printContentsList;
window.adminDeleteContent = adminDeleteContent;
window.openEditStudentModal = openEditStudentModal;
window.deleteStudent = deleteStudent;
window.editRating = editRating;
window.deleteRating = deleteRating;
window.deleteStudentLog = deleteStudentLog;
window.getStudentsData = getStudentsData;
window.getContents = getContents;
window.loadFilesList = loadFilesList;
window.loadStudentsList = loadStudentsList;
window.loadStudentsData = loadStudentsData;
