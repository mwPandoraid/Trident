from NyaaPy.nyaa import Nyaa
from qbittorrent import Client
import json
import time
import os
import requests


nyaa = Nyaa()
qb = Client('http://127.0.0.1:8080')

qb.login('admin', 'pwd')

createdcategories = [] #for later cleaning
infohashes = []

with open("anilist.json", 'r+') as f:
    anilist = json.loads(f.read())

def update():

    for anime in anilist["animes"]:
        searchword = anime["searchword"]
        results = nyaa.search(keyword=searchword, category=1)
        for torrent in results:
            episode = torrent.__dict__
            if anime["quality"] in episode["name"] and episode["id"] not in str(anime["downloaded"]):
                for filterword in anime["filter"]:
                    filtered = False
                    if filterword in episode["name"]:
                        print("Filtered episode with filter: " + filterword)
                        filtered = True
                        break

                for keyword in anime["require"]:
                    filtered = False
                    if keyword not in episode["name"]:
                        print("Episode did not fulfill requirement: " + keyword)
                        filtered = True
                        break

                if(filtered):
                    continue
                

                path = anilist["path"] + "\\" + anime["fullname"]
                qb.download_from_link(episode["magnet"], savepath=path, category=episode["name"])  #we create the category here so we can easily access the filename
                createdcategories.append(episode["name"])

                torrents = qb.torrents(category=episode["name"])
                print(torrents[0]["infohash_v1"])
                infohashes.append(torrents[0]["infohash_v1"])

                time.sleep(5) # wait for qbittorrent to finalize setting up the torrent before trying to get any data, this takes quite a long while sometimes sadly but it also makes sure we don't get ratelimited by nyaa.si
                
                filename = qb.get_torrent_files(torrents[0]["infohash_v1"])[0]['name']
                print(filename)


                anime["downloaded"].append({"id": episode["id"], "name": filename, "path": path, "status": "Unwatched"})


    with open('anilist.json', 'w') as outfile:
        json.dump(anilist, outfile)



update()

print("Cleaning placeholder categories...")
for category in createdcategories:
    print(category)
    qb.remove_category(category)

print("Moving all torrents to Trident category...")
try:
    qb.create_category("trident")
except Exception:
    True

qb.set_category(infohashes, "trident")

print("Trident downloader routine finished.")