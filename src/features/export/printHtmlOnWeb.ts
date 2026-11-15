/**
 * Web-only printing of a standalone HTML document.
 *
 * expo-print's `printAsync({ html })` on web ignores the `html` argument and
 * simply calls `window.print()`, which prints the current app screen instead of
 * the generated character sheet. This helper renders the HTML inside a hidden
 * iframe and opens the browser print dialog for that iframe only, so the user
 * can choose "Save as PDF".
 */
export function printHtmlOnWeb(html: string, title: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('Document is not available'));
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const cleanup = () => {
      setTimeout(() => {
        iframe.remove();
      }, 1000);
    };

    const frameWindow = iframe.contentWindow;
    const frameDoc = iframe.contentDocument ?? frameWindow?.document;
    if (!frameWindow || !frameDoc) {
      iframe.remove();
      reject(new Error('Unable to create print frame'));
      return;
    }

    frameDoc.open();
    frameDoc.write(html);
    frameDoc.close();
    frameDoc.title = title;

    const waitForImages = () => {
      const images = Array.from(frameDoc.images);
      return Promise.all(
        images.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>((done) => {
                img.addEventListener('load', () => done(), { once: true });
                img.addEventListener('error', () => done(), { once: true });
              }),
        ),
      );
    };

    const doPrint = () => {
      void waitForImages().then(() => {
        try {
          frameWindow.focus();
          frameWindow.addEventListener('afterprint', cleanup, { once: true });
          frameWindow.print();
          resolve();
        } catch (error) {
          iframe.remove();
          reject(error instanceof Error ? error : new Error('Print failed'));
        }
      });
    };

    if (frameDoc.readyState === 'complete') {
      setTimeout(doPrint, 50);
    } else {
      frameWindow.addEventListener('load', () => setTimeout(doPrint, 50), { once: true });
    }
  });
}
