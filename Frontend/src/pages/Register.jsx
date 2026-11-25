import AuthForm from '../components/auth/AuthForm';
import AuthLayout from '../components/auth/AuthLayout';

// Optional: add a photo for the left panel
// import RegisterImage from '../assets/Image/Pages/RegisterImage.png';

const perks = [
  'Save your wishlist across devices',
  'Checkout faster every time',
  'Track every order in one place',
];

export default function Register() {
  return (
    <AuthLayout
      eyebrow="New to ShopEase?"
      title="Create your account in a minute."
      text="Join to save your favourites, check out faster and follow every order."
      perks={perks}
      // image={RegisterImage}
    >
      <AuthForm mode="register" />
    </AuthLayout>
  );
}