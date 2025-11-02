// js/main.js
// دالة للتنقل بين الصفحات
function navigateTo(page) {
    window.location.href = page;
}

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', function() {
    // تحميل مكتبة Supabase
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = function() {
        // تحميل ملف supabase.js بعد تحميل المكتبة
        const supabaseScript = document.createElement('script');
        supabaseScript.src = 'js/supabase.js';
        document.head.appendChild(supabaseScript);
    };
    document.head.appendChild(script);

    // تحميل الشعار إذا كان موجوداً
    const logoImg = document.getElementById('logo-img');
    if (logoImg) {
        logoImg.onerror = function() {
            this.style.display = 'none';
        };
    }
});
