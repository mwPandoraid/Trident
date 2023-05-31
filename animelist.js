const electron = require('electron');
const path = require('path');
const fs = require('fs').promises;
const api = require('qbittorrent-api-v2')
const shell = require('electron').shell;
const { spawn } = require('child_process');
const { si } = require('nyaapi')

const { ToadScheduler, SimpleIntervalJob, Task } = require('toad-scheduler');
const { start } = require('repl');

const scheduler = new ToadScheduler()

var updaterRunning = false

//TODO: create a fetch function that will be used to grab things from the anilist file instead of using fs in every function
setUpdateInfo()

const task = new Task('downloader', () => {
    startDownloader()
})

startDownloader()

function startDownloader() {

    if (!updaterRunning) {
        updaterRunning = true;
        console.log("Running task.")
        let python = spawn("python3", ['trident_downloader.py']);
        let refreshButton = document.getElementsByName("refreshbutton")[0];
        let dataToSend;
        refreshButton.style.animation = "rotation 2s infinite linear";
        python.stdout.on('data', function (data) {
            console.log('Pipe data from python script ...');
            dataToSend = data.toString();
        });
        python.on('close', (code) => {
            console.log(dataToSend);
            updaterRunning = false
            refreshButton.style.animation = ""
            setUpdateInfo()
        })
    }

}

async function startJob() {
    let interval = await fetchSetting("update_interval")

    const job = new SimpleIntervalJob({ minutes: parseInt(interval) },
        task,
        { preventOverrun: true }
    );


    scheduler.addSimpleIntervalJob(job)
}

startJob()


async function setUpdateInfo() {
    var data = await fs.readFile('anilist.json')
    var json = JSON.parse(data)

    let time = json["last-updated"]

    let info = document.getElementById("lastupdated")
    info.innerHTML = `Last updated: ${time}`
}

async function fetchSetting(settingname) {
    const settings = await fs.readFile('settings.json', { encoding: 'utf8' })
    var json = JSON.parse(settings)
    return json[settingname]

}

async function changeSetting(settingname, value) {
    const settings = await fs.readFile('settings.json', { encoding: 'utf8' })
    var json = JSON.parse(settings)
    json[settingname] = value

    await fs.writeFile('settings.json', JSON.stringify(json))
}

async function listAnime() {

    document.getElementById("anilist").innerHTML = ""
    var data = await fs.readFile('anilist.json')
    try {
        var json = JSON.parse(data)

        for (let i = 0; i < json["animes"].length; i++) {
            var button = document.createElement('button');
            button.id = "menubutton"
            console.log(json["animes"][i])
            if (json["animes"][i]["updated"]) {
                button.style.backgroundColor = "#364156";
            }
            button.name = i;
            button.innerHTML = json["animes"][i]["fullname"];
            button.onclick = function () { displayAnimeEpisodes(i) }
            document.getElementById("anilist").appendChild(button)
        }
    } catch (error) {
        console.log("No JSON file found.")
    }

    var button = document.createElement('button');
    button.id = "menubutton"
    button.innerHTML = "+"
    button.onclick = addAnimeMenu
    document.getElementById("anilist").appendChild(button)

}

listAnime()
console.log(__dirname)

async function displayTorrentBox() {
    console.log("Searching");
    let searchword = document.getElementsByName("searchword")[0].value

    let filter = document.getElementsByName("filter")[0].value;
    let require = document.getElementsByName("require")[0].value;

    let filterlist = []

    if (filter.length !== 0) {
        filterlist = filter.split(",")
    }

    let requirelist = []

    if (require.length !== 0) {
        requirelist = require.split(',')
    }

    let results = await nyaaResults(searchword, filterlist, requirelist)
    console.log(results)
    console.log(results.length)

    let torrentbox = document.createElement("div")
    torrentbox.className = "torrentbox"

    results.forEach(result => {
        let resultElement = document.createElement("p")
        console.log(result["name"])
        resultElement.innerText = result["name"]

        torrentbox.appendChild(resultElement)
    })

    document.getElementById("content").appendChild(torrentbox)
}

async function addAnimeMenu() {
    document.getElementById("content").innerHTML = `
        <div style="width: 40%; float: left">
        <h1>Entry:</h1>
        <label> Name: <input type="text" id="textbox" name="name"></input> </label>
        <label> Searchword: <input type="text" id="textbox" name="searchword"></input> </label>
        <label> Filter keywords (separate with a coma): <input type="text" id="textbox" name="filter"></input> </label>
        <label> Require keywords (separate with a coma): <input type="text" id="textbox" name="require"></input> </label>
        <label> Background (optional): <br><input type="file" name="image" accept="image/png, image/gif, image/jpeg"></input> </label>
        <br></br>
        <button id="textbox" name="submit">Submit</button>
        <button id="textbox" name="check">Check</button>
        </div>
    `

    let submit = document.getElementsByName("submit")[0];
    submit.addEventListener("click", addAnimeToList)

    let check = document.getElementsByName("check")[0];
    check.addEventListener("click", displayTorrentBox)
}

async function addAnimeToList() {

    let name = document.getElementsByName("name")[0].value
    let searchword = document.getElementsByName("searchword")[0].value

    let logo = document.getElementsByName("image")[0].files[0].path
    let filter = document.getElementsByName("filter")[0].value;
    let require = document.getElementsByName("require")[0].value;

    var data = await fs.readFile('anilist.json')
    try {
        var json = JSON.parse(data)
    } catch (error) {
        var json =
        {
            "last_updated": "",
            "path": `animes/${path.normalize(__dirname).replace(/\\/g, "\\\\")}`,
            "animes": []
        }
        console.log(jsonstr)
    }
    console.log(json)
    let filterlist = []

    if (filter.length !== 0) {
        filterlist = filter.split(",")
    }

    let requirelist = []

    if (require.length !== 0) {
        requirelist = require.split(',')
    }

    console.log(filterlist)
    console.log(requirelist)

    json["animes"].push({
        "searchword": searchword,
        "filter": filterlist,
        "require": requirelist,
        "fullname": name,
        "quality": "1080p",
        "downloaded": [],
        "logopath": logo,
        "updated": false
    })
    console.log(json["animes"])
    await fs.writeFile("anilist.json", JSON.stringify(json))
    console.log('Submitted new anime.');
    document.getElementById("anilist").innerHTML = ""

    startDownloader();
    listAnime();
}

async function deleteEpisode(index, animindex) {
    var data = await fs.readFile('anilist.json')
    var json = JSON.parse(data)

    episodes = json["animes"][animindex]["downloaded"]
    console.log(episodes)
    episodes.splice(index, 1)

    await fs.writeFile("anilist.json", JSON.stringify(json))
    console.log('Removed episode from list.');
    displayAnimeEpisodes(animindex);
    hideEpisodePanel();
}

async function displayEpisodePanel(index, animindex) {
    var episodePanel = document.getElementById("episodepanel")

    var data = await fs.readFile('anilist.json')
    var json = JSON.parse(data)
    console.log(json)
    animeinfo = json["animes"][animindex]
    episodeinfo = animeinfo["downloaded"][index]

    episodePanel.innerHTML = `
        <img id="closeepanel" src="icons/close-icon.png" onclick="hideEpisodePanel()">
        <img id="deleteepisode" src="icons/trash.png" onclick="deleteEpisode(${index}, ${animindex})">
        <br></br>
        <p id="epinfo">Filename: <span id="filename">${episodeinfo["name"]}</span></div>
        <p id="epinfo">Located in: <span id="path">${episodeinfo["path"]}</span</div>
        <br></br>
        <label> Watched: <input type=checkbox id="checkbox" name="watched"> </label>
        `

    let watched = document.getElementsByName("watched")[0]

    watched.checked = episodeinfo["watched"]

    watched.addEventListener('change', async function () {
        episodeinfo["watched"] = this.checked
        await fs.writeFile("anilist.json", JSON.stringify(json))
        console.log('Updated episode watched status.');
    });


    episodePanel.style.display = "block"
    document.getElementById("content").style.width = "70%"
    document.getElementById("content").style.minWidth = "70%"
}

function hideEpisodePanel() {
    var episodePanel = document.getElementById("episodepanel")
    var content = document.getElementById("content");

    content.style.minWidth = "85%";

    episodePanel.style.display = "none"
}


async function deleteAnime(index) {
    var data = await fs.readFile('anilist.json')
    var json = JSON.parse(data)
    console.log(json)
    animes = json["animes"]
    animes.splice(index, 1);
    await fs.writeFile("anilist.json", JSON.stringify(json))
    console.log('Removed an anime.');


    listAnime()
}

async function displayTorrentMenu() {
    console.log("Funky")
    content = document.getElementById("content")

    content.innerHTML = `
        <center><h1> Trident Torrent List </h1></center>
    `

    api.connect(`http://${fetchSetting("qbittorrent_address")}:${fetchSetting("qbittorrent_port")}`,
        fetchSetting("qbittorrent_login"),
        fetchSetting("qbittorrent_password"))
        .then(qbt => {
            qbt.torrents("", "trident")
                .then(torrents => {
                    for (let i = 0; i < torrents.length; i++) {
                        let torrentdiv = document.createElement("div")
                        percentage = (torrents[i]["size"] - torrents[i]["amount_left"]) / torrents[i]["size"] * 100
                        percentage = percentage.toFixed(1)
                        console.log(torrents[i]["amount_left"])
                        torrentdiv.innerHTML = `
                    <p>${torrents[i]["name"]}: ${percentage}% | ${(torrents[i]["dlspeed"] / 1e+6).toFixed(2)} MB/s
                    `
                        content.appendChild(torrentdiv)
                    }

                })
                .catch(err => {
                    console.error(err)
                })
        })
        .catch(err => {
            console.error(err)
        })
}

//this entire function was coded while drunk so forgive me
async function displaySettingsAnime(index) {

    document.getElementById("content").innerHTML = `
    <div style="width: 40%; float: left">
    <h1>Settings for <span id="animename"></span></h1>
    <label> Name: <input type="text" id="textbox" name="name"></input> </label>
    <label> Searchword: <input type="text" id="textbox" name="searchword"></input> </label>
    <label> Filter keywords (separate with a coma): <input type="text" id="textbox" name="filter"></input> </label>
    <label> Require keywords (separate with a coma): <input type="text" id="textbox" name="require"></input> </label>
    <label> Background (optional): <br><input type="file" name="image" accept="image/png, image/gif, image/jpeg"></input> </label>
    <br></br>
    <button id="textbox" name="submit">Submit</button>
    <button id="textbox" name="check">Check</button>
    </div>
    `

    let name = document.getElementsByName("name")[0];
    let searchword = document.getElementsByName("searchword")[0];
    let logo = document.getElementsByName("image")[0];
    let filter = document.getElementsByName("filter")[0];
    let require = document.getElementsByName("require")[0];
    let headerspan = document.getElementById("animename");


    var data = await fs.readFile('anilist.json')
    var json = JSON.parse(data)
    animeinfo = json["animes"][index]

    searchword.value = animeinfo["searchword"]
    filter.value = animeinfo["filter"]
    require.value = animeinfo["require"]
    name.value = animeinfo["fullname"]
    headerspan.innerText = name.value;

    let button = document.getElementsByName("submit")[0];
    button.addEventListener("click", async () => {

        console.log("clicked")

        let filterlist = []

        if (filter.value.length !== 0) {
            filterlist = filter.value.split(",")
        }

        let requirelist = []

        if (require.value.length !== 0) {
            requirelist = require.value.split(',')
        }

        animeinfo["searchword"] = searchword.value;
        animeinfo["filter"] = filterlist
        animeinfo["require"] = requirelist
        animeinfo["fullname"] = name.value
        console.log(animeinfo)
        if (logo.files[0] !== undefined) {
            animeinfo["logopath"] = logo.files[0].path;
        }

        await fs.writeFile("anilist.json", JSON.stringify(json))
        console.log('Edited anime settings.');
        listAnime()
    })

    let check = document.getElementsByName("check")[0];
    check.addEventListener("click", displayTorrentBox)
}

async function displayAnimeEpisodes(index) {
    document.getElementById("content").innerHTML = ""

    var data = await fs.readFile('anilist.json')
    var json = JSON.parse(data)

    var head = document.createElement('h1');

    animinfo = json["animes"][index]

    head.innerHTML = animinfo["fullname"]


    var deleteButton = document.createElement('img')
    deleteButton.id = "deletebutton"
    deleteButton.src = "icons/trash.png"
    deleteButton.onclick = function () { deleteAnime(index) }

    var settingsbutton = document.createElement('img');
    settingsbutton.id = "animesettingsbutton"
    settingsbutton.src = "icons/anime-settings-icon.png"
    settingsbutton.onclick = function () { displaySettingsAnime(index) }

    var topdiv = document.createElement('div')

    document.getElementById("bottombar").appendChild(deleteButton)
    document.getElementById("bottombar").appendChild(settingsbutton)
    topdiv.appendChild(head)


    document.getElementById("content").appendChild(topdiv)
    for (let i = 0; i < animinfo["downloaded"].length; i++) {
        var ep = document.createElement('div');
        let filename = animinfo["downloaded"][i]["name"]
        ep.id = "episodebox"
        ep.name = i;
        ep.innerHTML = `
            <img id="episode" src="${animinfo["logopath"]}"></img>
            <p>${filename}</p>`;

        var directory = animinfo["downloaded"][i]["path"]
        if (!animinfo["downloaded"][i]["watched"]) {
            ep.style.backgroundColor = "#364156"
            console.log("Unwatched")
        }
        ep.onclick = function () { displayEpisodePanel(i, index) }
        ep.ondblclick = function () { shell.openPath(path.join(directory, filename)) }

        document.getElementById("content").appendChild(ep)
    }

    animinfo["updated"] = false;

    await fs.writeFile("anilist.json", JSON.stringify(json))
    console.log('Changed updated status.');
    listAnime();
}

async function displayAppSettings() {
    let content = document.getElementById("content");

    content.innerHTML = `
    <h1>Trident Settings</h1>
    <label> qBittorrent address: <input type="text" id="textbox" name="address"></input> </label>
    <label> qBittorrent port: <input type="number" id="textbox" name="port"></input> </label>
    <label> qBittorrent login: <input type="text" id="textbox" name="login"></input> </label>
    <label> qBittorrent password: <input type="text" id="textbox" name="password"></input> </label>
    <label> Update interval (in minutes)*: <input type="number" id="textbox" name="interval" min=1></input> </label>
    <p><small>*requires restart</small></p>
    <br></br>
    <button id="textbox" name="submit">Submit</button>
    `
    let address = document.getElementsByName("address")[0];
    let port = document.getElementsByName("port")[0];
    let login = document.getElementsByName("login")[0];
    let password = document.getElementsByName("password")[0];
    let interval = document.getElementsByName("interval")[0];

    address.value = await fetchSetting("qbittorrent_address")
    port.value = parseInt(await fetchSetting("qbittorrent_port"))
    login.value = await fetchSetting("qbittorrent_login")
    password.value = await fetchSetting("qbittorrent_password")
    interval.value = parseInt(await fetchSetting("update_interval"))

    console.log(await fetchSetting("qbittorrent_password"))


    let button = document.getElementsByName("submit")[0]
    button.addEventListener("click", async () => {

        if (interval.value == 0) {
            interval.value += 1;
        }

        await changeSetting("qbittorrent_address", address.value)
        await changeSetting("qbittorrent_port", port.value)
        await changeSetting("qbittorrent_login", login.value)
        await changeSetting("qbittorrent_password", password.value)
        await changeSetting("update_interval", Math.ceil(interval.value))
    })
}

async function nyaaResults(searchWord, filterlist = [], requirelist = []) {

    let results = []

    let searchresults = await si.searchAll(searchWord, {
        category: '1_0'
    })

    for (const result of searchresults) {
        let filtered = false

        filterlist.every(filterword => {
            if (result["name"].includes(filterword)) {
                filtered = true
                return false;
            }
        })

        requirelist.every(requireword => {
            if (!result["name"].includes(requireword)) {
                filtered = true;
                return false;
            }
        })

        if (!filtered) {
            results.push(result)
        }
    }
    console.log(results)

    return results
}

async function checkAnimes() {
    let data = await fs.readFile('anilist.json')
    let json = JSON.parse(data)

    data = await fs.readFile('downloading.json')
    let downloading = JSON.parse(data)

    for (anime of json["animes"]) {
        let results = await nyaaResults(anime["searchword"],
            anime["filter"],
            anime["require"])

        for(let result of results){ 
            //if anime["quality"] in episode["name"] and episode["id"] not in str(anime["downloaded"]) and episode["id"] not in str(downloading):
            if(!anime["downloaded"].includes(result["id"]) && !downloading.includes(result["id"])) {
                path = json["path"] + "\\" + anime["fullname"]
                
                downloading[result["hash"]] = {"id": result["id"], "name": filename, "path": path, "watched": False, "animeindex": index}
                
            }
        }
    }
}

checkAnimes()