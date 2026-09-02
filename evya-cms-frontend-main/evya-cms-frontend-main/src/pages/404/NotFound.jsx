import React from 'react';
import { Button } from "@/components/ui/button";
import { LightningBoltIcon, HomeIcon } from "@radix-ui/react-icons";
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4" 
         style={{
           background: 'linear-gradient(to right, #3877BB, #00A5CD, #3FBFB0, #5BBF8D, #89C860)'
         }}>
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-white">4<LightningBoltIcon className="inline-block w-16 h-16 text-yellow-400 animate-pulse" />4</h1>
          <h2 className="text-3xl font-semibold text-white">Oops! Page Not Found</h2>
          <p className="text-xl text-gray-100">There was an error loading this page. Please verify that you are using a correct URL or contact one of the admins if the issue persists.</p>
        </div>
        
        {/* <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-2 bg-white text-sm text-gray-500">Don't worry, we're on it!</span>
          </div>
        </div> */}
        
        <div className="flex flex-col space-y-4">
          <Button
            onClick={() => navigate('/')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-primary bg-white hover:bg-gray-100"
          >
            <HomeIcon className="mr-2 h-5 w-5" />
            Back to Home
          </Button>

        </div>
        
        <p className="mt-2 text-sm text-white">
          Need help? <a href="/contact" className="font-medium text-yellow-300 hover:text-yellow-200">Contact our support team</a>
        </p>
      </div>
    </div>
  );
};

export default NotFound;
