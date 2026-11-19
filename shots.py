# Take the four token-radar screenshots with Playwright's chromium.
# Usage: .venv/bin/python shots.py
# Writes screenshots/1-board.jpg, 2-detail.jpg, 3-filtered.jpg, 4-validation.jpg (1440x900 JPEG).
import asyncio
import os
from playwright.async_api import async_playwright

ENTRY = os.path.expanduser('~/workspace/makefun/token-radar-01-entry')
OUT = os.path.join(ENTRY, 'out8', 'dashboard', 'index.html')
SHOTS = os.path.join(ENTRY, 'screenshots')

async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(executable_path=os.path.expanduser('~/workspace/makefun/chrome-linux64/chrome'), args=['--no-sandbox', '--disable-dev-shm-usage', '--force-device-scale-factor=1'])
        page = await browser.new_page(viewport={'width': 1440, 'height': 900}, device_scale_factor=1)
        page.on('console', lambda m: print('console:', m.type, m.text[:200]))
        page.on('pageerror', lambda e: print('pageerror:', str(e)[:300]))
        # 1. board
        await page.goto('file://' + OUT)
        await page.wait_for_timeout(800)
        await page.screenshot(path=os.path.join(SHOTS, '1-board.jpg'), type='jpeg', quality=90)
        # 2. detail (rank 1) — fresh load so no state carries over
        await page.goto('about:blank')
        await page.goto('file://' + OUT + '#p=steakhouse-financial')
        await page.wait_for_timeout(800)
        await page.screenshot(path=os.path.join(SHOTS, '2-detail.jpg'), type='jpeg', quality=90)
        # 3. filtered (Lending category) — fresh load, dialog must be closed
        await page.goto('about:blank')
        await page.goto('file://' + OUT + '#category=Lending')
        await page.wait_for_timeout(800)
        await page.screenshot(path=os.path.join(SHOTS, '3-filtered.jpg'), type='jpeg', quality=90)
        # 4. validation panel + refit sandbox — scroll it into view
        await page.goto('about:blank')
        await page.goto('file://' + OUT)
        await page.wait_for_timeout(800)
        await page.evaluate("() => document.getElementById('validation-panel').scrollIntoView()")
        await page.wait_for_timeout(400)
        await page.screenshot(path=os.path.join(SHOTS, '4-validation.jpg'), type='jpeg', quality=90)
        await browser.close()

asyncio.run(main())
print('shots done')
