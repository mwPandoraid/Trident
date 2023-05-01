for(let i = 0; i < 50; i++){
    var button = document.createElement('button');
    button.id="menubutton"
    button.innerHTML = i;
    button.onclick = function() {console.log(i)}
    document.getElementById("anilist").appendChild(button)
}

var div = document.createElement('button');
button.id="menubutton"
button.innerHTML = "+"
button.onclick = function() {console.log("create")}
document.getElementById("anilist").appendChild(button)