const CART_STORAGE_KEY = 'fiddle-shop-cart';
const cart = [];
const orderIds = new Set();
const cartList = document.querySelector('.cart-list');
const cartTotal = document.querySelector('.cart-total');
const cartItemsCount = document.querySelector('.cart-items-count');
const checkoutButton = document.querySelector('.btn-checkout');
const continueButton = document.querySelector('.continue-shopping');
const cartToggles = document.querySelectorAll('.cart-toggle');
const cartWidget = document.querySelector('.cart-float');
const cartEmpty = document.querySelector('.cart-empty');
const cartCount = document.querySelectorAll('.cart-count');
const modalOverlay = document.querySelector('.modal-overlay');
const modalTitle = document.querySelector('.modal-title');
const productForm = document.querySelector('.product-form');
const productTypeInput = document.querySelector('#product-type');
const dynamicFields = document.querySelector('.dynamic-fields');
const closeModalButton = document.querySelector('.close-modal');
const preloader = document.querySelector('.preloader');

let activeProduct = null;

const formatPrice = (value) => {
  const formatted = value.toLocaleString('fa-IR');
  return `${formatted} تومان`;
};

const saveCart = () => {
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.warn('ذخیره سبد خرید امکان‌پذیر نیست.', error);
  }
};

const loadCart = () => {
  try {
    const saved = window.localStorage.getItem(CART_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        cart.splice(0, cart.length, ...parsed);
      }
    }
  } catch (error) {
    console.warn('بارگذاری سبد خرید امکان‌پذیر نیست.', error);
  }
};

const updateCartCount = () => {
  const count = cart.length;
  cartCount.forEach((badge) => {
    badge.textContent = count.toString();
  });
  if (cartItemsCount) {
    cartItemsCount.textContent = `تعداد آیتم‌ها: ${count}`;
  }
};

const generateOrderId = () => {
  let id;
  do {
    id = `F-${Math.floor(100000 + Math.random() * 900000)}`;
  } while (orderIds.has(id));
  orderIds.add(id);
  return id;
};

// ===== پیام موفقیت =====
function showSuccessToast(message) {
  const oldToast = document.querySelector('.success-toast');
  if (oldToast) oldToast.remove();
  
  const toast = document.createElement('div');
  toast.className = 'success-toast';
  toast.innerHTML = `<span class="icon">✅</span><span>${message}</span>`;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 100);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 600);
  }, 3000);
}

// ===== رندر سبد خرید =====
const renderCart = () => {
  if (!cartList || !cartTotal || !checkoutButton || !cartEmpty) return;

  cartList.innerHTML = '';

  if (cart.length === 0) {
    cartEmpty.style.display = 'block';
    cartList.style.display = 'none';
    cartTotal.textContent = 'مجموع: ۰ تومان';
    checkoutButton.disabled = true;
    updateCartCount();
    return;
  }

  cartEmpty.style.display = 'none';
  cartList.style.display = 'block';

  let total = 0;

  cart.forEach((item) => {
    total += item.price;
    const itemElement = document.createElement('li');
    itemElement.className = 'cart-item';
    itemElement.innerHTML = `
      <div>
        <strong>${item.name}</strong>
        <span>${formatPrice(item.price)}</span>
        <p class="cart-item-details">${item.details}</p>
      </div>
      <button type="button" class="btn-primary remove-item">حذف</button>
    `;

    itemElement.querySelector('.remove-item')?.addEventListener('click', () => {
      const index = cart.findIndex((cartItem) => cartItem.id === item.id);
      if (index !== -1) {
        itemElement.classList.add('removing');
        setTimeout(() => {
          cart.splice(index, 1);
          renderCart();
          const cartCounts = document.querySelectorAll('.cart-count');
          cartCounts.forEach(el => {
            el.classList.remove('bump');
            setTimeout(() => el.classList.add('bump'), 10);
          });
        }, 400);
      }
    });

    cartList.appendChild(itemElement);
  });

  cartTotal.textContent = `مجموع: ${formatPrice(total)}`;
  checkoutButton.disabled = false;
  updateCartCount();
  saveCart();
};

// ===== باز و بستن سبد =====
const openCartPanel = () => {
  if (!cartWidget) return;
  cartWidget.classList.add('open');
  cartToggles.forEach((toggle) => toggle.setAttribute('aria-expanded', 'true'));
};

const closeCartPanel = () => {
  if (!cartWidget) return;
  cartWidget.classList.remove('open');
  cartToggles.forEach((toggle) => toggle.setAttribute('aria-expanded', 'false'));
};

// ===== مودال =====
const showModal = () => {
  if (!modalOverlay) return;
  modalOverlay.classList.remove('hidden', 'closing');
  void modalOverlay.offsetWidth;
  modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
};

const hideModal = () => {
  if (!modalOverlay) return;
  modalOverlay.classList.add('closing');
  setTimeout(() => {
    modalOverlay.classList.remove('open', 'closing');
    modalOverlay.classList.add('hidden');
    document.body.style.overflow = '';
  }, 500);
  productForm?.reset();
  dynamicFields.innerHTML = '';
  activeProduct = null;
};

// ===== فیلدهای داینامیک =====
const createFieldsForProduct = (type) => {
  switch (type) {
    case 'profile':
      return `
        <div class="form-group">
          <label for="theme-color">تم رنگی پروفایل</label>
          <input id="theme-color" name="themeColor" type="text" placeholder="مثلاً نارنجی، بنفش، متالیک" required>
        </div>
        <div class="form-group">
          <label for="profile-skin-upload">آپلود اسکین</label>
          <input id="profile-skin-upload" name="skinUpload" type="file" accept="image/*,.png" required>
        </div>
      `;
    case 'thumbnail':
      return `
        <div class="form-group">
          <label for="thumbnail-title">عنوان تامنیل</label>
          <input id="thumbnail-title" name="thumbnailTitle" type="text" placeholder="مثلاً ورود به دنیای ماینکرافت" required>
        </div>
        <div class="form-group">
          <label for="thumbnail-skin-upload">آپلود اسکین</label>
          <input id="thumbnail-skin-upload" name="skinUpload" type="file" accept="image/*,.png" required>
        </div>
        <div class="form-group">
          <label for="resource-pack-upload">آپلود ریسورس پک (اختیاری)</label>
          <input id="resource-pack-upload" name="resourcePack" type="file" accept=".zip,.rar,.mcpack,.mcaddon">
        </div>
      `;
    case 'skin':
      return `
        <div class="form-group">
          <label for="skin-upload">آپلود اسکین</label>
          <input id="skin-upload" name="skinUpload" type="file" accept="image/*,.png" required>
        </div>
      `;
    default:
      return '';
  }
};

// ===== باز کردن فرم محصول =====
const openProductForm = (product) => {
  activeProduct = product;
  if (!productTypeInput || !modalTitle || !dynamicFields) return;

  productTypeInput.value = product.name;
  modalTitle.textContent = `فرم سفارش ${product.name}`;
  dynamicFields.innerHTML = createFieldsForProduct(product.type);
  showModal();
};

// ===== افزودن به سبد =====
const addCartItem = ({ name, price, type, details }) => {
  cart.push({
    id: Date.now() + Math.random(),
    name,
    price,
    type,
    details,
  });
  
  renderCart();
  openCartPanel();
  
  const cartCounts = document.querySelectorAll('.cart-count');
  cartCounts.forEach(el => {
    el.classList.remove('bump');
    setTimeout(() => el.classList.add('bump'), 10);
  });
  
  showSuccessToast(`✅ "${name}" به سبد خرید اضافه شد!`);
};

// ===== دکمه‌های افزودن به سبد =====
document.querySelectorAll('.add-to-cart').forEach(btn => {
  btn.addEventListener('click', function(e) {
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size/2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size/2) + 'px';
    this.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);

    this.classList.add('added');
    setTimeout(() => this.classList.remove('added'), 800);

    const card = this.closest('.product-card');
    if (!card) return;
    const type = card.getAttribute('data-type') || 'profile';
    const name = card.getAttribute('data-name') || 'محصول';
    const price = Number(card.getAttribute('data-price') || 0);
    openProductForm({ type, name, price });
  });
});

// ===== رویدادهای مودال =====
cartToggles.forEach((toggle) => {
  toggle.addEventListener('click', () => {
    if (!cartWidget) return;
    const isOpen = cartWidget.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });
});

if (modalOverlay) {
  modalOverlay.addEventListener('click', (event) => {
    if (event.target === modalOverlay) {
      hideModal();
    }
  });
}

closeModalButton?.addEventListener('click', hideModal);

// ===== ارسال فرم =====
productForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!activeProduct) return;

  const formData = new FormData(productForm);
  const extraNotes = formData.get('extraNotes') || '';
  const userId = formData.get('userId') || '';
  const details = [];

  if (activeProduct.type === 'profile') {
    details.push(`تم رنگی: ${formData.get('themeColor') || 'بدون انتخاب'}`);
    const skinFile = formData.get('skinUpload');
    if (skinFile && skinFile.name) details.push(`اسکین: ${skinFile.name}`);
  }

  if (activeProduct.type === 'thumbnail') {
    details.push(`عنوان: ${formData.get('thumbnailTitle') || 'بدون عنوان'}`);
    const skinFile = formData.get('skinUpload');
    if (skinFile && skinFile.name) details.push(`اسکین: ${skinFile.name}`);
    const resourceFile = formData.get('resourcePack');
    if (resourceFile && resourceFile.name) details.push(`ریسورس پک: ${resourceFile.name}`);
  }

  if (activeProduct.type === 'skin') {
    const skinFile = formData.get('skinUpload');
    if (skinFile && skinFile.name) details.push(`اسکین: ${skinFile.name}`);
  }

  if (extraNotes) details.push(`توضیحات: ${extraNotes}`);
  details.push(`آیدی: ${userId}`);

  addCartItem({
    name: activeProduct.name,
    price: activeProduct.price,
    type: activeProduct.type,
    details: details.join(' • '),
  });
  hideModal();
});

continueButton?.addEventListener('click', () => {
  closeCartPanel();
});

// ===== پریلودر =====
window.addEventListener('load', () => {
  if (!preloader) return;
  setTimeout(() => {
    document.body.classList.add('page-ready');
    preloader.classList.add('hidden');
    setTimeout(() => preloader.remove(), 500);
  }, 2000);
});

// ===== تسویه حساب =====
checkoutButton?.addEventListener('click', () => {
  if (cart.length === 0) return;
  const orderId = generateOrderId();
  
  try {
    const orders = JSON.parse(localStorage.getItem('fiddle-orders') || '[]');
    const user = JSON.parse(localStorage.getItem('fiddle-current-user') || 'null');
    orders.push({
      id: orderId,
      product: cart.map(item => item.name).join(' + '),
      total: cart.reduce((sum, item) => sum + item.price, 0),
      status: 'pending',
      date: new Date().toLocaleDateString('fa-IR'),
      username: user?.username || 'کاربر مهمان',
      items: cart.map(item => ({ name: item.name, price: item.price }))
    });
    localStorage.setItem('fiddle-orders', JSON.stringify(orders));
  } catch (e) {
    console.warn('ذخیره سفارش امکان‌پذیر نیست:', e);
  }
  
  showSuccessToast(`🎉 سفارش شما با شماره ${orderId} ثبت شد!`);
  cart.length = 0;
  renderCart();
  closeCartPanel();
});

loadCart();
renderCart();

console.log('🔥 Fiddle Shop با موفقیت بارگذاری شد!');
console.log('🔑 رمز ادمین: 29thd03kasra');