const electron = require('electron');
const path = require('path');
const fs = require('fs');
const api = require('qbittorrent-api-v2')
const shell = require('electron').shell;
const {spawn} = require('child_process');    

const { ToadScheduler, SimpleIntervalJob, Task } = require('toad-scheduler')

const scheduler = new ToadScheduler()

//TODO: create a fetch function that will be used to grab things from the anilist file instead of using fs in every function
setUpdateInfo()

const task = new Task('downloader', () => { 
    console.log("Running task.")
    var python = spawn("python3", ['trident_downloader.py']);  
    python.stdout.on('data', function (data) {
        console.log('Pipe data from python script ...');
        dataToSend = data.toString();
    });
    python.on('close', (code) => {
        console.log(dataToSend);
        setUpdateInfo()
    })
})
const job = new SimpleIntervalJob({ seconds: 60 }, task)

scheduler.addSimpleIntervalJob(job)

function setUpdateInfo() {
    fs.readFile('anilist.json', function (err, data) {
        var json = JSON.parse(data)

        let time = json["last-updated"]
        
        let info = document.getElementById("lastupdated")
        info.innerHTML = `Last updated: ${time}`
    })
}

function listAnime() {

    document.getElementById("anilist").innerHTML = ""
    fs.readFile('anilist.json', function (err, data) {
        try{
            var json = JSON.parse(data)

            for(let i = 0; i < json["animes"].length; i++){
                var button = document.createElement('button');
                button.id="menubutton"
                console.log(json["animes"][i])
                if(json["animes"][i]["updated"]){
                    button.style.backgroundColor = "#364156";
                }
                button.name = i;
                button.innerHTML = json["animes"][i]["fullname"];
                button.onclick = function() {displayAnimeEpisodes(i)}
                document.getElementById("anilist").appendChild(button)
            }
        } catch(error) {
            console.log("No JSON file found.")
        }

        var button = document.createElement('button');
        button.id="menubutton"
        button.innerHTML = "+"
        button.onclick = addAnimeMenu
        document.getElementById("anilist").appendChild(button)

    })

}

listAnime()
console.log(__dirname)

function addAnimeMenu() {
    document.getElementById("content").innerHTML = `
        <h1>Entry:</h1>
        <label> Name: <input type="text" id="textbox" name="name"></input> </label>
        <label> Searchword: <input type="text" id="textbox" name="searchword"></input> </label>
        <label> Filter keywords (separate with a coma): <input type="text" id="textbox" name="filter"></input> </label>
        <label> Require keywords (separate with a coma): <input type="text" id="textbox" name="require"></input> </label>
        <label> Background (optional): <br><input type="file" name="image" accept="image/png, image/gif, image/jpeg"></input> </label>
        <br></br>
        <button id="textbox" name="submit">Submit</button>
    `

    let button = document.getElementsByName("submit")[0];
    button.addEventListener("click", addAnimeToList)
}

function addAnimeToList(){

    let name = document.getElementsByName("name")[0].value
    let searchword = document.getElementsByName("searchword")[0].value

    let logo = document.getElementsByName("image")[0].files[0].path
    let filter = document.getElementsByName("filter")[0].value;
    let require = document.getElementsByName("require")[0].value;

    fs.readFile('anilist.json', function (err, data) {
        try{
            var json = JSON.parse(data)
        } catch(error){
            var jsonstr = `
            {
                "last_updated": "",
                "path": "${path.normalize(__dirname).replace(/\\/g, "\\\\")}",
                "animes": []
            }`
            console.log(jsonstr)
            var json = JSON.parse(jsonstr)
        }
        console.log(json)
        let filterlist = ""
        if(filter.length !== 0){
            filterlist = filter.split(",")
        } else {
            filterlist = []
        }

        let requirelist = ""
        if(require.length !== 0) {
            requirelist = require.split(',')
        } else {
            requirelist = []
        }

        console.log(filterlist)
        console.log(requirelist)

        json["animes"].push(        {
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
        fs.writeFile("anilist.json", JSON.stringify(json), function(err){
            if (err) throw err;
            console.log('Submitted new anime.');
            document.getElementById("anilist").innerHTML = ""

            listAnime()
        });
    })

}

function deleteEpisode(index, animindex) {
    fs.readFile('anilist.json', function (err, data) {
        var json = JSON.parse(data)

        episodes = json["animes"][animindex]["downloaded"]
        console.log(episodes)
        episodes.splice(index, 1)

        fs.writeFile("anilist.json", JSON.stringify(json), function(err){
            if (err) throw err;
            console.log('Removed episode from list.');
            displayAnimeEpisodes(animindex);
            hideEpisodePanel();
        });
    })
}

function displayEpisodePanel(index, animindex) {
    var episodePanel = document.getElementById("episodepanel")

    fs.readFile('anilist.json', function (err, data) {
        var json = JSON.parse(data)
        console.log(json)
        animeinfo = json["animes"][animindex]
        episodeinfo = animeinfo["downloaded"][index]

        episodePanel.innerHTML = `
        <img id="closeepanel" src="close-icon.png" onclick="hideEpisodePanel()">
        <img id="deleteepisode" src="trash.png" onclick="deleteEpisode(${index}, ${animindex})">
        <br></br>
        <p id="epinfo">Filename: <span id="filename">${episodeinfo["name"]}</span></div>
        <p id="epinfo">Located in: <span id="path">${episodeinfo["path"]}</span</div>
        <br></br>
        <label> Watched: <input type=checkbox id="checkbox" name="watched"> </label>
        `

        let watched = document.getElementsByName("watched")[0]

        watched.checked = episodeinfo["watched"]

        watched.addEventListener('change', function() {
            episodeinfo["watched"] = this.checked
            fs.writeFile("anilist.json", JSON.stringify(json), function(err){
                if (err) throw err;
                console.log('Updated episode watched status.');
            });
        })
    })


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


function deleteAnime(index) {
    fs.readFile('anilist.json', function (err, data) {
        var json = JSON.parse(data)
        console.log(json)
        animes = json["animes"]
        animes.splice(index, 1);
        fs.writeFile("anilist.json", JSON.stringify(json), function(err){
            if (err) throw err;
            console.log('Removed an anime.');


            listAnime()
        });
    })
}

async function displayTorrentMenu() {
    console.log("Funky")
    content = document.getElementById("content")
    
    content.innerHTML = `
        <center><h1> Trident Torrent List </h1></center>
    `

    api.connect('http://127.0.0.1:8080', 'admin', 'your_password')
	.then(qbt => {
		qbt.torrents("", "trident")
			.then(torrents => {
                for(let i = 0; i < torrents.length; i++){
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
function displaySettingsAnime(index) {

    document.getElementById("content").innerHTML = `
    <h1>Entry:</h1>
    <label> Name: <input type="text" id="textbox" name="name"></input> </label>
    <label> Searchword: <input type="text" id="textbox" name="searchword"></input> </label>
    <label> Filter keywords (separate with a coma): <input type="text" id="textbox" name="filter"></input> </label>
    <label> Require keywords (separate with a coma): <input type="text" id="textbox" name="require"></input> </label>
    <label> Background (optional): <br><input type="file" name="image" accept="image/png, image/gif, image/jpeg"></input> </label>
    <br></br>
    <button id="textbox" name="submit">Submit</button>
    `

    let name = document.getElementsByName("name")[0];
    let searchword = document.getElementsByName("searchword")[0];
    let logo = document.getElementsByName("image")[0];
    let filter = document.getElementsByName("filter")[0];
    let require = document.getElementsByName("require")[0];


    fs.readFile('anilist.json', function (err, data) {
        var json = JSON.parse(data)
        animeinfo = json["animes"][index]

        searchword.value = animeinfo["searchword"]
        filter.value = animeinfo["filter"]
        require.value = animeinfo["require"]
        name.value = animeinfo["fullname"]

        let button = document.getElementsByName("submit")[0];
        button.addEventListener("click", () => {

            console.log("clicked")

            let filterlist = ""
            if(filter.length !== 0){
                filterlist = filter.value.split(",")
            } else {
                filterlist = []
            }

            let requirelist = ""
            if(require.length !== 0) {
                requirelist = require.value.split(',')
            } else {
                requirelist = []
            }

            console.log(filterlist)
            console.log(requirelist)

            animeinfo["searchword"] = searchword.value;
            animeinfo["filter"] = filterlist
            animeinfo["require"] = requirelist
            animeinfo["fullname"] = name.value
            console.log(animeinfo)
            if(logo.files[0] !== undefined) {
                animeinfo["logopath"] = logo.files[0].path;
            }

            fs.writeFile("anilist.json", JSON.stringify(json), function(err){
                if (err) throw err;
                console.log('Edited anime settings.');
                listAnime()
        });
        
        
    })  
    })

         

}

function displayAnimeEpisodes(index) {
    document.getElementById("content").innerHTML = ""

    fs.readFile('anilist.json', function (err, data) {
        var json = JSON.parse(data)
        
        var head = document.createElement('h1');
    
        animinfo = json["animes"][index]

        head.innerHTML = animinfo["fullname"]

        
        var deleteButton = document.createElement('img')
        deleteButton.id = "deletebutton"
        deleteButton.src = "trash.png"
        deleteButton.onclick = function() {deleteAnime(index)}

        var settingsbutton = document.createElement('img');
        settingsbutton.id = "animesettingsbutton"
        settingsbutton.src = "download.png"
        settingsbutton.onclick = function() {displaySettingsAnime(index)}

        var topdiv = document.createElement('div')

        document.getElementById("bottombar").appendChild(deleteButton)
        document.getElementById("bottombar").appendChild(settingsbutton)
        topdiv.appendChild(head)


        document.getElementById("content").appendChild(topdiv)
        for(let i = 0; i < animinfo["downloaded"].length; i++){
            var ep = document.createElement('div');
            let filename = animinfo["downloaded"][i]["name"]
            ep.id="episodebox"
            ep.name = i;
            ep.innerHTML = `
            <img id="episode" src="${animinfo["logopath"]}"></img>
            <p>${filename}</p>`;

            var directory = animinfo["downloaded"][i]["path"]
            if(!animinfo["downloaded"][i]["watched"]) {
                ep.style.backgroundColor = "#364156"
                console.log("Unwatched")
            }
            ep.onclick = function() {displayEpisodePanel(i, index)}
            ep.ondblclick = function() { shell.openPath(path.join(directory, filename)) }

            document.getElementById("content").appendChild(ep)
        }

        animinfo["updated"] = false;

        fs.writeFile("anilist.json", JSON.stringify(json), function(err){
            if (err) throw err;
            console.log('Changed updated status.');
            listAnime();
        });
    })
}