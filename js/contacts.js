// contacts.js

import { formatDate } from "./utils.js";
import { showAlert } from "./utils.js";

let dataGlobal = [];
let conversationMap = {};

export async function loadAllChatList(token) {
  try {
    const [contactRes, groupRes] = await Promise.all([

      fetch('http://localhost:3000/api/contacts', {

        headers: { 'Authorization': `Bearer ${token}` }

      }),

      fetch('http://localhost:3000/api/allGroup', {

        headers: { 'Authorization': `Bearer ${token}` }

      })

    ]);



    if (contactRes.status === 401 || groupRes.status === 401) {

      showAlert('Sesi habis! Silakan login lagi.', 'danger');

      localStorage.removeItem('token');

      // logoutOnline();

      setTimeout(() => {

        window.location.href = 'login.html';

      }, 1500);

      return;

    }



    if (!contactRes.ok || !groupRes.ok) {

      throw new Error(`Gagal memuat data!`);

    }

    const contacts = await contactRes.json();
    const groups = await groupRes.json();

    // FORMAT CONTACTS (USER)
    const formattedContacts = contacts.map(c => ({
      type: 'user',
      id: c.user_id,
      conversationId: c.conversation_id,
      name: c.username,
      lastMessage: c.last_message,
      lastTime: c.last_message_time,
      status: c.status,
      messageType: c.message_type,
      imageUrl: c.image_url,
      profilePicture: c.profile_picture // Pastikan nama properti konsisten
    }));

    // FORMAT GROUPS
    const formattedGroups = groups.map(g => {
      let lastMsg = g.last_message;
      if (!lastMsg && g.message_type === "image") {
        lastMsg = "📷 Foto";
      }

      return {
        type: 'group',
        id: g.group_id,
        name: g.group_name,
        lastMessage: lastMsg || "Belum ada pesan",
        lastTime: g.last_message_time,
        sender: g.sender_username,
        messageType: g.message_type, // Tambahkan ini
        imageUrl: g.image_url,       // Tambahkan ini
        profilePicture: g.profile_picture // Tambahkan ini agar grup bisa punya foto
      };
    });

    const combined = [...formattedContacts, ...formattedGroups]
      .sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime));

    dataGlobal = combined;
    listContact(combined);
  } catch (error) {
    console.error('Gagal memuat kontak/grup:', error);
    const contactsList = document.getElementById('contacts-list');

      contactsList.innerHTML = `

        <div class="error-state">

          <i class="fas fa-exclamation-triangle fa-3x mb-3 text-danger"></i>

          <h5 class="text-danger">Gagal memuat data</h5>

          <p class="text-muted">${error.message}</p>

          <button class="btn btn-retry" onclick="loadAllChatList()">

            <i class="fas fa-sync-alt"></i> Coba Lagi

          </button>

        </div>

      `;
  }
}

export function listContact(combinedList) {
  const contactsList = document.getElementById('contacts-list');
  if (!contactsList) return;

  contactsList.innerHTML = combinedList.map(item => {
    const time = item.lastTime ? formatDate(item.lastTime) : '';

    // 1. LOGIKA PESAN
    const rawContent = item.lastMessage || '';
    const hasImageUrl = item.imageUrl && item.imageUrl !== 'null';
    const isImageFormatLama = rawContent.includes('http://localhost:3000/uploads/');
    const isImageFormatBaru = item.messageType === 'image';

    let displayMsg = '';
    if (isImageFormatBaru || hasImageUrl || isImageFormatLama) {
      const caption = (rawContent && !isImageFormatLama) ? rawContent : 'Gambar';
      displayMsg = `<i class="bi bi-camera-fill"></i> ${caption}`;
    } else {
      displayMsg = rawContent || 'Tidak ada pesan';
    }

    // 2. LOGIKA FOTO (Berlaku untuk User & Group)
    const pic = item.profilePicture; // Sesuaikan dengan properti di loadAllChatList
    const hasPhoto = pic && 
                     pic !== 'null' && 
                     String(pic).trim() !== '';

    const avatarInner = hasPhoto
      ? `<img src="http://localhost:3000/uploads/profile/${pic}" 
              alt="Foto" 
              class="contact-profile-photo" 
              onerror="this.parentElement.innerHTML='${item.name.charAt(0).toUpperCase()}';this.parentElement.classList.remove('contact-avatar--photo')"
              loading="lazy">`
      : item.name.charAt(0).toUpperCase();

    // 3. RENDER HTML USER
    if (item.type === 'user') {
      const status = item.status === 'online' ? 'online' : 'offline';
      return `
        <div class="contact-card" data-user-id="${item.id}" data-conversation-id="${item.conversationId}">
          <div class="contact-main">
            <div class="contact-avatar ${hasPhoto ? 'contact-avatar--photo' : 'bg-secondary text-white'}">
              ${avatarInner}
            </div>
            <div class="contact-info">
              <div class="contact-header">
                <h5 class="contact-name">${item.name}</h5>
                <span class="message-time">${time}</span>
              </div>
              <div class="contact-status-row">
                <span class="status-indicator ${status}"></span>
                <span class="status-text">${status}</span>
              </div>
              <p class="last-message text-truncate">${displayMsg}</p>
            </div>
          </div>
          <button class="btn btn-chat" onClick="startChat({otherUserId: ${item.id}, username: '${item.name}',image: '${item.profilePicture}'})">
            <i class="fas fa-comment-dots"></i> Chat
          </button>
        </div>`;
    }

    // 4. RENDER HTML GROUP
    if (item.type === 'group') {
      return `
        <div class="contact-card" data-group-id="${item.id}">
          <div class="contact-main">
            <div class="contact-avatar ${hasPhoto ? 'contact-avatar--photo' : 'bg-primary text-white'}">
              ${avatarInner}
            </div>
            <div class="contact-info">
              <div class="contact-header">
                <h5 class="contact-name"><small class="nama-grup">Group:</small> ${item.name}</h5>
                <span class="message-time">${time}</span>
              </div>
              <p class="last-message text-truncate">
                <strong>${item.sender || ''}:</strong> ${displayMsg}
              </p>
            </div>
          </div>
          <button class="btn btn-chat" onClick="window.location.href='contact.html?grupId=${item.id}&username=${item.name}&image=${pic}'">
            <i class="fas fa-comment-dots"></i> Chat
          </button>
        </div>`;
    }
    return '';
  }).join('');
}


  //mulai chat personal 
   export async function startChat(datanya) {
    const otherUserId = datanya.otherUserId
    const username = datanya.username
    const image = datanya.image
    
  
    try {
      if (!otherUserId || isNaN(otherUserId)) {
        throw new Error('ID kontak tidak valid');
      }
  
      const response = await fetch('http://localhost:3000/api/conversations/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ otherUserId }) // ⬅️ hanya kirim ini
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.message || "Terjadi kesalahan";
        if (response.status === 401) {
          window.location.href = 'login.html?error=unauthorized';
          return; // Stop eksekusi
        }
    
        throw new Error(errorMsg); // Lempar error untuk ditangkap di catch
      }
      // jika berhasil
      const data = await response.json();
      if (!data.conversationId) {
        throw new Error("ID percakapan tidak ditemukan");
      }
      window.location.href = `contact.html?conversationId=${data.conversationId}&username=${username}&image=${image}`;
  
    } catch (error) {
      console.error('Error:', error);
      alert(error.message.includes('User tidak valid')
        ? `Kontak tidak valid. Pastikan user ada di sistem.\n${error.message}`
        : `token sudah kadaluarsa: ${error.message}`
      );
      window.location.href = 'login.html?error=unauthorized'
    }
  }

  export function mapSearchUsers(users) {
    return users.map(user => ({
      id: user.user_id,
      name: user.username,
      status: user.status,
      lastMessage: '',
      lastTime: '',
      type: 'user',
      profilePicture: user.profile_picture || user.profil || null
    }));
  }