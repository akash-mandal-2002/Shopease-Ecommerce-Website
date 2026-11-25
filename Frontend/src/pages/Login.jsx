import AuthForm from '../components/auth/AuthForm';
import AuthLayout from '../components/auth/AuthLayout';

// Optional: add a photo for the left panel
// import LoginImage from '../assets/Image/Pages/LoginImage.png';

const perks = [
  'Track your orders in real time',
  'Save items to your wishlist',
  'Faster, secure checkout',
];

export default function Login() {
  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Sign in to continue shopping."
      text="Pick up right where you left off: your bag, wishlist and orders are waiting."
      perks={perks}
      // image={LoginImage}
    >
      <AuthForm mode="login" />
    </AuthLayout>
  );
}