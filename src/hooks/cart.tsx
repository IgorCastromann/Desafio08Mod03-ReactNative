import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';
import { ProductQuantity } from 'src/pages/Cart/styles';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const getStoragedProducts = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (getStoragedProducts) {
        setProducts([...JSON.parse(getStoragedProducts)]);
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const productExists = products.find((p: Product) => p.id === product.id);

      if (productExists) {
        setProducts(
          products.map(item =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          ),
        );
      } else {
        setProducts([...products, { ...product, quantity: 1 }]);
      }

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const productsIncremented = products.map(prod =>
        prod.id === id ? { ...prod, quantity: prod.quantity + 1 } : prod,
      );

      setProducts([...productsIncremented]);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(productsIncremented),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productsDecremented = products.map(prod => {
        if (prod.quantity > 0 && prod.id === id) {
          return { ...prod, quantity: prod.quantity - 1 };
        } else {
          return prod;
        }
      });

      setProducts([...productsDecremented]);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(productsDecremented),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
