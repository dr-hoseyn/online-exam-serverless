// مدیریت احراز هویت و JWT Token

/**
 * دریافت Token از localStorage
 */
function getToken() {
    return localStorage.getItem('token');
}

/**
 * دریافت اطلاعات کاربر فعلی
 */
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

/**
 * بررسی اینکه آیا کاربر لاگین کرده است
 */
function isAuthenticated() {
    return getToken() !== null;
}

/**
 * خروج از حساب کاربری
 */
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/index.html';
}

/**
 * بررسی و ریدایرکت در صورت عدم احراز هویت
 */
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

/**
 * بررسی دسترسی Admin
 */
function requireAdmin() {
    if (!requireAuth()) return false;
    
    const user = getCurrentUser();
    if (user && user.role !== 'admin') {
        window.location.href = '/dashboard.html';
        return false;
    }
    return true;
}

