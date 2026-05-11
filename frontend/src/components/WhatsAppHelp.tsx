import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function WhatsAppHelp() {
  const [isExpanded, setIsExpanded] = useState(false);
  const phoneNumber = '918210228101';
  const message = encodeURIComponent("I'm having trouble with Quiz Champ registration");
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, x: 20, y: 10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 20, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 right-0 mb-2"
          >
            <div className="bg-white rounded-2xl shadow-lg border border-[#d2d2d7] p-4 w-64">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#1d1d1f] mb-1">Need Help?</p>
                  <p className="text-xs text-[#86868b] leading-relaxed">
                    Having trouble with registration? Chat with our technical support team on WhatsApp.
                  </p>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-[#86868b] hover:text-[#1d1d1f] transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-2.5 px-4 bg-[#25D366] text-white rounded-full text-sm font-semibold text-center hover:bg-[#20BA5A] transition-colors"
              >
                Chat on WhatsApp
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        onMouseEnter={() => setIsExpanded(true)}
        className="w-14 h-14 bg-[#25D366] rounded-full shadow-lg flex items-center justify-center hover:bg-[#20BA5A] transition-colors group"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Technical Support"
      >
        <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
        </svg>
        
        {/* Pulse animation */}
        <span className="absolute w-14 h-14 bg-[#25D366] rounded-full animate-ping opacity-20" />
      </motion.button>

      {/* Tooltip on hover (desktop only) */}
      {!isExpanded && (
        <div className="hidden md:block absolute bottom-full right-0 mb-2 pointer-events-none">
          <div className="bg-[#1d1d1f] text-white text-xs py-2 px-3 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Technical Support
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#1d1d1f]" />
          </div>
        </div>
      )}
    </div>
  );
}
