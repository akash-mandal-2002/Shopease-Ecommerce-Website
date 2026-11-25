import Carousel from '../components/home/Carousel';
import CategorySection from '../components/home/CategorySection';
import FeaturedProducts from '../components/home/FeaturedProducts';
import TrendingProducts from '../components/home/TrendingProduct';
import MensShoes from '../components/home/MensShoes';
import BannerSlider from '../components/home/CarouselBottom';
import TrustStrip from './TrustStrip';
import PromoTiles from './PromoTiles';
export default function Home() {
    return (
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
