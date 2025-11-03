// js/admin.js - إضافة هذا الكود في بداية الملف
// التحقق من التحميل المزدوج
if (window.adminPageInitialized) {
    console.log('⚠️ Admin page already initialized, skipping...');
} else {
    window.adminPageInitialized = true;

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

    // دالة التحقق من بيانات المشرف (معدلة)
    async function verifyAdmin(username, password) {
        // التحقق من بيانات المشرف محلياً أولاً
        if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
            console.log('✅ Admin login successful (local verification)');
            return true;
        }
        
        // إذا فشل التحقق المحلي، جرب Supabase
        if (!window.supabaseClient || !window.supabase) {
            console.log('❌ Supabase not available for admin verification');
            return false;
        }
        
        try {
            const { data, error } = await window.supabase
                .rpc('verify_password', {
                    username_input: username,
                    password_input: password
                });
            
            if (error) {
                console.error('Error in verifyAdmin RPC:', error);
                return false;
            }
            console.log('✅ Admin login successful (Supabase verification)');
            return data;
        } catch (error) {
            console.error('Error in verifyAdmin:', error);
            return false;
        }
    }

    // باقي الكود كما هو...
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
                const isValid = await verifyAdmin(username, password);
                
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
        const modal
