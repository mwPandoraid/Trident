from NyaaPy.nyaa import Nyaa
from qbittorrent import Client
import json

nyaa = Nyaa()
qb = Client('http://127.0.0.1:8080')

qb.login('admin', 'pwd')

with open("anilist.json", 'r+') as f:
    anilist = json.loads(f.read())

def update():

    for anime in anilist["animes"]:
        searchword = anime["searchword"]
        results = nyaa.search(keyword=searchword, category=1)
        for torrent in results:
            episode = torrent.__dict__
            if anime["quality"] in episode["name"] and episode["id"] not in str(anime["downloaded"]):
                print(episode["magnet"])
                qb.download_from_link(episode["magnet"])
                anime["downloaded"].append({"id": episode["id"], "name": episode["name"], "status": "downloading"})


    with open('anilist.json', 'w') as outfile:
        json.dump(anilist, outfile)