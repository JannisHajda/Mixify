/*
SETUP
*/
const client_id = "YOUR CLIENT ID HERE";
const client_secret = "YOUR CLIENT SECRET HERE";
const redirect_uri = "YOUR REDIRECT URI HERE";
const scope =
  "user-read-private playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private";

const inquirer = require("inquirer");
const apiWrapper = require("./apiWrapper");

let shuffleArray = (array) => {
  let counter = array.length;
  while (counter > 0) {
    let index = Math.floor(Math.random() * counter);
    counter--;
    let temp = array[counter];
    array[counter] = array[index];
    array[index] = temp;
  }

  return array;
};

const spotify = new apiWrapper(
  "https://api.spotify.com/v1/",
  client_id,
  client_secret,
  redirect_uri,
  scope
);

let mixify = async () => {
  let authURL = spotify.genAuthURL();
  console.log("Please visit the following site: " + authURL);

  let questions = [
    {
      type: "input",
      name: "code",
      message: "What's the code you've received?",
    },
  ];

  inquirer.prompt(questions).then(async (answers) => {
    await spotify.requestTokens(answers.code);

    let tracks = [];
    let playlists = await spotify.getPlaylists();
    let playlistNames = playlists.map((playlist) => playlist.name);

    questions = [
      {
        type: "checkbox",
        name: "selectedPlaylists",
        message: "Which playlists do you want to combine?",
        choices: playlistNames,
      },
      {
        type: "input",
        name: "name",
        message: "What should your new playlist be called?",
      },
      {
        type: "input",
        name: "description",
        message: "What's the playlists description?",
      },
      {
        type: "confirm",
        name: "isPublic",
        message: "Should the new playlist be public?",
      },
    ];

    answers = await inquirer.prompt(questions);

    for (let i = 0; i < answers.selectedPlaylists.length; i++) {
      playlist =
        playlists[playlistNames.indexOf(answers.selectedPlaylists[i])].id;
      (await spotify.getPlaylistTracks(playlist)).forEach((track) => {
        if (tracks.indexOf(track.track.uri) == -1) {
          tracks.push(track.track.uri);
        }
      });
    }

    tracks = shuffleArray(tracks);
    let userID = (await spotify.getCurrentUser()).id;

    let playlistID = await spotify.createPlaylist(
      userID,
      answers.name,
      answers.isPublic,
      false,
      answers.description
    );

    while (tracks.length > 0) {
      spotify.addTracksToPlaylist(playlistID.id, tracks.slice(0, 100));
      tracks.splice(0, 100);
    }

    console.log(
      `Success, your new playlists has been created: ${playlistID.external_urls.spotify}`
    );
  });
};

mixify();
