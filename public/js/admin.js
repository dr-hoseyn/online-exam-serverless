// مدیریت پنل Admin

// بررسی احراز هویت و دسترسی Admin
if (!requireAdmin()) {
    // requireAdmin خودش ریدایرکت می‌کند
}

const user = getCurrentUser();
document.getElementById('userName').textContent = user.username;

let currentTab = 'questions';

// نمایش تب
function showTab(tabName) {
    // مخفی کردن همه تب‌ها
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // حذف استایل فعال از همه دکمه‌ها
    document.querySelectorAll('[id^="tab-"]').forEach(btn => {
        btn.classList.remove('border-b-2', 'border-indigo-600');
    });
    
    // نمایش تب انتخاب شده
    document.getElementById(`${tabName}-tab`).classList.remove('hidden');
    document.getElementById(`tab-${tabName}`).classList.add('border-b-2', 'border-indigo-600');
    
    currentTab = tabName;
    
    // بارگذاری داده‌های تب
    if (tabName === 'questions') {
        loadQuestions();
    } else if (tabName === 'users') {
        loadUsers();
    } else if (tabName === 'results') {
        loadResults();
    }
}

// مدیریت فرم افزودن سوال
document.getElementById('addQuestionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const question = document.getElementById('questionText').value;
    const options = [
        document.getElementById('option1').value,
        document.getElementById('option2').value,
        document.getElementById('option3').value,
        document.getElementById('option4').value
    ];
    const correctAnswer = parseInt(document.getElementById('correctAnswer').value);
    
    const errorDiv = document.getElementById('questionError');
    const successDiv = document.getElementById('questionSuccess');
    
    errorDiv.classList.add('hidden');
    successDiv.classList.add('hidden');
    
    try {
        const response = await fetch('/api/admin/questions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ question, options, correctAnswer })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            successDiv.textContent = data.message || 'سوال با موفقیت افزوده شد';
            successDiv.classList.remove('hidden');
            
            // پاک کردن فرم
            document.getElementById('addQuestionForm').reset();
            
            // بارگذاری مجدد لیست سوالات
            loadQuestions();
        } else {
            if (response.status === 401 || response.status === 403) {
                logout();
            } else {
                errorDiv.textContent = data.error || 'خطا در افزودن سوال';
                errorDiv.classList.remove('hidden');
            }
        }
    } catch (error) {
        console.error('خطا:', error);
        errorDiv.textContent = 'خطا در ارتباط با سرور';
        errorDiv.classList.remove('hidden');
    }
});

// بارگذاری سوالات
async function loadQuestions() {
    try {
        const response = await fetch('/api/admin/questions', {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        const data = await response.json();
        const container = document.getElementById('questionsList');
        
        if (response.ok) {
            if (data.questions.length === 0) {
                container.innerHTML = '<p class="text-gray-600">هنوز سوالی در سیستم وجود ندارد.</p>';
            } else {
                const questionsHTML = data.questions.map(q => `
                    <div class="border border-gray-200 rounded-lg p-4 mb-4">
                        <p class="font-semibold text-gray-800 mb-2">${q.question}</p>
                        <div class="grid md:grid-cols-2 gap-2 mb-2">
                            ${q.options.map((opt, idx) => `
                                <div class="text-sm ${idx === q.correctAnswer ? 'text-green-600 font-semibold' : 'text-gray-600'}">
                                    ${idx + 1}. ${opt} ${idx === q.correctAnswer ? '✓' : ''}
                                </div>
                            `).join('')}
                        </div>
                        <p class="text-xs text-gray-500">${new Date(q.createdAt).toLocaleDateString('fa-IR')}</p>
                    </div>
                `).join('');
                container.innerHTML = questionsHTML;
            }
        } else {
            if (response.status === 401 || response.status === 403) {
                logout();
            } else {
                container.innerHTML = '<p class="text-red-600">خطا در بارگذاری سوالات</p>';
            }
        }
    } catch (error) {
        console.error('خطا:', error);
        document.getElementById('questionsList').innerHTML = '<p class="text-red-600">خطا در ارتباط با سرور</p>';
    }
}

// بارگذاری کاربران
async function loadUsers() {
    try {
        const response = await fetch('/api/admin/users', {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        const data = await response.json();
        const container = document.getElementById('usersList');
        
        if (response.ok) {
            if (data.users.length === 0) {
                container.innerHTML = '<p class="text-gray-600">هیچ کاربری در سیستم وجود ندارد.</p>';
            } else {
                const usersHTML = `
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-gray-100">
                                <tr>
                                    <th class="px-4 py-2 text-right">نام کاربری</th>
                                    <th class="px-4 py-2 text-right">ایمیل</th>
                                    <th class="px-4 py-2 text-right">نقش</th>
                                    <th class="px-4 py-2 text-right">امتیاز کل</th>
                                    <th class="px-4 py-2 text-right">تاریخ ثبت‌نام</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.users.map(u => `
                                    <tr class="border-b">
                                        <td class="px-4 py-2">${u.username}</td>
                                        <td class="px-4 py-2">${u.email}</td>
                                        <td class="px-4 py-2">
                                            <span class="px-2 py-1 rounded ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}">
                                                ${u.role === 'admin' ? 'مدیر' : 'کاربر'}
                                            </span>
                                        </td>
                                        <td class="px-4 py-2 font-semibold text-indigo-600">${u.totalScore || 0}</td>
                                        <td class="px-4 py-2 text-sm text-gray-500">${new Date(u.createdAt).toLocaleDateString('fa-IR')}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
                container.innerHTML = usersHTML;
            }
        } else {
            if (response.status === 401 || response.status === 403) {
                logout();
            } else {
                container.innerHTML = '<p class="text-red-600">خطا در بارگذاری کاربران</p>';
            }
        }
    } catch (error) {
        console.error('خطا:', error);
        document.getElementById('usersList').innerHTML = '<p class="text-red-600">خطا در ارتباط با سرور</p>';
    }
}

// بارگذاری نتایج
async function loadResults() {
    try {
        const response = await fetch('/api/admin/results', {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        const data = await response.json();
        const container = document.getElementById('resultsList');
        
        if (response.ok) {
            if (data.results.length === 0) {
                container.innerHTML = '<p class="text-gray-600">هنوز نتیجه‌ای ثبت نشده است.</p>';
            } else {
                const resultsHTML = `
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-gray-100">
                                <tr>
                                    <th class="px-4 py-2 text-right">نام کاربر</th>
                                    <th class="px-4 py-2 text-right">ایمیل</th>
                                    <th class="px-4 py-2 text-right">نمره</th>
                                    <th class="px-4 py-2 text-right">پاسخ صحیح</th>
                                    <th class="px-4 py-2 text-right">تاریخ</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.results.map(r => `
                                    <tr class="border-b">
                                        <td class="px-4 py-2">${r.username}</td>
                                        <td class="px-4 py-2">${r.email}</td>
                                        <td class="px-4 py-2 font-semibold ${r.score >= 70 ? 'text-green-600' : r.score >= 50 ? 'text-yellow-600' : 'text-red-600'}">
                                            ${r.score}%
                                        </td>
                                        <td class="px-4 py-2">${r.correctAnswers} / ${r.totalQuestions}</td>
                                        <td class="px-4 py-2 text-sm text-gray-500">${new Date(r.date).toLocaleDateString('fa-IR')}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
                container.innerHTML = resultsHTML;
            }
        } else {
            if (response.status === 401 || response.status === 403) {
                logout();
            } else {
                container.innerHTML = '<p class="text-red-600">خطا در بارگذاری نتایج</p>';
            }
        }
    } catch (error) {
        console.error('خطا:', error);
        document.getElementById('resultsList').innerHTML = '<p class="text-red-600">خطا در ارتباط با سرور</p>';
    }
}

// بارگذاری داده‌های تب اول
loadQuestions();

