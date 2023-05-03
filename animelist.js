const electron = require('electron');
const path = require('path');
const fs = require('fs');
const api = require('qbittorrent-api-v2')


function listAnime() {

    fs.readFile('anilist.json', function (err, data) {
        try{
            var json = JSON.parse(data)

            for(let i = 0; i < json["animes"].length; i++){
                var button = document.createElement('button');
                button.id="menubutton"
                console.log(json["animes"][i])
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
            var json = JSON.parse(`
            {
                "path": "${__dirname}"
                "animes": []
            }`)
        }
        console.log(json)
        const filterlist = filter.split(",")
        const requirelist = require.split(",")
        json["animes"].push(        {
            "searchword": searchword,
            "filter": filterlist,
            "require": requirelist,
            "fullname": name,
            "quality": "1080p",
            "downloaded": [],
            "logopath": logo
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

function displayEpisodePanel(index, animindex) {
    var episodePanel = document.getElementById("episodepanel")

    fs.readFile('anilist.json', function (err, data) {
        var json = JSON.parse(data)
        console.log(json)
        animeinfo = json["animes"][animindex]
        episodeinfo = animeinfo["downloaded"][index]

        episodePanel.innerHTML = `
        <img id="closeepanel" src="close-icon.png" onclick="hideEpisodePanel()"
        <br></br>
        <p id="epinfo">Filename: <span id="filename">${episodeinfo["name"]}</span></div>
        `
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
            document.getElementById("anilist").innerHTML = ""

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

        var topdiv = document.createElement('div')

        topdiv.appendChild(deleteButton)
        topdiv.appendChild(head)


        document.getElementById("content").appendChild(topdiv)
        for(let i = 0; i < animinfo["downloaded"].length; i++){
            var ep = document.createElement('div');
            ep.id="episodebox"
            ep.name = i;
            ep.innerHTML = `
            <img id="episode" src="${animinfo["logopath"]}"></img>
            <p>${animinfo["downloaded"][i]["name"]}</p>`;
            ep.onclick = function() {displayEpisodePanel(i, index)}
            document.getElementById("content").appendChild(ep)
        }

        
    })
}