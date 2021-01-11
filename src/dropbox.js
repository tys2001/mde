import axios from 'axios';
import dropboxKey from '@/dropbox_key';

export default {
  openAuth: () => {
    window.open(`https://www.dropbox.com/1/oauth2/authorize?response_type=code&client_id=${dropboxKey.appkey}`);
  },
  auth: async (code) => {
    const formData = new FormData();
    formData.append("code", code);
    formData.append("grant_type", "authorization_code");
    formData.append("client_id", dropboxKey.appkey);
    formData.append("client_secret", dropboxKey.appsecret);
    const response = await axios.post(
      "https://api.dropboxapi.com/1/oauth2/token",
      formData
    );
    localStorage.accessToken = response.data.access_token;
  },
  addImage: async (file) => {
    const param1 = {
      "path": `/image/${new Date().getTime()}.png`,
      "mode": "add",
      "autorename": true,
      "mute": false,
      "strict_conflict": true
    };
    const response1 = await axios.post(
      "https://content.dropboxapi.com/2/files/upload",
      file,
      {
        headers: {
          "Authorization": `Bearer ${localStorage.accessToken}`,
          "Content-Type": "application/octet-stream",
          "Dropbox-API-Arg": JSON.stringify(param1)
        }
      },
    );
    const param2 = {
      "path": response1.data.path_display,
      "settings": {
        "requested_visibility": "public",
        "audience": "public",
        "access": "viewer"
      }
    };
    const response2 = await axios.post(
      "https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings",
      JSON.stringify(param2),
      {
        headers: {
          "Authorization": `Bearer ${localStorage.accessToken}`,
          "Content-Type": "application/json",
        }
      },
    );
    return response2.data.url.replace("/s/", "/s/raw/").replace("?dl=0", "");
  },
  saveDocument: async (title, content) => {
    const blob = new Blob([content], { type: "text/plain" });
    const param = {
      "path": `/documents/${title}`,
      "mode": "overwrite",
      "autorename": false,
      "mute": false,
      "strict_conflict": true
    };
    return await axios.post(
      "https://content.dropboxapi.com/2/files/upload",
      blob,
      {
        headers: {
          "Authorization": `Bearer ${localStorage.accessToken}`,
          "Content-Type": "application/octet-stream",
          "Dropbox-API-Arg": JSON.stringify(param)
        }
      },
    );
  },
  listDocuments: async () => {
    const param = {
      "path": "/documents",
      "recursive": false,
      "include_media_info": false,
      "include_deleted": false,
      "include_has_explicit_shared_members": false,
      "include_mounted_folders": false,
      "include_non_downloadable_files": true
    };
    try {
      const response = await axios.post(
        "https://api.dropboxapi.com/2/files/list_folder",
        param,
        {
          headers: {
            "Authorization": `Bearer ${localStorage.accessToken}`,
            "Content-Type": "application/json"
          }
        },
      );
      return response.data.entries.map(e => ({
        name: e.name,
        datetime: e.server_modified
      }));
    } catch (error) {
      if (error.error_summary === "path/not_found/..") {
        return [];
      }
    }
  },
  getDocument: async (title) => {
    const param = {
      "path": `/documents/${title}`
    };
    const response = await axios.post(
      "https://content.dropboxapi.com/2/files/download",
      null,
      {
        headers: {
          "Authorization": `Bearer ${localStorage.accessToken}`,
          "Content-Type": "text/plain",
          "Dropbox-API-Arg": JSON.stringify(param)
        }
      },
    );
    return {
      name: title,
      text: response.data
    };
  },
  saveStylesheet: async (title, content) => {
    const blob = new Blob([content], { type: "text/plain" });
    const param = {
      "path": `/stylesheets/${title}`,
      "mode": "overwrite",
      "autorename": false,
      "mute": false,
      "strict_conflict": true
    };
    return await axios.post(
      "https://content.dropboxapi.com/2/files/upload",
      blob,
      {
        headers: {
          "Authorization": `Bearer ${localStorage.accessToken}`,
          "Content-Type": "application/octet-stream",
          "Dropbox-API-Arg": JSON.stringify(param)
        }
      },
    );
  },
  listStylesheets: async () => {
    const param = {
      "path": "/stylesheets",
      "recursive": false,
      "include_media_info": false,
      "include_deleted": false,
      "include_has_explicit_shared_members": false,
      "include_mounted_folders": false,
      "include_non_downloadable_files": true
    };
    try {
      const response = await axios.post(
        "https://api.dropboxapi.com/2/files/list_folder",
        param,
        {
          headers: {
            "Authorization": `Bearer ${localStorage.accessToken}`,
            "Content-Type": "application/json"
          }
        },
      );
      return response.data.entries.map(e => ({
        name: e.name,
        datetime: e.server_modified
      }));
    } catch (error) {
      if (error.response.data.error.path[".tag"] === "not_found") return [];
      else throw error;
    }
  },
  getStylesheet: async (title) => {
    const param = {
      "path": `/stylesheets/${title}`
    };
    const response = await axios.post(
      "https://content.dropboxapi.com/2/files/download",
      null,
      {
        headers: {
          "Authorization": `Bearer ${localStorage.accessToken}`,
          "Content-Type": "text/plain",
          "Dropbox-API-Arg": JSON.stringify(param)
        }
      },
    );
    return {
      name: title,
      text: response.data
    };
  }

}