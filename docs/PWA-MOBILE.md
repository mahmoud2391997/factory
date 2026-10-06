# Mobile installation and barcode scanning

Open the deployed HTTPS Vercel URL on your phone. On Android, choose **Install app** in the app or browser menu. On iPhone, open Safari and use **Share → Add to Home Screen**. The installed app includes a barcode shortcut.

In **Warehouses → Barcode**, choose **Scan with camera**, allow camera permission, and aim at a well-lit barcode. The rear camera is preferred; a camera selector appears when multiple cameras are available. A successful read stops the camera and uses the existing authenticated barcode lookup. USB readers and manual entry remain available. The scanner reads the ERP's printed Code 128 labels and common barcode/QR formats supported by ZXing.

Camera access and PWA installation require a secure origin. `localhost` works on the development computer, but `http://192.168.x.x:3000` on a phone does not provide a secure camera context. Use the HTTPS deployment for physical mobile tests. If permission is denied, enable the camera in browser/site settings and retry.

The camera stops on success, Stop, navigation, or when the app enters the background. Scanning is local to the device; camera frames are not uploaded. Only the decoded code is sent to the existing ERP endpoint.

The service worker is enabled in production. It caches only icons and a static offline notice. Authenticated pages, API responses and transactions are never cached or queued. Barcode lookup and business operations need an internet connection.

Verify on physical Android Chrome and iPhone Safari: installation, rear-camera selection, permission denial and retry, Code 128 label lookup, repeated scan without duplicate requests, camera indicator turning off on Stop/background/navigation, manual entry, and offline reload. Automated image-decoding tests verify compatibility with actual printed labels; they do not replace physical-camera tests.
