const axios = require("axios");
const qs = require("querystring");

class Spotify {
  constructor(baseURL, client_id, client_secret, redirect_uri, scope) {
    this.baseURL = baseURL;
    this.client_id = client_id;
    this.client_secret = client_secret;
    this.redirect_uri = redirect_uri;
    this.scope = scope;
    this.access_token = "";
    this.refresh_token = "";
  }

  async performRequest(method, endpoint, params, data) {
    try {
      let res = await axios({
        responseType: "json",
        baseURL: this.baseURL,
        url: endpoint,
        method,
        headers: {
          Authorization: `Bearer ${this.access_token}`,
        },
        params,
        data,
      });

      if (res.data.items) {
        let items = res.data.items;

        while (res.data.next) {
          res = await axios({
            responseType: "json",
            url: res.data.next,
            method,
            headers: {
              Authorization: `Bearer ${this.access_token}`,
            },
          });

          res.data.items.forEach((item) => items.push(item));
        }

        return items;
      }

      return res.data;
    } catch (e) {
      console.log(e.response.data.error);
    }
  }

  /* 
    Authorization
  */

  genAuthURL() {
    let urlParams = new URLSearchParams({
      client_id: this.client_id,
      response_type: "code",
      redirect_uri: this.redirect_uri,
      scope: this.scope,
    });

    return `https://accounts.spotify.com/authorize?${urlParams.toString()}`;
  }

  async requestTokens(code) {
    try {
      let res = await axios({
        responseType: "json",
        url: "https://accounts.spotify.com/api/token",
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${this.client_id}:${this.client_secret}`
          ).toString("base64")}`,
        },
        data: qs.stringify({
          grant_type: "authorization_code",
          code,
          redirect_uri: this.redirect_uri,
        }),
      });

      this.access_token = res.data.access_token;
      this.refresh_token = res.data.refresh_token;
      console.log(res.data.access_token, res.data.refresh_token);
    } catch (e) {
      return e.response.data;
    }
  }

  /*
    Playlists
  */

  async getPlaylists() {
    let data = await this.performRequest("GET", "me/playlists");
    return data;
  }

  async getPlaylistTracks(playlist_id) {
    let data = await this.performRequest(
      "GET",
      `playlists/${playlist_id}/tracks`
    );

    return data;
  }

  async createPlaylist(user_id, name, is_public, collaborative, description) {
    let data = await this.performRequest(
      "POST",
      `users/${user_id}/playlists`,
      {},
      {
        name,
        public: is_public,
        collaborative,
        description,
      }
    );

    return data;
  }

  async addTracksToPlaylist(playlist_id, uris) {
    let data = await this.performRequest(
      "POST",
      `playlists/${playlist_id}/tracks`,
      {},
      { uris: uris }
    );

    return data;
  }

  /*
    User
  */

  async getCurrentUser() {
    let data = await this.performRequest("GET", "me");
    return data;
  }
}

module.exports = Spotify;
