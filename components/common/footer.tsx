import Image from 'next/image';

const Footer = () => {
  return (
    <footer className='relative h-[50px] sm:h-[350px] md:h-[500px] overflow-hidden'>
      <Image
        src='/footer_zoom_out_85.jpg'
        alt='Cosmic Portal'
        fill
        className='object-cover object-center'
        priority
        quality={100}
      />
      <div className='absolute inset-0 bg-gradient-to-t from-black/50 via-black/30 to-transparent'>
        <div className='h-full container mx-auto px-6 lg:px-8 flex flex-col'>
          <div className='mt-16 pb-8'>
            <div className='flex flex-col sm:flex-row justify-between items-center gap-10 sm:gap-0'>
              <div className='grid grid-cols-2 sm:flex gap-16 sm:gap-24 w-full sm:w-auto'>
                <div className='font-sans'>
                  <a href='https://www.cyreneai.com/about' className='text-lg md:text-2xl text-white font-semibold hover:text-white no-underline'>
                    Mission
                  </a>
                  <ul className='text-white/70 mt-4 space-y-2 text-base'>
                    <li>
                      <a href='https://www.cyreneai.com/token' className='hover:underline'>Token</a>
                    </li>
                    <li>
                      <a href='https://docs.netsepio.com/latest/cyreneai' className='hover:underline'>Docs</a>
                    </li>
                  </ul>
                </div>
                <div>
                  <a href='#' className='text-lg md:text-2xl text-white font-semibold hover:text-white no-underline'>
                    Integrations
                  </a>
                  <ul className='text-white/70 mt-4 space-y-2 text-base'>
                    <li>
                      <a href='https://play.google.com/store/apps/details?id=com.erebrus.app' className='hover:underline'>Erebrus Android</a>
                    </li>
                    <li>
                      <a href='https://testflight.apple.com/join/BvdARC75' className='hover:underline'>Erebrus iOS*</a>
                    </li>
                    <li>
                      <a href='https://x.com/CyreneAI' className='hover:underline'>CyreneAI on X</a>
                    </li>
                    <li>
                      <a href='https://discord.gg/qJ98QZ6EBx' className='hover:underline'>CyreneAI on Discord</a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className='mt-auto pb-8'>
            <div className='flex flex-col sm:flex-row justify-between items-center gap-8 sm:gap-0'>
              <div>
                <div className='grid grid-cols-2 border-b border-white/40 pb-4 gap-6 sm:flex sm:gap-8 w-full sm:w-auto text-center'>
                  <a href='#' className='text-md text-white/70 hover:text-white no-underline'>Privacy Policy</a>
                  <a href='#' className='text-md text-white/70 hover:text-white no-underline'>Terms and Conditions</a>
                </div>
                <div className='text-white/40 py-4 text-center sm:text-left text-sm'>
                  © 2025 - CyreneAI. All rights reserved.
                </div>
              </div>
              <div className='flex items-center gap-4'>
                <span className='text-lg text-white/70'>Brought to you by</span>
                <a href='https://netsepio.com' target='_blank' rel='noopener noreferrer' className='no-underline'>
                  <Image
                    src='/Netsepio_logo_white_with_text 3.png'
                    alt='NetSepio'
                    width={160}
                    height={40}
                    className='object-contain'
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;