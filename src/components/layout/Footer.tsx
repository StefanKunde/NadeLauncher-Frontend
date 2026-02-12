'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-[#2a2a3e] bg-[#0a0a0f]">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <span className="text-xl font-bold">
              <span className="text-gradient-gold">NADE</span>
              <span className="text-[#e8e8e8]">PRO</span>
            </span>
            <p className="text-[#6b6b8a] text-sm mt-3 leading-relaxed">
              The ultimate CS2 grenade practice platform. Master every lineup, dominate every map.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold text-[#e8e8e8] uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-2">
              <li><Link href="#features" className="text-[#6b6b8a] hover:text-[#f0a500] text-sm transition-colors">Features</Link></li>
              <li><Link href="#maps" className="text-[#6b6b8a] hover:text-[#f0a500] text-sm transition-colors">Maps</Link></li>
              <li><Link href="#pricing" className="text-[#6b6b8a] hover:text-[#f0a500] text-sm transition-colors">Pricing</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold text-[#e8e8e8] uppercase tracking-wider mb-4">Resources</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="text-[#6b6b8a] hover:text-[#f0a500] text-sm transition-colors">Documentation</Link></li>
              <li><Link href="#" className="text-[#6b6b8a] hover:text-[#f0a500] text-sm transition-colors">Server Plugin</Link></li>
              <li><Link href="#" className="text-[#6b6b8a] hover:text-[#f0a500] text-sm transition-colors">Community</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-[#e8e8e8] uppercase tracking-wider mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="text-[#6b6b8a] hover:text-[#f0a500] text-sm transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="text-[#6b6b8a] hover:text-[#f0a500] text-sm transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="text-[#6b6b8a] hover:text-[#f0a500] text-sm transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#2a2a3e] mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#6b6b8a] text-sm">
            &copy; {new Date().getFullYear()} NadePro. All rights reserved.
          </p>
          <p className="text-[#6b6b8a] text-xs">
            Not affiliated with Valve Corporation. CS2 is a trademark of Valve Corporation.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
