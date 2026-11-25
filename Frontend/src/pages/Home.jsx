import { useRouter } from '../context/RouterContext';
import Carousel from '../components/home/Carousel';
import CategorySection from '../components/home/CategorySection';
import FeaturedProducts from '../components/home/FeaturedProducts';
import Banner2 from '../assets/Image/banner/banner (2).png';
import TrendingProducts from '../components/home/TrendingProduct';
import MensShoes from '../components/home/MensShoes';
import BannerSlider from '../components/home/CarouselBottom';
import TrustStrip from './TrustStrip';
import PromoTiles from './PromoTiles';
export default function Home() {
    const { navigate } = useRouter(); return (
        <div className="space-y-20 pb-16">
            <Carousel />
            <CategorySection />
            <FeaturedProducts />
             <BannerSlider />
           

            <TrendingProducts />
            <MensShoes />
            <PromoTiles/>
          <TrustStrip/>
        </div>)
        ;
}
