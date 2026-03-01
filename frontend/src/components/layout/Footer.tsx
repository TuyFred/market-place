export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white mt-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-10 text-slate-700">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-start">
          <div>
            <div className="text-lg font-semibold text-slate-900">Ass Market Place</div>
            <p className="text-sm text-slate-500 mt-2">Quality clothes & accessories for women and children. Comfortable, affordable and shipped fast.</p>
          </div>

          <div className="flex gap-8">
            <div>
              <h4 className="text-sm font-medium text-slate-900">Company</h4>
              <ul className="mt-2 text-sm text-slate-500 space-y-1">
                <li><a href="/about" className="hover:text-accent">About us</a></li>
                <li><a href="/contact" className="hover:text-accent">Contact</a></li>
                <li><a href="/products" className="hover:text-accent">Products</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-slate-900">Support</h4>
              <ul className="mt-2 text-sm text-slate-500 space-y-1">
                <li><a href="/faq" className="hover:text-accent">FAQ</a></li>
                <li><a href="/shipping" className="hover:text-accent">Shipping</a></li>
                <li><a href="/returns" className="hover:text-accent">Returns</a></li>
              </ul>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-slate-900">Stay updated</h4>
            <p className="text-sm text-slate-500 mt-2">Subscribe for new arrivals and exclusive offers.</p>
            <form className="mt-3 flex items-center gap-2">
              <input type="email" placeholder="Your email" className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent" />
              <button type="button" className="inline-flex items-center rounded-md bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent/90">Subscribe</button>
            </form>

            <div className="mt-4 text-sm text-slate-500">
              <div>© {new Date().getFullYear()} Ass Market Place</div>
              <div className="mt-1">All rights reserved.</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

