import Image from 'next/image';
import Link from 'next/link';
import { FaTwitter, FaDiscord} from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className='relative bg-gradient-to-r from-gray-900 via-gray-800 to-black'>
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0">
        <Image
          src='/footer_zoom_out_85.jpg'
          alt='Cosmic Portal'
          fill
          className='object-cover object-center'
          priority
          quality={100}
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/50 to-transparent"></div>
      </div>

      {/* Content */}
      <div className='relative container mx-auto px-4 py-12'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12'>
          {/* Brand Section */}
          <div className='space-y-6'>
            <Image
              src='/CyreneAI_logo-text.png'
              alt='Cyrene AI'
              width={180}
              height={60}
              className='object-contain'
            />
            <p className='text-gray-100 text-sm leading-relaxed'>
              Pioneering the future of AI interaction through multi-agent collaboration and locally hosted LLMs.
            </p>
            <div className='flex space-x-4'>
              <Link 
                href='https://x.com/CyreneAI' 
                className='p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors'
                target='_blank'
              >
                <FaTwitter className='w-5 h-5 text-gray-100 hover:text-white' />
              </Link>
              <Link 
                href='https://discord.gg/qJ98QZ6EBx' 
                className='p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors'
                target='_blank'
              >
                <FaDiscord className='w-5 h-5 text-gray-100 hover:text-white' />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className='text-white text-lg font-semibold mb-6'>Quick Links</h3>
            <ul className='space-y-4'>
              <li>
                <Link href='/about' className='text-gray-100 hover:text-white transition-colors'>
                  About Us
                </Link>
              </li>
              <li>
                <Link href='https://docs.netsepio.com/latest/cyreneai' className='text-gray-100 hover:text-white transition-colors'>
                  Documentation
                </Link>
              </li>
              <li>
                <Link href='/token' className='text-gray-100 hover:text-white transition-colors'>
                  Token
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className='text-white text-lg font-semibold mb-6'>Resources</h3>
            <ul className='space-y-4'>
              <li>
                <Link href='https://play.google.com/store/apps/details?id=com.erebrus.app' className='text-gray-100 hover:text-white transition-colors'>
                  Erebrus Android
                </Link>
              </li>
              <li>
                <Link href='https://testflight.apple.com/join/BvdARC75' className='text-gray-100 hover:text-white transition-colors'>
                  Erebrus iOS*
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className='text-white text-lg font-semibold mb-6'>Contact</h3>
            <ul className='space-y-4'>
              <li>
                <Link href='mailto:support@cyreneai.com' className='text-gray-100 hover:text-white transition-colors'>
                  support@cyreneai.com
                </Link>
              </li>
              <li>
                <Link href='/contact' className='text-gray-100 hover:text-white transition-colors'>
                  Contact Form
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className='mt-12 pt-8 border-t border-white/10'>
          <div className='flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0'>
            <div className='text-white text-sm'>
              © 2025 CyreneAI. All rights reserved.
            </div>
            <div className='flex space-x-6 text-sm'>
              <Link href='/privacy' className='text-white hover:text-white transition-colors'>
                Privacy Policy
              </Link>
              <Link href='/terms' className='text-white hover:text-white transition-colors'>
                Terms of Service
              </Link>
            </div>
          </div>
        </div>

        {/* Powered By Section */}
        <div className='mt-8 flex justify-center items-center space-x-2 text-sm text-white'>
          <span>Powered by</span>
          <Link href='https://netsepio.com' target='_blank' rel='noopener noreferrer'>
            <Image
              src='/Netsepio_logo_white_with_text 3.png'
              alt='NetSepio'
              width={100}
              height={25}
              className='object-contain hover:opacity-100 transition-opacity'
            />
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;