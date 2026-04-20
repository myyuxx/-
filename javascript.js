// ============================================
//   ของดีนครนายก — javascript.js
// ============================================

let cart = [];
let currentCategory = 'ทั้งหมด';
let currentDistrict = 'ทุกอำเภอ';
let notifications = [];
let users = [];
let currentUser = null;
let isAdmin = false;
let editingPostId = null;
let pendingPosts = [];
let approvedPosts = [];
let reviews = [];
let mapData = { image: '' };
let isEditingMap = false;
const ADMIN_EMAIL = 'admin@outlook.com';
const ADMIN_NAME = 'แอดมิน';
const ADMIN_PASSWORD = 'admin1234';

// ========== โหลดข้อมูลผู้ใช้ ==========
function loadUserData() {
  if (currentUser) {
    if (!Array.isArray(currentUser.reviewedProducts)) {
      currentUser.reviewedProducts = [];
    }
    currentUser.hasOrderedBefore = !!currentUser.hasOrderedBefore;

    const userCart = localStorage.getItem("cart_" + currentUser.email);
    if (userCart) {
      try {
        cart = JSON.parse(userCart);
      } catch (e) {
        cart = [];
      }
    } else {
      cart = [];
    }
    const userNotifications = localStorage.getItem("notifications_" + currentUser.email);
    if (userNotifications) {
      try {
        notifications = JSON.parse(userNotifications);
      } catch (e) {
        notifications = [];
      }
    } else {
      notifications = [];
    }
  } else {
    cart = [];
    notifications = [];
  }
  updateCartBadge();
  updateNotificationBadge();
}

// ========== บันทึกข้อมูลผู้ใช้ ==========
function saveUserData() {
  if (currentUser) {
    localStorage.setItem("cart_" + currentUser.email, JSON.stringify(cart));
    localStorage.setItem("notifications_" + currentUser.email, JSON.stringify(notifications));
  }
}

function saveReviews() {
  localStorage.setItem('reviews', JSON.stringify(reviews));
}

function getProductReviews(productName) {
  return reviews.filter(review => review.productName === productName);
}

function getReviewCount(productName) {
  return getProductReviews(productName).length;
}

function getAverageRating(productName) {
  const productReviews = getProductReviews(productName);
  if (productReviews.length === 0) return 0;
  return productReviews.reduce((sum, item) => sum + item.rating, 0) / productReviews.length;
}

function migrateUserData(oldEmail, newEmail) {
  if (!oldEmail || !newEmail || oldEmail === newEmail) return;
  const oldCartKey = "cart_" + oldEmail;
  const oldNotifKey = "notifications_" + oldEmail;
  const newCartKey = "cart_" + newEmail;
  const newNotifKey = "notifications_" + newEmail;

  const oldCart = localStorage.getItem(oldCartKey);
  const oldNotifications = localStorage.getItem(oldNotifKey);

  if (oldCart !== null) {
    localStorage.setItem(newCartKey, oldCart);
    localStorage.removeItem(oldCartKey);
  }

  if (oldNotifications !== null) {
    localStorage.setItem(newNotifKey, oldNotifications);
    localStorage.removeItem(oldNotifKey);
  }
}

// ========== โหลดตะกร้าและการแจ้งเตือนเมื่อเปิดเว็บ ==========
window.onload = () => {
  const savedUsers = localStorage.getItem("users");
  if (savedUsers) {
    try {
      users = JSON.parse(savedUsers);
    } catch (e) {
      users = [];
    }
  }

  const savedPendingPosts = localStorage.getItem("pendingPosts");
  if (savedPendingPosts) {
    try {
      pendingPosts = JSON.parse(savedPendingPosts);
    } catch (e) {
      pendingPosts = [];
    }
  }

  const savedApprovedPosts = localStorage.getItem("approvedPosts");
  if (savedApprovedPosts) {
    try {
      approvedPosts = JSON.parse(savedApprovedPosts);
    } catch (e) {
      approvedPosts = [];
    }
  }

  const savedUser = localStorage.getItem("currentUser");
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      isAdmin = currentUser.isAdmin === true;
    } catch (e) {
      currentUser = null;
      isAdmin = false;
    }
  }

  loadUserData();

  const savedReviews = localStorage.getItem("reviews");
  if (savedReviews) {
    try {
      reviews = JSON.parse(savedReviews);
    } catch (e) {
      reviews = [];
    }
  }

  const savedMapData = localStorage.getItem("mapData");
  if (savedMapData) {
    try {
      mapData = JSON.parse(savedMapData);
      if (Array.isArray(mapData) || !mapData?.image) {
        mapData = { image: 'แผนที่นครนายก.png' };
      }
    } catch (e) {
      mapData = { image: 'แผนที่นครนายก.png' };
    }
  } else {
    mapData = { image: 'แผนที่นครนายก.png' };
  }

  updateProfileOrderCount();
  updateAuthUI();
  updateAdminUI();
  renderApprovedPosts();
  renderPendingPosts();
  renderMyProducts();
  updateProductReviewBadges();
  updateUserReviewBadges();
};

// ========== สลับหน้า ==========
function showPage(pageId, linkEl) {
  // ซ่อนทุกหน้า
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  // แสดงหน้าที่เลือก
  const target = document.getElementById(pageId);
  if (target) target.classList.add('active');

  // อัปเดต active link
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  if (linkEl) linkEl.classList.add('active');

  // render เนื้อหาเฉพาะหน้า
  if (pageId === 'cart') renderCart();
  if (pageId === 'notifications') renderNotifications();
  if (pageId === 'product') {
    updateProductPage();
    renderApprovedPosts();
    renderPendingPosts();
    renderMyProducts();
  }
  if (pageId === 'profile') {
    updateAuthUI();
    if (isAdmin) renderAdminReports();
  }
  if (pageId === 'map') {
    renderMap();
    renderMapInfo();
    updateMapEditAccess();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
  return false; // prevent href jump
};

function updateAuthUI() {
  const authSection = document.getElementById('auth-section');
  const profileUser = document.getElementById('profile-user');
  const sidebarName = document.querySelector('.user-mini-name');
  const sidebarRole = document.querySelector('.user-mini-role');
  const profileUserName = document.getElementById('profile-user-name');
  const profileUserEmail = document.getElementById('profile-user-email');
  const profileUserRole = document.getElementById('profile-user-role');
  const profileWelcomeText = document.getElementById('profile-welcome-text');
  const adminDashboard = document.getElementById('admin-dashboard');

  if (currentUser) {
    if (authSection) authSection.style.display = 'none';
    if (profileUser) profileUser.style.display = 'block';
    if (adminDashboard) adminDashboard.style.display = isAdmin ? 'block' : 'none';
    if (sidebarName) sidebarName.textContent = currentUser.name || 'ผู้ใช้';
    if (sidebarRole) sidebarRole.textContent = isAdmin ? 'แอดมิน' : 'สมาชิก';
    if (profileUserName) profileUserName.textContent = currentUser.name || 'ผู้ใช้';
    if (profileUserEmail) profileUserEmail.textContent = currentUser.email;
    const profileUserPhone = document.getElementById('profile-user-phone');
    const profileUserAddress = document.getElementById('profile-user-address');
    if (profileUserPhone) profileUserPhone.textContent = currentUser.phone || '-';
    if (profileUserAddress) profileUserAddress.textContent = currentUser.address || '-';
    if (profileUserRole) profileUserRole.textContent = isAdmin ? 'แอดมิน' : 'สมาชิก';
    if (profileWelcomeText) profileWelcomeText.textContent = isAdmin ? 'คุณเข้าสู่ระบบในฐานะแอดมิน' : 'คุณเข้าสู่ระบบเรียบร้อยแล้ว';
  } else {
    if (authSection) authSection.style.display = 'grid';
    if (profileUser) profileUser.style.display = 'none';
    if (adminDashboard) adminDashboard.style.display = 'none';
    if (sidebarName) sidebarName.textContent = 'ผู้เยี่ยมชม';
    if (sidebarRole) sidebarRole.textContent = 'คนทั่วไป';
  }

  updateAdminUI();
  updateUserReviewBadges();
}

function updateProductPage() {
  const authMessage = document.getElementById('product-auth-message');
  const productManagement = document.getElementById('product-management');
  if (currentUser) {
    authMessage.style.display = 'none';
    productManagement.style.display = 'block';
  } else {
    authMessage.style.display = 'block';
    productManagement.style.display = 'none';
  }
}


// ========== จัดการเข้าสู่ระบบแอดมิน ==========
function handleAdminLogin(event) {
  event.preventDefault();
  const email = document.getElementById('admin-email').value.trim();
  const password = document.getElementById('admin-password').value.trim();
  if (loginAdmin(email, password)) {
    document.getElementById('admin-login-form').reset();
  }
}

function toggleProfileEdit() {
  if (!currentUser) return;
  const editForm = document.getElementById('profile-edit-form');
  if (!editForm) return;
  const nameInput = document.getElementById('edit-name');
  const emailInput = document.getElementById('edit-email');
  const phoneInput = document.getElementById('edit-phone');
  const addressInput = document.getElementById('edit-address');

  if (editForm.style.display === 'block') {
    editForm.style.display = 'none';
    return;
  }

  if (nameInput) nameInput.value = currentUser.name || '';
  if (emailInput) emailInput.value = currentUser.email || '';
  if (phoneInput) phoneInput.value = currentUser.phone || '';
  if (addressInput) addressInput.value = currentUser.address || '';
  editForm.style.display = 'block';
}

function saveProfileEdit(event) {
  event.preventDefault();
  if (!currentUser) return;

  const nameInput = document.getElementById('edit-name');
  const emailInput = document.getElementById('edit-email');
  const phoneInput = document.getElementById('edit-phone');
  const addressInput = document.getElementById('edit-address');

  const name = nameInput ? nameInput.value.trim() : '';
  const email = emailInput ? emailInput.value.trim() : '';
  const phone = phoneInput ? phoneInput.value.trim() : '';
  const address = addressInput ? addressInput.value.trim() : '';

  if (!name || !email || !phone || !address) {
    showToast('⚠️ กรุณากรอกชื่อ อีเมล เบอร์โทร และที่อยู่ให้ครบถ้วน');
    return;
  }

  if (!/^[0-9]{10}$/.test(phone)) {
    showToast('⚠️ เบอร์โทรต้องเป็นตัวเลข 10 หลัก');
    return;
  }

  const oldEmail = currentUser.email;
  if (email !== oldEmail && users.some(u => u.email === email)) {
    showToast('⚠️ อีเมลนี้ถูกใช้งานแล้ว');
    return;
  }

  currentUser.name = name;
  currentUser.phone = phone;
  currentUser.address = address;

  const userIndex = users.findIndex(u => u.email === oldEmail);
  if (userIndex !== -1) {
    users[userIndex] = { ...users[userIndex], name, phone, address, email };
  }

  if (email !== oldEmail) {
    migrateUserData(oldEmail, email);
    currentUser.email = email;
  }

  saveCurrentUser();
  saveUsers();
  saveUserData();
  updateAuthUI();
  showToast('✅ บันทึกข้อมูลเรียบร้อยแล้ว');
  document.getElementById('profile-edit-form').style.display = 'none';
}

function cancelProfileEdit() {
  const editForm = document.getElementById('profile-edit-form');
  if (editForm) editForm.style.display = 'none';
}

function saveUsers() {
  localStorage.setItem("users", JSON.stringify(users));
}

function saveCurrentUser() {
  localStorage.setItem("currentUser", JSON.stringify(currentUser));
}

function clearCurrentUser() {
  currentUser = null;
  isAdmin = false;
  localStorage.removeItem("currentUser");
  localStorage.removeItem("isAdmin");
}

// ========== อัปเดต UI แอดมิน ==========
function updateAdminUI() {
  const adminLinks = document.querySelectorAll('.admin-only');
  adminLinks.forEach(link => {
    link.style.display = isAdmin ? 'flex' : 'none';
  });

  const adminBadge = document.querySelector('.admin-badge');
  if (adminBadge) {
    adminBadge.style.display = isAdmin ? 'inline-block' : 'none';
  }

  const adminLoginSection = document.getElementById('admin-login-section');
  if (adminLoginSection) {
    adminLoginSection.style.display = isAdmin ? 'none' : 'block';
  }
}

// ========== เข้าสู่ระบบแอดมิน ==========
function loginAdmin(email, password) {
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    isAdmin = true;
    currentUser = { name: 'แอดมิน', email, password, isAdmin: true };
    saveCurrentUser();
    if (!users.find(u => u.email === email)) {
      users.push(currentUser);
      saveUsers();
    }
    updateAuthUI();
    showToast('✅ เข้าสู่ระบบแอดมินสำเร็จ');
    showPage('profile');
    return true;
  }
  showToast('❌ อีเมลหรือรหัสผ่านแอดมินไม่ถูกต้อง');
  return false;
}

// ========== ออกจากระบบ ==========
function logout() {
  saveUserData();
  clearCurrentUser();
  cart = [];
  notifications = [];
  renderCart();
  updateCartBadge();
  updateNotificationBadge();
  updateAuthUI();
  showToast('👋 ออกจากระบบแล้ว');
  showPage('home');
}

function logoutAdmin() {
  logout();
}

function handleRegister(event) {
  event.preventDefault();
  const name = document.getElementById('register-name').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value.trim();
  const confirmPassword = document.getElementById('register-confirm-password').value.trim();
  const phone = document.getElementById('register-phone').value.trim();
  const address = document.getElementById('register-address').value.trim();

  if (!name || !email || !password || !confirmPassword || !phone || !address) {
    showToast('⚠️ กรุณากรอกข้อมูลให้ครบถ้วน');
    return;
  }

  if (!/^[0-9]{10}$/.test(phone)) {
    showToast('⚠️ เบอร์โทรต้องเป็นตัวเลข 10 หลัก');
    return;
  }

  if (password !== confirmPassword) {
    showToast('⚠️ รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน');
    return;
  }

  if (users.some(u => u.email === email)) {
    showToast('⚠️ อีเมลนี้ถูกใช้แล้ว');
    return;
  }

  const isAdminUser = email === ADMIN_EMAIL || name === ADMIN_NAME;

  if (isAdminUser && password !== ADMIN_PASSWORD) {
    showToast('❌ รหัสผ่านแอดมินไม่ถูกต้อง');
    return;
  }

  const user = { name, email, password, isAdmin: isAdminUser, phone, address, hasOrderedBefore: false, reviewedProducts: [] };
  users.push(user);
  saveUsers();
  currentUser = user;
  isAdmin = user.isAdmin;
  saveCurrentUser();
  loadUserData();
  updateAuthUI();
  showToast('✅ สมัครสมาชิกสำเร็จ');
  showPage('profile');
}

function handleMemberLogin(event) {
  event.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();

  if (!email || !password) {
    showToast('⚠️ กรุณากรอกข้อมูลให้ครบถ้วน');
    return;
  }

  let user = users.find(u => u.email === email && u.password === password);
  if (!user && email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    user = { name: 'แอดมิน', email, password, isAdmin: true, hasOrderedBefore: false, reviewedProducts: [] };
    users.push(user);
    saveUsers();
  }

  if (!user) {
    showToast('❌ อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    return;
  }

  currentUser = user;
  currentUser.reviewedProducts = Array.isArray(currentUser.reviewedProducts) ? currentUser.reviewedProducts : [];
  currentUser.hasOrderedBefore = !!currentUser.hasOrderedBefore;
  isAdmin = !!user.isAdmin;
  saveCurrentUser();
  loadUserData();
  updateAuthUI();
  showToast('✅ เข้าสู่ระบบสำเร็จ');
  showPage('profile');
}

function toggleAuthMode(mode) {
  const signinCard = document.getElementById('signin-card');
  const signupCard = document.getElementById('signup-card');
  if (!signinCard || !signupCard) return;
  if (mode === 'register') {
    signinCard.style.display = 'none';
    signupCard.style.display = 'block';
  } else {
    signupCard.style.display = 'none';
    signinCard.style.display = 'block';
  }
}

function handleAddProduct(event) {
  event.preventDefault();
  if (!currentUser) {
    showToast('⚠️ โปรดเข้าสู่ระบบก่อนโพสต์สินค้า');
    return;
  }

  const name = document.getElementById('new-product-name').value.trim();
  const slogan = document.getElementById('new-product-slogan').value.trim();
  const category = document.getElementById('new-product-category').value;
  const district = document.getElementById('new-product-district').value;
  const price = parseInt(document.getElementById('new-product-price').value, 10);
  const image = document.getElementById('new-product-image').value.trim();

  if (!name || !slogan || !category || !district || !price || !image) {
    showToast('⚠️ กรุณากรอกข้อมูลสินค้าให้ครบถ้วน');
    return;
  }

  if (editingPostId) {
    const index = approvedPosts.findIndex(post => post.id === editingPostId && post.sellerEmail === currentUser.email);
    if (index === -1) {
      showToast('❌ ไม่พบสินค้าที่จะแก้ไข');
      cancelEditProduct();
      return;
    }

    approvedPosts[index] = {
      ...approvedPosts[index],
      name,
      slogan,
      category,
      district,
      price,
      image,
      time: new Date().toLocaleString('th-TH', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    };

    saveApprovedPosts();
    renderApprovedPosts();
    renderMyProducts();
    showToast('✅ แก้ไขสินค้าสำเร็จ');
    cancelEditProduct();
    return;
  }

  const pendingItem = {
    id: Date.now(),
    seller: currentUser.name,
    sellerEmail: currentUser.email,
    name,
    slogan,
    category,
    district,
    price,
    image,
    status: 'pending',
    time: new Date().toLocaleString('th-TH', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  };

  pendingPosts.unshift(pendingItem);
  savePendingPosts();
  renderPendingPosts();
  event.target.reset();
  showToast('✅ โพสต์สำเร็จ รอแอดมินตรวจสอบ');
}

function savePendingPosts() {
  localStorage.setItem('pendingPosts', JSON.stringify(pendingPosts));
}

function saveApprovedPosts() {
  localStorage.setItem('approvedPosts', JSON.stringify(approvedPosts));
}

function setProductFormMode(editing) {
  const submitBtn = document.getElementById('add-product-submit');
  const cancelBtn = document.getElementById('cancel-edit-btn');
  const formTitle = document.querySelector('.add-product-section h3');
  if (!submitBtn || !cancelBtn || !formTitle) return;

  if (editing) {
    submitBtn.textContent = 'บันทึกการแก้ไข';
    cancelBtn.style.display = 'inline-flex';
    formTitle.textContent = 'แก้ไขสินค้า';
  } else {
    submitBtn.textContent = 'โพสต์สินค้า';
    cancelBtn.style.display = 'none';
    formTitle.textContent = 'โพสต์สินค้าใหม่';
  }
}

function startEditProduct(postId) {
  const post = approvedPosts.find(item => item.id === postId && item.sellerEmail === currentUser?.email);
  if (!post) {
    showToast('❌ ไม่พบข้อมูลสินค้าหรือคุณไม่มีสิทธิ์แก้ไข');
    return;
  }

  editingPostId = post.id;
  document.getElementById('new-product-name').value = post.name;
  document.getElementById('new-product-slogan').value = post.slogan;
  document.getElementById('new-product-category').value = post.category;
  document.getElementById('new-product-district').value = post.district;
  document.getElementById('new-product-price').value = post.price;
  document.getElementById('new-product-image').value = post.image;
  setProductFormMode(true);
  showToast('✏️ กำลังแก้ไขสินค้า: ' + post.name);
}

function cancelEditProduct() {
  editingPostId = null;
  const form = document.getElementById('add-product-form');
  if (form) form.reset();
  setProductFormMode(false);
}

function deleteApprovedPost(postId) {
  const index = approvedPosts.findIndex(post => post.id === postId && post.sellerEmail === currentUser?.email);
  if (index === -1) {
    showToast('❌ ไม่พบสินค้าหรือคุณไม่มีสิทธิ์ลบ');
    return;
  }

  if (!confirm('คุณต้องการลบสินค้านี้จริงหรือไม่?')) return;

  approvedPosts.splice(index, 1);
  saveApprovedPosts();
  renderApprovedPosts();
  renderMyProducts();
  showToast('🗑 ลบสินค้าสำเร็จ');
}

function renderPendingPosts() {
  const list = document.getElementById('pending-posts-list');
  if (!list) return;

  if (!currentUser) {
    list.innerHTML = '<p>กรุณาเข้าสู่ระบบเพื่อดูสินค้ารออนุมัติของคุณ</p>';
    return;
  }

  const isAdminView = isAdmin;
  const postsToShow = isAdminView ? pendingPosts : pendingPosts.filter(post => post.sellerEmail === currentUser.email);

  if (postsToShow.length === 0) {
    list.innerHTML = '<p>ยังไม่มีสินค้ารออนุมัติ</p>';
    renderMyProducts();
    return;
  }

  list.innerHTML = postsToShow.map(post => `
    <div class="pending-post-card">
      <div>
        <strong>${post.name}</strong>
        <p>${post.slogan}</p>
        <p>อำเภอ ${post.district} • ราคา ฿${post.price}</p>
        ${isAdminView ? `<p style="margin-top:8px;font-size:13px;color:${post.sellerEmail === currentUser.email ? '#4a6741' : '#6b7280'}">ผู้โพสต์: ${post.seller} (${post.sellerEmail})</p>` : ''}
      </div>
      <div class="pending-status">
        ${isAdminView ? `<button class="btn-approve" onclick="approvePendingPost(${post.id})">อนุมัติ</button><button class="btn-reject" onclick="rejectPendingPost(${post.id})">ปฏิเสธ</button>` : 'รออนุมัติ'}
      </div>
    </div>
  `).join('');
}

function renderApprovedPosts() {
  const grid = document.getElementById('product-grid');
  const list = document.getElementById('approved-posts-list');

  if (list) {
    if (approvedPosts.length === 0) {
      list.innerHTML = '<p>ยังไม่มีสินค้าที่อนุมัติ</p>';
    } else {
      list.innerHTML = approvedPosts.map(post => `
        <div class="approved-post-card">
          <div class="approved-post-thumb"><img src="${post.image}" alt="${post.name}" onerror="this.src=''; this.parentElement.innerHTML='<div class=\'img-placeholder\'>🛍</div>'"></div>
          <div class="approved-post-body">
            <h4>${post.name}</h4>
            <p>${post.slogan}</p>
            <div class="approved-meta">อำเภอ ${post.district} • ฿${post.price}</div>
            <div class="approved-label">ผู้ขาย: ${post.seller}</div>
          </div>
        </div>
      `).join('');
    }
  }

  if (!grid) return;

  approvedPosts.forEach(post => {
    if (document.querySelector(`.product-card[data-product-id="${post.id}"]`)) return;

    const card = document.createElement('div');
    card.className = 'product-card';
    card.setAttribute('data-category', post.category);
    card.setAttribute('data-district', post.district);
    card.setAttribute('data-product-id', post.id);
    card.innerHTML = `
      <div class="card-badge">${post.category}</div>
      <div class="product-img-wrap">
        <img src="${post.image}" alt="${post.name}" onerror="this.parentElement.innerHTML='<div class=\'img-placeholder\'>🛍</div>'">
      </div>
      <div class="card-body">
        <h3>${post.name}</h3>
        <p class="desc">${post.slogan}</p>
        <p class="location">📍 ${post.district}</p>
        <p class="rating">⭐ 4.5 <span class="review-count">(รีวิวใหม่)</span></p>
        <div class="card-footer">
          <p class="price">฿${post.price} <span class="points">+5 แต้ม</span></p>
          <button onclick="addToCart('${post.name}', ${post.price}, '${post.image}')">+ ตะกร้า</button>
        </div>
      </div>
    `;
    grid.prepend(card);
  });
  renderMyProducts();
}

function renderMyProducts() {
  const list = document.getElementById('my-products-list');
  if (!list) return;

  if (!currentUser) {
    list.innerHTML = '<p>กรุณาเข้าสู่ระบบเพื่อดูสินค้าของคุณ</p>';
    return;
  }

  const myPosts = approvedPosts.filter(post => post.sellerEmail === currentUser.email);
  if (myPosts.length === 0) {
    list.innerHTML = '<p>ยังไม่มีสินค้าที่ได้รับการอนุมัติของคุณ</p>';
    return;
  }

  list.innerHTML = myPosts.map(post => `
    <div class="approved-post-card">
      <div class="approved-post-thumb"><img src="${post.image}" alt="${post.name}" onerror="this.src=''; this.parentElement.innerHTML='<div class=\'img-placeholder\'>🛍</div>'"></div>
      <div class="approved-post-body">
        <h4>${post.name}</h4>
        <p>${post.slogan}</p>
        <div class="approved-meta">อำเภอ ${post.district} • ฿${post.price}</div>
        <div class="approved-label">สถานะ: ${post.status === 'approved' ? 'ขายได้' : 'รออนุมัติ'}</div>
        <div style="margin-top:12px; display:flex; gap:10px; flex-wrap:wrap;">
          <button class="btn-edit-prod" type="button" onclick="startEditProduct(${post.id})">✏️ แก้ไข</button>
          <button class="btn-reject" type="button" onclick="deleteApprovedPost(${post.id})">🗑 ลบ</button>
        </div>
      </div>
    </div>
  `).join('');
}

function approvePendingPost(postId) {
  const index = pendingPosts.findIndex(p => p.id === postId);
  if (index === -1) return;
  const approvedItem = { ...pendingPosts[index], status: 'approved' };
  approvedPosts.unshift(approvedItem);
  pendingPosts.splice(index, 1);
  savePendingPosts();
  saveApprovedPosts();
  renderPendingPosts();
  renderApprovedPosts();
  showToast('✅ อนุมัติโพสต์แล้ว');
}

function rejectPendingPost(postId) {
  const index = pendingPosts.findIndex(p => p.id === postId);
  if (index === -1) return;
  pendingPosts.splice(index, 1);
  savePendingPosts();
  renderPendingPosts();
  showToast('❌ ปฏิเสธโพสต์แล้ว');
}

// ========== เพิ่มรูปสินค้าในตะกร้า ==========
function getProductImage(name) {
  const card = Array.from(document.querySelectorAll('.product-card')).find(product => {
    const title = product.querySelector('h3');
    return title && title.textContent.trim() === name;
  });
  return card ? (card.querySelector('img') ? card.querySelector('img').src : '') : '';
}

// ========== คำนวณราคาหลังส่วนลด ==========
function getDiscountedPrice(productName, originalPrice) {
  if (currentUser && currentUser.reviewedProducts && currentUser.reviewedProducts.includes(productName)) {
    return Math.round(originalPrice * 0.95); // ลด 5%
  }
  return originalPrice;
}

// ========== เพิ่มสินค้าลงตะกร้า ==========
function addToCart(name, price) {
  if (!currentUser) {
    showToast('⚠️ กรุณาเข้าสู่ระบบหรือสมัครสมาชิกก่อนเพิ่มสินค้า');
    return;
  }

  // คำนวณราคาหลังส่วนลดถ้ารีวิวแล้ว
  const discountedPrice = getDiscountedPrice(name, price);

  const existing = cart.find(item => item.name === name);
  const imgSrc = getProductImage(name);

  if (existing) {
    existing.qty += 1;
    if (!existing.imgSrc && imgSrc) {
      existing.imgSrc = imgSrc;
    }
  } else {
    cart.push({ name, price: discountedPrice, originalPrice: price, qty: 1, imgSrc });
  }
  saveCart();
  updateCartBadge();
  updateProfileOrderCount();
  showToast('🛒 เพิ่ม "' + name + '" ลงตะกร้าแล้ว!');
}

// ========== เปลี่ยนจำนวนสินค้าในตะกร้า ==========
function changeQty(index, delta) {
  if (cart[index]) {
    cart[index].qty += delta;
    if (cart[index].qty < 1) cart[index].qty = 1;
    saveCart();
    renderCart();
    updateCartBadge();
  }
}

// ========== ลบสินค้าออกจากตะกร้า ==========
function removeFromCart(index) {
  const name = cart[index] ? cart[index].name : '';
  cart.splice(index, 1);
  saveCart();
  renderCart();
  updateCartBadge();
  if (name) showToast('🗑 ลบ "' + name + '" ออกจากตะกร้าแล้ว');
}

// ========== แสดงรายการตะกร้า ==========
function renderCart() {
  const container = document.getElementById('cart-items-container');
  const summarySection = document.getElementById('cart-summary-section');
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty-state">
        <span class="empty-icon">🛒</span>
        <p>ยังไม่มีสินค้าในตะกร้า<br>ไปเลือกสินค้าในหน้าแรกได้เลย!</p>
      </div>
    `;
    if (summarySection) summarySection.style.display = 'none';
    return;
  }

  if (summarySection) summarySection.style.display = 'flex';

  let html = '';
  let total = 0;

  cart.forEach((item, index) => {
    const subtotal = item.price * item.qty;
    total += subtotal;

    const itemImage = item.imgSrc || getProductImage(item.name) || '';
    if (!item.imgSrc && itemImage) {
      item.imgSrc = itemImage;
      saveCart();
    }

    const hasImage = itemImage !== '';
    const isDiscounted = item.originalPrice && item.price < item.originalPrice;
    const priceDisplay = isDiscounted ? `<span style="text-decoration: line-through; color: #999;">฿${item.originalPrice.toLocaleString()}</span> ฿${item.price.toLocaleString()} (ลด 5%)` : `฿${item.price.toLocaleString()}`;

    html += `
      <div class="cart-item">
        <div class="cart-item-image">
          ${hasImage ? `<img src="${itemImage}" alt="${item.name}" onerror="this.style.display='none'; this.parentElement.querySelector('.cart-item-placeholder').style.display='flex';">` : ''}
          <div class="cart-item-placeholder" style="display:${hasImage ? 'none' : 'flex'}">🛍</div>
        </div>
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <div class="item-unit">ราคาต่อชิ้น: ${priceDisplay}</div>
          <div class="item-price-each">฿${subtotal.toLocaleString()}</div>
        </div>
        <div class="qty-control">
          <button onclick="changeQty(${index}, -1)">−</button>
          <span class="qty-num">${item.qty}</span>
          <button onclick="changeQty(${index}, 1)">+</button>
        </div>
        <button class="btn-remove" onclick="removeFromCart(${index})">🗑 ลบ</button>
      </div>
    `;
  });

  container.innerHTML = html;

  const totalEl = document.getElementById('total');
  if (totalEl) totalEl.textContent = total.toLocaleString();
}

// ========== ชำระเงิน ==========
function checkout() {
  if (!currentUser) {
    showToast('⚠️ กรุณาเข้าสู่ระบบก่อนชำระเงิน');
    return;
  }
  if (cart.length === 0) {
    showToast('⚠️ ไม่มีสินค้าในตะกร้า');
    return;
  }
  openCheckoutModal();
}

// ========== เปิด modal ชำระเงิน ==========
function prepareCheckoutForm() {
  const nameInput = document.getElementById('customer-name');
  const phoneGroup = document.getElementById('checkout-phone-group');
  const addressGroup = document.getElementById('checkout-address-group');
  const phoneInput = document.getElementById('customer-phone');
  const addressInput = document.getElementById('customer-address');

  const isRepeatOrder = !!currentUser?.hasOrderedBefore;

  if (nameInput) {
    nameInput.value = currentUser?.name || '';
  }

  if (phoneInput && addressInput) {
    phoneInput.value = currentUser?.phone || '';
    addressInput.value = currentUser?.address || '';
  }

  if (phoneGroup && addressGroup && phoneInput && addressInput) {
    if (isRepeatOrder) {
      phoneGroup.style.display = 'none';
      addressGroup.style.display = 'none';
      phoneInput.required = false;
      addressInput.required = false;
    } else {
      phoneGroup.style.display = '';
      addressGroup.style.display = '';
      phoneInput.required = true;
      addressInput.required = true;
    }
  }
}

function openCheckoutModal() {
  const modal = document.getElementById('checkout-modal');
  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  document.getElementById('modal-item-count').textContent = itemCount + ' ชิ้น';
  document.getElementById('modal-total').textContent = '฿' + total.toLocaleString();
  prepareCheckoutForm();

  if (modal) modal.classList.add('show');
}

// ========== ปิด modal ==========
function closeModal() {
  const modal = document.getElementById('checkout-modal');
  if (modal) modal.classList.remove('show');
}

function closeReviewModal() {
  const modal = document.getElementById('review-modal');
  if (modal) modal.classList.remove('show');
}

// ========== จัดการฟอร์มชำระเงิน ==========
document.addEventListener('DOMContentLoaded', () => {
  const checkoutForm = document.getElementById('checkout-form');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', handleCheckoutSubmit);
  }

  // จัดการการเปลี่ยนแปลงวิธีการชำระเงิน
  const paymentRadios = document.querySelectorAll('input[name="payment-method"]');
  paymentRadios.forEach(radio => {
    radio.addEventListener('change', handlePaymentMethodChange);
  });

  // จัดการการ format หมายเลขบัตร
  const cardNumberInput = document.getElementById('card-number');
  if (cardNumberInput) {
    cardNumberInput.addEventListener('input', formatCardNumber);
  }

  // จัดการการ format วันหมดอายุ
  const cardExpiryInput = document.getElementById('card-expiry');
  if (cardExpiryInput) {
    cardExpiryInput.addEventListener('input', formatCardExpiry);
  }

  document.addEventListener('click', (e) => {
    const card = e.target.closest('.product-card, .approved-post-card');
    if (!card) return;
    if (e.target.closest('button, a, input, textarea')) return;
    const titleEl = card.querySelector('h3, h4');
    if (!titleEl) return;
    const productName = titleEl.textContent.trim();
    if (productName) {
      openReviewModal(productName, 'view');
    }
  });

  const reviewForm = document.getElementById('review-form');
  if (reviewForm) {
    reviewForm.addEventListener('submit', submitReview);
  }
});

function formatCardNumber(e) {
  let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  let formattedValue = '';
  for (let i = 0; i < value.length; i++) {
    if (i > 0 && i % 4 === 0) {
      formattedValue += ' ';
    }
    formattedValue += value[i];
  }
  e.target.value = formattedValue;
}

function formatCardExpiry(e) {
  let value = e.target.value.replace(/\D/g, '');
  if (value.length >= 2) {
    value = value.substring(0, 2) + '/' + value.substring(2, 4);
  }
  e.target.value = value;
}

function handlePaymentMethodChange(e) {
  const method = e.target.value;
  const qrDetails = document.getElementById('qr-details');
  const cardDetails = document.getElementById('card-details');
  const codDetails = document.getElementById('cod-details');

  if (method === 'qr') {
    qrDetails.style.display = 'block';
    cardDetails.style.display = 'none';
    codDetails.style.display = 'none';
  } else if (method === 'card') {
    qrDetails.style.display = 'none';
    cardDetails.style.display = 'block';
    codDetails.style.display = 'none';
  } else if (method === 'cod') {
    qrDetails.style.display = 'none';
    cardDetails.style.display = 'none';
    codDetails.style.display = 'block';
  }
}

function handleCheckoutSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('customer-name').value.trim();
  const note = document.getElementById('customer-note').value.trim();
  const paymentMethod = document.querySelector('input[name="payment-method"]:checked');
  const phoneInput = document.getElementById('customer-phone');
  const addressInput = document.getElementById('customer-address');
  let phone = phoneInput ? phoneInput.value.trim() : '';
  let address = addressInput ? addressInput.value.trim() : '';

  const isRepeatOrder = !!currentUser?.hasOrderedBefore;

  if (!name) {
    showToast('⚠️ กรุณากรอกชื่อผู้รับ');
    return;
  }

  if (!paymentMethod) {
    showToast('⚠️ กรุณาเลือกวิธีการชำระเงิน');
    return;
  }

  if (!isRepeatOrder) {
    if (!phone || !address) {
      showToast('⚠️ กรุณากรอกข้อมูลที่อยู่และเบอร์ติดต่อสำหรับการจัดส่ง');
      return;
    }
    if (currentUser) {
      currentUser.phone = phone;
      currentUser.address = address;
    }
  } else {
    if (!currentUser?.phone || !currentUser?.address) {
      if (!phone || !address) {
        showToast('⚠️ กรุณากรอกเบอร์โทรและที่อยู่สำหรับการจัดส่ง');
        return;
      }
      if (currentUser) {
        currentUser.phone = phone;
        currentUser.address = address;
      }
    }
    phone = currentUser?.phone || phone;
    address = currentUser?.address || address;
  }

  if (currentUser) {
    currentUser.name = name;
    currentUser.hasOrderedBefore = true;
    const userIndex = users.findIndex(u => u.email === currentUser.email);
    if (userIndex !== -1) {
      users[userIndex] = currentUser;
    } else {
      users.push(currentUser);
    }
    saveUsers();
    saveCurrentUser();
  }

  // ตรวจสอบข้อมูลบัตรหากเลือกชำระด้วยบัตร
  if (paymentMethod.value === 'card') {
    const cardNumber = document.getElementById('card-number').value.trim();
    const cardName = document.getElementById('card-name').value.trim();
    const cardExpiry = document.getElementById('card-expiry').value.trim();
    const cardCvv = document.getElementById('card-cvv').value.trim();

    if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
      showToast('⚠️ กรุณากรอกข้อมูลบัตรให้ครบถ้วน');
      return;
    }

    // ตรวจสอบรูปแบบเบื้องต้น (จำลอง)
    if (cardNumber.length < 16) {
      showToast('⚠️ หมายเลขบัตรไม่ถูกต้อง');
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
      showToast('⚠️ รูปแบบวันหมดอายุไม่ถูกต้อง (MM/YY)');
      return;
    }
    if (cardCvv.length < 3) {
      showToast('⚠️ CVV ไม่ถูกต้อง');
      return;
    }
  }

  // สร้างการแจ้งเตือน
  const orderId = 'ORD' + Date.now();
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  let paymentType = '';
  if (paymentMethod.value === 'qr') paymentType = 'QR Code';
  else if (paymentMethod.value === 'card') paymentType = 'บัตรเครดิต/เดบิต';
  else if (paymentMethod.value === 'cod') paymentType = 'เก็บเงินปลายทาง';

  const notification = {
    id: Date.now(),
    type: 'order',
    title: 'คำสั่งซื้อได้รับการยืนยันแล้ว',
    message: `คำสั่งซื้อ ${orderId} มูลค่า ฿${total.toLocaleString()} ได้รับการยืนยันแล้ว กำลังจัดเตรียมสินค้า (${paymentType})`,
    time: new Date().toLocaleString('th-TH'),
    unread: true,
    details: {
      orderId,
      name,
      phone,
      address,
      note,
      paymentMethod: paymentType,
      items: [...cart],
      total
    }
  };

  notifications.unshift(notification);
  saveNotifications();

  // ล้างตะกร้า
  cart = [];
  saveCart();
  renderCart();
  updateCartBadge();
  updateProfileOrderCount();
  updateNotificationBadge();

  // ปิด modal และแสดง toast
  closeModal();
  showToast('✅ ชำระเงินสำเร็จ! ตรวจสอบการแจ้งเตือนสำหรับรายละเอียด');

  // รีเซ็ตฟอร์ม
  document.getElementById('checkout-form').reset();
  // ซ่อน payment details
  document.getElementById('qr-details').style.display = 'none';
  document.getElementById('card-details').style.display = 'none';
  document.getElementById('cod-details').style.display = 'none';
}

// ========== บันทึกการแจ้งเตือนใน localStorage ==========
function saveNotifications() {
  saveUserData();
}

// ========== แสดงการแจ้งเตือน ==========
function renderNotifications() {
  const container = document.getElementById('notifications-container');
  if (!container) return;

  if (notifications.length === 0) {
    container.innerHTML = `
      <div class="notification-card">
        <div class="notif-icon">📭</div>
        <div class="notif-content">
          <h4>ยังไม่มีแจ้งเตือน</h4>
          <p>การแจ้งเตือนทั้งหมดจะแสดงที่นี่</p>
          <span class="notif-time">-</span>
        </div>
      </div>
    `;
    return;
  }

  let html = '';
  notifications.forEach((notif, index) => {
    const icon = notif.type === 'order' ? '🛒' : '📢';
    const unreadClass = notif.unread ? 'unread' : '';

    html += `
      <div class="notification-card ${unreadClass}" onclick="openNotification(${index})">
        <div class="notif-icon">${icon}</div>
        <div class="notif-content">
          <h4>${notif.title}</h4>
          <p>${notif.message}</p>
          <span class="notif-time">${notif.time}</span>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function openNotification(index) {
  if (!notifications[index]) return;
  notifications[index].unread = false;
  saveNotifications();
  renderNotifications();
  updateNotificationBadge();

  const notif = notifications[index];
  if (notif.type === 'order' && notif.details?.items?.length > 0) {
    openReviewModal(notif.details.items[0].name, 'write', notif.details.items);
  } else {
    showToast('เปิดการแจ้งเตือนแล้ว');
  }
}

function openReviewModal(productName, mode = 'view', orderItems = []) {
  const modal = document.getElementById('review-modal');
  const modalTitle = document.getElementById('review-modal-title');
  const formSection = document.getElementById('review-form-section');
  const orderItemsSection = document.getElementById('review-order-items');
  const reviewProductInput = document.getElementById('review-product-name');
  const reviewProductTitle = document.getElementById('review-selected-product');

  if (!modal || !modalTitle || !formSection || !orderItemsSection || !reviewProductInput || !reviewProductTitle) return;

  modalTitle.textContent = mode === 'write' ? `เขียนรีวิวสินค้า: ${productName}` : `รีวิวสินค้า: ${productName}`;
  reviewProductInput.value = productName;
  reviewProductTitle.textContent = productName;
  reviewProductTitle.dataset.productName = productName;

  orderItemsSection.innerHTML = '';
  if (orderItems.length > 1 && mode === 'write') {
    orderItemsSection.style.display = 'block';
    orderItemsSection.innerHTML = `
      <div class="review-order-label">เลือกสินค้าที่ต้องการรีวิว</div>
      <div class="review-order-list">
        ${orderItems.map(item => `<button type="button" class="btn-review-item" onclick="setReviewProduct('${item.name}')">${item.name} (${item.qty} ชิ้น)</button>`).join('')}
      </div>
    `;
  } else {
    orderItemsSection.style.display = 'none';
  }

  if (mode === 'write' && currentUser) {
    formSection.style.display = 'block';
    document.getElementById('review-comment').value = '';
    document.getElementById('review-rating').value = '5';
  } else if (mode === 'write' && !currentUser) {
    formSection.style.display = 'none';
    showToast('⚠️ กรุณาเข้าสู่ระบบก่อนเขียนรีวิว');
  } else {
    formSection.style.display = 'none';
  }

  renderReviewList(productName);
  modal.classList.add('show');
}

function renderReviewList(productName) {
  const reviewList = document.getElementById('review-list');
  const reviewSummary = document.getElementById('review-summary');
  if (!reviewList || !reviewSummary) return;

  const productReviews = getProductReviews(productName);
  const count = productReviews.length;
  const average = getAverageRating(productName);

  reviewSummary.innerHTML = `
    <div class="review-summary-meta">
      <strong>คะแนนเฉลี่ย:</strong> ${count > 0 ? average.toFixed(1) : 'ยังไม่มี'}
      <span>(${count} รีวิว)</span>
    </div>
  `;

  if (count === 0) {
    reviewList.innerHTML = `<div class="review-empty">ยังไม่มีรีวิวสำหรับสินค้านี้</div>`;
    return;
  }

  reviewList.innerHTML = productReviews.map(review => `
    <div class="review-card">
      <div class="review-card-header">
        <div><strong>${review.userName}</strong> • ${new Date(review.time).toLocaleDateString('th-TH')}</div>
        <div class="review-rating">${'⭐'.repeat(review.rating)}${review.rating < 5 ? ' (' + review.rating + ')' : ''}</div>
      </div>
      <div class="review-card-body">
        <p>${review.comment}</p>
      </div>
    </div>
  `).join('');
}

function setReviewProduct(productName) {
  const reviewProductInput = document.getElementById('review-product-name');
  const reviewProductTitle = document.getElementById('review-selected-product');
  if (reviewProductInput && reviewProductTitle) {
    reviewProductInput.value = productName;
    reviewProductTitle.textContent = productName;
    renderReviewList(productName);
  }
}

function submitReview(e) {
  e.preventDefault();
  if (!currentUser) {
    showToast('⚠️ กรุณาเข้าสู่ระบบก่อนเขียนรีวิว');
    return;
  }

  const productName = document.getElementById('review-product-name').value;
  const rating = parseInt(document.getElementById('review-rating').value, 10);
  const comment = document.getElementById('review-comment').value.trim();

  if (!productName || !rating || !comment) {
    showToast('⚠️ กรุณากรอกคะแนนและข้อความรีวิว');
    return;
  }

  reviews.unshift({
    productName,
    userEmail: currentUser.email,
    userName: currentUser.name,
    rating,
    comment,
    time: new Date().toISOString()
  });
  saveReviews();
  renderReviewList(productName);
  updateProductReviewBadges();

  // เพิ่มสินค้าในรายการที่รีวิวแล้วสำหรับส่วนลด
  if (!currentUser.reviewedProducts) {
    currentUser.reviewedProducts = [];
  }
  if (!currentUser.reviewedProducts.includes(productName)) {
    currentUser.reviewedProducts.push(productName);
    saveUsers();
    saveCurrentUser();
  }

  updateUserReviewBadges();
  showToast('✅ ส่งรีวิวเรียบร้อยแล้ว คุณจะได้รับส่วนลด 5% สำหรับสินค้านี้ในครั้งต่อไป!');
}

function updateProductReviewBadges() {
  const cards = document.querySelectorAll('.product-card, .approved-post-card');
  cards.forEach(card => {
    const titleEl = card.querySelector('h3, h4');
    const countEl = card.querySelector('.review-count');
    if (!titleEl || !countEl) return;
    const name = titleEl.textContent.trim();
    const count = getReviewCount(name);
    countEl.textContent = `(${count} รีวิว)`;
    const ratingEl = countEl.parentElement;
    if (ratingEl && count > 0) {
      const avg = getAverageRating(name).toFixed(1);
      if (ratingEl.firstChild && ratingEl.firstChild.nodeType === Node.TEXT_NODE) {
        ratingEl.firstChild.textContent = `⭐ ${avg} `;
      }
    }
  });
}

// ========== อัปเดต badge สำหรับสินค้าที่ผู้ใช้รีวิวแล้ว ==========
function updateUserReviewBadges() {
  if (!currentUser || !currentUser.reviewedProducts) return;

  const productCards = document.querySelectorAll('.product-card');
  productCards.forEach(card => {
    const titleEl = card.querySelector('h3');
    if (!titleEl) return;
    const productName = titleEl.textContent.trim();

    // ลบ badge เดิมถ้ามี
    const existingBadge = card.querySelector('.review-badge, .discount-badge');
    if (existingBadge) existingBadge.remove();

    if (currentUser.reviewedProducts.includes(productName)) {
      // เพิ่ม badge ส่วนลดสำหรับสินค้าที่รีวิวแล้ว
      const badge = document.createElement('div');
      badge.className = 'discount-badge';
      badge.textContent = 'รีวิวแล้ว • ลด 5%';
      card.style.position = 'relative'; // ตรวจสอบว่า card มี position relative
      card.appendChild(badge);
    }
  });
}

// ========== ทำเครื่องหมายว่าอ่านแล้ว ==========
function markAsRead(index) {
  if (notifications[index]) {
    notifications[index].unread = false;
    saveNotifications();
    renderNotifications();
    updateNotificationBadge();
  }
}

// ========== บันทึกตะกร้าใน localStorage ==========
function saveCart() {
  saveUserData();
}

// ========== อัปเดตตัวเลขบน badge ==========
function updateCartBadge() {
  const total = cart.reduce((sum, item) => sum + item.qty, 0);
  const badge = document.getElementById('cart-count-badge');
  if (badge) {
    badge.textContent = total;
    badge.style.display = total > 0 ? 'inline-block' : 'none';
  }
}

// ========== อัปเดตจำนวนออเดอร์ในโปรไฟล์ ==========
function updateProfileOrderCount() {
  const el = document.getElementById('profile-order-count');
  if (el) el.textContent = cart.length;
}

// ========== อัปเดต badge การแจ้งเตือน ==========
function updateNotificationBadge() {
  const unreadCount = notifications.filter(n => n.unread).length;
  const badge = document.querySelector('.notif-badge');
  if (badge) {
    badge.textContent = unreadCount;
    badge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
  }
}

// ========== ตั้งค่าหมวดหมู่ ==========
function setCategory(category, btnEl) {
  currentCategory = category;
  // อัปเดต active button
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active-cat'));
  if (btnEl) btnEl.classList.add('active-cat');
  filterProducts();
}

// ========== ตั้งค่าอำเภอ ==========
function setDistrict(district) {
  currentDistrict = district;
  filterProducts();
}

// ========== แสดงรายงานแอดมิน ==========
function renderAdminReports() {
  if (!isAdmin) {
    showPage('home');
    return;
  }

  const container = document.getElementById('admin-reports-container');
  if (!container) return;

  // คำนวณข้อมูลรายงาน
  const orders = notifications.filter(n => n.type === 'order');
  const totalRevenue = orders.reduce((sum, order) => sum + order.details.total, 0);
  const totalOrders = orders.length;

  // สินค้าขายดี
  const productSales = {};
  orders.forEach(order => {
    order.details.items.forEach(item => {
      if (productSales[item.name]) {
        productSales[item.name] += item.qty;
      } else {
        productSales[item.name] = item.qty;
      }
    });
  });

  const topProducts = Object.entries(productSales)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  // สถิติการชำระเงิน
  const paymentStats = {};
  orders.forEach(order => {
    const method = order.details.paymentMethod;
    if (paymentStats[method]) {
      paymentStats[method]++;
    } else {
      paymentStats[method] = 1;
    }
  });

  let html = `
    <div class="admin-stats-grid">
      <div class="admin-stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-content">
          <h3>ยอดขายรวม</h3>
          <p class="stat-value">฿${totalRevenue.toLocaleString()}</p>
        </div>
      </div>
      <div class="admin-stat-card">
        <div class="stat-icon">📦</div>
        <div class="stat-content">
          <h3>จำนวนคำสั่งซื้อ</h3>
          <p class="stat-value">${totalOrders}</p>
        </div>
      </div>
      <div class="admin-stat-card">
        <div class="stat-icon">🛒</div>
        <div class="stat-content">
          <h3>สินค้าขายแล้ว</h3>
          <p class="stat-value">${Object.values(productSales).reduce((a, b) => a + b, 0)}</p>
        </div>
      </div>
      <div class="admin-stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-content">
          <h3>ลูกค้าที่สั่งซื้อ</h3>
          <p class="stat-value">${new Set(orders.map(o => o.details.phone)).size}</p>
        </div>
      </div>
    </div>

    <div class="admin-section">
      <h3>📊 สินค้าขายดี</h3>
      <div class="top-products">
        ${topProducts.map(([name, qty], index) => `
          <div class="top-product-item">
            <span class="rank">#${index + 1}</span>
            <span class="product-name">${name}</span>
            <span class="product-qty">${qty} ชิ้น</span>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="admin-section">
      <h3>💳 สถิติการชำระเงิน</h3>
      <div class="payment-stats">
        ${Object.entries(paymentStats).map(([method, count]) => `
          <div class="payment-stat-item">
            <span class="payment-method">${method}</span>
            <span class="payment-count">${count} รายการ</span>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="admin-section">
      <h3>📋 คำสั่งซื้อล่าสุด</h3>
      <div class="recent-orders">
        ${orders.slice(0, 10).map(order => `
          <div class="order-item">
            <div class="order-header">
              <span class="order-id">${order.details.orderId}</span>
              <span class="order-date">${order.time}</span>
              <span class="order-total">฿${order.details.total.toLocaleString()}</span>
            </div>
            <div class="order-customer">
              <span>${order.details.name}</span>
              <span>${order.details.phone}</span>
            </div>
            <div class="order-payment">${order.details.paymentMethod}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  container.innerHTML = html;
}
function filterProducts() {
  const products = document.querySelectorAll('.product-card');
  const searchInput = document.getElementById('search-input');
  const searchText = searchInput ? searchInput.value.toLowerCase() : '';

  let visibleCount = 0;

  products.forEach(product => {
    const productCategory = product.getAttribute('data-category');
    const productDistrict  = product.getAttribute('data-district');
    const productNameEl    = product.querySelector('h3');
     const productName      = productNameEl ? productNameEl.textContent.toLowerCase() : '';

    const matchCategory = (currentCategory === 'ทั้งหมด' || productCategory === currentCategory);
    const matchDistrict = (currentDistrict === 'ทุกอำเภอ' || productDistrict === currentDistrict);
    const matchSearch   = (searchText === '' || productName.includes(searchText));

    if (matchCategory && matchDistrict && matchSearch) {
      product.style.display = '';
      visibleCount++;
    } else {
      product.style.display = 'none';
    }
  });

  // แสดงข้อความถ้าไม่พบสินค้า
  const grid = document.getElementById('product-grid');
  const existingMsg = document.getElementById('no-product-msg');
  if (existingMsg) existingMsg.remove();

  if (visibleCount === 0 && grid) {
    const msg = document.createElement('p');
    msg.id = 'no-product-msg';
    msg.style.cssText = 'color:#7f8c8d;font-size:15px;padding:20px 0;grid-column:1/-1;';
    msg.textContent = '😔 ไม่พบสินค้าที่ตรงกับการค้นหา';
    grid.appendChild(msg);
  }
}

// ========== แผนที่จังหวัดนครนายก ==========
function renderMap() {
  const mapDisplay = document.getElementById('map-display');
  if (!mapDisplay) return;

  if (!mapData || !mapData.image) {
    mapDisplay.innerHTML = '<p style="text-align:center;color:#7f8c8d;padding:40px 20px;">ยังไม่มีภาพแผนที่<br>กรุณากดปุ่มแก้ไขแล้วอัปโหลดรูปภาพ</p>';
    return;
  }

  mapDisplay.innerHTML = `<img src="${mapData.image}" alt="แผนที่จังหวัดนครนายก" style="width:100%;height:auto;border-radius:12px;object-fit:cover;">`;
}

function updateMapEditAccess() {
  const editBtn = document.getElementById('map-edit-btn');
  const editPanel = document.getElementById('map-edit-controls');
  
  if (!editBtn || !editPanel) return;

  if (isAdmin) {
    editBtn.style.display = 'block';
  } else {
    editBtn.style.display = 'none';
    editPanel.style.display = 'none';
    isEditingMap = false;
  }
}

function toggleMapEdit() {
  if (!isAdmin) {
    showToast('❌ เฉพาะแอดมินเท่านั้นที่สามารถแก้ไข');
    return;
  }

  const editPanel = document.getElementById('map-edit-controls');
  if (!editPanel) return;

  isEditingMap = !isEditingMap;
  editPanel.style.display = isEditingMap ? 'block' : 'none';

  if (isEditingMap) {
    const imageInput = document.getElementById('map-image-file');
    const preview = document.getElementById('map-edit-preview');
    if (imageInput) imageInput.value = '';
    if (preview) {
      preview.innerHTML = mapData?.image
        ? `<img src="${mapData.image}" alt="ตัวอย่างรูปแผนที่">`
        : 'ไม่มีรูปตัวอย่าง';
    }
  }
}

function previewMapImage(event) {
  const file = event.target.files[0];
  const preview = document.getElementById('map-edit-preview');
  if (!preview || !file) {
    if (preview) preview.textContent = 'ไม่มีรูปตัวอย่าง';
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    preview.innerHTML = `<img src="${e.target.result}" alt="ตัวอย่างรูปแผนที่">`;
  };
  reader.readAsDataURL(file);
}

function saveMapData() {
  if (!isAdmin) return;

  const fileInput = document.getElementById('map-image-file');
  const file = fileInput?.files?.[0];
  if (!file) {
    showToast('⚠️ กรุณาเลือกไฟล์รูปภาพแผนที่');
    return;
  }
  if (!file.type.startsWith('image/')) {
    showToast('⚠️ ไฟล์ต้องเป็นภาพเท่านั้น');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    mapData = { image: e.target.result };
    localStorage.setItem('mapData', JSON.stringify(mapData));
    showToast('✅ บันทึกรูปแผนที่เรียบร้อยแล้ว');
    toggleMapEdit();
    renderMap();
  };
  reader.readAsDataURL(file);
}

function showDistrictInfo(districtName) {
  const districtData = mapData.find(d => d.name === districtName);
  if (districtData) {
    showToast(`📍 ${districtName}: ${districtData.info || 'ไม่มีข้อมูล'}`);
  }
}

// ========== Toast แจ้งเตือน ==========
function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2800);
}
