import { useCartStore, selectItemCount } from "../lib/cart-store";

export default function CartButton() {
  const itemCount = useCartStore(selectItemCount);
  const openCart = useCartStore((s) => s.openCart);

  return (
    <button
      onClick={openCart}
      aria-label={
        itemCount > 0
          ? `Open cart, ${itemCount} item${itemCount !== 1 ? "s" : ""}`
          : "Open cart"
      }
      className="cart-btn"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M15.75 10.5V6a3.75 3.75 0 0 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {itemCount > 0 && (
        <span className="cart-btn__count" aria-hidden="true">
          {itemCount > 9 ? "9+" : itemCount}
        </span>
      )}
    </button>
  );
}
