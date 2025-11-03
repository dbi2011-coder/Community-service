// js/admin.js - إضافة هذا الكود في بداية الملف
// التحقق من التحميل المزدوج
if (window.adminPageInitialized) {
    console.log('⚠️ Admin page already initialized, skipping...');
} else {
    window.adminPageInitialized = true;

    // الكود الأصلي لـ admin.js يبدأ من هنا...
    // بيانات تسجيل الدخول الافتراضية
    const ADMIN_CREDENTIALS = {
        username: "عمرو بن العاص",
        password: "10243"
    };

    // متغيرات عامة
    let currentSortOrder = 'date';

    // الانتظار حتى يكون Supabase جاهزاً
    document.addEventListener('DOMContentLoaded', function() {
        console.log('👨‍💼 Initializing admin page...');
        
        document.addEventListener('supabaseReady', initAdminPage);
        
        // إذا كان supabase جاهزاً بالفعل
        if (window.supabaseClient && window.isSupabaseInitialized) {
            console.log('✅ Supabase already ready, initializing admin page...');
            setTimeout(initAdminPage, 100);
        }
    });

    // باقي الكود كما هو...
    // [يتبع نفس الكود السابق لـ admin.js]
}
// js/admin.js - الملف المعدل ليعمل مع Supabase
// بيانات تسجيل الدخول الافتراضية
const ADMIN_CREDENTIALS = {
    username: "عمرو بن العاص",
    password: "10243"
};

// متغيرات عامة
let currentSortOrder = 'date';

// دالة للتحقق من تحميل Supabase
function waitForSupabase() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50;
        
        const checkSupabase = () => {
            if (window.supabaseClient && window.supabase) {
                resolve();
            } else if (attempts < maxAttempts) {
                attempts++;
                setTimeout(checkSupabase, 100);
            } else {
                reject(new Error('Supabase failed to load'));
            }
        };
        checkSupabase();
    });
}

// الانتظار حتى يكون Supabase جاهزاً
document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('supabaseReady', initAdminPage);
    
    // إذا كان supabase جاهزاً بالفعل
    if (window.supabaseClient) {
        initAdminPage();
    }
});

function initAdminPage() {
    console.log('Initializing admin page...');
    
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
    adminLoginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('adminUsername').value.trim();
        const password = document.getElementById('adminPassword').value.trim();
        
        try {
            const isValid = await window.supabaseClient.verifyAdmin(username, password);
            
            if (isValid) {
                localStorage.setItem('adminLoggedIn', 'true');
                showAdminPanel();
            } else {
                alert('اسم المستخدم أو كلمة المرور غير صحيحة');
            }
        } catch (error) {
            console.error('Error during login:', error);
            alert('حدث خطأ أثناء تسجيل الدخول');
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
        editStudentForm.addEventListener('submit', async function(e) {
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
            
            try {
                await window.supabaseClient.updateStudentData(originalId, { name, id, phone });
                document.getElementById('editStudentModal').classList.add('hidden');
                await loadStudentsData();
                alert('تم تحديث بيانات الزائر بنجاح!');
            } catch (error) {
                console.error('Error updating student data:', error);
                alert('خطأ في تحديث بيانات الزائر');
            }
        });
    }

    // تحديث البيانات كل 10 ثواني
    setInterval(async () => {
        if (localStorage.getItem('adminLoggedIn') === 'true') {
            await loadStudentsList();
            await loadStudentsData();
            await loadTicketsData();
            await updateTicketsStats();
        }
    }, 10000);
}

// دوال مساعدة للتذاكر
async function getTickets() {
    return await window.supabaseClient.getTickets();
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
async function getContents() {
    return await window.supabaseClient.getContents();
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

// دوال تحميل القوائم
async function loadFilesList() {
    const filesList = document.getElementById('filesList');
    if (!filesList) return;
    
    try {
        const contents = await getContents();
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
    } catch (error) {
        console.error('Error loading files list:', error);
        filesList.innerHTML = '<p class="no-files">خطأ في تحميل المحتويات</p>';
    }
}

async function loadStudentsList() {
    const studentsTableBody = document.getElementById('studentsTableBody');
    if (!studentsTableBody) return;
    
    try {
        const studentsLog = await window.supabaseClient.getStudentsLog();
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
                            <button class="btn edit-btn" onclick="editRating('${log.id}')">تعديل التقييم</button>
                            <button class="btn delete-btn" onclick="deleteRating('${log.id}')">حذف التقييم</button>
                        ` : 'لا يوجد تقييم'}
                        <button class="btn delete-log-btn" onclick="deleteStudentLog('${log.id}')" title="حذف سجل الاطلاع">
                            🗑️ حذف
                        </button>
                    </div>
                </td>
            `;
            studentsTableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading students list:', error);
        studentsTableBody.innerHTML = '<tr><td colspan="9" style="text-align: center;">خطأ في تحميل البيانات</td></tr>';
    }
}

async function loadStudentsData(searchTerm = '') {
    const studentsDataTableBody = document.getElementById('studentsDataTableBody');
    if (!studentsDataTableBody) return;
    
    try {
        const studentsData = await window.supabaseClient.getStudentsData();
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
    } catch (error) {
        console.error('Error loading students data:', error);
        studentsDataTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">خطأ في تحميل البيانات</td></tr>';
    }
}

// دوال إدارة التذاكر
async function openTicketManagement(ticketId) {
    try {
        const tickets = await getTickets();
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
    } catch (error) {
        console.error('Error opening ticket management:', error);
        alert('خطأ في فتح إدارة التذكرة');
    }
}

async function addResponse(ticketId) {
    const responseMessage = document.getElementById('responseMessage');
    if (!responseMessage) return;
    
    const message = responseMessage.value.trim();
    
    if (!message) {
        alert('يرجى إدخال نص الرد');
        return;
    }
    
    try {
        const tickets = await getTickets();
        const ticket = tickets.find(t => t.id === ticketId);
        
        if (ticket) {
            const responses = [...ticket.responses, {
                responder: 'المشرف',
                message: message,
                date: new Date().toLocaleString('ar-SA')
            }];
            
            await window.supabaseClient.updateTicket(ticketId, {
                responses: responses,
                last_update: new Date().toISOString()
            });
            
            responseMessage.value = '';
            await openTicketManagement(ticketId);
            
            // تحديث البيانات
            await loadTicketsData();
            await updateTicketsStats();
            
            alert('تم إضافة الرد بنجاح');
        }
    } catch (error) {
        console.error('Error adding response:', error);
        alert('خطأ في إضافة الرد');
    }
}

async function updateTicketStatusAndClose(ticketId) {
    const statusSelect = document.getElementById('ticketStatus');
    if (!statusSelect) return;
    
    const newStatus = statusSelect.value;
    
    try {
        await window.supabaseClient.updateTicket(ticketId, {
            status: newStatus,
            last_update: new Date().toISOString()
        });
        
        // تحديث البيانات
        await loadTicketsData();
        await updateTicketsStats();
        
        closeTicketModal();
        alert('تم تحديث حالة التذكرة بنجاح');
    } catch (error) {
        console.error('Error updating ticket status:', error);
        alert('خطأ في تحديث حالة التذكرة');
    }
}

async function deleteTicket(ticketId) {
    if (confirm('هل أنت متأكد من حذف هذه التذكرة؟')) {
        try {
            await window.supabaseClient.deleteTicket(ticketId);
            
            // تحديث البيانات
            await loadTicketsData();
            await updateTicketsStats();
            
            alert('تم حذف التذكرة بنجاح');
        } catch (error) {
            console.error('Error deleting ticket:', error);
            alert('خطأ في حذف التذكرة');
        }
    }
}

function closeTicketModal() {
    const modal = document.getElementById('ticketManagementModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// دوال تحميل وعرض التذاكر
async function loadTicketsData(searchTerm = '') {
    const tickets = await getTickets();
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

async function updateTicketsStats() {
    try {
        const tickets = await getTickets();
        const openCount = tickets.filter(t => t.status === 'مفتوحة').length;
        const pendingCount = tickets.filter(t => t.status === 'قيد المعالجة').length;
        const closedCount = tickets.filter(t => t.status === 'مغلقة').length;
        
        const openElement = document.getElementById('openTicketsCount');
        const pendingElement = document.getElementById('pendingTicketsCount');
        const closedElement = document.getElementById('closedTicketsCount');
        
        if (openElement) openElement.textContent = openCount;
        if (pendingElement) pendingElement.textContent = pendingCount;
        if (closedElement) closedElement.textContent = closedCount;
    } catch (error) {
        console.error('Error updating tickets stats:', error);
    }
}

// دوال الطباعة
async function printVisitorsList() {
    try {
        const studentsLog = await window.supabaseClient.getStudentsLog();
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
    } catch (error) {
        console.error('Error printing visitors list:', error);
        alert('خطأ في طباعة القائمة');
    }
}

async function printContentsList() {
    try {
        const contents = await getContents();
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
    } catch (error) {
        console.error('Error printing contents list:', error);
        alert('خطأ في طباعة القائمة');
    }
}

// دوال إدارة المحتوى والزوار
async function adminDeleteContent(contentId) {
    if (confirm('هل أنت متأكد من حذف هذا المحتوى؟')) {
        try {
            await window.supabaseClient.deleteContent(contentId);
            await loadFilesList();
            alert('تم حذف المحتوى بنجاح!');
        } catch (error) {
            console.error('Error deleting content:', error);
            alert('خطأ في حذف المحتوى');
        }
    }
}

async function openEditStudentModal(studentId) {
    try {
        const studentsData = await window.supabaseClient.getStudentsData();
        const student = studentsData.find(s => s.id === studentId);
        
        if (student) {
            document.getElementById('editStudentOriginalId').value = student.id;
            document.getElementById('editStudentName').value = student.name;
            document.getElementById('editStudentId').value = student.id;
            document.getElementById('editStudentPhone').value = student.phone;
            document.getElementById('editStudentModal').classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error opening edit student modal:', error);
        alert('خطأ في فتح نافذة التعديل');
    }
}

async function deleteStudent(studentId) {
    if (confirm('هل أنت متأكد من حذف هذا الزائر؟ سيتم حذف جميع سجلات الاطلاع الخاصة به.')) {
        try {
            await window.supabaseClient.deleteStudent(studentId);
            await loadStudentsData();
            await loadStudentsList();
            alert('تم حذف الزائر بنجاح!');
        } catch (error) {
            console.error('Error deleting student:', error);
            alert('خطأ في حذف الزائر');
        }
    }
}

async function editRating(logId) {
    try {
        const studentsLog = await window.supabaseClient.getStudentsLog();
        const log = studentsLog.find(l => l.id === logId);
        
        if (log) {
            const newRating = prompt('أدخل التقييم الجديد (1-5):', log.rating);
            if (newRating && newRating >= 1 && newRating <= 5) {
                const newNotes = prompt('أدخل الملاحظات الجديدة:', log.ratingNotes || '');
                await window.supabaseClient.updateStudentRating(logId, parseInt(newRating), newNotes || '');
                await loadStudentsList();
                alert('تم تحديث التقييم بنجاح!');
            }
        }
    } catch (error) {
        console.error('Error editing rating:', error);
        alert('خطأ في تعديل التقييم');
    }
}

async function deleteRating(logId) {
    if (confirm('هل أنت متأكد من حذف التقييم؟')) {
        try {
            await window.supabaseClient.updateStudentRating(logId, 0, '');
            await loadStudentsList();
            alert('تم حذف التقييم بنجاح!');
        } catch (error) {
            console.error('Error deleting rating:', error);
            alert('خطأ في حذف التقييم');
        }
    }
}

async function deleteStudentLog(logId) {
    if (confirm('هل أنت متأكد من حذف سجل الاطلاع هذا؟')) {
        try {
            await window.supabaseClient.deleteStudentLog(logId);
            await loadStudentsList();
            alert('تم حذف سجل الاطلاع بنجاح!');
        } catch (error) {
            console.error('Error deleting student log:', error);
            alert('خطأ في حذف سجل الاطلاع');
        }
    }
}

// وظائف مساعدة
function checkAdminLogin() {
    if (localStorage.getItem('adminLoggedIn') === 'true') {
        showAdminPanel();
    }
}

async function showAdminPanel() {
    const adminLoginSection = document.getElementById('adminLoginSection');
    const adminPanel = document.getElementById('adminPanel');
    
    if (adminLoginSection) adminLoginSection.classList.add('hidden');
    if (adminPanel) adminPanel.classList.remove('hidden');
    await loadFilesList();
    await loadStudentsList();
    await loadStudentsData();
    await loadTicketsData();
    await updateTicketsStats();
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

async function handleUploadForm(e) {
    e.preventDefault();
    
    const type = document.getElementById('contentType').value;
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
                // في بيئة حقيقية، يجب رفع الملف إلى خدمة تخزين
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
        try {
            await addNewContent(type, title, content, note);
            document.getElementById('uploadForm').reset();
        } catch (error) {
            alert('خطأ في إضافة المحتوى');
        }
    } else {
        alert('يرجى ملء جميع الحقول المطلوبة');
    }
}

async function addNewContent(type, title, content, note = '') {
    try {
        await window.supabaseClient.addContent({
            type: type,
            title: title,
            content: content,
            note: note
        });
        await loadFilesList();
        alert('تم إضافة المحتوى بنجاح!');
    } catch (error) {
        console.error('Error adding content:', error);
        throw error;
    }
}

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

