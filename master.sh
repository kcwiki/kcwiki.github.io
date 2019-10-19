rm -rf /tmp/kcwiki

cd ac
rm -rf build
yarn build
mv build/index.html build/ac.html
mv build /tmp/kcwiki
cd ..

cp -r fish food log plot /tmp/kcwiki

yarm format

git checkout master
rm -rf precache-manifest.* static
cp -rf /tmp/kcwiki/* .
git add .
git commit --amend --no-edit --date now
git push git@github.com:kcwiki/kcwiki.github.io.git master -f
git checkout develop
