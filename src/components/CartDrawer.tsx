import { useEffect } from "react";
import { useCartStore, selectSubtotal } from "../lib/cart-store";

export default function CartDrawer() {
  const items = useCartStore((s) => s.items);
  const isOpen = useCartStore((s) => s.isOpen);
  const closeCart = useCartStore((s) => s.closeCart);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const subtotal = useCartStore(selectSubtotal);

  // Lock body scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) closeCart();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, closeCart]);

  return (
    <>
      <div
        className={`cart-overlay${isOpen ? " cart-overlay--visible" : ""}`}
        onClick={closeCart}
        aria-hidden="true"
      />

      <div
        className={`cart-drawer${isOpen ? " cart-drawer--open" : ""}`}
        role="dialog"
        aria-label="Shopping cart"
        aria-modal="true"
      >
        <div className="cart-drawer__header">
          <h2 className="cart-drawer__title">Your Order</h2>
          <button
            onClick={closeCart}
            className="cart-drawer__close"
            aria-label="Close cart"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2 2l12 12M14 2L2 14"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="cart-empty">
            <p className="cart-empty__text">Your cart is empty.</p>
            <a
              href="/products"
              className="cart-empty__link"
              onClick={closeCart}
            >
              Browse the shop
            </a>
          </div>
        ) : (
          <>
            <ul className="cart-drawer__items">
              {items.map((item) => (
                <li key={item.id} className="cart-item">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="cart-item__image"
                    />
                  ) : (
                    <div
                      className="cart-item__image-placeholder"
                      aria-hidden="true"
                    />
                  )}
                  <div className="cart-item__info">
                    <span className="cart-item__name">{item.name}</span>
                    <span className="cart-item__price">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                    <div className="cart-item__controls">
                      <button
                        className="cart-item__qty-btn"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        aria-label={`Decrease quantity of ${item.name}`}
                      >
                        −
                      </button>
                      <span className="cart-item__qty">{item.quantity}</span>
                      <button
                        className="cart-item__qty-btn"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        aria-label={`Increase quantity of ${item.name}`}
                      >
                        +
                      </button>
                      <button
                        className="cart-item__remove"
                        onClick={() => removeItem(item.id)}
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="cart-drawer__footer">
              <div className="cart-subtotal">
                <span className="cart-subtotal__label">Subtotal</span>
                <span className="cart-subtotal__amount">
                  ${subtotal.toFixed(2)}
                </span>
              </div>
              <button className="cart-checkout-btn" disabled>
                Checkout — Coming Soon
              </button>
              <p className="cart-pickup-note">
                Available for in-restaurant pickup only.
              </p>
            </div>
          </>
        )}
      </div>
    </>
  );
}
