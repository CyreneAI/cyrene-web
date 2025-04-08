import Subscription from '@/components/Subscription';
import StarCanvas from '@/components/StarCanvas';

const SubscriptionPage = () => {
  return (
    <><StarCanvas/>
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-white mb-8">Premium Subscription</h1>
        <Subscription />
      </div>
    </div></>
    
  );
};

export default SubscriptionPage;