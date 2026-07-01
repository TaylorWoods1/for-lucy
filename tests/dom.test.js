import { describe, expect, it } from 'vitest';
import { escapeHtml, htmlList } from '../js/ui/dom.js';

describe('dom utilities', () => {
  it('escapes HTML special characters', () => {
    expect(escapeHtml(`<script>"'&</script>`)).toBe(
      '&lt;script&gt;&quot;&#39;&amp;&lt;/script&gt;',
    );
  });

  it('builds escaped list markup', () => {
    expect(htmlList(['<safe>', 'item'])).toBe('<li>&lt;safe&gt;</li><li>item</li>');
  });
});
