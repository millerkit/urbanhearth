import { useState } from "react";
import { useCartStore } from "../lib/cart-store";

interface Props {
  id: string;
  name: string;
  price: number;
  image?: string;
  available: boolean;
}

export default function AddToCartButton({
  id,
  name,
  price,
  image,
  available,
}: Props) {
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  if (!available) {
    return (
      <button
        className="add-to-cart add-to-cart--unavailable"
        disabled
        aria-label="Out of stock"
      >
        Out of Stock
      </button>
    );
  }

  function handleAdd() {
    addItem({ id, name, price, image });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <button
      className={`add-to-cart${added ? " add-to-cart--added" : ""}`}
      onClick={handleAdd}
      aria-label={added ? "Added to cart" : "Add to cart"}
    >
      {added ? "Added to Cart" : "Add to Cart"}
    </button>
  );
}
