'use client';
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { setCatRegistry, defaultShopCats, slugifyCat } from '@/lib/format';

const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

const CART_KEY = 'wcs_cart_v1';
const COUPON_KEY = 'wcs_coupon_v1';
function loadCoupon() {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(COUPON_KEY) || 'null'); } catch { return null; }
}

// Default storefront copy so the hero renders instantly (before the settings API responds)
const DEFAULT_SETTINGS = {
  brand: 'WebCodeShop',
  accent: 'webcode',
  eb: '12,000+ developers trust us',
  h1: 'Premium <span class="gradient-text">code & scripts</span>, delivered in seconds',
  sub: 'Production-ready PHP & HTML software, modern JS apps, and instant digital gift cards — with license keys delivered automatically and lifetime updates included.',
  cta: 'Browse the store',
};

async function api(path, options) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...(options || {}),
  });
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) {
    const msg = (data && data.error) || (typeof data === 'string' ? data : 'Request failed');
    const e = new Error(msg);
    e.status = res.status;
    throw e;
  }
  return data;
}

function loadCart() {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { return []; }
}

export default function Providers({ children }) {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [user, setUser] = useState(null);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [cart, setCart] = useState([]);
  const [coupon, setCoupon] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState(null);
  const toastRef = useRef(null);

  const isAdmin = user && user.role === 'admin';
  const admin = isAdmin ? user : null;

  const showToast = useCallback((msg, kind) => {
    setToast({ msg, kind: kind || 'default', id: Date.now() });
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(null), 2600);
  }, []);

  // ===== hydrate =====
  useEffect(() => {
    setCart(loadCart());
    setCoupon(loadCoupon());
    let cancelled = false;
    const fetchProducts = async () => {
      for (let i = 0; i < 4; i++) {
        try {
          const r = await api('/api/products');
          if (r && Array.isArray(r.products)) return r.products;
        } catch (e) {}
        await new Promise((res) => setTimeout(res, 350 * (i + 1)));
      }
      return null;
    };
    (async () => {
      try {
        const [s, prods, me] = await Promise.all([
          api('/api/settings').catch(() => ({ settings: {} })),
          fetchProducts(),
          api('/api/auth/me').catch(() => ({ user: null })),
        ]);
        if (cancelled) return;
        setSettings({ ...DEFAULT_SETTINGS, ...(s.settings || {}) });
        if (prods) setProducts(prods);
        setUser(me.user || null);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // After login, fetch orders (+ admin extras)
  useEffect(() => {
    if (!hydrated || !user) { setOrders([]); setCustomers([]); setCoupons([]); setWishlistIds([]); return; }
    (async () => {
      try {
        const o = await api('/api/orders').catch(() => ({ orders: [] }));
        setOrders(o.orders || []);
        const wl = await api('/api/wishlist').catch(() => ({ productIds: [] }));
        setWishlistIds(wl.productIds || []);
        if (user.role === 'admin') {
          const [u, c] = await Promise.all([
            api('/api/users').catch(() => ({ users: [] })),
            api('/api/coupons').catch(() => ({ coupons: [] })),
          ]);
          setCustomers(u.users || []);
          setCoupons(c.coupons || []);
        }
      } catch {}
    })();
  }, [user, hydrated]);

  // persist cart
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch {}
  }, [cart, hydrated]);

  // self-heal: drop cart items whose product no longer exists (e.g. after a reseed)
  useEffect(() => {
    if (!hydrated || !products.length) return;
    setCart((c) => {
      const valid = c.filter((i) => products.some((p) => p.id === i.pid));
      return valid.length === c.length ? c : valid;
    });
  }, [products, hydrated]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.setAttribute('data-accent', settings.accent || 'webcode');
  }, [settings.accent]);

  // ===== cart =====
  const addToCart = (pid, qty = 1) => {
    setCart((c) => {
      const ex = c.find((i) => i.pid === pid);
      return ex ? c.map((i) => (i.pid === pid ? { ...i, qty: i.qty + qty } : i)) : [...c, { pid, qty }];
    });
    showToast('Added to cart', 'success');
  };
  const setQty = (pid, qty) => setCart((c) => c.map((i) => (i.pid === pid ? { ...i, qty: Math.max(1, qty) } : i)));
  const removeFromCart = (pid) => setCart((c) => c.filter((i) => i.pid !== pid));
  const clearCart = () => setCart([]);

  // ===== auth =====
  const login = async (email, password) => {
    try {
      const r = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      setUser(r.user);
      showToast('Welcome back!', 'success');
      return { ok: true };
    } catch (e) { return { ok: false, error: e.message }; }
  };
  const register = async (name, email, password) => {
    try {
      const r = await api('/api/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
      setUser(r.user);
      showToast('Account created', 'success');
      return { ok: true };
    } catch (e) { return { ok: false, error: e.message }; }
  };
  const adminLogin = async (email, password) => {
    try {
      const r = await api('/api/auth/admin-login', { method: 'POST', body: JSON.stringify({ email, password }) });
      setUser(r.user);
      showToast('Admin signed in', 'success');
      return { ok: true };
    } catch (e) { return { ok: false, error: e.message }; }
  };
  const logout = async () => {
    try { await api('/api/auth/logout', { method: 'POST' }); } catch {}
    setUser(null);
    setOrders([]); setCustomers([]); setCoupons([]);
    showToast('Signed out');
  };
  const adminLogout = logout;

  // ===== checkout =====
  const placeOrder = async (couponCode, paymentMethod, txnId) => {
    if (!user) return { ok: false, error: 'Please sign in to checkout' };
    const validItems = cart.filter((c) => products.some((p) => p.id === c.pid));
    if (!validItems.length) return { ok: false, error: 'Cart is empty' };
    try {
      const r = await api('/api/orders', {
        method: 'POST',
        body: JSON.stringify({ items: validItems.map((c) => ({ id: c.pid, qty: c.qty })), couponCode: couponCode || null, paymentMethod: paymentMethod || 'card', txnId: txnId || null }),
      });
      setOrders((o) => [r.order, ...o]);
      setCart([]);
      setCoupon(null);
      try { localStorage.removeItem(COUPON_KEY); } catch {}
      const p = await api('/api/products').catch(() => null);
      if (p) setProducts(p.products);
      showToast(r.order.status === 'pending' ? 'Payment submitted for review' : 'Order placed!', 'success');
      return { ok: true, order: r.order };
    } catch (e) { return { ok: false, error: e.message }; }
  };

  const validateCoupon = async (code, subtotal) => {
    try {
      const r = await api('/api/coupons/validate', { method: 'POST', body: JSON.stringify({ code, subtotal }) });
      return { ok: true, ...r };
    } catch (e) { return { ok: false, error: e.message }; }
  };

  // Shared coupon state so cart + checkout stay in sync.
  const applyCoupon = async (code, subtotal) => {
    const r = await validateCoupon(code, subtotal);
    if (r.ok) {
      const c = { code: r.code, discount: r.discount };
      setCoupon(c);
      try { localStorage.setItem(COUPON_KEY, JSON.stringify(c)); } catch {}
    } else {
      setCoupon(null);
      try { localStorage.removeItem(COUPON_KEY); } catch {}
    }
    return r;
  };
  const removeCoupon = () => {
    setCoupon(null);
    try { localStorage.removeItem(COUPON_KEY); } catch {}
  };

  // Help Center support messages.
  const submitSupport = async (payload) => {
    try { const r = await api('/api/support', { method: 'POST', body: JSON.stringify(payload) }); return { ok: true, ...r }; }
    catch (e) { return { ok: false, error: e.message }; }
  };
  const loadSupportMessages = async () => {
    try { const r = await api('/api/support'); return { ok: true, messages: r.messages || [] }; }
    catch (e) { return { ok: false, error: e.message, messages: [] }; }
  };
  const deleteSupportMessage = async (id) => {
    try { await api('/api/support/' + id, { method: 'DELETE' }); return { ok: true }; }
    catch (e) { return { ok: false, error: e.message }; }
  };

  // ===== admin: products =====
  const saveProduct = async (p) => {
    try {
      const r = p.id
        ? await api('/api/products/' + p.id, { method: 'PUT', body: JSON.stringify(p) })
        : await api('/api/products', { method: 'POST', body: JSON.stringify(p) });
      const list = await api('/api/products');
      setProducts(list.products);
      showToast(p.id ? 'Product updated' : 'Product created', 'success');
      return { ok: true, product: r.product };
    } catch (e) { showToast(e.message, 'error'); return { ok: false, error: e.message }; }
  };
  const deleteProduct = async (id) => {
    try {
      await api('/api/products/' + id, { method: 'DELETE' });
      setProducts((arr) => arr.filter((x) => x.id !== id));
      showToast('Product deleted', 'success');
      return { ok: true };
    } catch (e) { showToast(e.message, 'error'); return { ok: false }; }
  };

  // ===== admin: orders =====
  const setOrderStatus = async (orderId, status) => {
    try {
      const r = await api('/api/orders/' + orderId, { method: 'PATCH', body: JSON.stringify({ status }) });
      setOrders((arr) => arr.map((o) => (o.id === orderId ? r.order : o)));
      showToast(status === 'completed' ? 'Order approved — keys delivered' : 'Order updated', 'success');
      return { ok: true, order: r.order };
    } catch (e) { showToast(e.message, 'error'); return { ok: false }; }
  };
  const sendOrderMessage = async (orderId, message) => {
    try {
      const r = await api('/api/orders/' + orderId, { method: 'PATCH', body: JSON.stringify({ message }) });
      setOrders((arr) => arr.map((o) => (o.id === orderId ? r.order : o)));
      showToast('Message sent to customer', 'success');
      return { ok: true, order: r.order };
    } catch (e) { showToast(e.message, 'error'); return { ok: false }; }
  };
  const addOrderKey = async (orderId, code, name) => {
    try {
      const r = await api('/api/orders/' + orderId, { method: 'PATCH', body: JSON.stringify({ addKey: code, keyName: name }) });
      setOrders((arr) => arr.map((o) => (o.id === orderId ? r.order : o)));
      showToast('Custom key sent to customer', 'success');
      return { ok: true, order: r.order };
    } catch (e) { showToast(e.message, 'error'); return { ok: false }; }
  };
  const deleteOrder = async (orderId) => {
    try {
      await api('/api/orders/' + orderId, { method: 'DELETE' });
      setOrders((arr) => arr.filter((o) => o.id !== orderId));
      showToast('Order deleted', 'success');
      return { ok: true };
    } catch (e) { showToast(e.message, 'error'); return { ok: false }; }
  };

  // ===== admin: coupons =====
  const saveCoupon = async (c) => {
    try {
      const r = c.id
        ? await api('/api/coupons/' + c.id, { method: 'PATCH', body: JSON.stringify(c) })
        : await api('/api/coupons', { method: 'POST', body: JSON.stringify(c) });
      const list = await api('/api/coupons');
      setCoupons(list.coupons);
      showToast(c.id ? 'Coupon updated' : 'Coupon created', 'success');
      return { ok: true, coupon: r.coupon };
    } catch (e) { showToast(e.message, 'error'); return { ok: false, error: e.message }; }
  };
  const toggleCoupon = async (id) => {
    const c = coupons.find((x) => x.id === id);
    if (!c) return;
    return saveCoupon({ id, active: !c.active });
  };
  const deleteCoupon = async (id) => {
    try {
      await api('/api/coupons/' + id, { method: 'DELETE' });
      setCoupons((arr) => arr.filter((x) => x.id !== id));
      showToast('Coupon deleted', 'success');
    } catch (e) { showToast(e.message, 'error'); }
  };

  // ===== admin: customers =====
  const deleteCustomer = async (id) => {
    try {
      await api('/api/users/' + id, { method: 'DELETE' });
      setCustomers((arr) => arr.filter((u) => u.id !== id));
      showToast('Customer deleted', 'success');
    } catch (e) { showToast(e.message, 'error'); }
  };

  // ===== admin: settings =====
  const updateSettings = async (patch) => {
    try {
      const r = await api('/api/settings', { method: 'PUT', body: JSON.stringify(patch) });
      setSettings({ ...DEFAULT_SETTINGS, ...(r.settings || {}) });
      showToast('Settings saved', 'success');
    } catch (e) { showToast(e.message, 'error'); }
  };

  // ===== admin: categories (stored in the settings table as JSON) =====
  const categories = (Array.isArray(settings.categories) && settings.categories.length)
    ? settings.categories
    : defaultShopCats();

  // Keep the format.js registry in sync so catName()/catIcon() resolve custom cats.
  useEffect(() => { setCatRegistry(categories); }, [settings.categories]);

  const saveCategories = async (next) => {
    const r = await api('/api/settings', { method: 'PUT', body: JSON.stringify({ categories: next }) });
    setSettings({ ...DEFAULT_SETTINGS, ...(r.settings || {}) });
    return r;
  };
  const addCategory = async (name, icon, image, sub) => {
    const nm = (name || '').trim();
    if (!nm) { showToast('Category name is required', 'error'); return { ok: false, error: 'Name required' }; }
    const base = slugifyCat(nm);
    let id = base; let i = 2;
    while (categories.some((c) => c.id === id)) { id = base + '-' + i++; }
    const next = [...categories, { id, name: nm, icon: (icon || '����').trim().slice(0, 4) || '📦', image: image || null, sub: (sub || '').trim() }];
    try {
      await saveCategories(next);
      showToast('Category added', 'success');
      return { ok: true, id };
    } catch (e) { showToast(e.message, 'error'); return { ok: false, error: e.message }; }
  };
  const deleteCategory = async (id) => {
    const next = categories.filter((c) => c.id !== id);
    try {
      await saveCategories(next);
      showToast('Category deleted', 'success');
      return { ok: true };
    } catch (e) { showToast(e.message, 'error'); return { ok: false, error: e.message }; }
  };
  const updateCategory = async (id, patch) => {
    const nm = (patch.name || '').trim();
    if (!nm) { showToast('Category name is required', 'error'); return { ok: false, error: 'Name required' }; }
    const next = categories.map((c) => (c.id === id ? { ...c, name: nm, icon: (patch.icon || c.icon || '📦').trim().slice(0, 4) || '📦', image: patch.image === undefined ? c.image : (patch.image || null), sub: patch.sub === undefined ? (c.sub || '') : (patch.sub || '') } : c));
    try {
      await saveCategories(next);
      showToast('Category updated', 'success');
      return { ok: true };
    } catch (e) { showToast(e.message, 'error'); return { ok: false, error: e.message }; }
  };

  // ===== profile =====
  const updateProfile = async (patch) => {
    const r = await api('/api/auth/profile', { method: 'PATCH', body: JSON.stringify(patch) });
    setUser(r.user);
    return r.user;
  };

  // ===== wishlist =====
  const toggleWishlist = async (pid) => {
    if (!user) { showToast('Sign in to save items', 'error'); return { ok: false }; }
    try {
      const r = await api('/api/wishlist', { method: 'POST', body: JSON.stringify({ productId: pid }) });
      setWishlistIds((arr) => r.inWishlist ? Array.from(new Set([...arr, pid])) : arr.filter((x) => x !== pid));
      showToast(r.inWishlist ? 'Saved to wishlist' : 'Removed from wishlist', 'success');
      return r;
    } catch (e) { showToast(e.message, 'error'); return { ok: false, error: e.message }; }
  };
  const inWishlist = (pid) => wishlistIds.includes(pid);

  // ===== reviews =====
  const fetchReviews = async (productId) => {
    try { return await api('/api/reviews?productId=' + encodeURIComponent(productId)); }
    catch { return { reviews: [], average: 0, count: 0 }; }
  };
  const submitReview = async (productId, rating, body) => {
    try {
      await api('/api/reviews', { method: 'POST', body: JSON.stringify({ productId, rating, body }) });
      const p = await api('/api/products').catch(() => null);
      if (p) setProducts(p.products);
      showToast('Review posted', 'success');
      return { ok: true };
    } catch (e) { showToast(e.message, 'error'); return { ok: false, error: e.message }; }
  };

  // ===== analytics =====
  const fetchAnalytics = async () => {
    try { return await api('/api/analytics'); }
    catch { return null; }
  };

  const value = {
    products, orders, coupons, customers, settings, cart, user, admin,
    hydrated, toast, isAdmin,
    addToCart, setQty, removeFromCart, clearCart,
    login, register, logout, adminLogin, adminLogout,
    placeOrder, validateCoupon, coupon, applyCoupon, removeCoupon, submitSupport, loadSupportMessages, deleteSupportMessage,
    saveProduct, deleteProduct,
    setOrderStatus, deleteOrder, sendOrderMessage, addOrderKey,
    saveCoupon, toggleCoupon, deleteCoupon,
    deleteCustomer,
    updateSettings, fetchAnalytics,
    categories, addCategory, deleteCategory, updateCategory,
    updateProfile,
    wishlistIds, toggleWishlist, inWishlist,
    fetchReviews, submitReview,
    showToast,
  };

  return (
    <AppCtx.Provider value={value}>
      {children}
      {toast && <div className={`toast ${toast.kind}`} key={toast.id}>{toast.msg}</div>}
    </AppCtx.Provider>
  );
}
