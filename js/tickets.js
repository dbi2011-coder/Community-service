// js/tickets.js
console.log('🎫 Tickets script loaded');

// جعل الدوال متاحة عالمياً
window.viewTicketDetails = async function(ticketId) {
    try {
        const tickets = await window.supabaseClient.getTickets();
        const ticket = tickets.find(t => t.id === ticketId);
        
        if (ticket) {
            // إخفاء قسم النتائج وإظهار قسم التفاصيل
            document.getElementById('ticketResults').classList.add('hidden');
            document.getElementById('ticketDetailsSection').classList.remove('hidden');
            
            const detailsContent = document.getElementById('ticketDetailsContent');
            
            // تحديد إذا كان الزائر يمكنه الرد
            const canRespond = ticket.status === 'مفتوحة' || ticket.status === 'قيد المعالجة';
            
            detailsContent.innerHTML = `
                <div class="ticket-detail-card">
                    <div class="ticket-detail-header">
                        <h3>${ticket.title}</h3>
                        <span class="ticket-status ${getStatusClass(ticket.status)}">${ticket.status}</span>
                    </div>
                    <div class="ticket-info">
                        <p><strong>رقم التذكرة:</strong> ${ticket.id}</p>
                        <p><strong>رقم الهوية:</strong> ${ticket.identity}</p>
                        <p><strong>تاريخ الإنشاء:</strong> ${ticket.createdDate}</p>
                        <p><strong>آخر تحديث:</strong> ${ticket.lastUpdate}</p>
                    </div>
                    <div class="ticket-description">
                        <h4>وصف المشكلة:</h4>
                        <p>${ticket.description}</p>
                    </div>
                    
                    ${ticket.responses && ticket.responses.length > 0 ? `
                        <div class="ticket-responses">
                            <h4>سجل المحادثة:</h4>
                            ${ticket.responses.map((response, index) => `
                                <div class="response-item ${response.responder === 'الزائر' ? 'visitor-response' : 'admin-response'}">
                                    <div class="response-header">
                                        <strong>${response.responder}</strong>
                                        <span class="response-date">${response.date}</span>
                                    </div>
                                    <p>${response.message}</p>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="no-responses">
                            <p>لا توجد ردود حتى الآن</p>
                        </div>
                    `}
                    
                    ${canRespond ? `
                        <div class="visitor-response-section">
                            <h4>إضافة رد جديد</h4>
                            <textarea id="visitorResponseMessage" rows="4" placeholder="أدخل ردك هنا..."></textarea>
                            <button class="btn" onclick="addVisitorResponse('${ticket.id}')">إرسال الرد</button>
                            <p class="response-note">يمكنك الرد على التذكرة في أي وقت طالما لم يتم إغلاقها</p>
                        </div>
                    ` : `
                        <div class="ticket-closed-message">
                            <p>⚠️ هذه التذكرة مغلقة ولا يمكن إضافة ردود جديدة.</p>
                        </div>
                    `}
                    
                    <div class="ticket-actions">
                        <button class="btn secondary" onclick="showTicketQuerySection()">العودة للبحث</button>
                    </div>
                </div>
            `;
        } else {
            alert('التذكرة غير موجودة');
        }
    } catch (error) {
        console.error('Error viewing ticket details:', error);
        alert('خطأ في عرض تفاصيل التذكرة: ' + error.message);
    }
};

window.addVisitorResponse = async function(ticketId) {
    const responseMessageInput = document.getElementById('visitorResponseMessage');
    if (!responseMessageInput) return;
    
    const responseMessage = responseMessageInput.value.trim();
    
    if (!responseMessage) {
        alert('يرجى إدخال نص الرد');
        return;
    }
    
    try {
        const tickets = await window.supabaseClient.getTickets();
        const ticket = tickets.find(t => t.id === ticketId);
        
        if (ticket) {
            // التحقق من أن التذكرة ليست مغلقة
            if (ticket.status === 'مغلقة') {
                alert('لا يمكن إضافة رد على تذكرة مغلقة');
                return;
            }
            
            const responses = [...(ticket.responses || []), {
                responder: 'الزائر',
                message: responseMessage,
                date: new Date().toLocaleString('ar-SA')
            }];
            
            await window.supabaseClient.updateTicket(ticketId, {
                responses: responses,
                last_update: new Date().toISOString()
            });
            
            // مسح حقل الرد
            responseMessageInput.value = '';
            
            // تحديث العرض
            await window.viewTicketDetails(ticketId);
            alert('تم إضافة ردك بنجاح وسيتم مراجعته من قبل المسؤول');
        }
    } catch (error) {
        console.error('Error adding visitor response:', error);
        alert('خطأ في إضافة الرد: ' + error.message);
    }
};

// التحقق من عدم التهيئة المزدوجة
if (window.ticketsPageInitialized) {
    console.log('⚠️ Tickets page already initialized, skipping...');
} else {
    window.ticketsPageInitialized = true;

    // نظام إدارة التذاكر
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🎫 Tickets page DOM loaded');
        
        // الانتظار حتى يكون Supabase جاهزاً
        document.addEventListener('supabaseReady', function() {
            console.log('✅ Supabase ready, initializing tickets page...');
            setTimeout(initTicketsPage, 100);
        });
        
        // إذا كان supabase جاهزاً بالفعل
        if (window.supabaseClient && window.isSupabaseInitialized) {
            console.log('✅ Supabase already ready, initializing tickets page...');
            setTimeout(initTicketsPage, 100);
        }
    });

    function initTicketsPage() {
        console.log('🎫 Initializing tickets page...');
        
        // التحقق من أن Supabase جاهز
        if (!window.supabaseClient || !window.isSupabaseInitialized) {
            console.error('Supabase not ready for tickets page');
            alert('النظام غير جاهز حالياً. يرجى تحديث الصفحة والمحاولة مرة أخرى.');
            return;
        }
        
        const newTicketForm = document.getElementById('newTicketForm');
        const ticketQueryForm = document.getElementById('ticketQueryForm');
        
        // إنشاء تذكرة جديدة
        if (newTicketForm) {
            newTicketForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const title = document.getElementById('ticketTitle').value.trim();
                const identity = document.getElementById('ticketIdentity').value.trim();
                const description = document.getElementById('ticketDescription').value.trim();
                
                if (title && identity && description) {
                    if (!isValidId(identity)) {
                        alert('يرجى إدخال رقم هوية صحيح (10 أرقام)');
                        return;
                    }
                    
                    try {
                        const ticketId = await createNewTicket(title, identity, description);
                        alert(`تم إنشاء التذكرة بنجاح! رقم التذكرة: ${ticketId}\nيرجى حفظ رقم التذكرة للمتابعة.\n\nيمكنك الآن متابعة التذكرة والرد على المسؤول من خلال قسم "استعلام عن تذكرة".`);
                        newTicketForm.reset();
                        hideAllSections();
                    } catch (error) {
                        console.error('Error creating ticket:', error);
                        alert('خطأ في إنشاء التذكرة: ' + error.message);
                    }
                } else {
                    alert('يرجى ملء جميع الحقول المطلوبة');
                }
            });
        }

        // استعلام عن تذكرة
        if (ticketQueryForm) {
            ticketQueryForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const ticketId = document.getElementById('queryTicketId').value.trim();
                const identity = document.getElementById('queryIdentity').value.trim();
                
                if (ticketId || identity) {
                    try {
                        await searchTickets(ticketId, identity);
                    } catch (error) {
                        console.error('Error searching tickets:', error);
                        alert('خطأ في البحث عن التذاكر: ' + error.message);
                    }
                } else {
                    alert('يرجى إدخال رقم التذكرة أو رقم الهوية');
                }
            });
        }
        
        console.log('✅ Tickets page initialized successfully');
    }

    // إنشاء تذكرة جديدة
    async function createNewTicket(title, identity, description) {
        const ticketId = 'T' + Date.now().toString();
        
        const newTicket = {
            id: ticketId,
            title: title,
            identity: identity,
            description: description,
            status: 'مفتوحة',
            responses: []
        };
        
        try {
            const result = await window.supabaseClient.createTicket(newTicket);
            return result;
        } catch (error) {
            console.error('Error creating ticket:', error);
            throw new Error('فشل في إنشاء التذكرة: ' + error.message);
        }
    }

    // البحث عن التذاكر
    async function searchTickets(ticketId, identity) {
        try {
            const tickets = await window.supabaseClient.getTickets();
            let results = [];
            
            if (ticketId) {
                results = tickets.filter(ticket => ticket.id === ticketId);
            } else if (identity) {
                results = tickets.filter(ticket => ticket.identity === identity);
            }
            
            displayTicketResults(results);
        } catch (error) {
            console.error('Error searching tickets:', error);
            throw new Error('فشل في البحث عن التذاكر: ' + error.message);
        }
    }

    // عرض نتائج البحث
    function displayTicketResults(results) {
        const resultsContainer = document.getElementById('ticketResultsList');
        const resultsSection = document.getElementById('ticketResults');
        
        if (!resultsContainer) return;
        
        resultsContainer.innerHTML = '';
        
        if (results.length === 0) {
            resultsContainer.innerHTML = '<p class="no-results">لا توجد تذاكر مطابقة لبحثك</p>';
        } else {
            results.sort((a, b) => b.createdTimestamp - a.createdTimestamp);
            
            results.forEach(ticket => {
                const ticketElement = document.createElement('div');
                ticketElement.className = `ticket-result ${ticket.status === 'مغلقة' ? 'closed' : ''}`;
                
                // تحديد إذا كان الزائر يمكنه الرد
                const canRespond = ticket.status === 'مفتوحة' || ticket.status === 'قيد المعالجة';
                const responseCount = ticket.responses ? ticket.responses.length : 0;
                
                ticketElement.innerHTML = `
                    <div class="ticket-header">
                        <h4>${ticket.title} <span class="ticket-id">#${ticket.id}</span></h4>
                        <span class="ticket-status ${getStatusClass(ticket.status)}">${ticket.status}</span>
                    </div>
                    <div class="ticket-info">
                        <p><strong>رقم الهوية:</strong> ${ticket.identity}</p>
                        <p><strong>تاريخ الإنشاء:</strong> ${ticket.createdDate}</p>
                        <p><strong>آخر تحديث:</strong> ${ticket.lastUpdate}</p>
                        <p><strong>عدد الردود:</strong> ${responseCount}</p>
                    </div>
                    <div class="ticket-actions">
                        <button class="btn view-btn" onclick="viewTicketDetails('${ticket.id}')">عرض التفاصيل</button>
                        ${canRespond ? `
                            <span class="response-badge">✓ يمكنك الرد</span>
                        ` : ''}
                    </div>
                `;
                resultsContainer.appendChild(ticketElement);
            });
        }
        
        if (resultsSection) {
            resultsSection.classList.remove('hidden');
        }
    }

    // الحصول على فئة الحالة
    function getStatusClass(status) {
        const classes = {
            'مفتوحة': 'status-open',
            'قيد المعالجة': 'status-pending',
            'مغلقة': 'status-closed'
        };
        return classes[status] || 'status-open';
    }

    // التحقق من رقم الهوية
    function isValidId(id) {
        return /^\d{10}$/.test(id);
    }

    // إخفاء جميع الأقسام
    function hideAllSections() {
        const sections = ['newTicketSection', 'ticketQuerySection', 'ticketResults', 'ticketDetailsSection'];
        sections.forEach(section => {
            const element = document.getElementById(section);
            if (element) element.classList.add('hidden');
        });
    }
}
