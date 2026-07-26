import os
import sys

# Pre-bundle the vendor directory for dependencies (Linux only)
if os.name != 'nt':
    vendor_dir = os.path.join(os.path.dirname(__file__), 'vendor')
    if os.path.exists(vendor_dir):
        sys.path.insert(0, vendor_dir)

import uvicorn
from app.main import app

if __name__ == "__main__":
    port = int(os.environ.get("X_ZOHO_CATALYST_LISTEN_PORT", 9000))
    uvicorn.run(app, host="0.0.0.0", port=port)
