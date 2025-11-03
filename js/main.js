// js/main.js
// دالة للتنقل بين الصفحات
function navigateTo(page) {
    window.location.href = page;
}

// دالة لتحميل مكتبة Supabase بشكل موثوق
function loadSupabaseLibrary() {
    return new Promise((resolve, reject) => {
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            console.log('✅ Supabase library already loaded');
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
        
        script.onload = function() {
            console.log('✅ Supabase library loaded successfully');
            // تأخير بسيط للتأكد من اكتمال التحميل
            setTimeout(resolve, 100);
        };
        
        script.onerror = function() {
            console.error('❌ Failed to load Supabase library');
            reject(new Error('فشل في تحميل مكتبة Supabase'));
        };
        
        document.head.appendChild(script);
    });
}

// دالة لتحميل ملف الدوال
function loadSupabaseFunctions() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'js/supabase.js';
        
        script.onload = function() {
            console.log('✅ Supabase functions loaded successfully');
            // تأخير للتأكد من اكتمال التهيئة
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
        const maxAttempts = 50;
        
        const checkReady = () => {
            if (window.supabaseClient && window.isSupabaseInitialized) {
                console.log('✅ Supabase completely ready');
                resolve();
            } else if (attempts < maxAttempts) {
                attempts++;
                console.log(`⏳ Waiting for Supabase to be ready... (${attempts}/${maxAttempts})`);
                setTimeout(checkReady, 100);
            } else {
                console.log('⚠️ Supabase not ready, but continuing anyway');
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
        verifyAdmin: async () => false,
        getContents: async () => [],
        addContent: async () => { throw new Error('النظام غير متاح حالياً'); },
        deleteContent: async () => { throw new Error('النظام غير متاح حالياً'); },
        getStudentsData: async () => [],
        saveStudentData: async () => { throw new Error('النظام غير متاح حالياً'); },
        updateStudentData: async () => { throw new Error('النظام غير متاح حالياً'); },
        deleteStudent: async () => { throw new Error('النظام غير متاح حالياً'); },
        getStudentsLog: async () => [],
        addStudentLog: async () => { throw new Error('النظام غير متاح حالياً'); },
        updateStudentRating: async () => { throw new Error('النظام غير متاح حالياً'); },
        deleteStudentLog: async () => { throw new Error('النظام غير متاح حالياً'); },
        getTickets: async () => [],
        createTicket: async () => { throw new Error('النظام غير متاح حالياً'); },
        updateTicket: async () => { throw new Error('النظام غير متاح حالياً'); },
        deleteTicket: async () => { throw new Error('النظام غير متاح حالياً'); }
    };
    
    window.supabase = {};
    window.isSupabaseInitialized = true;
    
    console.log('✅ Fallback mode activated');
}

// التهيئة الرئيسية للتطبيق
async function initializeApplication() {
    console.log('🚀 Starting application initialization...');
    
    // التحقق من التهيئة المسبقة
    if (window.isSupabaseInitialized) {
        console.log('✅ Application already initialized');
        document.dispatchEvent(new CustomEvent('supabaseReady'));
        return;
    }
    
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
