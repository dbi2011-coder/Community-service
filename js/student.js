document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('studentLoginForm');
    const contentSection = document.getElementById('contentSection');
    const ratingSection = document.getElementById('ratingSection');
    const filesContainer = document.getElementById('filesContainer');
    const displayVisitorName = document.getElementById('displayVisitorName');
    const displayVisitorId = document.getElementById('displayVisitorId');
    const displayVisitorPhone = document.getElementById('displayVisitorPhone');
    const loginTime = document.getElementById('loginTime');
    
    let currentStudent = {
        name: '',
        id: '',
        phone: ''
    };
    
    let currentRating = 0;
    let currentContentId = '';
    let currentContentTitle = '';

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const studentName = document.getElementById('studentName').value.trim();
        const studentId = document.getElementById('studentId').value.trim();
        const studentPhone = document.getElementById('studentPhone').value.trim();
        
        if (studentName && studentId && studentPhone) {
            if (!isValidId(studentId)) {
                alert('يرجى إدخال رقم هوية صحيح (10 أرقام)');
                return;
            }
            
            if (!isValidPhone(studentPhone)) {
                alert('يرجى إدخال رقم جوال صحيح');
                return;
            }
            
            // التحقق من تطابق البيانات إذا كان الزائر مسجل مسبقاً
            const existingStudent = checkExistingStudent(studentId, studentName, studentPhone);
            if (existingStudent === 'mismatch') {
                alert('البيانات لا تتطابق مع السجل السابق. يرجى التأكد من الاسم ورقم الجوال، أو التواصل مع مشرف البرنامج في حال النسيان.');
                return;
            }
            
            currentStudent = {
                name: studentName,
                id: studentId,
                phone: studentPhone
            };
            
            saveStudentData(currentStudent);
            
            displayVisitorName.textContent = currentStudent.name;
            displayVisitorId.textContent = currentStudent.id;
            displayVisitorPhone.textContent = currentStudent.phone;
            loginTime.textContent = new Date().toLocaleString('ar-SA');
            
            loginForm.classList.add('hidden');
            contentSection.classList.remove('hidden');
            loadStudentContents();
        } else {
            alert('يرجى ملء جميع الحقول المطلوبة');
        }
    });
    
    // التحقق من بيانات الزائر المسجل مسبقاً
    function checkExistingStudent(studentId, studentName, studentPhone) {
        const studentsData = getStudentsData();
        const existingStudent = studentsData.find(s => s.id === studentId);
        
        if (existingStudent) {
            if (existingStudent.name !== studentName || existingStudent.phone !== studentPhone) {
                return 'mismatch';
            }
        }
        return 'match';
    }

    // نظام التقييم
    function setupRatingSystem() {
        const stars = document.querySelectorAll('.star');
        const submitRatingBtn = document.getElementById('submitRating');
        const skipRatingBtn = document.getElementById('skipRating');
        const currentRatingText = document.getElementById('currentRatingText');
        const ratingContentTitle = document.getElementById('ratingContentTitle');
        
        stars.forEach(star => {
            star.addEventListener('click', function() {
                const rating = parseInt(this.getAttribute('data-rating'));
                currentRating = rating;
                
                // تحديث مظهر النجوم
                stars.forEach(s => {
                    const starRating = parseInt(s.getAttribute('data-rating'));
                    if (starRating <= rating) {
                        s.classList.add('active');
                    } else {
                        s.classList.remove('active');
                    }
                });
                
                // تحديث نص التقييم الحالي بعبارات جميلة
                const ratingTexts = {
                    1: '🌠 ضعيف - يحتاج تحسين',
                    2: '💫 مقبول - محتوى عادي', 
                    3: '⭐ جيد - مفيد ومتميز',
                    4: '🌟 جيد جداً - محتوى قيم',
                    5: '✨ ممتاز - إبداعي ورائع'
                };
                currentRatingText.textContent = ratingTexts[rating] || 'لم يتم اختيار تقييم بعد';
                
                submitRatingBtn.disabled = false;
            });
            
            // تأثير التمرير
            star.addEventListener('mouseenter', function() {
                const rating = parseInt(this.getAttribute('data-rating'));
                stars.forEach(s => {
                    const starRating = parseInt(s.getAttribute('data-rating'));
                    if (starRating <= rating) {
                        s.classList.add('hover');
                    } else {
                        s.classList.remove('hover');
                    }
                });
            });
            
            star.addEventListener('mouseleave', function() {
                stars.forEach(s => {
                    s.classList.remove('hover');
                });
            });
        });
        
        submitRatingBtn.addEventListener('click', function() {
            const notes = document.getElementById('ratingNotes').value.trim();
            saveRating(currentContentId, currentContentTitle, currentRating, notes);
            contentSection.classList.remove('hidden');
            ratingSection.classList.add('hidden');
            loadStudentContents();
            alert('شكراً لك على تقييمك!');
        });
        
        skipRatingBtn.addEventListener('click', function() {
            contentSection.classList.remove('hidden');
            ratingSection.classList.add('hidden');
            loadStudentContents();
        });
    }

    function saveRating(contentId, contentTitle, rating, notes) {
        const studentsLog = getStudentLogs();
        const logIndex = studentsLog.findIndex(log => 
            log.studentId === currentStudent.id && 
            log.contentId === contentId &&
            !log.rating // البحث عن السجل الذي لم يتم تقييمه بعد
        );
        
        if (logIndex !== -1) {
            studentsLog[logIndex].rating = rating;
            studentsLog[logIndex].ratingNotes = notes;
            studentsLog[logIndex].ratingDate = new Date().toLocaleString('ar-SA');
            localStorage.setItem('studentsLog', JSON.stringify(studentsLog));
        }
    }
    
    function loadStudentContents() {
        const contents = getContents();
        const studentLogs = getStudentLogs();
        
        filesContainer.innerHTML = '';
        
        if (contents.length === 0) {
            filesContainer.innerHTML = '<p>لا توجد محتويات متاحة حالياً.</p>';
            return;
        }
        
        contents.forEach(content => {
            const hasViewed = studentLogs.some(log => 
                log.studentId === currentStudent.id && log.contentId === content.id
            );
            
            const contentElement = document.createElement('div');
            contentElement.className = `student-file-item ${hasViewed ? 'viewed' : ''}`;
            contentElement.innerHTML = `
                <div class="file-header">
                    <h3>${content.title}</h3>
                    <span class="status">${hasViewed ? 'تم الاطلاع ✓' : 'لم يتم الاطلاع'}</span>
                </div>
                <div class="file-content">
                    ${renderContent(content)}
                </div>
                <div class="file-actions">
                    ${!hasViewed ? `
                        <div class="agreement-section">
                            <label class="checkbox-container">
                                <input type="checkbox" id="agreement-${content.id}" class="agreement-checkbox">
                                <span class="checkmark"></span>
                                نعم اطلعت على المحتوى المرفق
                            </label>
                            <button class="btn view-btn" onclick="viewContent('${content.id}', '${content.title}')" disabled>
                                تأكيد الاطلاع
                            </button>
                        </div>
                    ` : `
                        <p class="viewed-message">تم تأكيد الاطلاع في: ${getViewDate(studentLogs, content.id)}</p>
                        ${getRatingDisplay(studentLogs, content.id)}
                    `}
                </div>
            `;
            filesContainer.appendChild(contentElement);
            
            if (!hasViewed) {
                const checkbox = document.getElementById(`agreement-${content.id}`);
                const viewBtn = contentElement.querySelector('.view-btn');
                
                checkbox.addEventListener('change', function() {
                    viewBtn.disabled = !this.checked;
                    if (this.checked) {
                        this.parentElement.classList.add('checked');
                    } else {
                        this.parentElement.classList.remove('checked');
                    }
                });
            }
        });
    }
    
    function renderContent(content) {
        switch(content.type) {
            case 'link':
                return `
                    <div class="content-preview">
                        <p>رابط خارجي:</p>
                        <a href="${content.content}" target="_blank" class="file-link" onclick="event.stopPropagation()">
                            ${content.title} - اضغط هنا لفتح الرابط
                        </a>
                    </div>`;
            case 'file':
                // إصلاح مشكلة تنزيل الملفات
                const fileName = content.title + getFileExtension(content.content);
                return `
                    <div class="content-preview">
                        <p>ملف مرفوع:</p>
                        <a href="${content.content}" download="${fileName}" class="file-link" onclick="handleFileDownload('${content.id}', '${content.title}')">
                            ${content.title} - اضغط هنا لتحميل الملف
                        </a>
                    </div>`;
            case 'text':
                return `
                    <div class="content-preview">
                        <h4>${content.title}</h4>
                        <p>${content.content}</p>
                    </div>`;
            case 'fileWithNote':
                const fileNameWithNote = content.title + getFileExtension(content.content);
                return `
                    <div class="content-preview">
                        <p>ملف مرفوع:</p>
                        <a href="${content.content}" download="${fileNameWithNote}" class="file-link" onclick="handleFileDownload('${content.id}', '${content.title}')">
                            ${content.title} - اضغط هنا لتحميل الملف
                        </a>
                        ${content.note ? `
                            <div class="note-section">
                                <h4>ملاحظة:</h4>
                                <p class="note-text">${content.note}</p>
                            </div>
                        ` : ''}
                    </div>`;
            case 'linkWithNote':
                return `
                    <div class="content-preview">
                        <p>رابط خارجي:</p>
                        <a href="${content.content}" target="_blank" class="file-link" onclick="event.stopPropagation()">
                            ${content.title} - اضغط هنا لفتح الرابط
                        </a>
                        ${content.note ? `
                            <div class="note-section">
                                <h4>ملاحظة:</h4>
                                <p class="note-text">${content.note}</p>
                            </div>
                        ` : ''}
                    </div>`;
            default:
                return '<p>نوع المحتوى غير معروف</p>';
        }
    }
    
    function getRatingDisplay(logs, contentId) {
        const log = logs.find(log => 
            log.studentId === currentStudent.id && log.contentId === contentId
        );
        
        if (log && log.rating) {
            const stars = '★'.repeat(log.rating) + '☆'.repeat(5 - log.rating);
            const ratingTexts = {
                1: '🌠 ضعيف - يحتاج تحسين',
                2: '💫 مقبول - محتوى عادي', 
                3: '⭐ جيد - مفيد ومتميز',
                4: '🌟 جيد جداً - محتوى قيم',
                5: '✨ ممتاز - إبداعي ورائع'
            };
            return `
                <div class="rating-display">
                    <strong>تقييمك:</strong> ${stars} (${ratingTexts[log.rating]})
                    ${log.ratingNotes ? `<br><small>ملاحظاتك: ${log.ratingNotes}</small>` : ''}
                </div>
            `;
        }
        return '';
    }
    
    function getRatingText(rating) {
        const ratings = {
            1: 'ضعيف',
            2: 'مقبول',
            3: 'جيد',
            4: 'جيد جداً',
            5: 'ممتاز'
        };
        return ratings[rating] || 'غير معروف';
    }
    
    function getContents() {
        return JSON.parse(localStorage.getItem('adminContents')) || [];
    }
    
    function getStudentLogs() {
        return JSON.parse(localStorage.getItem('studentsLog')) || [];
    }
    
    function getViewDate(logs, contentId) {
        const log = logs.find(log => 
            log.studentId === currentStudent.id && log.contentId === contentId
        );
        return log ? `${log.date} ${log.time}` : '';
    }
    
    function saveStudentData(student) {
        const studentsData = getStudentsData();
        const existingStudent = studentsData.find(s => s.id === student.id);
        
        if (!existingStudent) {
            studentsData.push({
                name: student.name,
                id: student.id,
                phone: student.phone,
                firstLogin: new Date().toLocaleString('ar-SA')
            });
            localStorage.setItem('studentsData', JSON.stringify(studentsData));
        }
    }
    
    function getStudentsData() {
        return JSON.parse(localStorage.getItem('studentsData')) || [];
    }
    
    function isValidId(id) {
        return /^\d{10}$/.test(id);
    }
    
    function isValidPhone(phone) {
        return /^05\d{8}$/.test(phone);
    }

    // دالة مساعدة للحصول على امتداد الملف
    function getFileExtension(url) {
        if (url.includes('.pdf')) return '.pdf';
        if (url.includes('.doc') || url.includes('.docx')) return '.docx';
        if (url.includes('.xls') || url.includes('.xlsx')) return '.xlsx';
        if (url.includes('.ppt') || url.includes('.pptx')) return '.pptx';
        if (url.includes('.jpg') || url.includes('.jpeg')) return '.jpg';
        if (url.includes('.png')) return '.png';
        if (url.includes('.zip')) return '.zip';
        return '.file';
    }

    // دالة لتسجيل تحميل الملفات
    function handleFileDownload(contentId, contentTitle) {
        // يمكن إضافة تسجيل لتحميل الملفات إذا لزم الأمر
        console.log(`تم تحميل الملف: ${contentTitle} (${contentId})`);
    }
    
    window.viewContent = function(contentId, contentTitle) {
        const studentsLog = getStudentLogs();
        const now = new Date();
        
        studentsLog.push({
            studentName: currentStudent.name,
            studentId: currentStudent.id,
            studentPhone: currentStudent.phone,
            contentId: contentId,
            contentTitle: contentTitle,
            date: now.toLocaleDateString('ar-SA'),
            time: now.toLocaleTimeString('ar-SA'),
            timestamp: now.getTime(),
            rating: 0, // سيتم تحديثه لاحقاً
            ratingNotes: '',
            ratingDate: ''
        });
        
        localStorage.setItem('studentsLog', JSON.stringify(studentsLog));
        
        // إعداد نظام التقييم
        currentContentId = contentId;
        currentContentTitle = contentTitle;
        currentRating = 0;
        
        // تحديث عنوان المحتوى في واجهة التقييم
        document.getElementById('ratingContentTitle').textContent = contentTitle;
        
        // إعادة تعيين النجوم
        document.querySelectorAll('.star').forEach(star => {
            star.classList.remove('active');
        });
        document.getElementById('ratingNotes').value = '';
        document.getElementById('currentRatingText').textContent = 'لم يتم اختيار تقييم بعد';
        document.getElementById('submitRating').disabled = true;
        
        // إظهار قسم التقييم وإخفاء المحتوى
        contentSection.classList.add('hidden');
        ratingSection.classList.remove('hidden');
    };

    // تهيئة نظام التقييم عند تحميل الصفحة
    setupRatingSystem();
});
