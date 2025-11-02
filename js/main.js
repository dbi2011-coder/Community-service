// js/main.js
// دالة للتنقل بين الصفحات
function navigateTo(page) {
    window.location.href = page;
}

// دالة للتحقق من تحميل Supabase
function waitForSupabase() {
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 50; // 5 ثواني كحد أقصى
        
        const checkSupabase = () => {
            if (window.supabaseClient && window.supabase) {
                console.log('Supabase client loaded successfully');
                resolve();
            } else if (attempts < maxAttempts) {
                attempts++;
                setTimeout(checkSupabase, 100);
            } else {
                console.error('Supabase client failed to load after', maxAttempts, 'attempts');
                resolve(); // نستمر حتى لو فشل التحميل
            }
        };
        checkSupabase();
    });
}

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Initializing application...');
    
    // تحميل مكتبة Supabase
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = async function() {
        console.log('Supabase library loaded');
        
        // تحميل ملف supabase.js بعد تحميل المكتبة
        const supabaseScript = document.createElement('script');
        supabaseScript.src = 'js/supabase.js';
        supabaseScript.onload = async function() {
            console.log('Supabase functions loaded');
            
            // الانتظار حتى يصبح supabaseClient جاهزاً
            await waitForSupabase();
            
            // إعلام الصفحة أن Supabase جاهز
            document.dispatchEvent(new CustomEvent('supabaseReady'));
        };
        
        supabaseScript.onerror = function() {
            console.error('Failed to load supabase.js');
        };
        
        document.head.appendChild(supabaseScript);
    };
    
    script.onerror = function() {
        console.error('Failed to load Supabase library');
    };
    
    document.head.appendChild(script);

    // تحميل الشعار إذا كان موجوداً
    const logoImg = document.getElementById('logo-img');
    if (logoImg) {
        logoImg.onerror = function() {
            this.style.display = 'none';
        };
    }
    
    console.log('Application initialization complete');
});
