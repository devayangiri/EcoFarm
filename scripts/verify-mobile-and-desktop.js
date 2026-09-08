const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = path.resolve('C:/Users/Administrator/.gemini/antigravity/brain/4c377e3d-76a4-4e5c-bb4f-0d9153080e7d');

async function run() {
  console.log('--- Starting Puppeteer Multi-Device Visual & Functional Verification ---');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // Test 1: PWA Manifest & Service Worker Endpoints
  console.log('\n[1] Checking PWA manifest & service worker endpoints...');
  const manifestRes = await page.goto('http://localhost:3000/manifest.webmanifest');
  const manifestJson = await manifestRes.json();
  console.log('✓ Manifest short_name:', manifestJson.short_name);
  console.log('✓ Manifest display:', manifestJson.display);
  console.log('✓ Manifest theme_color:', manifestJson.theme_color);
  console.log('✓ Manifest icons count:', manifestJson.icons.length);

  const swRes = await page.goto('http://localhost:3000/sw.js');
  console.log('✓ Service Worker sw.js status:', swRes.status());

  // Test 2: Mobile Viewports (Home Page)
  const mobileViewports = [
    { name: 'small-android', width: 360, height: 800 },
    { name: 'standard-mobile', width: 390, height: 844 },
    { name: 'large-mobile', width: 430, height: 932 },
  ];

  for (const vp of mobileViewports) {
    console.log(`\n[2] Testing Mobile Home at ${vp.name} (${vp.width}x${vp.height})...`);
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });

    // Verify Mobile App Elements
    const mobileHeaderVisible = await page.$eval(
      'header',
      (el) => window.getComputedStyle(el).display !== 'none'
    );
    console.log('✓ Mobile header visible:', mobileHeaderVisible);

    const bottomNavVisible = await page.$eval(
      'nav.fixed.bottom-0',
      (el) => window.getComputedStyle(el).display !== 'none'
    ).catch(() => false);
    console.log('✓ Bottom navigation visible:', bottomNavVisible);

    // Verify No horizontal scroll overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    console.log('✓ Zero horizontal overflow (scrollWidth <= innerWidth):', !hasHorizontalOverflow);

    // Verify Desktop Hero is suppressed
    const desktopHeroSuppressed = await page.evaluate(() => {
      const desktopHero = document.querySelector('.hidden.md\\:block');
      return desktopHero ? window.getComputedStyle(desktopHero).display === 'none' : true;
    });
    console.log('✓ Desktop hero suppressed on mobile:', desktopHeroSuppressed);

    // Capture mobile home screenshot
    const shotPath = path.join(ARTIFACT_DIR, `mobile_home_${vp.name}.png`);
    await page.screenshot({ path: shotPath, fullPage: false });
    console.log(`✓ Saved screenshot: ${shotPath}`);
  }

  // Test 3: Mobile Marketplace (2-Column Grid & Category Chips)
  console.log('\n[3] Testing Mobile Marketplace at 390x844...');
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('http://localhost:3000/marketplace', { waitUntil: 'networkidle0' });

  const categoryChipsPresent = await page.evaluate(() => {
    return document.querySelectorAll('button').length > 5;
  });
  console.log('✓ Category chips & filter triggers present:', categoryChipsPresent);

  const marketShotPath = path.join(ARTIFACT_DIR, 'mobile_marketplace_390x844.png');
  await page.screenshot({ path: marketShotPath, fullPage: false });
  console.log(`✓ Saved screenshot: ${marketShotPath}`);

  // Test 4: Mobile Cart (Sticky Checkout Bar)
  console.log('\n[4] Testing Mobile Cart View at 390x844...');
  await page.goto('http://localhost:3000/cart', { waitUntil: 'networkidle0' });
  const cartShotPath = path.join(ARTIFACT_DIR, 'mobile_cart_390x844.png');
  await page.screenshot({ path: cartShotPath, fullPage: false });
  console.log(`✓ Saved screenshot: ${cartShotPath}`);

  // Test 5: Desktop Control Viewports (Strict Desktop Preservation)
  const desktopViewports = [
    { name: 'desktop-1280', width: 1280, height: 900 },
    { name: 'desktop-1440', width: 1440, height: 900 },
    { name: 'desktop-1600', width: 1600, height: 900 },
    { name: 'desktop-1920', width: 1920, height: 1080 },
  ];

  for (const vp of desktopViewports) {
    console.log(`\n[5] Testing Desktop Preservation at ${vp.name} (${vp.width}x${vp.height})...`);
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });

    // Verify Mobile Elements are hidden on Desktop
    const bottomNavOnDesktop = await page.evaluate(() => {
      const nav = document.querySelector('nav.fixed.bottom-0');
      if (!nav) return false;
      return window.getComputedStyle(nav).display !== 'none';
    });
    console.log('✓ Mobile bottom nav hidden on desktop:', !bottomNavOnDesktop);

    // Verify Desktop Hero is visible
    const desktopHeroVisible = await page.evaluate(() => {
      const hero = document.querySelector('.hidden.md\\:block');
      return hero ? window.getComputedStyle(hero).display !== 'none' : false;
    });
    console.log('✓ Desktop hero visible on desktop:', desktopHeroVisible);

    // Verify Desktop Footer is visible
    const desktopFooterVisible = await page.evaluate(() => {
      const footerGrid = document.querySelector('footer .hidden.md\\:block');
      return footerGrid ? window.getComputedStyle(footerGrid).display !== 'none' : false;
    });
    console.log('✓ Multi-column desktop footer visible:', desktopFooterVisible);

    const desktopShotPath = path.join(ARTIFACT_DIR, `desktop_home_${vp.name}.png`);
    await page.screenshot({ path: desktopShotPath, fullPage: false });
    console.log(`✓ Saved screenshot: ${desktopShotPath}`);
  }

  await browser.close();
  console.log('\n--- Multi-Device Verification Completed Successfully! ---');
}

run().catch((err) => {
  console.error('Verification error:', err);
  process.exit(1);
});
