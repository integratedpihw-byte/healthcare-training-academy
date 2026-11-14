#!/usr/bin/env bash
# Starts the production build for end-to-end tests with test-only settings:
# deterministic AI provider and local private storage (both refused in real production).
set -euo pipefail
export PLATFORM_ADMIN_MFA=optional AI_PROVIDER=fake ALLOW_FAKE_AI=1 ALLOW_LOCAL_STORAGE=1 STORAGE_DIR="${STORAGE_DIR:-/tmp/chta-e2e-storage}"
exec npx next start -p "${PORT:-3000}"
