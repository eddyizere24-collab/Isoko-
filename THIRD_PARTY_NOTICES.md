# Third-party software notices

ISOKO uses the following separately licensed browser-side image tools:

- **compresso.js 1.0.3** — MIT License. It resizes and compresses selected photos on the user's device before upload. Source: https://github.com/iziuqo/compresso/tree/v1.0.3. License copy: [licenses/COMPRESSO-MIT.txt](licenses/COMPRESSO-MIT.txt).
- **heic-to 1.6.7** — GNU Lesser General Public License v3 (LGPL-3.0). This optional decoder is loaded only when a HEIC/HEIF photo needs conversion in a browser that cannot decode it natively. Its source is not modified by ISOKO. Source: https://github.com/hoppergee/heic-to/tree/v1.6.7. License copy: [licenses/HEIC-TO-LGPL-3.0.txt](licenses/HEIC-TO-LGPL-3.0.txt).

Photos are processed in the user's browser. The original image is not sent to either library's publisher or to a separate image-conversion service. ISOKO sends only the normalized JPEG/WebP output to its own authenticated image-upload endpoint.
