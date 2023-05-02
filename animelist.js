const electron = require('electron');
const path = require('path');
const fs = require('fs');

for(let i = 0; i < 5; i++){



}

fs.readFile('anilist.json', function (err, data) {
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

    var button = document.createElement('button');
    button.id="menubutton"
    button.innerHTML = "+"
    button.onclick = addAnimeMenu
    document.getElementById("anilist").appendChild(button)

})

function addAnimeMenu() {
    document.getElementById("content").innerHTML = `
        <h1>Entry:</h1>
        <label> Name: <input type="text" id="textbox" name="name"></input> </label>
        <label> Searchword: <input type="text" id="textbox" name="searchword"></input> </label>
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

    fs.readFile('anilist.json', function (err, data) {
        var json = JSON.parse(data)
        console.log(json)
        json["animes"].push(        {
            "searchword": searchword,
            "fullname": name,
            "quality": "1080p",
            "downloaded": [],
            "logopath": logo
        })
        console.log(json["animes"])
        fs.writeFile("anilist.json", JSON.stringify(json), function(err){
            if (err) throw err;
            console.log('Submitted new anime.');
        });
    })
}

function displayAnimeEpisodes(index) {
    document.getElementById("content").innerHTML = ""

    fs.readFile('anilist.json', function (err, data) {
        var json = JSON.parse(data)
        var head = document.createElement('h1');
    
        animinfo = json["animes"][index]

        head.innerHTML = animinfo["fullname"]

        document.getElementById("content").appendChild(head)
        for(let i = 0; i < animinfo["downloaded"].length; i++){
            var ep = document.createElement('div');
            ep.id="episodebox"
            ep.innerHTML = `
            <img id="episode" src="${animinfo["logopath"]}"></img>
            <p>${animinfo["downloaded"][i]["name"]}</p>`;
            document.getElementById("content").appendChild(ep)
        }
    })
}