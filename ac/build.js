const { readFileSync, writeFileSync } = require('fs')
const { head } = require('axios')
const { map: conc } = require('bluebird')
const { find, map, toPairs, sortBy } = require('lodash')

const error = s => {
  throw new Error(s)
}

const sources = [
  /^https:\/\/www.(pixiv).net\/artworks\/\d+$/,
  /^https:\/\/seiga.(nicovideo).jp\/seiga\/im\d+$/,
  /^https:\/\/(danbooru).donmai.us\/posts\/\d+$/,
  /^https:\/\/(twitter).com\/i\/web\/status\/\d+$/,
  /^https:\/\/twitter.com\/(.+?)\/status\/\d+$/,
]

const getSourceType = url => find(map(sources, pattern => (url.match(pattern) || [])[1])) || error(url)

const getSource = url => ({ type: getSourceType(url), url })

const getFile = (rarity, name) =>
  `${rarity}_${name
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/\s/g, '_')}`

const getImage = (rarity, name) => `https://amusementclub.nyc3.cdn.digitaloceanspaces.com/cards/kancolle/${getFile(rarity, name)}.jpg`

const data = readFileSync('data.csv')
  .toString()
  .split('\n')
  .map(e =>
    e
      .split(',')
      .map(e => e.trim())
      .map(e => +e || e),
  )
  .filter(e => e && typeof e[0] === 'number')
  .map(([rarity, ship, name, source], key) => ({
    key,
    rarity,
    ship: ship ? ship.split('/').sort() : [],
    name,
    source: getSource(source),
    file: getFile(rarity, name),
    image: getImage(rarity, name),
  }))
  .sort((a, b) => (a.rarity === b.rarity ? a.name.localeCompare(b.name) : b.rarity - a.rarity))

const popularity = {}

for (const e of data) {
  for (const ship of e.ship) {
    popularity[ship] = popularity[ship] || 0
    ++popularity[ship]
  }
}

const checkLink = async (url, file) => {
  const { status } = await head(`${process.env.proxy || ''}${url}`, { validateStatus: false })
  if (status !== 200) {
    console.log(`${file} - ${url}${status !== 404 ? ` (${status})` : ''}`)
  }
  return status
}

const main = async () => {
  if (process.argv.includes('--check-source') || process.argv.includes('--check-wiki')) {
    await conc(
      data,
      async e => {
        e.source.status = await checkLink(e.source.url, e.file)
        if (process.argv.includes('--check-wiki')) {
          await conc(e.ship, ship => checkLink(`https://kancolle.fandom.com/wiki/${ship.replace(/ /g, '_')}`, e.file))
        }
      },
      { concurrency: 10 },
    )
  }

  const wiki = `{|class="wikitable sortable"
!Rarity!!Ship!!Name!!Source!!Image
${data
  .map(
    e => `|-
|${e.rarity}||${e.ship.map(e => `[[${e}]]`).join('<br>')}||${e.name}||[${e.source.url} ${
      e.source.type
    }]||<span class="external-image" data-width="200">[${e.image}]</span>`,
  )
  .join('\n')}
|}
`

  const csv = `rarity, ship, name, source, image
${data.map(e => `${e.rarity}, ${e.ship ? e.ship.join('/') : ''}, ${e.name}, ${e.source.url}, ${e.image}`).join('\n')}
`

  const dataTs = `const data = ${JSON.stringify(data, null, 2)}

export default data
`

  const popularityTs = `const data = ${JSON.stringify(sortBy(toPairs(popularity), e => -e[1]).map(([ship, count]) => ({ ship, count })), null, 2)}

export default data
`

  writeFileSync('data.wiki', wiki)
  writeFileSync('data.csv', csv)
  writeFileSync('src/data.ts', dataTs)
  writeFileSync('src/popularity.ts', popularityTs)
}

main()
