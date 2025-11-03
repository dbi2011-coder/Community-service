// js/main.js
console.log('🚀 Starting application initialization...');

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

        console.log('📦 Loading Supabase library...');
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
        
        script.onload = function() {
            console.log('✅ Supabase library loaded successfully');
            setTimeout(resolve, 100);
        };
        
        script.onerror = function(error) {
            console.error('❌ Failed to load Supabase library:', error);
            reject(new Error('فشل في تحميل مكتبة Supabase'));
        };
        
        document.head.appendChild(script);
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
        const maxAttempts = 20;
        
        const checkReady = () => {
            if (window.supabaseClient && window.isSupabaseInitialized) {
                console.log('✅ Supabase completely ready');
                resolve();
            } else if (attempts < maxAttempts) {
                attempts++;
                console.log(`⏳ Waiting for Supabase to be ready... (${attempts}/${maxAttempts})`);
                setTimeout(checkReady, 200);
            } else {
                console.log('❌ Supabase failed to initialize');
                resolve(); // نستمر حتى مع فشل Supabase
            }
        };
        
        checkReady();
    });
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
        
    } catch (error) {
        console.error('❌ Application initialization failed:', error);
    }
    
    // إعلام الصفحة أن النظام جاهز (حتى مع فشل Supabase)
    document.dispatchEvent(new CustomEvent('supabaseReady'));
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
