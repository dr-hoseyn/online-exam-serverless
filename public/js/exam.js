// مدیریت آزمون و تایمر

let questions = [];
let timeLeft = 30 * 60; // 30 دقیقه به ثانیه
let timerInterval = null;

// بررسی احراز هویت
if (!isAuthenticated()) {
    window.location.href = '/login.html';
}

// بارگذاری سوالات
async function loadQuestions() {
    try {
        const response = await fetch('/api/exam/questions', {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            questions = data.questions;
            
            if (questions.length === 0) {
                document.getElementById('loadingMessage').innerHTML = 
                    '<p class="text-red-600">هیچ سوالی در سیستم وجود ندارد.</p>';
                return;
            }

            renderQuestions();
            startTimer();
        } else {
            if (response.status === 401) {
                logout();
            } else {
                showError('خطا در بارگذاری سوالات');
            }
        }
    } catch (error) {
        console.error('خطا:', error);
        showError('خطا در ارتباط با سرور');
    }
}

// نمایش سوالات
function renderQuestions() {
    const container = document.getElementById('questionsContainer');
    const form = document.getElementById('examForm');
    const loading = document.getElementById('loadingMessage');

    const questionsHTML = questions.map((q, index) => `
        <div class="border border-gray-200 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">
                سوال ${index + 1}: ${q.question}
            </h3>
            <div class="space-y-2">
                ${q.options.map((option, optIndex) => `
                    <label class="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                        <input type="radio" name="question_${q.id}" value="${optIndex}" required
                               class="ml-2 w-4 h-4 text-indigo-600">
                        <span class="text-gray-700">${option}</span>
                    </label>
                `).join('')}
            </div>
        </div>
    `).join('');

    container.innerHTML = questionsHTML;
    loading.classList.add('hidden');
    form.classList.remove('hidden');
}

// شروع تایمر
function startTimer() {
    updateTimerDisplay();
    
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            submitExam(true); // ارسال خودکار
        }
    }, 1000);
}

// به‌روزرسانی نمایش تایمر
function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.getElementById('timer').textContent = 
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    // تغییر رنگ در 5 دقیقه آخر
    if (timeLeft <= 5 * 60) {
        document.getElementById('timer').parentElement.classList.remove('bg-red-100');
        document.getElementById('timer').parentElement.classList.add('bg-red-200');
    }
}

// ارسال آزمون
async function submitExam(isAuto = false) {
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    const form = document.getElementById('examForm');
    const formData = new FormData(form);
    
    // جمع‌آوری پاسخ‌ها
    const answers = questions.map(q => {
        const answer = formData.get(`question_${q.id}`);
        return {
            questionId: q.id,
            answerIndex: answer ? parseInt(answer) : -1
        };
    });

    // نمایش لودینگ
    form.innerHTML = '<p class="text-center py-8 text-gray-600">در حال ارسال پاسخ‌ها...</p>';

    try {
        const response = await fetch('/api/exam/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ answers })
        });

        const data = await response.json();

        if (response.ok) {
            // نمایش نتیجه
            form.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-6xl mb-4">${data.score >= 70 ? '✅' : '📝'}</div>
                    <h2 class="text-3xl font-bold text-gray-800 mb-4">نمره شما: ${data.score}%</h2>
                    <p class="text-gray-600 mb-2">${data.correctAnswers} از ${data.totalQuestions} سوال صحیح</p>
                    <p class="text-indigo-600 font-semibold mb-6">امتیاز کل: ${data.totalScore}</p>
                    <a href="/dashboard.html" class="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition">
                        بازگشت به داشبورد
                    </a>
                </div>
            `;
        } else {
            if (response.status === 401) {
                logout();
            } else {
                showError(data.error || 'خطا در ارسال پاسخ‌ها');
            }
        }
    } catch (error) {
        console.error('خطا:', error);
        showError('خطا در ارتباط با سرور');
    }
}

// نمایش خطا
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

// مدیریت ارسال فرم
document.getElementById('examForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (confirm('آیا از ارسال پاسخ‌ها اطمینان دارید؟')) {
        submitExam();
    }
});

// بارگذاری سوالات هنگام لود صفحه
loadQuestions();

