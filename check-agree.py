# Check the radar-3 dashboard end to end in a real browser:
# - every row's detail view recomputes the implied value from the snapshot
#   figures and it must MATCH board.json (the agreement line)
# - every farm step the page renders must match board.json's farm_steps exactly
# - the stats, verdict counts and tabs render
# Usage: .venv/bin/python check-agree.py <out-dir>
import asyncio
import json
import os
import sys

from playwright.async_api import async_playwright

ENTRY = os.path.expanduser('~/workspace/makefun/token-radar-01-entry')
OUT_DIR = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.join(ENTRY, 'out3')
PAGE = 'file://' + os.path.join(OUT_DIR, 'dashboard', 'index.html')


async def main():
    board = json.load(open(os.path.join(OUT_DIR, 'board.json')))
    rows = board['rows']
    data = json.load(open(os.path.join(OUT_DIR, 'board.json')))
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(
            executable_path=os.path.expanduser('~/workspace/makefun/chrome-linux64/chrome'),
            args=['--no-sandbox', '--disable-dev-shm-usage', '--force-device-scale-factor=1'])
        page = await browser.new_page(viewport={'width': 1440, 'height': 900})
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)[:200]))
        await page.goto(PAGE)
        await page.wait_for_timeout(600)
        stats = await page.evaluate("() => document.querySelector('.facts').innerText")
        print('STATS:', ' | '.join(stats.split('\n')))
        # every row: open detail via hash, read agreement + steps
        bad_agree = []
        bad_steps = []
        for r in rows:
            await page.goto(PAGE + '#p=' + r['slug'])
            await page.wait_for_timeout(120)
            text = await page.evaluate("() => document.getElementById('detail-body').innerText")
            if 'matches the value board.json carries' not in text:
                bad_agree.append(r['slug'])
            # steps are the <li> items; each renders "action" + "Cost: ... Time: ..."
            steps = await page.evaluate(
                "() => [...document.querySelectorAll('#detail-body .steps li')].map(li => li.innerText.replace(/\\n/g, ' '))")
            # rebuild the expected rendered form: action + ' Cost: ... Time: ...' is already one string in board.json;
            # the page splits on ' Cost: ' and re-renders as <b>action</b><span>Cost: ...</span>, innerText joins with space
            for got, want in zip(steps, r['farm_steps']):
                norm_got = ' '.join(got.split())
                norm_want = ' '.join(want.split())
                if norm_got != norm_want:
                    bad_steps.append((r['slug'], norm_got[:120], norm_want[:120]))
                    break
            if len(bad_steps) > 3:
                break
        print('rows checked:', len(rows))
        print('agreement failures:', bad_agree[:10], 'count:', len(bad_agree))
        print('step mismatches:', bad_steps[:3], 'count:', len(bad_steps))
        print('page errors:', errors[:5])
        await browser.close()


asyncio.run(main())
print('agree-check done')
