/*
 * ============================================================
 * LLEMS Home
 * ------------------------------------------------------------
 * Dependency-free progressive enhancement for the LLEMS
 * homepage components.
 *
 * PORTABILITY NOTE:
 * No reliance on Dawn globals or jQuery. This script:
 *   - lazy-reveals product cards on scroll,
 *   - handles AJAX add-to-cart for single-variant products,
 *   - dispatches custom events so a host theme can react to
 *     cart updates without being coupled to this component.
 *
 * Works with:
 *   <llems-home> and <llems-product-listing> custom elements.
 * ============================================================
 */

(function () {
  'use strict';

  const ADDED_MESSAGE = 'Added';
  const ERROR_MESSAGE = 'Error';

  /**
   * Shared behaviour used by both LLEMS section variants.
   */
  class LlemsSectionBase extends HTMLElement {
    connectedCallback() {
      this.revealCards();
      this.bindCartForms();
    }

    disconnectedCallback() {
      if (this.observer) this.observer.disconnect();
    }

    /** Reveal product cards as they enter the viewport. */
    revealCards() {
      this.cards = Array.from(this.querySelectorAll('.llems-card'));
      if (!this.cards.length) return;

      // Respect users who prefer reduced motion.
      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;

      if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        this.revealAll();
        return;
      }

      this.observer = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('llems-card--visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { rootMargin: '0px 0px -10% 0px' }
      );

      this.cards.forEach((card) => {
        card.classList.add('llems-card--reveal');
        this.observer.observe(card);
      });
    }

    /** Fallback: show every card immediately. */
    revealAll() {
      this.cards.forEach((card) => card.classList.add('llems-card--visible'));
    }

    /** Attach AJAX submit handlers to every add-to-cart form in this section. */
    bindCartForms() {
      this.cartForms = Array.from(
        this.querySelectorAll('form[data-type="add-to-cart-form"]')
      );

      this.cartForms.forEach((form) => {
        form.addEventListener('submit', (event) => this.handleCartSubmit(event, form));
      });
    }

    /**
     * POST the form to Shopify's cart add endpoint and provide
     * lightweight feedback on the button.
     */
    async handleCartSubmit(event, form) {
      event.preventDefault();

      const button = form.querySelector('button[type="submit"]');
      const originalLabel = button ? button.textContent : '';

      if (button) button.disabled = true;

      try {
        const response = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data?.description || 'Add to cart failed');
        }

        if (button) button.textContent = ADDED_MESSAGE;

        // Notify the host theme that the cart changed, without knowing
        // anything about the host's cart implementation.
        document.dispatchEvent(
          new CustomEvent('llems:cart:added', {
            bubbles: true,
            detail: { source: form },
          })
        );
      } catch (err) {
        if (button) button.textContent = ERROR_MESSAGE;
        // eslint-disable-next-line no-console
        console.error('[LLEMS] Add to cart failed:', err);
      } finally {
        setTimeout(() => {
          if (button) {
            button.disabled = false;
            button.textContent = originalLabel;
          }
        }, 1500);
      }
    }
  }

  /** Homepage section custom element. */
  class LlemsHome extends LlemsSectionBase {}

  /** Standalone product listing section custom element. */
  class LlemsProductListing extends LlemsSectionBase {}

  if (!customElements.get('llems-home')) {
    customElements.define('llems-home', LlemsHome);
  }

  if (!customElements.get('llems-product-listing')) {
    customElements.define('llems-product-listing', LlemsProductListing);
  }
})();
