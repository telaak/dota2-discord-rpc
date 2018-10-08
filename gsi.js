const http = require('http')
const express = require('express')
const client = require('discord-rich-presence')('498175281794646017')
const app = express()
const server = http.createServer(app)
const heroes = require('./heroes.js')
const abilities = require('./abilities.js')
const items = require('./items.js')
const getHeroName = (heroString) => heroes[heroString].name
const getAbilityName = (abilityString) => abilities.abilitydata[abilityString].dname
const getItemName = (itemString) => items.itemdata[itemString].dname

let port = 4000
let host = '127.0.0.1'
let json = {}
let abilitiesString = ''
let itemsString = ''

let radiantNames = ''
let direNames = ''

let radiantNetWorth = 0
let direNetWorth = 0

let radiantKills = 0
let direKills = 0

let menuTimeUpdated = false

let interval = setInterval(() => {
  resetStats()
  if (Object.keys(json.player).length === 21) {
    parseJSON('playing')
    updatePresence('playing')
  } else if (Object.keys(json.player).length === 2) {
    parseJSON('spectating')
    updatePresence('spectating')
  } else {
    updatePresence('menu')
  }
}, 15000)

function resetStats () {
  abilitiesString = ''
  itemsString = ''
  radiantNames = ''
  direNames = ''
  radiantNetWorth = 0
  direNetWorth = 0
  radiantKills = 0
  direKills = 0
}

function parseJSON (status) {
  if (status === 'playing') {
    for (let ability in json.abilities) {
      abilitiesString += 'Level ' + json.abilities[ability].level + ' ' + getAbilityName(json.abilities[ability].name) + '\n'
    }
    for (let slot in json.items) {
      if (json.items[slot].name !== 'empty') {
        itemsString += getItemName(json.items[slot].name.replace('item_', '')) + '\n'
      }
    }
  } else if (status === 'spectating') {
    for (let player in json.player.team2) {
      radiantNames += json.player.team2[player].name + ' ' + json.player.team2[player].kills + '/' + json.player.team2[player].deaths + '/' + json.player.team2[player].assists + '\n'
      radiantNetWorth += Number(json.player.team2[player].net_worth)
      radiantKills += Number(json.player.team2[player].kills)
    }
    for (let player in json.player.team3) {
      direNames += json.player.team3[player].name + ' ' + json.player.team3[player].kills + '/' + json.player.team3[player].deaths + '/' + json.player.team3[player].assists + '\n'
      direNetWorth += Number(json.player.team3[player].net_worth)
      direKills += Number(json.player.team3[player].kills)
    }
  }
}

function updatePresence (status) {
  let payload = {}
  if (status === 'playing') {
    menuTimeUpdated = false
    payload = {
      state: json.player.gold + ' G ' + json.player.gpm + ' GPM ' + json.player.xpm + ' XPM',
      details: 'KDA: ' + json.player.kills + '/' + json.player.deaths + '/' + json.player.assists + ' CS: ' + json.player.last_hits + '/' + json.player.denies,
      largeImageKey: json.hero.name.replace('npc_dota_hero_', ''),
      largeImageText: itemsString,
      smallImageKey: String(json.hero.level),
      smallImageText: abilitiesString,
      startTimestamp: Math.round((new Date().getTime() / 1000)) - json.map.clock_time
    }
  } else if (status === 'spectating') {
    menuTimeUpdated = false
    payload = {
      details: radiantNames,
      state: direNames,
      largeImageKey: 'default',
      largeImageText: 'Radiant net worth: ' + radiantNetWorth + '\n' + ' Dire net worth: ' + direNetWorth + '\n',
      smallImageKey: 'eye',
      smallImageText: 'Spectating a game' + radiantKills + ' - ' + direKills,
      startTimestamp: Math.round((new Date().getTime() / 1000)) - json.map.clock_time
    }
  } else if (status === 'menu' && !menuTimeUpdated) {
    payload = {
      details: 'In menu',
      state: 'Not doing anything',
      largeImageKey: 'default',
      startTimestamp: new Date()
    }
    client.updatePresence(payload)
    menuTimeUpdated = true
  }
  if (!menuTimeUpdated) {
    client.updatePresence(payload)
  }
}

app.post('/', function (req, res) {
  let body = ''
  req.on('data', function (data) {
    body += data
  })
  req.on('end', function () {
    json = JSON.parse(body)
  })
})

app.get('/', (req, res) => {
  res.send(json)
})

server.listen(port, host)
console.log('Listening at http://' + host + ':' + port)
