(function (root) {
  'use strict';
  const DAY = 86400000;
  const names = {denago: 'the denago', club4: 'club car four-seater', club2: 'club car two-seater'};
  function validDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value || '') &&
      Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  }
  function parseOffer(search) {
    const p = new URLSearchParams(search);
    const coupon = p.get('coupon'), from = p.get('from'), to = p.get('to'), cart = p.get('cart');
    if (!coupon || !/^[A-Za-z0-9-]{6,64}$/.test(coupon) || !names[cart] ||
        !validDate(from) || !validDate(to) || to <= from) return null;
    const total = p.get('total');
    if (total !== null && (!/^\d{1,8}(\.\d{1,2})?$/.test(total) || Number(total) <= 0)) return null;
    return {coupon, from, to, cart, days: (Date.parse(to) - Date.parse(from)) / DAY,
      total: total === null ? null : Number(total)};
  }
  function offerState(offer, period, cart) {
    if (!period || !cart) return 'loading';
    if (period.from.iso !== offer.from || period.to.iso !== offer.to ||
        period.to.at - period.from.at !== offer.days * DAY) return 'mismatch';
    const items = cart.items || [];
    if (!items.length) return 'waiting';
    if (items.length !== 1 || Number(items[0].quantity) !== 1 ||
        String(items[0].item_name).trim().toLowerCase() !== names[offer.cart]) return 'mismatch';
    if (cart.coupon && cart.coupon !== offer.coupon) return 'conflict';
    if (cart.coupon === offer.coupon && Number(cart.couponDiscount) > 0) {
      if (offer.total && Math.abs(Number(cart.grandTotalWithTax) - offer.total) > 0.005) return 'price-mismatch';
      if (offer.total && !Number.isFinite(Number(cart.grandTotalWithTax))) return 'price-mismatch';
      return 'applied';
    }
    return 'ready';
  }
  function parsePeriodTexts(texts) {
    if (texts.length !== 2) return null;
    const values = texts.map(text => {
      const m = text.match(/(\d{4}-\d{2}-\d{2})\s+(\d{1,2}):(\d{2})\s*([AP]M)?/i);
      if (!m || !validDate(m[1])) return null;
      let h = Number(m[2]);
      if (m[4]) h = h % 12 + (/p/i.test(m[4]) ? 12 : 0);
      if (h > 23 || Number(m[3]) > 59) return null;
      return {iso: m[1], at: Date.parse(m[1]) + (h * 60 + Number(m[3])) * 60000};
    });
    return values.every(Boolean) ? {from: values[0], to: values[1]} : null;
  }
  function init(context) {
    const offer = parseOffer(root.location.search);
    if (!offer) {
      if (root.location.search.includes('coupon=') && /^\/checkouts\//.test(root.location.pathname)) {
        const error = document.createElement('p'); error.id = 'private-offer-status'; error.setAttribute('role','alert');
        error.textContent = 'This offer link is incomplete. Ask Chris for a new link before paying. / Este enlace está incompleto. Pide a Chris un nuevo enlace antes de pagar.';
        document.body.prepend(error);
      }
      return;
    }
    const es = document.documentElement.lang.startsWith('es');
    const copy = es ? {
      loading: 'Preparando tu oferta privada…',
      waiting: 'Tu oferta privada: elige el carrito indicado para aplicar el descuento en tu cesta.',
      applying: 'Aplicando tu descuento…',
      applied: 'Tu descuento está aplicado. Revisa el total en tu cesta y continúa para reservar.',
      mismatch: 'Esta oferta es para el carrito y las fechas del enlace. Revisa las fechas y deja solo ese carrito en tu cesta.',
      conflict: 'Tu cesta ya tiene otro descuento. Retíralo de la cesta para usar esta oferta.',
      'price-mismatch': 'El total no coincide con tu oferta. Contacta a Chris por WhatsApp antes de pagar.',
      failed: 'No pudimos aplicar esta oferta. No continúes al precio normal: inténtalo otra vez o escríbenos por WhatsApp.',
      retry: 'Reintentar', help: 'Ayuda por WhatsApp'
    } : {
      loading: 'Preparing your private offer…',
      waiting: 'Your private offer: choose the specified cart below to apply the discount in your basket.',
      applying: 'Applying your discount…',
      applied: 'Your discount is applied. Review your basket total, then continue to book.',
      mismatch: 'This offer is for the cart and dates in your link. Check the dates and keep only that cart in your basket.',
      conflict: 'Your basket already has another discount. Remove it in the basket to use this offer.',
      'price-mismatch': 'The total does not match your offer. Please WhatsApp Chris before paying.',
      failed: 'We couldn’t apply this offer. Please don’t continue at the standard price: try again or ask us on WhatsApp.',
      retry: 'Try again', help: 'Help on WhatsApp'
    };
    const checkout = /^\/checkouts\//.test(root.location.pathname);
    const visible = selector => [...document.querySelectorAll(selector)].filter(e => e.getClientRects().length);
    const first = selector => visible(selector)[0];
    const host = checkout ? document.querySelector('.checkout-cart__price-breakdown') || document.querySelector('main') || document.body : document.querySelector('#booq-dates');
    if (!host) return;
    const note = document.createElement('div');
    note.id = 'private-offer-status';
    note.style.cssText = 'margin:1rem 0;padding:1rem;border:1px solid #C9A24B;border-radius:12px;color:' + (checkout ? '#28251f;background:#fff8e8' : 'inherit;background:#16140d') + ';line-height:1.5';
    const words = document.createElement('p');
    words.setAttribute('role', 'status');
    words.style.margin = '0';
    if (offer.total) {
      const price = document.createElement('p'); price.style.cssText = 'font-weight:700;margin:0 0 .5rem';
      price.textContent = (es ? 'Tu oferta: ' : 'Your private offer: ') +
        new Intl.NumberFormat(es ? 'es-MX' : 'en-US', {style:'currency',currency:'MXN',currencyDisplay:'code'}).format(offer.total) +
        ' (≈ US$' + (offer.total / 17.978).toLocaleString('en-US',{maximumFractionDigits:2}) + ')';
      note.append(price);
    }
    const retry = document.createElement('button');
    retry.type = 'button'; retry.textContent = copy.retry; retry.hidden = true;
    retry.style.cssText = 'margin-top:.75rem;margin-right:1rem';
    const help = document.createElement('a');
    help.href = 'https://wa.me/525538955620?text=' + encodeURIComponent(es ? 'Hola Chris, necesito ayuda con mi oferta privada.' : 'Hi Chris, I need help with my private booking offer.');
    help.textContent = copy.help; help.hidden = true;
    note.append(words, retry, help); host.append(note);
    let submitting = false, attempted = false, failed = false, began = 0;
    function checkoutCart() {
      const items = visible('.checkout-cart-line__product-title').map(e => {
        const m = e.textContent.trim().match(/^(\d+)x\s+(.+)$/);
        return m ? {quantity: Number(m[1]), item_name: m[2]} : {quantity: 0, item_name: ''};
      });
      const amount = first('[data-tid="coupon_discount"]');
      const total = first('[data-tid="total"]');
      return {items, coupon: first('[data-tid="coupon_code"]')?.textContent.trim(),
        grandTotalWithTax: total ? Number(total.textContent.replace(/[^\d.]/g,'')) : NaN,
        couponDiscount: amount ? Math.abs(Number(amount.textContent.replace(/[^\d.]/g, ''))) : 0};
    }
    const current = () => checkout
      ? offerState(offer, parsePeriodTexts(visible('.summary-period__date').map(e => e.textContent)), checkoutCart())
      : offerState(offer, context.getPeriod(), (root.Booqable || {}).cartData);
    const show = key => {
      if (words.textContent !== copy[key]) words.textContent = copy[key];
      retry.hidden = key !== 'failed';
      help.hidden = !['failed', 'mismatch', 'conflict', 'price-mismatch'].includes(key);
      note.dataset.state = key;
    };
    async function apply() {
      if (submitting || failed) return;
      if (attempted) return;
      submitting = true; began = Date.now(); show('applying');
      const deadline = Date.now() + 10000;
      try {
        let input;
        const reveal = first('.checkout-cart__coupon-action');
        if (reveal) reveal.click();
        while (!(input = first('.checkout-cart__coupon-input-field'))) {
          if (Date.now() > deadline || current() !== 'ready') throw new Error('Offer form unavailable');
          await new Promise(resolve => setTimeout(resolve, 150));
        }
        if (current() !== 'ready') throw new Error('Basket changed');
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        setter.call(input, offer.coupon);
        input.dispatchEvent(new Event('input', {bubbles: true}));
        input.dispatchEvent(new Event('change', {bubbles: true}));
        let button;
        do {
          await new Promise(resolve => setTimeout(resolve, 100));
          button = first('.checkout-cart__coupon-button');
          if (Date.now() > deadline) throw new Error('Offer form unavailable');
        } while (!button || button.disabled);
        if (current() !== 'ready') throw new Error('Basket changed');
        attempted = true;
        button.click();
      } catch (error) {
        failed = true; show('failed');
      } finally { submitting = false; }
    }
    function tick() {
      const state = current();
      root.sablesPrivateOfferPending = checkout && state !== 'applied';
      if (state === 'applied') { failed = false; show('applied'); return; }
      if (state !== 'ready') { show(state); return; }
      if (!checkout) {
        words.textContent = es ? 'Tu oferta privada está vinculada. Continúa para ver el descuento antes de pagar.' : 'Your private offer is linked. Continue to see your discount before payment.';
        note.dataset.state = 'linked'; return;
      }
      if (failed) { show('failed'); return; }
      if (!submitting && attempted && Date.now() - began > 15000) { failed = true; show('failed'); return; }
      show('applying'); apply();
    }
    retry.addEventListener('click', () => { attempted = false; failed = false; tick(); });
    if (checkout) {
      document.addEventListener('submit', event => {
        if (!event.target.querySelector('#checkout-form-submit-button') || current() === 'applied') return;
        event.preventDefault(); event.stopImmediatePropagation(); tick(); note.scrollIntoView({block:'center'});
      }, true);
    }
    tick(); root.setInterval(tick, 500);
  }
  const api = {parseOffer, offerState, parsePeriodTexts, init};
  if (typeof module === 'object' && module.exports) module.exports = api;
  else {
    root.SablesPrivateOffer = api;
    const start = () => {
      if (/^\/checkouts\//.test(root.location.pathname)) init({});
      else if (root.sablesPrivateOfferContext) init(root.sablesPrivateOfferContext);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
  }
})(typeof window === 'object' ? window : globalThis);
