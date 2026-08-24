#!/bin/bash
# Replaces electron-builder's stock postinst, so everything it normally does is
# repeated here — the symlink, the mime and desktop database updates — plus the
# sandbox handling below.

ln -sf '/opt/${sanitizedProductName}/${executable}' '/usr/bin/${executable}'

update-mime-database /usr/share/mime || true
update-desktop-database /usr/share/applications || true

# The Chromium sandbox on Ubuntu 24.04+.
#
# The stock template decides between the namespace sandbox and the SUID helper
# by running `unshare --user true` — as root, during the postinst. But
# kernel.apparmor_restrict_unprivileged_userns=1 restricts UNPRIVILEGED user
# namespaces only, and root is exempt, so the probe always succeeds, the helper
# is left non-SUID, and the app aborts for the ordinary user who launches it.
# Probe as `nobody` instead, which is who actually has to do it.
if command -v runuser >/dev/null 2>&1 && runuser -u nobody -- unshare --user true 2>/dev/null; then
  # Unprivileged user namespaces work: the namespace sandbox is used and the
  # SUID helper must NOT be setuid.
  chmod 0755 '/opt/${sanitizedProductName}/chrome-sandbox' || true
else
  # Install an AppArmor profile granting this binary the right to create a user
  # namespace, which is the supported fix on 24.04+.
  if [ -d /etc/apparmor.d ]; then
    cat > '/etc/apparmor.d/${executable}' <<PROFILE
abi <abi/4.0>,
include <tunables/global>

profile ${executable} "/opt/${sanitizedProductName}/${executable}" flags=(unconfined) {
  userns,
  include if exists <local/${executable}>
}
PROFILE
    if command -v apparmor_parser >/dev/null 2>&1; then
      apparmor_parser -r '/etc/apparmor.d/${executable}' 2>/dev/null || true
    fi
  fi
  # Belt and braces: make the SUID helper usable for kernels without AppArmor.
  chmod 4755 '/opt/${sanitizedProductName}/chrome-sandbox' || true
fi
