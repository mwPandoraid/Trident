# Trident

Trident is an anime library app designed to keep all of your series up to date using nyaa.si.

## To do
* Create a fetch function that will be used to grab things from the anilist file instead of using fs in every function


* Make the UI look cleaner (Rewrite the entire UI in a proper frontend framework)

* Allow users to delete episodes without the downloader instantly redownloading them (A hack for now is to delete the episode straight from the folder).

* Allow users to specify where to store anime episodes.

* Add GitHub releases.

* Design a proper logo

* Allow users to download batch torrents

* Rewrite the downloader to JS




## Installation


Node.js dependencies are packaged with the source code.

To install python dependencies, run:

`pip install -r requirements.txt`

You also need qBittorrent to run Trident.
You can get the latest release from their site [here](https://www.qbittorrent.org/)

For the downloader script to be able to manage torrents, the Web UI functionality needs to be enabled.

Settings -> Web UI -> Check "Web User Interface (Remote control)"![image](https://user-images.githubusercontent.com/35378051/236524125-f09fcce0-59f1-487f-8deb-10a6939e63b2.png)

Here you can turn off authentication for clients on localhost, or you can specify the authentication credentials.

After changing any qBittorrent settings, go to the Trident settings, and enter the settings there.
![image](https://user-images.githubusercontent.com/35378051/236524908-9de25361-61da-44b4-9588-13a68785f550.png)












## Usage

To start Trident, run:

`npm start`

When adding an anime to your watchlist, you first need to find the series on nyaa.si. Most of the submitters add tags to their releases (like [Erai-Raws].
![Image of nyaa.si](https://user-images.githubusercontent.com/35378051/236522235-4b800f58-db55-4b63-86c5-114fbe83a0e1.png)
As you can see in the screenshot, the common part in all of these uploads is [Erai-raws] Oshi no Ko.

Set that as your searchword in the app like this: ![image](https://user-images.githubusercontent.com/35378051/236522721-22e7bb0a-d0a7-4252-a098-f53e0328dc99.png)

We also need to include filter words to avoid duplicates.

Let's say that we want Multiple Subtitles, but no HEVC. We need to set up the fitler keywords and the require keywords accordingly: ![image](https://user-images.githubusercontent.com/35378051/236523210-c686996e-6b0b-45af-b66a-ec07ab074a44.png)

For now, even though it says that a background image is optional, you need to specify one. Will be fixed later.
## Contributing

Pull requests are welcome. For major changes, please open an issue first
to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](https://choosealicense.com/licenses/mit/)
