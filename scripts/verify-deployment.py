"""Exercise a deployed build with Playwright; evidence stays in ignored output/."""
import argparse
import hashlib
import json
from pathlib import Path
import re
from urllib.parse import parse_qs, urlparse, quote

from playwright.sync_api import expect, sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--base-url', default='https://flipbook.vriksh.ca')
args = parser.parse_args()
base = args.base_url.rstrip('/')
root = Path(__file__).resolve().parent.parent
out = root / 'output/deployment'
out.mkdir(parents=True, exist_ok=True)
version = json.loads((root / 'package.json').read_text())['version']
errors = []
analytics = []
clarity_responses = []
collection_requests = []
expect.set_options(timeout=20000)
with sync_playwright() as p:
    browser = p.chromium.launch(args=['--no-sandbox', '--disable-quic'])
    context = browser.new_context(reduced_motion='reduce', permissions=['clipboard-read', 'clipboard-write'])
    page = context.new_page()
    page.on('response', lambda r: analytics.append({'url': r.url, 'status': r.status}) if ('google-analytics.com/g/collect' in r.url or 'googletagmanager.com/gtag/js' in r.url) else None)
    page.on('response', lambda r: clarity_responses.append(r.status) if r.url.startswith('https://www.clarity.ms/tag/z0u0h01nl0') else None)
    page.on('request', lambda r: collection_requests.append(r.url) if 'google-analytics.com/g/collect' in r.url else None)
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    assert context.request.get(base + '/version.json').json() == {'version': version}
    pdf = context.request.get(base + '/book.pdf')
    assert pdf.ok and pdf.headers['content-type'] == 'application/pdf'
    assert hashlib.sha256(pdf.body()).digest() == hashlib.sha256((root / 'assets/sample.pdf').read_bytes()).digest()
    assert context.request.get(base + '/assets/missing.mjs').status == 404
    assert context.request.get(base + '/wasm/missing.wasm').status == 404
    for width in (390, 1440):
        page.set_viewport_size({'width': width, 'height': 900})
        print('Checking viewport', width, flush=True)
        assert page.goto(base + '/', wait_until='networkidle').status == 200
        page.screenshot(path=str(out / f'{width}-initial.png'))
        expect(page.get_by_role('heading', name='Your PDF. A little more alive.')).to_be_visible()
        expect(page.locator('.product-credit')).to_contain_text('v' + version)
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        page.get_by_role('button', name=re.compile('Theme:')).click()
        page.get_by_role('menuitemradio', name='Dark', exact=True).click()
        expect(page.locator('html')).to_have_attribute('data-theme', 'dark')
        page.get_by_role('button', name='Theme: Dark').click()
        page.get_by_role('menuitemradio', name='Sage', exact=True).click()
        assert page.locator('button, input, .pdf-url-form, .theme-popover').evaluate_all(
            "es => es.every(e => getComputedStyle(e).borderTopLeftRadius === '0px')"
        )
        github = page.get_by_role('link', name='GitHub', exact=True)
        expect(github).to_be_visible()
        assert github.get_attribute('href') == 'https://github.com/Pragith/flipbook'
        assert github.get_attribute('target') == '_blank'
        assert github.evaluate("e => getComputedStyle(e).borderTopLeftRadius") == '0px'
        github.focus()
        assert github.evaluate('e => e === document.activeElement')
        with page.expect_popup() as popup:
            github.press('Enter')
        assert popup.value.url.startswith('https://github.com/Pragith/flipbook')
        popup.value.close()
        page.screenshot(path=str(out / f'{width}-welcome.png'))
        page.evaluate('localStorage.clear()')
        # Upload the original local sample: no server-side PDF processing.
        page.locator('input[type=file]').set_input_files(root / 'assets/sample.pdf')
        expect(page.get_by_label('Page number', exact=True)).to_have_value('1')
        page.wait_for_function("document.querySelectorAll('img[data-page][src]').length > 0")
        page.get_by_label('Page number', exact=True).fill('4')
        page.get_by_label('Page number', exact=True).press('Enter')
        expect(page.get_by_label('Page number', exact=True)).to_have_value('4')
        page.wait_for_timeout(1000)  # Allow page-flip's current transition to finish.
        page.get_by_role('button', name='Next page', exact=True).click()
        expect(page.get_by_label('Page number', exact=True)).not_to_have_value('4')
        page.wait_for_timeout(1000)
        page.get_by_role('button', name='Previous page', exact=True).click()
        expect(page.get_by_label('Page number', exact=True)).to_have_value('4')
        expect(page.locator('.product-credit')).to_contain_text('v' + version)
        assert page.locator('button, input, .controls, aside').evaluate_all(
            "es => es.every(e => getComputedStyle(e).borderTopLeftRadius === '0px')"
        )
        with page.expect_download() as download:
            page.get_by_role('link', name='Download PDF', exact=True).click()
        assert hashlib.sha256(Path(download.value.path()).read_bytes()).digest() == hashlib.sha256(pdf.body()).digest()
        page.get_by_role('button', name='Back to start').click()
        page.get_by_label('PDF URL', exact=True).fill(base + '/book.pdf')
        page.get_by_role('button', name='Open PDF URL', exact=True).click()
        expect(page.get_by_label('Page number', exact=True)).to_be_visible()
        page.wait_for_function("document.querySelectorAll('img[data-page][src]').length > 1")
        page.get_by_label('Page number', exact=True).fill('4')
        page.get_by_label('Page number', exact=True).press('Enter')
        expect(page.get_by_label('Page number', exact=True)).to_have_value('4')
        shared = base + '/?pdf=' + quote(base + '/book.pdf', safe='') + '&page=4'
        if width == 1440:  # The existing compact phone toolbar hides Share.
            page.get_by_role('button', name='Share', exact=True).click()
            page.wait_for_function("navigator.clipboard.readText().then(t => t.includes('page=4'))")
            shared = page.evaluate('navigator.clipboard.readText()')
            assert 'pdf=' in shared and 'page=4' in shared
        print('Upload, URL, next/previous and download passed:', width, flush=True)
        page.goto(shared, wait_until='networkidle')
        expect(page.get_by_label('Page number', exact=True)).to_have_value('4')
        page.wait_for_function("document.querySelectorAll('img[data-page][src]').length > 1")
        expect(page.get_by_role('region', name='Magazine reader')).to_have_attribute('data-clarity-mask', 'true')
        expect(page.locator('.publication strong')).to_have_attribute('data-clarity-mask', 'true')
        page.get_by_role('button', name='Notes', exact=True).click()
        expect(page.get_by_label('notes panel', exact=True)).to_have_attribute('data-clarity-mask', 'true')
        page.get_by_role('button', name='Close panel', exact=True).click()
        page.get_by_role('button', name='Zoom', exact=True).click()
        expect(page.get_by_role('dialog', name='Zoomed reading view')).to_have_attribute('data-clarity-mask', 'true')
        page.get_by_role('button', name='Close zoom', exact=True).click()
        page.screenshot(path=str(out / f'{width}-reader.png'))
    page.wait_for_function("window.google_tag_manager && window.google_tag_manager['G-5G040P491R']")
    assert any('googletagmanager.com/gtag/js?id=G-5G040P491R' in r['url'] and r['status'] == 200 for r in analytics), analytics
    assert collection_requests, 'No Analytics collection request observed'
    initial = parse_qs(urlparse(collection_requests[0]).query)
    assert initial.get('tid') == ['G-5G040P491R']
    assert initial.get('dl') == [base + '/'], initial.get('dl')
    worker = page.locator('script[type=module]').first.get_attribute('src')
    assert context.request.get(base + worker).headers['content-type'].startswith('application/javascript')
    assert clarity_responses and all(status == 200 for status in clarity_responses), clarity_responses
    assert not errors, errors
    browser.close()
(out / 'results.json').write_text(json.dumps({'base': base, 'version': version, 'widths': [390, 1440], 'localUpload': True, 'urlLoading': True, 'pageTurns': True, 'downloadChecksum': True, 'sharedPageLink': True, 'squareControls': True, 'consoleErrors': errors, 'analyticsProperty': 'G-5G040P491R', 'analyticsInitialPageviewDispatched': True, 'clarityTag': 'z0u0h01nl0', 'clarityTagStatuses': clarity_responses, 'readerAndNotesMasked': True}, indent=2) + '\n')
print('PASS: production version, PDF assets, local/URL opening, page turns, downloads, sharing, themes and square controls at 390/1440px; zero browser errors.')
