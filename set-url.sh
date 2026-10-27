#!/bin/sh
# ব্যবহার: sh set-url.sh <github-username> <repo-name>
# canonical, Open Graph ও sitemap এর URL আপনার GitHub Pages ঠিকানায় বদলে দেয়।
set -e
if [ $# -lt 2 ]; then echo "ব্যবহার: sh set-url.sh <github-username> <repo-name>"; exit 1; fi
NEW="https://$1.github.io/$2/"
for f in index.html index.tpl.html sitemap.xml robots.txt; do
  [ -f "$f" ] || continue
  sed -i '' "s|https://example.github.io/ip-exam/|$NEW|g" "$f" 2>/dev/null || sed -i "s|https://example.github.io/ip-exam/|$NEW|g" "$f"
done
echo "URL সেট হয়েছে: $NEW"
