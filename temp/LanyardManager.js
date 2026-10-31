// src/LanyardManager.js

export class LanyardManager {
  constructor(userId, onUpdateCallback) {
    this.userId = userId;
    this.onUpdate = onUpdateCallback;
    this.intervalId = null;
    // Standart, engellenmesi çok zor olan HTTP API adresi
    this.apiUrl = `https://api.lanyard.rest/v1/users/${this.userId}`;
  }

  // Bağlantıyı başlat (Artık soket yerine düzenli aralıklarla istek atıyor)
  connect() {
    // Sayfa ilk açıldığında beklemeden hemen ilk veriyi çek
    this.fetchData();

    // Sonra her 3 saniyede bir arka planda sessizce sorgula (3000 ms)
    this.intervalId = setInterval(() => {
      this.fetchData();
    }, 3000);
  }

  // Sayfa kapandığında arka plandaki döngüyü temizle
  disconnect() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  // Veriyi çeken ve işleyen ana metot
  async fetchData() {
    try {
      const response = await fetch(this.apiUrl);
      const json = await response.json();

      if (json.success && json.data) {
        const temizVeri = this.parseProfileData(json.data);
        this.onUpdate(temizVeri); // React'ı yeni veriyle besle
      }
    } catch (error) {
      console.error("Lanyard veri çekme hatası:", error);
    }
  }

  // Gelen karmaşık veriyi ayıklayan iç metot
  parseProfileData(data) {
    const user = data.discord_user;
    if (!user) return null;

    const avatarUrl = user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
      : `https://cdn.discordapp.com/embed/avatars/0.png`;

    const status = data.discord_status || "offline";

    let musicText = null;
    let spotify = null;
    if (data.listening_to_spotify && data.spotify) {
      musicText = `[${data.spotify.artist} | ${data.spotify.song}]`;
      spotify = { 
        artist: data.spotify.artist, 
        song: data.spotify.song,
        start: data.spotify.timestamps ? data.spotify.timestamps.start : null,
        end: data.spotify.timestamps ? data.spotify.timestamps.end : null,
        albumArt: data.spotify.album_art_url || null
      };
    }

    return { avatarUrl, status, musicText, spotify };
  }
}