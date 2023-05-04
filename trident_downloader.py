from NyaaPy.nyaa import Nyaa
from qbittorrent import Client
import json
import time
import os
import requests
from datetime import datetime


nyaa = Nyaa()
qb = Client('http://127.0.0.1:8080')

qb.login('admin', 'pwd')

createdcategories = [] #for later cleaning
infohashes = []

with open("anilist.json", 'r+') as f:
    anilist = json.loads(f.read())

with open("downloading.json", 'r+') as d:
    downloading = json.loads(d.read())

print("Trident Downloader")

def update():

    now = datetime.now()
    dt_string = now.strftime("%d/%m/%Y %H:%M:%S")
    print(dt_string)
    anilist["last-updated"] = dt_string

    for index, anime in enumerate(anilist["animes"]):
        searchword = anime["searchword"]
        results = nyaa.search(keyword=searchword, category=1)
        print("Searching for " + searchword)
        print("Found results: " + str(len(results)))
        for torrent in results:
            episode = torrent.__dict__
            if anime["quality"] in episode["name"] and episode["id"] not in str(anime["downloaded"]):
                filtered = False
                for filterword in anime["filter"]:
                    if filterword in episode["name"]:
                        print("Filtered episode with filter: " + filterword)
                        filtered = True
                        break
                unfulfilled = False        
                for keyword in anime["require"]:
                    if keyword not in episode["name"]:
                        print("Episode did not fulfill requirement: " + keyword)
                        unfulfilled = True
                        break

                if(filtered or unfulfilled):
                    print("Skipping.")
                    continue
                

                path = anilist["path"] + "\\" + anime["fullname"]
                qb.download_from_link(episode["magnet"], savepath=path, category=episode["name"])  #we create the category here so we can easily access the filename
                createdcategories.append(episode["name"])

                # wait for qbittorrent to finalize setting up the torrent before trying to get any data, this takes quite a long while sometimes sadly but it also makes sure we don't get ratelimited by nyaa.si


                time.sleep(5)

                try:
                    torrents = qb.torrents(category=episode["name"])
                    print(torrents[0]["infohash_v1"])
                    print(filtered)
                    infohashes.append(torrents[0]["infohash_v1"])

                
                    filename = qb.get_torrent_files(torrents[0]["infohash_v1"])[0]['name']

                    print(filename)

                    downloading[torrents[0]["infohash_v1"]] = {"id": episode["id"], "name": filename, "path": path, "watched": False, "animeindex": index}
                except IndexError:
                    print("[ERROR] Failed to add torrent - this could be due to a duplicate. Make sure to delete any old torrents from qbittorrent.")
                    continue

                         #anime["updated"] = True
                #anime["downloaded"].append({"id": episode["id"], "name": filename, "path": path, "watched": False})

    with open('downloading.json', 'w') as outfile:
        json.dump(downloading, outfile)


def update_downloaded():
    try:
        moved = [] #placeholder for moved torrents, can't remove them in the for loop because you can't change dict mid loop
        for infohash, animinfo in downloading.items():
            torrent = qb.get_torrent(infohash)
            if(torrent["completion_date"] != -1): #for some reason im not getting the "amount_left" field here, i'll just use completion_date instead
                anilist["animes"][animinfo["animeindex"]]["downloaded"].append(animinfo)
                qb.delete(torrent["infohash_v1"])
                moved.append(infohash)
                print("Finished and cleared torrent " + torrent["infohash_v1"])

        for movedtorrent in moved:
            downloading.pop(movedtorrent)

        with open('downloading.json', 'w') as outfile:
            json.dump(downloading, outfile)

        with open('anilist.json', 'w') as outfile:
            json.dump(anilist, outfile)
    except Exception as e:
        print(e)



def clean_placeholders(createdcategories):
    print("Cleaning placeholder categories...")
    for category in createdcategories:
        print(category)
        qb.remove_category(category)



def move_trident(infohashes):
    print("Moving all torrents to Trident category...")
    try:
        qb.create_category("trident")
    except Exception:
        True

    qb.set_category(infohashes, "trident")


def clear_finished():
    print("Clearing finished torrents.")
    torrents = qb.torrents(category="trident")
    for torrent in torrents:
        if(torrent["amount_left"] == 0):
            qb.delete(torrent["infohash_v1"])
            print("Cleared torrent " + torrent["infohash_v1"])

#clear_finished()
update()
clean_placeholders(createdcategories)
move_trident(infohashes)
update_downloaded()


print("Trident downloader routine finished.")