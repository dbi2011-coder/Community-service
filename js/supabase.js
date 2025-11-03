// js/supabase.js
console.log('🔧 Starting Supabase functions initialization...');

// التحقق من عدم التهيئة المزدوجة
if (window.supabaseClient && window.isSupabaseInitialized) {
    console.log('⚠️ Supabase already initialized, skipping...');
} else {
    // بدء التهيئة بعد تحميل الصفحة بالكامل
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeSupabase);
    } else {
        setTimeout(initializeSupabase, 100);
    }
}

function initializeSupabase() {
    console.log('🔄 Attempting to initialize Supabase...');
    
    // محاولة تهيئة Supabase
    try {
        // التحقق من وجود المكتبة أولاً
        if (typeof window.supabase === 'undefined' || typeof window.supabase.createClient !== 'function') {
            console.warn('⚠️ Supabase library not available yet, will retry in 500ms...');
            
            // إعادة المحاولة بعد نصف ثانية مع عدد محاولات محدود
            let retryCount = 0;
            const maxRetries = 10;
            
            const retryInitialization = () => {
                retryCount++;
                if (retryCount <= maxRetries) {
                    if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
                        console.log('✅ Supabase library loaded on retry ' + retryCount);
                        createSupabaseClient();
                    } else {
                        console.warn(`🔄 Retry ${retryCount}/${maxRetries} - Supabase library still not available`);
                        setTimeout(retryInitialization, 500);
                    }
                } else {
                    console.error('❌ Max retries reached, setting up fallback mode');
                    setupFallbackMode();
                }
            };
            
            setTimeout(retryInitialization, 500);
            return;
        }
        
        createSupabaseClient();
        
    } catch (error) {
        console.error('❌ Supabase initialization failed:', error);
        setupFallbackMode();
    }
}

function createSupabaseClient() {
    try {
        const SUPABASE_URL = 'https://doekfbxelitbeqkbuiax.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvZWtmYnhlbGl0YmVxa2J1aWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMTU0MzAsImV4cCI6MjA3NzU5MTQzMH0.vFQYMahYm6p1UOtMeZjH8U9Q9ueXdcAQFQwc4YudXlk';

        console.log('🔧 Creating Supabase client...');
        
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: false,
                autoRefreshToken: false
            },
            db: {
                schema: 'public'
            },
            global: {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        });

        console.log('✅ Supabase client created successfully');

        // تعريف دوال Supabase
        const supabaseClient = {
            // دوال المشرفين
            verifyAdmin: async (username, password) => {
                if (!supabase) {
                    console.warn('Supabase client not available for verifyAdmin');
                    return false;
                }
                
                try {
                    const { data, error } = await supabase
                        .rpc('verify_password', {
                            username_input: username,
                            password_input: password
                        });
                    
                    if (error) {
                        console.error('Error in verifyAdmin RPC:', error);
                        return false;
                    }
                    return data;
                } catch (error) {
                    console.error('Error in verifyAdmin:', error);
                    return false;
                }
            },

            // دوال المحتويات
            getContents: async () => {
                if (!supabase) {
                    console.warn('Supabase client not available for getContents');
                    return [];
                }
                
                try {
                    const { data, error } = await supabase
                        .from('contents')
                        .select('*')
                        .order('created_at', { ascending: false });
                    
                    if (error) {
                        console.error('Error getting contents:', error);
                        return [];
                    }
                    
                    return data.map(item => ({
                        id: item.id,
                        type: item.type,
                        title: item.title,
                        content: item.content,
                        note: item.note,
                        date: new Date(item.created_at).toLocaleString('ar-SA')
                    }));
                } catch (error) {
                    console.error('Error getting contents:', error);
                    return [];
                }
            },

            addContent: async (contentData) => {
                if (!supabase) {
                    throw new Error('Supabase client not available');
                }
                
                try {
                    const { data, error } = await supabase
                        .from('contents')
                        .insert([{
                            type: contentData.type,
                            title: contentData.title,
                            content: contentData.content,
                            note: contentData.note || ''
                        }])
                        .select()
                        .single();
                    
                    if (error) throw error;
                    
                    return {
                        id: data.id,
                        type: data.type,
                        title: data.title,
                        content: data.content,
                        note: data.note,
                        date: new Date(data.created_at).toLocaleString('ar-SA')
                    };
                } catch (error) {
                    console.error('Error adding content:', error);
                    throw error;
                }
            },

            deleteContent: async (contentId) => {
                if (!supabase) {
                    throw new Error('Supabase client not available');
                }
                
                try {
                    const { error } = await supabase
                        .from('contents')
                        .delete()
                        .eq('id', contentId);
                    
                    if (error) throw error;
                } catch (error) {
                    console.error('Error deleting content:', error);
                    throw error;
                }
            },

            // دوال بيانات الزوار
            getStudentsData: async () => {
                if (!supabase) {
                    console.warn('Supabase client not available for getStudentsData');
                    return [];
                }
                
                try {
                    const { data, error } = await supabase
                        .from('students_data')
                        .select('*')
                        .order('first_login', { ascending: false });
                    
                    if (error) {
                        console.error('Error getting students data:', error);
                        return [];
                    }
                    
                    return data.map(item => ({
                        name: item.name,
                        id: item.id,
                        phone: item.phone,
                        firstLogin: new Date(item.first_login).toLocaleString('ar-SA')
                    }));
                } catch (error) {
                    console.error('Error getting students data:', error);
                    return [];
                }
            },

            saveStudentData: async (student) => {
                if (!supabase) {
                    throw new Error('Supabase client not available');
                }
                
                try {
                    const { data, error } = await supabase
                        .from('students_data')
                        .upsert([{
                            id: student.id,
                            name: student.name,
                            phone: student.phone
                        }], { 
                            onConflict: 'id'
                        })
                        .select()
                        .single();
                    
                    if (error) throw error;
                    
                    return {
                        name: data.name,
                        id: data.id,
                        phone: data.phone,
                        firstLogin: new Date(data.first_login).toLocaleString('ar-SA')
                    };
                } catch (error) {
                    console.error('Error saving student data:', error);
                    throw error;
                }
            },

            updateStudentData: async (oldId, newData) => {
                if (!supabase) {
                    throw new Error('Supabase client not available');
                }
                
                try {
                    if (oldId !== newData.id) {
                        await supabaseClient.deleteStudent(oldId);
                    }
                    
                    return await supabaseClient.saveStudentData(newData);
                } catch (error) {
                    console.error('Error updating student data:', error);
                    throw error;
                }
            },

            deleteStudent: async (studentId) => {
                if (!supabase) {
                    throw new Error('Supabase client not available');
                }
                
                try {
                    const { error } = await supabase
                        .from('students_data')
                        .delete()
                        .eq('id', studentId);
                    
                    if (error) throw error;
                } catch (error) {
                    console.error('Error deleting student:', error);
                    throw error;
                }
            },

            // دوال سجلات الاطلاع
            getStudentsLog: async () => {
                if (!supabase) {
                    console.warn('Supabase client not available for getStudentsLog');
                    return [];
                }
                
                try {
                    const { data, error } = await supabase
                        .from('students_log')
                        .select('*')
                        .order('view_date', { ascending: false });
                    
                    if (error) {
                        console.error('Error getting students log:', error);
                        return [];
                    }
                    
                    return data.map(item => ({
                        id: item.id,
                        studentName: item.student_name,
                        studentId: item.student_id,
                        studentPhone: item.student_phone,
                        contentId: item.content_id,
                        contentTitle: item.content_title,
                        date: new Date(item.view_date).toLocaleDateString('ar-SA'),
                        time: new Date(item.view_date).toLocaleTimeString('ar-SA'),
                        timestamp: new Date(item.view_date).getTime(),
                        rating: item.rating || 0,
                        ratingNotes: item.rating_notes || '',
                        ratingDate: item.rating_date ? new Date(item.rating_date).toLocaleString('ar-SA') : ''
                    }));
                } catch (error) {
                    console.error('Error getting students log:', error);
                    return [];
                }
            },

            addStudentLog: async (logData) => {
                if (!supabase) {
                    throw new Error('Supabase client not available');
                }
                
                try {
                    const { data, error } = await supabase
                        .from('students_log')
                        .insert([{
                            student_name: logData.studentName,
                            student_id: logData.studentId,
                            student_phone: logData.studentPhone,
                            content_id: logData.contentId,
                            content_title: logData.contentTitle
                        }])
                        .select()
                        .single();
                    
                    if (error) throw error;
                    
                    return {
                        id: data.id,
                        studentName: data.student_name,
                        studentId: data.student_id,
                        studentPhone: data.student_phone,
                        contentId: data.content_id,
                        contentTitle: data.content_title,
                        date: new Date(data.view_date).toLocaleDateString('ar-SA'),
                        time: new Date(data.view_date).toLocaleTimeString('ar-SA'),
                        timestamp: new Date(data.view_date).getTime(),
                        rating: data.rating || 0,
                        ratingNotes: data.rating_notes || '',
                        ratingDate: data.rating_date ? new Date(data.rating_date).toLocaleString('ar-SA') : ''
                    };
                } catch (error) {
                    console.error('Error adding student log:', error);
                    throw error;
                }
            },

            updateStudentRating: async (logId, rating, ratingNotes) => {
                if (!supabase) {
                    throw new Error('Supabase client not available');
                }
                
                try {
                    const { data, error } = await supabase
                        .from('students_log')
                        .update({
                            rating: rating,
                            rating_notes: ratingNotes,
                            rating_date: new Date().toISOString()
                        })
                        .eq('id', logId)
                        .select()
                        .single();
                    
                    if (error) throw error;
                    
                    return {
                        id: data.id,
                        studentName: data.student_name,
                        studentId: data.student_id,
                        studentPhone: data.student_phone,
                        contentId: data.content_id,
                        contentTitle: data.content_title,
                        date: new Date(data.view_date).toLocaleDateString('ar-SA'),
                        time: new Date(data.view_date).toLocaleTimeString('ar-SA'),
                        timestamp: new Date(data.view_date).getTime(),
                        rating: data.rating,
                        ratingNotes: data.rating_notes,
                        ratingDate: new Date(data.rating_date).toLocaleString('ar-SA')
                    };
                } catch (error) {
                    console.error('Error updating student rating:', error);
                    throw error;
                }
            },

            deleteStudentLog: async (logId) => {
                if (!supabase) {
                    throw new Error('Supabase client not available');
                }
                
                try {
                    const { error } = await supabase
                        .from('students_log')
                        .delete()
                        .eq('id', logId);
                    
                    if (error) throw error;
                } catch (error) {
                    console.error('Error deleting student log:', error);
                    throw error;
                }
            },

            // دوال التذاكر
            getTickets: async () => {
                if (!supabase) {
                    console.warn('Supabase client not available for getTickets');
                    return [];
                }
                
                try {
                    const { data, error } = await supabase
                        .from('support_tickets')
                        .select('*')
                        .order('created_date', { ascending: false });
                    
                    if (error) {
                        console.error('Error getting tickets:', error);
                        return [];
                    }
                    
                    return data.map(item => ({
                        id: item.id,
                        title: item.title,
                        identity: item.identity,
                        description: item.description,
                        status: item.status,
                        createdDate: new Date(item.created_date).toLocaleString('ar-SA'),
                        createdTimestamp: new Date(item.created_date).getTime(),
                        responses: item.responses || [],
                        lastUpdate: new Date(item.last_update).toLocaleString('ar-SA')
                    }));
                } catch (error) {
                    console.error('Error getting tickets:', error);
                    return [];
                }
            },

            createTicket: async (ticketData) => {
                if (!supabase) {
                    throw new Error('Supabase client not available');
                }
                
                try {
                    // استخدام insert بدون select لتجنب الخطأ 409
                    const { error } = await supabase
                        .from('support_tickets')
                        .insert([{
                            id: ticketData.id,
                            title: ticketData.title,
                            identity: ticketData.identity,
                            description: ticketData.description,
                            status: ticketData.status || 'مفتوحة',
                            responses: ticketData.responses || []
                        }]);
                    
                    if (error) {
                        // إذا كان الخطأ 409 (تعارض)، حاول مع ID مختلف
                        if (error.code === '23505') { // PostgreSQL unique violation
                            const newTicketId = 'T' + Date.now().toString();
                            console.log(`🔄 Ticket ID conflict, retrying with new ID: ${newTicketId}`);
                            
                            const { error: retryError } = await supabase
                                .from('support_tickets')
                                .insert([{
                                    id: newTicketId,
                                    title: ticketData.title,
                                    identity: ticketData.identity,
                                    description: ticketData.description,
                                    status: ticketData.status || 'مفتوحة',
                                    responses: ticketData.responses || []
                                }]);
                            
                            if (retryError) throw retryError;
                            return newTicketId;
                        }
                        throw error;
                    }
                    
                    return ticketData.id;
                } catch (error) {
                    console.error('Error creating ticket:', error);
                    throw new Error('فشل في إنشاء التذكرة: ' + (error.message || 'خطأ غير معروف'));
                }
            },

            updateTicket: async (ticketId, updates) => {
                if (!supabase) {
                    throw new Error('Supabase client not available');
                }
                
                try {
                    const { data, error } = await supabase
                        .from('support_tickets')
                        .update(updates)
                        .eq('id', ticketId)
                        .select()
                        .single();
                    
                    if (error) throw error;
                    
                    return {
                        id: data.id,
                        title: data.title,
                        identity: data.identity,
                        description: data.description,
                        status: data.status,
                        createdDate: new Date(data.created_date).toLocaleString('ar-SA'),
                        createdTimestamp: new Date(data.created_date).getTime(),
                        responses: data.responses || [],
                        lastUpdate: new Date(data.last_update).toLocaleString('ar-SA')
                    };
                } catch (error) {
                    console.error('Error updating ticket:', error);
                    throw error;
                }
            },

            deleteTicket: async (ticketId) => {
                if (!supabase) {
                    throw new Error('Supabase client not available');
                }
                
                try {
                    const { error } = await supabase
                        .from('support_tickets')
                        .delete()
                        .eq('id', ticketId);
                    
                    if (error) throw error;
                } catch (error) {
                    console.error('Error deleting ticket:', error);
                    throw error;
                }
            }
        };

        // جعل الدوال متاحة عالمياً
        window.supabaseClient = supabaseClient;
        window.supabase = supabase;
        window.isSupabaseInitialized = true;

        console.log('✅ Supabase functions initialized successfully');
        
        // إرسال إشارة أن Supabase جاهز
        document.dispatchEvent(new CustomEvent('supabaseReady'));

    } catch (error) {
        console.error('❌ Error creating Supabase client:', error);
        setupFallbackMode();
    }
}

function setupFallbackMode() {
    console.log('🛡️ Setting up fallback mode...');
    
    // إنشاء دوال وهمية في حالة الفشل
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
    
    // إرسال إشارة أن النظام جاهز (حتى في الوضع الافتراضي)
    document.dispatchEvent(new CustomEvent('supabaseReady'));
}
