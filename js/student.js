// js/student.js
console.log('🎓 Student script loaded');

// دالة للتحقق من تحميل Supabase
function waitForSupabase() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 100;
        
        const checkSupabase = () => {
            if (window.supabaseClient && window.supabase && window.isSupabaseInitialized) {
                resolve();
            } else if (attempts < maxAttempts) {
                attempts++;
                setTimeout(checkSupabase, 100);
            } else {
                reject(new Error('Supabase not loaded'));
            }
        };
        checkSupabase();
    });
}

// نظام التقييم
function setupRatingSystem() {
    console.log('⭐ Setting up rating system...');
    
    const stars = document.querySelectorAll('.star');
    const submitRatingBtn = document.getElementById('submitRating');
    const skipRatingBtn = document.getElementById('skipRating');
    const currentRatingText = document.getElementById('currentRatingText');
    
    if (!stars.length) {
        console.log('⭐ No stars found, skipping rating system');
        return;
    }
    
    stars.forEach(star => {
        star.addEventListener('click', function() {
            const rating = parseInt(this.getAttribute('data-rating'));
            window.currentRating = rating;
            
            // تحديث مظهر النجوم
            stars.forEach(s => {
                const starRating = parseInt(s.getAttribute('data-rating'));
                if (starRating <= rating) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
            
            // تحديث نص التقييم الحالي
            const ratingTexts = {
                1: '🌠 ضعيف - يحتاج تحسين',
                2: '💫 مقبول - محتوى عادي', 
                3: '⭐ جيد - مفيد ومتميز',
                4: '🌟 جيد جداً - محتوى قيم',
                5: '✨ ممتاز - إبداعي ورائع'
            };
            if (currentRatingText) {
                currentRatingText.textContent = ratingTexts[rating] || 'لم يتم اختيار تقييم بعد';
            }
            
            if (submitRatingBtn) {
                submitRatingBtn.disabled = false;
            }
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
    
    if (submitRatingBtn) {
        submitRatingBtn.addEventListener('click', async function() {
            const notes = document.getElementById('ratingNotes');
            const notesValue = notes ? notes.value.trim() : '';
            
            try {
                await saveRating(window.currentLogId, window.currentRating, notesValue);
                if (window.contentSection) window.contentSection.classList.remove('hidden');
                if (window.ratingSection) window.ratingSection.classList.add('hidden');
                await loadStudentContents();
                alert('شكراً لك على تقييمك!');
            } catch (error) {
                console.error('Error saving rating:', error);
                alert('خطأ في حفظ التقييم');
            }
        });
    }
    
    if (skipRatingBtn) {
        skipRatingBtn.addEventListener('click', function() {
            if (window.contentSection) window.contentSection.classList.remove('hidden');
            if (window.ratingSection) window.ratingSection.classList.add('hidden');
            loadStudentContents();
        });
    }
}

async function saveRating(logId, rating, notes) {
    if (!window.supabaseClient) {
        throw new Error('System not ready');
    }
    
    try {
        await window.supabaseClient.updateStudentRating(logId, rating, notes);
    } catch (error) {
        console.error('Error saving rating:', error);
        throw error;
    }
}

async function loadStudentContents() {
    if (!window.currentStudent || !window.supabaseClient) {
        console.error('Cannot load contents: system not ready');
        return;
    }
    
    try {
        const contents = await window.supabaseClient.getContents();
        const studentLogs = await window.supabaseClient.getStudentsLog();
        
        if (!window.filesContainer) {
            console.error('Files container not found');
            return;
        }
        
        window.filesContainer.innerHTML = '';
        
        if (contents.length === 0) {
            window.filesContainer.innerHTML = '<p>لا توجد محتويات متاحة حالياً.</p>';
            return;
        }
        
        contents.forEach(content => {
            const hasViewed = studentLogs.some(log => 
                log.studentId === window.currentStudent.id && log.contentId === content.id
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
            window.filesContainer.appendChild(contentElement);
            
            if (!hasViewed) {
                const checkbox = document.getElementById(`agreement-${content.id}`);
                const viewBtn = contentElement.querySelector('.view-btn');
                
                if (checkbox && viewBtn) {
                    checkbox.addEventListener('change', function() {
                        viewBtn.disabled = !this.checked;
                        if (this.checked) {
                            this.parentElement.classList.add('checked');
                        } else {
                            this.parentElement.classList.remove('checked');
                        }
                    });
                }
            }
        });
    } catch (error) {
        console.error('Error loading student contents:', error);
        if (window.filesContainer) {
            window.filesContainer.innerHTML = '<p>خطأ في تحميل المحتويات</p>';
        }
    }
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
        case 'fileWithNote':
            try {
                const fileData = JSON.parse(content.content);
                const fileName = fileData.name || content.title;
                const fileType = fileData.type || 'application/octet-stream';
                
                return `
                    <div class="content-preview">
                        <p>ملف مرفوع:</p>
                        <div class="file-info">
                            <p><strong>اسم الملف:</strong> ${fileName}</p>
                            <p><strong>نوع الملف:</strong> ${getFileTypeText(fileType)}</p>
                            <p><strong>الحجم:</strong> ${formatFileSize(fileData.size)}</p>
                        </div>
                        <button class="btn download-btn" onclick="downloadFile('${content.id}', '${fileName}', '${fileType}', '${fileData.data}')">
                            📥 تحميل الملف
                        </button>
                    </div>
                    ${content.note ? `
                        <div class="note-section">
                            <h4>ملاحظة:</h4>
                            <p class="note-text">${content.note}</p>
                        </div>
                    ` : ''}`;
            } catch (error) {
                console.error('Error parsing file data:', error);
                return `
                    <div class="content-preview">
                        <p style="color: red;">خطأ في تحميل الملف</p>
                    </div>`;
            }
        case 'text':
            return `
                <div class="content-preview">
                    <h4>${content.title}</h4>
                    <div class="text-content">${content.content}</div>
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

// دالة لتحميل الملف
window.downloadFile = function(contentId, fileName, fileType, fileData) {
    try {
        // تحويل Base64 إلى Blob
        const binaryString = atob(fileData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: fileType });
        
        // إنشاء رابط تحميل
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log(`تم تحميل الملف: ${fileName} (${contentId})`);
        
        // تسجيل عملية التحميل (اختياري)
        handleFileDownload(contentId, fileName);
        
    } catch (error) {
        console.error('Error downloading file:', error);
        alert('خطأ في تحميل الملف');
    }
}

// دوال مساعدة للملفات
function getFileTypeText(mimeType) {
    const types = {
        'application/pdf': 'PDF',
        'application/msword': 'Word',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
        'application/vnd.ms-excel': 'Excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
        'application/vnd.ms-powerpoint': 'PowerPoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint',
        'image/jpeg': 'صورة JPEG',
        'image/png': 'صورة PNG',
        'text/plain': 'نص',
        'application/zip': 'أرشيف مضغوط'
    };
    return types[mimeType] || mimeType;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getRatingDisplay(logs, contentId) {
    const log = logs.find(log => 
        log.studentId === window.currentStudent.id && log.contentId === contentId
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

function getViewDate(logs, contentId) {
    const log = logs.find(log => 
        log.studentId === window.currentStudent.id && log.contentId === contentId
    );
    return log ? `${log.date} ${log.time}` : '';
}

async function saveStudentData(student) {
    if (!window.supabaseClient) {
        throw new Error('System not ready');
    }
    
    try {
        await window.supabaseClient.saveStudentData(student);
    } catch (error) {
        console.error('Error saving student data:', error);
        throw error;
    }
}

function isValidId(id) {
    return /^\d{10}$/.test(id);
}

function isValidPhone(phone) {
    return /^05\d{8}$/.test(phone);
}

function getFileExtension(filename) {
    if (!filename) return '';
    const parts = filename.split('.');
    return parts.length > 1 ? '.' + parts.pop().toLowerCase() : '';
}

function handleFileDownload(contentId, contentTitle) {
    console.log(`تم تحميل الملف: ${contentTitle} (${contentId})`);
}

// الدالة الرئيسية للصفحة
function initStudentPage() {
    console.log('🎓 Initializing student page...');
    
    // حفظ العناصر في النطاق العام
    window.loginForm = document.getElementById('studentLoginForm');
    window.contentSection = document.getElementById('contentSection');
    window.ratingSection = document.getElementById('ratingSection');
    window.filesContainer = document.getElementById('filesContainer');
    window.displayVisitorName = document.getElementById('displayVisitorName');
    window.displayVisitorId = document.getElementById('displayVisitorId');
    window.displayVisitorPhone = document.getElementById('displayVisitorPhone');
    window.loginTime = document.getElementById('loginTime');
    
    // تهيئة المتغيرات العامة
    window.currentStudent = {
        name: '',
        id: '',
        phone: ''
    };
    
    window.currentRating = 0;
    window.currentContentId = '';
    window.currentContentTitle = '';
    window.currentLogId = '';
    
    // إعداد نظام التقييم
    setupRatingSystem();
    
    // إعداد نموذج التسجيل
    if (window.loginForm) {
        window.loginForm.addEventListener('submit', async function(e) {
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
                    alert('يرجى إدخال رقم جوال صحيح (يبدأ بـ 05 ويحتوي على 10 أرقام)');
                    return;
                }
                
                try {
                    // التحقق من تطابق البيانات إذا كان الزائر مسجل مسبقاً
                    const studentsData = await window.supabaseClient.getStudentsData();
                    const existingStudent = studentsData.find(s => s.id === studentId);
                    
                    if (existingStudent) {
                        if (existingStudent.name !== studentName || existingStudent.phone !== studentPhone) {
                            alert('البيانات لا تتطابق مع السجل السابق. يرجى التأكد من الاسم ورقم الجوال، أو التواصل مع مشرف البرنامج في حال النسيان.');
                            return;
                        }
                    }
                    
                    window.currentStudent = {
                        name: studentName,
                        id: studentId,
                        phone: studentPhone
                    };
                    
                    await saveStudentData(window.currentStudent);
                    
                    if (window.displayVisitorName) window.displayVisitorName.textContent = window.currentStudent.name;
                    if (window.displayVisitorId) window.displayVisitorId.textContent = window.currentStudent.id;
                    if (window.displayVisitorPhone) window.displayVisitorPhone.textContent = window.currentStudent.phone;
                    if (window.loginTime) window.loginTime.textContent = new Date().toLocaleString('ar-SA');
                    
                    if (window.loginForm) window.loginForm.classList.add('hidden');
                    if (window.contentSection) window.contentSection.classList.remove('hidden');
                    
                    await loadStudentContents();
                } catch (error) {
                    console.error('Error during login:', error);
                    alert('حدث خطأ أثناء تسجيل الدخول: ' + error.message);
                }
            } else {
                alert('يرجى ملء جميع الحقول المطلوبة');
            }
        });
    }
    
    console.log('✅ Student page initialized successfully');
}

// جعل الدوال متاحة عالمياً
window.viewContent = async function(contentId, contentTitle) {
    try {
        const logData = {
            studentName: window.currentStudent.name,
            studentId: window.currentStudent.id,
            studentPhone: window.currentStudent.phone,
            contentId: contentId,
            contentTitle: contentTitle
        };
        
        const result = await window.supabaseClient.addStudentLog(logData);
        window.currentLogId = result.id;
        
        // إعداد نظام التقييم
        window.currentContentId = contentId;
        window.currentContentTitle = contentTitle;
        window.currentRating = 0;
        
        // تحديث عنوان المحتوى في واجهة التقييم
        const ratingContentTitle = document.getElementById('ratingContentTitle');
        if (ratingContentTitle) ratingContentTitle.textContent = contentTitle;
        
        // إعادة تعيين النجوم
        document.querySelectorAll('.star').forEach(star => {
            star.classList.remove('active');
        });
        
        const ratingNotes = document.getElementById('ratingNotes');
        if (ratingNotes) ratingNotes.value = '';
        
        const currentRatingText = document.getElementById('currentRatingText');
        if (currentRatingText) currentRatingText.textContent = 'لم يتم اختيار تقييم بعد';
        
        const submitRatingBtn = document.getElementById('submitRating');
        if (submitRatingBtn) submitRatingBtn.disabled = true;
        
        // إظهار قسم التقييم وإخفاء المحتوى
        if (window.contentSection) window.contentSection.classList.add('hidden');
        if (window.ratingSection) window.ratingSection.classList.remove('hidden');
    } catch (error) {
        console.error('Error viewing content:', error);
        alert('خطأ في تأكيد الاطلاع');
    }
};

// بدء التطبيق عند اكتمال التحميل
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Student page DOM loaded');
    
    // الانتظار حتى يكون Supabase جاهزاً
    document.addEventListener('supabaseReady', function() {
        console.log('✅ Supabase ready, initializing student page...');
        setTimeout(initStudentPage, 100);
    });
    
    // إذا كان supabase جاهزاً بالفعل
    if (window.supabaseClient && window.isSupabaseInitialized) {
        console.log('✅ Supabase already ready, initializing student page...');
        setTimeout(initStudentPage, 100);
    }
});
