'use client';
import Link from 'next/link';
import { useApp } from './Providers';

function SocialIcon({ d }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={d}/></svg>;
}

export default function Footer() {
  const app = useApp();
  if (!app) return null;
  const year = new Date().getFullYear();
  return (
    <footer className="footer-v2">
      <div className="container">
        <div className="top">
          <div className="brand-col">
            <div className="brand-row">
              <img src="/logo-icon.png" alt={app.settings.brand}/>
              <b>{app.settings.brand}</b>
            </div>
            <div className="tagline">— Code. Templates. Scripts. Solutions. —</div>
            <p className="about">Premium code, scripts and digital gift cards built by indie developers — delivered to your inbox the moment you check out.</p>
            <ul className="foot-contact">
              <li><a href="tel:+919718962885">+91 97189 62885</a></li>
              <li><a href="tel:+918586070279">+91 85860 70279</a></li>
              <li><a href="mailto:contact@webcodeshop.com">contact@webcodeshop.com</a></li>
            </ul>
            <div className="socials">
              <a href="#" aria-label="Twitter"><SocialIcon d="M22 5.8a8.4 8.4 0 01-2.36.64 4.1 4.1 0 001.81-2.27 8.2 8.2 0 01-2.6 1A4.1 4.1 0 0011.85 9a11.65 11.65 0 01-8.46-4.29 4.1 4.1 0 001.27 5.48A4.1 4.1 0 012.8 9.7v.05a4.1 4.1 0 003.3 4.03 4.1 4.1 0 01-1.86.07 4.11 4.11 0 003.83 2.85A8.23 8.23 0 012 18.4a11.62 11.62 0 006.29 1.85c7.55 0 11.68-6.25 11.68-11.68v-.53A8.36 8.36 0 0022 5.8z"/></a>
              <a href="#" aria-label="GitHub"><SocialIcon d="M12 2C6.48 2 2 6.58 2 12.26c0 4.5 2.87 8.32 6.84 9.67.5.1.68-.23.68-.5v-1.75c-2.78.62-3.37-1.36-3.37-1.36-.45-1.18-1.11-1.5-1.11-1.5-.91-.63.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.57 2.34 1.12 2.91.86.09-.67.35-1.12.63-1.38-2.22-.26-4.55-1.14-4.55-5.06 0-1.12.39-2.03 1.03-2.74-.1-.26-.45-1.3.1-2.72 0 0 .84-.28 2.75 1.05A9.3 9.3 0 0112 6.93c.85 0 1.7.12 2.5.34 1.91-1.33 2.75-1.05 2.75-1.05.55 1.42.2 2.46.1 2.72.64.71 1.03 1.62 1.03 2.74 0 3.93-2.34 4.8-4.57 5.05.36.32.68.94.68 1.9v2.81c0 .27.18.6.69.5C19.13 20.58 22 16.76 22 12.26 22 6.58 17.52 2 12 2z"/></a>
              <a href="#" aria-label="Discord"><SocialIcon d="M20.32 4.94a17.6 17.6 0 00-4.36-1.36.07.07 0 00-.07.03c-.19.34-.4.78-.55 1.13a16.4 16.4 0 00-4.91 0 11.5 11.5 0 00-.56-1.13.07.07 0 00-.07-.03 17.6 17.6 0 00-4.36 1.36.06.06 0 00-.03.03C2.5 9.05 1.93 13.04 2.2 16.98a.08.08 0 00.03.05 17.7 17.7 0 005.34 2.7.07.07 0 00.08-.03c.41-.56.78-1.16 1.09-1.78a.07.07 0 00-.04-.1 11.66 11.66 0 01-1.66-.79.07.07 0 010-.12c.11-.08.22-.17.33-.25a.07.07 0 01.07-.01c3.48 1.59 7.25 1.59 10.69 0a.07.07 0 01.07.01c.11.09.22.17.33.26a.07.07 0 010 .12c-.53.31-1.08.58-1.66.79a.07.07 0 00-.04.1c.32.62.69 1.22 1.09 1.78a.07.07 0 00.08.03 17.65 17.65 0 005.35-2.7.07.07 0 00.03-.05c.32-4.55-.55-8.51-2.32-12.01a.06.06 0 00-.03-.03zM8.52 14.58c-.86 0-1.57-.79-1.57-1.76 0-.97.7-1.76 1.57-1.76.88 0 1.58.8 1.57 1.76 0 .97-.7 1.76-1.57 1.76zm6.97 0c-.86 0-1.57-.79-1.57-1.76 0-.97.7-1.76 1.57-1.76.88 0 1.58.8 1.57 1.76 0 .97-.69 1.76-1.57 1.76z"/></a>
              <a href="#" aria-label="YouTube"><SocialIcon d="M22.54 6.42a2.78 2.78 0 00-1.95-2C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 2A29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 2C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-2A29 29 0 0023 12a29 29 0 00-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/></a>
            </div>
          </div>
          <div>
            <h5>Shop</h5>
            <Link href="/shop" className="flink">All products</Link>
            {(app.categories || []).map((c) => (
              <Link key={c.id} href={'/shop?c=' + c.id} className="flink">{c.name}</Link>
            ))}
          </div>
          <div>
            <h5>Account</h5>
            <Link href="/login" className="flink">Sign in</Link>
            <Link href="/register" className="flink">Create account</Link>
            <Link href="/account" className="flink">My orders</Link>
            <Link href="/cart" className="flink">My cart</Link>
          </div>
          <div>
            <h5>Company</h5>
            <Link href="/about" className="flink">About us</Link>
            <Link href="/help" className="flink">Help center</Link>
            <Link href="/cookies" className="flink">Cookie policy</Link>
            <a href="mailto:contact@webcodeshop.com" className="flink">Contact us</a>
          </div>
          <div>
            <h5>Stay updated</h5>
            <p style={newsBlurbStyle}>Tips, drops & promo codes — 1 email a week, no spam.</p>
            <form className="news" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="you@email.com" required/>
              <button type="submit">Join</button>
            </form>
          </div>
        </div>
        <div className="bot">
          <p>© {year} {app.settings.brand}. All rights reserved.</p>
          <div style={legalLinksStyle}>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/cookies">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
const newsBlurbStyle = { fontSize: 13, color: 'rgba(255,255,255,.6)', marginBottom: 8, lineHeight: 1.55 };
const legalLinksStyle = { display: 'flex', gap: 18 };
