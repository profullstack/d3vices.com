#!/bin/bash
# Replaces electron-builder's stock postrm; mirrors what it normally does.

rm -f '/usr/bin/${executable}'
rm -f '/etc/apparmor.d/${executable}'

update-mime-database /usr/share/mime || true
update-desktop-database /usr/share/applications || true
