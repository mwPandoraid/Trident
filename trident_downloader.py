from NyaaPy.nyaa import Nyaa
from qbittorrent import Client
import json
from datetime import datetime
import time


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
        time.sleep(0.5) #don't spam nyaa.si with requests
        print("Searching for " + searchword)

        results = nyaa.search(keyword=searchword, category=1)
        
        print("Found results: " + str(len(results)))
        for torrent in results:
            episode = torrent.__dict__
            if anime["quality"] in episode["name"] and episode["id"] not in str(anime["downloaded"]) and episode["id"] not in str(downloading):

                filtered = False
                for filterword in anime["filter"]:
                    if filterword in episode["name"]:
                        filtered = True
                        break
                unfulfilled = False        
                for keyword in anime["require"]:
                    if keyword not in episode["name"]:
                        unfulfilled = True
                        break

                if(filtered or unfulfilled):
                    print("Skipping.")
                    continue
                
                    
                path = anilist["path"] + "\\" + anime["fullname"]
                qb.download_from_link(episode["magnet"], savepath=path, category=episode["name"])  #we create the category here so we can easily access the filename
                
                createdcategories.append(episode["name"])
                torrents = qb.torrents(category=episode["name"])
                
                infohashes.append(torrents[0]["infohash_v1"])

                print("we're here " + episode["name"])
                #Wait for the metadata to finish downloading so we can get torrent files.
                while qb.torrents(category=episode["name"])[0]["state"] == "metaDL":
                    pass

                filename = qb.get_torrent_files(torrents[0]["infohash_v1"])
                            
                filename = filename[0]['name']
 
                print("Added torrent to downloading.json: " + filename)
                downloading[torrents[0]["infohash_v1"]] = {"id": episode["id"], "name": filename, "path": path, "watched": False, "animeindex": index}
                        
                print(f"Failed to add torrent.")
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
                print("Finished and cleared torrent " + animinfo["name"])

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
        qb.remove_category(category)



def move_trident(infohashes):
    print("Moving all torrents to Trident category...")
    try:
        qb.create_category("trident")
    except Exception:
        True

    qb.set_category(infohashes, "trident")

update()
clean_placeholders(createdcategories)
move_trident(infohashes)
update_downloaded()


print("Trident downloader routine finished.")