// js/main.js
// دالة للتنقل بين الصفحات
function navigateTo(page) {
    window.location.href = page;
}

// متغير عالمي لتعقب حالة التحميل
let isSupabaseInitialized = false;

// دالة للتحقق من تحميل Supabase
function waitForSupabase() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 100; // 10 ثواني كحد أقصى
        
        const checkSupabase = () => {
            if (window.supabaseClient && window.supabase && isSupabaseInitialized) {
                console.log('✅ Supabase client loaded successfully');
                resolve();
            } else if (attempts < maxAttempts) {
                attempts++;
                setTimeout(checkSupabase, 100);
            } else {
                console.error('❌ Supabase client failed to load after', maxAttempts, 'attempts');
                reject(new Error('فشل في تحميل النظام. يرجى تحديث الصفحة.'));
            }
        };
        checkSupabase();
    });
}

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Initializing application...');
    
    // منع التحميل المزدوج
    if (window.supabaseInitializing) {
        console.log('Supabase is already initializing...');
        return;
    }
    
    window.supabaseInitializing = true;

    try {
        // تحميل مكتبة Supabase أولاً
        await loadSupabaseLibrary();
        
        // ثم تحميل ملف الدوال
        await loadSupabaseFunctions();
        
        // الانتظار حتى يصبح supabaseClient جاهزاً
        await waitForSupabase();
        
        console.log('✅ Application initialization complete');
        
        // إعلام الصفحة أن Supabase جاهز
        document.dispatchEvent(new CustomEvent('supabaseReady'));
        
    } catch (error) {
        console.error('❌ Application initialization failed:', error);
        alert('حدث خطأ في تحميل النظام: ' + error.message);
    } finally {
        window.supabaseInitializing = false;
    }

    // تحميل الشعار إذا كان موجوداً
    const logoImg = document.getElementById('logo-img');
    if (logoImg) {
        logoImg.onerror = function() {
            this.style.display = 'none';
        };
    }
});

// دالة لتحميل مكتبة Supabase
function loadSupabaseLibrary() {
    return new Promise((resolve, reject) => {
        // إذا كانت المكتبة محملة مسبقاً
        if (window.supabase) {
            console.log('📚 Supabase library already loaded');
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        
        script.onload = function() {
            console.log('📚 Supabase library loaded successfully');
            resolve();
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
            console.log('🔧 Supabase functions loaded successfully');
            resolve();
        };
        
        script.onerror = function() {
            console.error('❌ Failed to load Supabase functions');
            reject(new Error('فشل في تحميل دوال Supabase'));
        };
        
        document.head.appendChild(script);
    });
}
