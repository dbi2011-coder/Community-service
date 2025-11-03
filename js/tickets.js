// js/tickets.js
console.log('🎫 Tickets script loaded');

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
                        alert(`تم إنشاء التذكرة بنجاح! رقم التذكرة: ${ticketId}\nيرجى حفظ رقم التذكرة للمتابعة.`);
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
                        alert('خطأ في البحث عن التذاكر');
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
        
        const result = await window.supabaseClient.createTicket(newTicket);
        return result;
    }

    // البحث عن التذاكر
    async function searchTickets(ticketId, identity) {
        const tickets = await window.supabaseClient.getTickets();
        let results = [];
        
        if (ticketId) {
            results = tickets.filter(ticket => ticket.id === ticketId);
        } else if (identity) {
            results = tickets.filter(ticket => ticket.identity === identity);
        }
        
        displayTicketResults(results);
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
                ticketElement.innerHTML = `
                    <div class="ticket-header">
                        <h4>${ticket.title} <span class="ticket-id">#${ticket.id}</span></h4>
                        <span class="ticket-status ${getStatusClass(ticket.status)}">${ticket.status}</span>
                    </div>
                    <div class="ticket-info">
                        <p><strong>رقم الهوية:</strong> ${ticket.identity}</p>
                        <p><strong>تاريخ الإنشاء:</strong> ${ticket.createdDate}</p>
                        <p><strong>آخر تحديث:</strong> ${ticket.lastUpdate}</p>
                    </div>
                    <div class="ticket-actions">
                        <button class="btn view-btn" onclick="viewTicketDetails('${ticket.id}')">عرض التفاصيل</button>
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

    // دوال إضافية مطلوبة
    async function viewTicketDetails(ticketId) {
        try {
            const tickets = await window.supabaseClient.getTickets();
            const ticket = tickets.find(t => t.id === ticketId);
            
            if (ticket) {
                const detailsSection = document.getElementById('ticketDetailsSection');
                const detailsContent = document.getElementById('ticketDetailsContent');
                
                if (detailsSection && detailsContent) {
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
                            ${ticket.responses.length > 0 ? `
                                <div class="ticket-responses">
                                    <h4>الردود:</h4>
                                    ${ticket.responses.map(response => `
                                        <div class="response-item">
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
                        </div>
                    `;
                    
                    hideAllSections();
                    detailsSection.classList.remove('hidden');
                }
            }
        } catch (error) {
            console.error('Error viewing ticket details:', error);
            alert('خطأ في عرض تفاصيل التذكرة');
        }
    }

    async function addVisitorResponse(ticketId) {
        const responseMessage = prompt('أدخل ردك:');
        if (responseMessage && responseMessage.trim()) {
            try {
                const tickets = await window.supabaseClient.getTickets();
                const ticket = tickets.find(t => t.id === ticketId);
                
                if (ticket) {
                    const responses = [...ticket.responses, {
                        responder: 'الزائر',
                        message: responseMessage.trim(),
                        date: new Date().toLocaleString('ar-SA')
                    }];
                    
                    await window.supabaseClient.updateTicket(ticketId, {
                        responses: responses,
                        last_update: new Date().toISOString()
                    });
                    
                    await viewTicketDetails(ticketId);
                    alert('تم إضافة ردك بنجاح');
                }
            } catch (error) {
                console.error('Error adding visitor response:', error);
                alert('خطأ في إضافة الرد');
            }
        }
    }

    // جعل الدوال متاحة globally
    window.viewTicketDetails = viewTicketDetails;
    window.addVisitorResponse = addVisitorResponse;
    window.hideAllSections = hideAllSections;
}
