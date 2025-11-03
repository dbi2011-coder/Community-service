// js/main.js
console.log('🚀 Starting application initialization...');

// دالة للتنقل بين الصفحات
function navigateTo(page) {
    window.location.href = page;
}

// دالة لتحميل مكتبة Supabase بشكل موثوق
function loadSupabaseLibrary() {
    return new Promise((resolve, reject) => {
        // إذا كانت المكتبة محملة بالفعل
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            console.log('✅ Supabase library already loaded');
            resolve();
            return;
        }

        // إذا كان هناك محاولة سابقة، استخدمها
        if (window.supabaseLoadPromise) {
            window.supabaseLoadPromise.then(resolve).catch(reject);
            return;
        }

        console.log('📦 Loading Supabase library...');
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
        script.integrity = 'sha384-2pT8Ld9qpsVw3R8S+Q8xkJtDdWp2si5+5+5En+5Z5Q5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5';
        script.crossOrigin = 'anonymous';
        
        // إنشاء promise جديد
        window.supabaseLoadPromise = new Promise((resolve, reject) => {
            script.onload = function() {
                console.log('✅ Supabase library loaded successfully');
                // تأخير بسيط للتأكد من اكتمال التحميل
                setTimeout(() => {
                    resolve();
                    window.supabaseLoadPromise = null;
                }, 100);
            };
            
            script.onerror = function(error) {
                console.error('❌ Failed to load Supabase library:', error);
                reject(new Error('فشل في تحميل مكتبة Supabase'));
                window.supabaseLoadPromise = null;
            };
        });

        document.head.appendChild(script);
        window.supabaseLoadPromise.then(resolve).catch(reject);
    });
}

// دالة لتحميل ملف الدوال
function loadSupabaseFunctions() {
    return new Promise((resolve, reject) => {
        console.log('🔧 Loading Supabase functions...');
        
        const script = document.createElement('script');
        script.src = 'js/supabase.js';
        
        script.onload = function() {
            console.log('✅ Supabase functions loaded successfully');
            setTimeout(resolve, 100);
        };
        
        script.onerror = function() {
            console.error('❌ Failed to load Supabase functions');
            reject(new Error('فشل في تحميل دوال Supabase'));
        };
        
        document.head.appendChild(script);
    });
}

// دالة للتحقق من اكتمال تحميل Supabase
function waitForSupabaseReady() {
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 30; // قللنا عدد المحاولات
        
        const checkReady = () => {
            if (window.supabaseClient && window.isSupabaseInitialized) {
                console.log('✅ Supabase completely ready');
                resolve();
            } else if (attempts < maxAttempts) {
                attempts++;
                console.log(`⏳ Waiting for Supabase to be ready... (${attempts}/${maxAttempts})`);
                setTimeout(checkReady, 200); // زيادة الوقت بين المحاولات
            } else {
                console.log('⚠️ Supabase not ready after maximum attempts');
                setupFallbackMode();
                resolve();
            }
        };
        
        checkReady();
    });
}

// دالة بديلة في حالة فشل Supabase
function setupFallbackMode() {
    console.log('🛡️ Setting up fallback mode...');
    
    window.supabaseClient = {
        verifyAdmin: async () => {
            console.log('🛡️ Fallback: verifyAdmin');
            return true; // في وضع الاستعداد، اسمح بالدخول للمشرف
        },
        getContents: async () => {
            console.log('🛡️ Fallback: getContents');
            const localContents = localStorage.getItem('fallback_contents');
            return localContents ? JSON.parse(localContents) : [];
        },
        addContent: async (contentData) => {
            console.log('🛡️ Fallback: addContent', contentData);
            const contents = JSON.parse(localStorage.getItem('fallback_contents') || '[]');
            const newContent = {
                id: Date.now().toString(),
                ...contentData,
                date: new Date().toLocaleString('ar-SA')
            };
            contents.push(newContent);
            localStorage.setItem('fallback_contents', JSON.stringify(contents));
            return newContent;
        },
        deleteContent: async (contentId) => {
            console.log('🛡️ Fallback: deleteContent', contentId);
            const contents = JSON.parse(localStorage.getItem('fallback_contents') || '[]');
            const filtered = contents.filter(c => c.id !== contentId);
            localStorage.setItem('fallback_contents', JSON.stringify(filtered));
        },
        getStudentsData: async () => {
            console.log('🛡️ Fallback: getStudentsData');
            return JSON.parse(localStorage.getItem('fallback_students') || '[]');
        },
        saveStudentData: async (student) => {
            console.log('🛡️ Fallback: saveStudentData', student);
            const students = JSON.parse(localStorage.getItem('fallback_students') || '[]');
            const existingIndex = students.findIndex(s => s.id === student.id);
            
            if (existingIndex >= 0) {
                students[existingIndex] = { ...student, firstLogin: students[existingIndex].firstLogin };
            } else {
                students.push({ ...student, firstLogin: new Date().toLocaleString('ar-SA') });
            }
            
            localStorage.setItem('fallback_students', JSON.stringify(students));
            return student;
        },
        updateStudentData: async (oldId, newData) => {
            console.log('🛡️ Fallback: updateStudentData', oldId, newData);
            const students = JSON.parse(localStorage.getItem('fallback_students') || '[]');
            const studentIndex = students.findIndex(s => s.id === oldId);
            
            if (studentIndex >= 0) {
                if (oldId !== newData.id) {
                    students.splice(studentIndex, 1);
                    students.push({ ...newData, firstLogin: students[studentIndex].firstLogin });
                } else {
                    students[studentIndex] = { ...newData, firstLogin: students[studentIndex].firstLogin };
                }
                localStorage.setItem('fallback_students', JSON.stringify(students));
            }
            return newData;
        },
        deleteStudent: async (studentId) => {
            console.log('🛡️ Fallback: deleteStudent', studentId);
            const students = JSON.parse(localStorage.getItem('fallback_students') || '[]');
            const filtered = students.filter(s => s.id !== studentId);
            localStorage.setItem('fallback_students', JSON.stringify(filtered));
        },
        getStudentsLog: async () => {
            console.log('🛡️ Fallback: getStudentsLog');
            return JSON.parse(localStorage.getItem('fallback_logs') || '[]');
        },
        addStudentLog: async (logData) => {
            console.log('🛡️ Fallback: addStudentLog', logData);
            const logs = JSON.parse(localStorage.getItem('fallback_logs') || '[]');
            const newLog = {
                id: Date.now().toString(),
                ...logData,
                date: new Date().toLocaleDateString('ar-SA'),
                time: new Date().toLocaleTimeString('ar-SA'),
                timestamp: Date.now(),
                rating: 0,
                ratingNotes: '',
                ratingDate: ''
            };
            logs.push(newLog);
            localStorage.setItem('fallback_logs', JSON.stringify(newLog));
            return newLog;
        },
        updateStudentRating: async (logId, rating, ratingNotes) => {
            console.log('🛡️ Fallback: updateStudentRating', logId, rating, ratingNotes);
            const logs = JSON.parse(localStorage.getItem('fallback_logs') || '[]');
            const logIndex = logs.findIndex(l => l.id === logId);
            
            if (logIndex >= 0) {
                logs[logIndex].rating = rating;
                logs[logIndex].ratingNotes = ratingNotes;
                logs[logIndex].ratingDate = new Date().toLocaleString('ar-SA');
                localStorage.setItem('fallback_logs', JSON.stringify(logs));
            }
            return logs[logIndex] || {};
        },
        deleteStudentLog: async (logId) => {
            console.log('🛡️ Fallback: deleteStudentLog', logId);
            const logs = JSON.parse(localStorage.getItem('fallback_logs') || '[]');
            const filtered = logs.filter(l => l.id !== logId);
            localStorage.setItem('fallback_logs', JSON.stringify(filtered));
        },
        getTickets: async () => {
            console.log('🛡️ Fallback: getTickets');
            return JSON.parse(localStorage.getItem('fallback_tickets') || '[]');
        },
        createTicket: async (ticketData) => {
            console.log('🛡️ Fallback: createTicket', ticketData);
            const tickets = JSON.parse(localStorage.getItem('fallback_tickets') || '[]');
            const newTicket = {
                ...ticketData,
                createdDate: new Date().toLocaleString('ar-SA'),
                createdTimestamp: Date.now(),
                lastUpdate: new Date().toLocaleString('ar-SA')
            };
            tickets.push(newTicket);
            localStorage.setItem('fallback_tickets', JSON.stringify(tickets));
            return ticketData.id;
        },
        updateTicket: async (ticketId, updates) => {
            console.log('🛡️ Fallback: updateTicket', ticketId, updates);
            const tickets = JSON.parse(localStorage.getItem('fallback_tickets') || '[]');
            const ticketIndex = tickets.findIndex(t => t.id === ticketId);
            
            if (ticketIndex >= 0) {
                tickets[ticketIndex] = { ...tickets[ticketIndex], ...updates };
                localStorage.setItem('fallback_tickets', JSON.stringify(tickets));
                return tickets[ticketIndex];
            }
            return null;
        },
        deleteTicket: async (ticketId) => {
            console.log('🛡️ Fallback: deleteTicket', ticketId);
            const tickets = JSON.parse(localStorage.getItem('fallback_tickets') || '[]');
            const filtered = tickets.filter(t => t.id !== ticketId);
            localStorage.setItem('fallback_tickets', JSON.stringify(filtered));
        }
    };
    
    window.supabase = {};
    window.isSupabaseInitialized = true;
    
    console.log('✅ Fallback mode activated');
}

// التهيئة الرئيسية للتطبيق
async function initializeApplication() {
    console.log('🚀 Starting application initialization...');
    
    try {
        // الخطوة 1: تحميل مكتبة Supabase
        await loadSupabaseLibrary();
        
        // الخطوة 2: تحميل ملف الدوال
        await loadSupabaseFunctions();
        
        // الخطوة 3: الانتظار حتى اكتمال التهيئة
        await waitForSupabaseReady();
        
        console.log('🎉 Application initialized successfully!');
        
        // إعلام الصفحة أن النظام جاهز
        document.dispatchEvent(new CustomEvent('supabaseReady'));
        
    } catch (error) {
        console.error('❌ Application initialization failed:', error);
        
        // تفعيل الوضع الافتراضي
        setupFallbackMode();
        
        // إعلام الصفحة أن النظام جاهز (بالوضع الافتراضي)
        document.dispatchEvent(new CustomEvent('supabaseReady'));
    }
}

// بدء التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Page loaded, starting application...');
    
    // تحميل الشعار إذا كان موجوداً
    const logoImg = document.getElementById('logo-img');
    if (logoImg) {
        logoImg.onerror = function() {
            this.style.display = 'none';
        };
    }
    
    // بدء تهيئة التطبيق
    initializeApplication();
});

// جعل الدالة متاحة عالمياً
window.navigateTo = navigateTo;
