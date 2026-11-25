import { lazy, Suspense } from "react";
import Loader from "./components/common/Loader";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import { RouterProvider, useRouter } from "./context/RouterContext";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import Home from "./pages/Home";
const Shop = lazy(() => import("./pages/Shop"));
const Category = lazy(() => import("./pages/Category"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const Cart = lazy(() => import("./pages/Cart"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Account = lazy(() => import("./pages/Account"));
const Orders = lazy(() => import("./pages/Orders"));
const Admin = lazy(() => import("./pages/Admin"));
const Support = lazy(() => import("./pages/Support"));
import { EmptyState } from "./components/common/States";
import Button from "./components/common/Button";

function RouteView() {
  const { pathname, navigate } = useRouter();
  let content;
  if (pathname === "/") content = <Home />;
  else if (pathname === "/shop") content = <Shop />;
  else if (pathname.startsWith("/category/")) {
    const [group, sub] = pathname.split("/").filter(Boolean).slice(1);
    content = <Category group={group} sub={sub} />;
  } else if (pathname.startsWith("/product/"))
    content = <ProductDetails id={pathname.split("/")[2]} />;
  else if (pathname === "/cart") content = <Cart />;
  else if (pathname === "/wishlist") content = <Wishlist />;
  else if (pathname === "/checkout") content = <Checkout />;
  else if (pathname === "/login") content = <Login />;
  else if (pathname === "/register") content = <Register />;
  else if (pathname === "/account") content = <Account />;
  else if (pathname === "/orders") content = <Orders />;
  else if (pathname === "/admin") content = <Admin />;
  else if (pathname === "/support") content = <Support />;
  else
    content = (
      <main className="mx-auto max-w-2xl px-4 py-20">
        <EmptyState
          title="Page not found"
          message="The page you requested does not exist."
        />
        <div className="mt-5 text-center">
          <Button onClick={() => navigate("/")}>Back home</Button>
        </div>
      </main>
    );
  return (
    <>
      <Header />
      <div className="min-h-[calc(100vh-76px)]">
        <Suspense fallback={<Loader label="Loading..." />}>{content}</Suspense>
      </div>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <RouterProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <RouteView />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </RouterProvider>
  );
}
