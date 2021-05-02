import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

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

  async function findProduct(id: string) {
    const productExist = products.find(p => p.id === id);
    return productExist;
  }

  async function deleteProduct(product: Product) {

    const productIndex = products.findIndex(p => p.id === product.id);
    products.splice(productIndex,1);
    setProducts(products);
  }

  async function setAllProducts(products: Product[])
  {
    setProducts(products);
    await AsyncStorage.setItem('@GoMarket:products',JSON.stringify(products),);
  }


  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storageProduct = await AsyncStorage.getItem('@GoMarket:products');

      if (storageProduct)
        setProducts([... JSON.parse(storageProduct)]);

    }

    loadProducts();
  }, []);



  const addToCart = useCallback(async product => {

    const productExist = await findProduct(product.id);

    if (productExist)
      setProducts(products.map(p => p.id === product.id ? { ... product, quantity: p.quantity + 1} : p));
    else
      setProducts([ ... products, { ... product, quantity: 1}]);

    await AsyncStorage.setItem('@GoMarket:products',JSON.stringify(products),);

  }, [products]);

  const increment = useCallback(async id => {

    const newProducts = products.map( product => product.id === id ? {... product, quantity: product.quantity + 1} : product);
    await setAllProducts(newProducts);

  }, [products]);

  const decrement = useCallback(async id => {

    const productSelected = await findProduct(id);

    if (productSelected?.quantity === 1)
      await deleteProduct(productSelected);

    const newProducts = products.map( product => product.id === id ? {... product, quantity: product.quantity - 1} : product);

    setProducts(newProducts);

    await AsyncStorage.setItem('@GoMarket:products',JSON.stringify(newProducts),);

  }, [products]);

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
