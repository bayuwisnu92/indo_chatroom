
const token = localStorage.getItem('token');
let currentUserId = null;
let dataGlobal = []
let currentGrupId = null; // Tambahkan ini di baris paling atas file

if (!token) {
  window.location.href = 'login.html';
} else {
  verifyToken(token)
    .then(userData => {
      
      const user = userData.user || {};
      currentUserId = user.user_id || user.id || decodeToken(token); // fallback terakhir

      // Validasi user ID
      if (!currentUserId) {
        throw new Error("User ID tidak ditemukan di token atau respons");
      }
      loadProtectedContent(userData);
      
      
    })
    .catch(error => {
      console.error('Authentication error:', error);
      localStorage.removeItem('token');
      logoutOnline()
      window.location.href = 'login.html';
    });
}

// Fungsi verifikasi token
async function verifyToken(token) {
  try {
    const response = await fetch('https://projects-cherry-liabilities-dan.trycloudflare.com/api/verify-token', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Authentication failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Verify token error:', error);
    throw error;
  }
}

// Fungsi tampilkan konten
function loadProtectedContent(userData) {
    try {
      // 1. Debug: Tampilkan isi lengkap userData
      // console.log('Parsed user data:', JSON.parse(JSON.stringify(userData)));
      
      // 2. Akses data dengan benar
      const user = userData.user || {};
      const username = user.username || 'Guest';
      const userId = user.id || 'N/A';
      document.title = `Chat App - ${username}`; // ⬅️ Tambahkan ini
      // 3. Update DOM
      const homeElement = document.getElementById('home');
      if (homeElement) {
        homeElement.textContent = `${username} (ID: ${userId})`;
      }
  
    
      document.getElementById('logout').addEventListener('click', async () => {
        try{
          const response = await fetch('https://projects-cherry-liabilities-dan.trycloudflare.com/api/logout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          if(response.status === 200){
            showAlert('Logout berhasil!', 'success');
            localStorage.removeItem('token');
            window.location.href = 'login.html';
          }
        } catch (error) {
          console.error('Logout error:', error);
          showAlert('Logout gagal!', 'danger');
        }
      });
  

      
    } catch (error) {
      console.error('Error loading content:', error);
      document.body.innerHTML = `
        <p>Error loading user data. Please <a href="login.html">login again</a>.</p>
      `;
    }
  }

async function logoutOnline(){
  try{
    const response = await fetch('https://projects-cherry-liabilities-dan.trycloudflare.com/api/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if(response.status === 200){
      showAlert('Logout berhasil!', 'success');
      window.location.href = '/views/login.html';
    }
  } catch (error) {
    console.error('Logout error:', error);
    showAlert('Logout gagal!', 'danger');
  }
}

// Ambil daftar kontak dari backend
async function loadAllChatList() {
  try {
    const [contactRes, groupRes] = await Promise.all([
      fetch('https://projects-cherry-liabilities-dan.trycloudflare.com/api/contacts', {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch('https://projects-cherry-liabilities-dan.trycloudflare.com/api/allGroup', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
    ]);

    if (contactRes.status === 401 || groupRes.status === 401) {
      showAlert('Sesi habis! Silakan login lagi.', 'danger');
      localStorage.removeItem('token');
      logoutOnline();
      setTimeout(() => {
        window.location.href = '/views/login.html';
      }, 1500);
      return;
    }

    if (!contactRes.ok || !groupRes.ok) {
      throw new Error(`Gagal memuat data!`);
    }

    const contacts = await contactRes.json();
    const groups = await groupRes.json();

    // Di dalam loadAllChatList() bagian formattedContacts
    const formattedContacts = contacts.map(c => ({
      type: 'user',
      id: c.user_id,
      conversationId: c.conversation_id,
      name: c.username,
      lastMessage: c.last_message, 
      lastTime: c.last_message_time,
      status: c.status,
      // TAMBAHKAN DUA BARIS INI:
      messageType: c.message_type, 
      imageUrl: c.image_url 
    }));
    formattedContacts.forEach(c => {
      conversationMap[c.conversationId] = c.id;
    });
    const formattedGroups = groups.map(g => ({
      type: 'group',
      id: g.group_id,
      name: g.group_name,
      lastMessage: g.last_message,
      lastTime: g.last_message_time,
      sender: g.sender_username
    }));

    // Gabungkan dan sortir berdasarkan waktu pesan terakhir
    const combined = [...formattedContacts, ...formattedGroups]
      .sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime));

    // Simpan ke global jika perlu
    dataGlobal = combined;

    // Render semua dengan 1 fungsi
    listContact(combined);
    console.log("conversationMap:", conversationMap);
  } catch (error) {
    console.error('Gagal memuat kontak/grup:', error);
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


// Fungsi untuk menampilkan alert
function showAlert(message, type) {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
  alertDiv.role = 'alert';
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  document.body.prepend(alertDiv);
  
  // Hilangkan alert setelah 3 detik
  setTimeout(() => {
    alertDiv.classList.remove('show');
    setTimeout(() => alertDiv.remove(), 150);
  }, 3000);
}
// Mulai percakapan dengan user tertentu
async function startChat(datanya) {
  const otherUserId = datanya.otherUserId
  const username = datanya.username
  

  try {
    if (!otherUserId || isNaN(otherUserId)) {
      throw new Error('ID kontak tidak valid');
    }

    const response = await fetch('https://projects-cherry-liabilities-dan.trycloudflare.com/api/conversations/start', {
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
    window.location.href = `contact.html?conversationId=${data.conversationId}&username=${username}`;

  } catch (error) {
    console.error('Error:', error);
    alert(error.message.includes('User tidak valid')
      ? `Kontak tidak valid. Pastikan user ada di sistem.\n${error.message}`
      : `token sudah kadaluarsa: ${error.message}`
    );
    window.location.href = 'login.html?error=unauthorized'
  }
}
const pencarian = document.getElementById("pencarian");

let timeout;

pencarian.addEventListener("input", function () {

  clearTimeout(timeout);

  timeout = setTimeout(async () => {

    const keyword = this.value.trim();

    if (keyword.length < 2) {
      listContact(dataGlobal);
      return;
    }

    try {

      const res = await fetch(`https://projects-cherry-liabilities-dan.trycloudflare.com/api/users/search?q=${keyword}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const users = await res.json();

      const mappedUsers = mapSearchUsers(users);

      listContact(mappedUsers);

    } catch (err) {
      console.error("Search error:", err);
    }

  }, 300);

});

// Muat daftar kontak saat halaman terbuka
loadAllChatList()
function listContact(combinedList) {
  const contactsList = document.getElementById('contacts-list');
  // ... (spinner loading tetap ada) ...

  contactsList.innerHTML = combinedList.map(item => {
    const time = item.lastTime ? formatDate(item.lastTime) : '';
    
    // AMBIL DATA PESAN
    const rawContent = item.lastMessage || '';
    const hasImageUrl = item.imageUrl && item.imageUrl !== 'null';
    const isImageFormatLama = rawContent.includes('https://projects-cherry-liabilities-dan.trycloudflare.com/uploads/');
    const isImageFormatBaru = item.messageType === 'image';

    let displayMsg = '';

    // LOGIKA PENENTUAN ICON
    if (isImageFormatBaru || hasImageUrl || isImageFormatLama) {
      // Jika ada teks caption (format baru) atau teks selain URL (format lama)
      const caption = (rawContent && !isImageFormatLama) ? rawContent : 'Gambar';
      displayMsg = `<i class="bi bi-camera-fill"></i> ${caption}`;
    } else {
      displayMsg = rawContent || 'Tidak ada pesan';
    }

    // Render HTML (User atau Group)
    if (item.type === 'user') {
      const status = item.status === 'online' ? 'online' : 'offline';
      return `
        <div class="contact-card" data-user-id="${item.id}" data-conversation-id="${item.conversationId}">
          <div class="contact-main">
            <div class="contact-avatar">${item.name.charAt(0).toUpperCase()}</div>
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
          <button class="btn btn-chat" onClick="startChat({otherUserId: ${item.id}, username: '${item.name}'})">
            <i class="fas fa-comment-dots"></i> Chat
          </button>
        </div>`;
    }
    
    // Render HTML Group
    if (item.type === 'group') {
      return `
        <div class="contact-card" data-group-id="${item.id}">
          <div class="contact-main">
            <div class="contact-avatar bg-primary text-white">${item.name.charAt(0).toUpperCase()}</div>
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
          <button class="btn btn-chat" onClick="window.location.href='contact.html?grupId=${item.id}&username=${item.name}'">
            <i class="fas fa-comment-dots"></i> Chat
          </button>
        </div>`;
    }
    return '';
  }).join('');
}

function mapSearchUsers(users) {
  return users.map(user => ({
    id: user.user_id,
    name: user.username,
    status: user.status,
    lastMessage: '',
    lastTime: '',
    type: 'user'
  }));
}


const formGroup = document.getElementById('formGroup');
formGroup.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  try {
    const nameInput = document.getElementById('name'); // Pastikan ID-nya ada di HTML
    const name = nameInput.value;

    // Validasi input
    if (!name.trim()) {
      showAlert('Nama grup tidak boleh kosong', 'danger');
      return;
    }

    const response = await fetch('https://projects-cherry-liabilities-dan.trycloudflare.com/api/newGroup', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json' // ✅ Penting!
      },
      body: JSON.stringify({ name: name })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = await response.json();
    
    if (json.status === 'success') {
      showAlert('Grup berhasil dibuat', 'success');
      loadAllChatList()
      formGroup.reset();
    } else {
      showAlert(json.message || 'Grup gagal dibuat', 'danger'); // Tampilkan pesan error dari server
    }
  } catch (error) {
    console.error('Error:', error);
    showAlert('Terjadi kesalahan saat membuat grup', 'danger');
  }
});

function formatDate(isoString) {
  if (!isoString) return '';
  
  const date = new Date(isoString);
  const now = new Date();
  
  // Jika kurang dari 1 menit lalu
  const diffMinutes = Math.floor((now - date) / 60000);
  if (diffMinutes < 1) return 'Baru saja';
  
  // Jika hari ini
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // Jika kemarin
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Kemarin';
  }
  
  // Format tanggal
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short'
  });
}

const urlParams = new URLSearchParams(window.location.search);
const conversationId = urlParams.get('conversationId');
const lawanChat =urlParams.get('username');

const grupId = urlParams.get('grupId')

const socket = io("https://projects-cherry-liabilities-dan.trycloudflare.com", {
  auth: {
    token: token
  }
});
socket.on("connect", () => {
  console.log("Socket connected:", socket.id);

  // 1. Join ke room pribadi (WAJIB agar bisa terima update list kapan saja)
  if (currentUserId) {
    socket.emit("joinPersonalRoom", currentUserId); 
  }

  // 2. Join ke conversation/group jika ada di URL
  if (conversationId) socket.emit("joinConversation", conversationId);
  if (grupId) socket.emit("joinGroup", grupId);
});


// Contoh fungsi saat user klik salah satu grup di UI
function bukaGrup(idGrup) {
  currentGrupId = idGrup; // Simpan ID grup yang sedang dibuka ke variabel global
  
  // BERITAHU BACKEND: "Saya mau masuk ke room grup ini"
  socket.emit("joinGroup", idGrup); 
  
  loadMessagesGrup(idGrup); // Ambil history chat
}

// Letakkan ini di luar fungsi manapun agar selalu aktif
socket.on("newGroupAssigned", (data) => {
  console.log("Sinyal grup baru diterima:", data);
  
  // 1. Refresh daftar chat/kontak di sidebar agar grup baru muncul
  if (typeof loadAllChatList === 'function') {
      loadAllChatList();
  }

  // 2. Tampilkan notifikasi (opsional)
  if (typeof showAlert === 'function') {
      showAlert(data.message);
  } else {
      alert(data.message);
  }
});

socket.on("newGroupMessage", (data) => {
  console.log("Ada pesan grup baru masuk:", data);

  // CEK: Apakah pesan ini milik grup yang sedang saya buka?
  // Gunakan 'groupId' (pastikan backend mengirim property ini di objek result)
  if (data.groupId == currentGrupId) {
    appendMessage(data)
      scrollToBottom(); // Scroll otomatis ke bawah
  } else {
      // Opsi: Tampilkan notifikasi atau update angka "unread" di daftar grup
      console.log("Pesan masuk di grup lain");
      loadAllChatList(); // Update preview pesan terakhir di sidebar
  }
});

socket.on("updateGroupContactList", (data) => {
  console.log("Update sidebar grup:", data);
  loadAllChatList(); // Panggil fungsi yang me-refresh daftar chat di samping
});
socket.on("user_status", (data) => {

  // update contact list
  const contact = document.querySelector(`[data-user-id="${data.userId}"]`);

  if (contact) {
    const indicator = contact.querySelector(".status-indicator");
    const text = contact.querySelector(".status-text");

    if (indicator && text) {
      indicator.classList.remove("online", "offline");
      indicator.classList.add(data.status);

      text.textContent = data.status === "online" ? "Online" : "Offline";
    }
  }

  // =========================
  // update header chat realtime
  // =========================
  const headerIndicator = document.querySelector("#chat-name .status-indicator");
  const headerText = document.querySelector("#chat-name .status-text");

  if (headerIndicator && headerText) {
    headerIndicator.classList.remove("online", "offline");
    headerIndicator.classList.add(data.status);

    headerText.textContent = data.status === "online" ? "Online" : "Offline";
  }

});
socket.on("messageDeleted", (data) => {

  const msg = document.querySelector(`[data-id="${data.messageId}"]`);

  if (msg) {
    msg.remove();
  }

});

socket.on("messageEdited", (data) => {

  console.log("EDIT REALTIME:", data); // debug

  const msg = document.querySelector(`[data-id="${data.messageId}"]`);

  if (msg) {

    const username = msg.getAttribute("data-username") || "User";

    msg.querySelector("p").innerHTML = `
      <strong>${username}:</strong> ${renderContent(data.content)} 
      <small>(edited)</small>
    `;

  }

});


document.getElementById('chat-form').addEventListener('submit', (e) => {
  e.preventDefault();
  sendMessage();
});

async function sendMessage() {

  const messageInput = document.getElementById('message-input');
  const fileInput = document.getElementById('file-input');

  const content = messageInput.value.trim();
  const file = fileInput.files[0];

  if (!content && !file) return;

  const formData = new FormData();
  formData.append('content', content);

  if (file) {
    formData.append('image', file);
  }

  if (grupId) {

    await sendMessageGrup();

  } else if (conversationId) {

    try {

      const response = await fetch(`https://projects-cherry-liabilities-dan.trycloudflare.com/api/${conversationId}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {

        messageInput.value = '';
        fileInput.value = '';

      } else {

        alert('Gagal mengirim pesan!');

      }

    } catch (error) {

      console.error('Error:', error);

    }
  }
}
function appendMessage(message) {
  const chatBox = document.getElementById("messages");
  if (!chatBox) return;

  const isSent = message.senderId == currentUserId;
  const kelas = isSent ? 'message sent' : 'message received';
  const username = message.senderName || 'User';

  let bodyHtml = '';
  // Jika pesan mengandung image (dari socket biasanya membawa imageUrl atau messageType)
  if (message.messageType === 'image' || message.imageUrl) {
    bodyHtml = `
      <img src="https://projects-cherry-liabilities-dan.trycloudflare.com/uploads/${message.imageUrl}" class="chat-image mb-2" style="max-width: 200px; border-radius: 8px;">
      ${message.content ? `<p class="mb-0">${renderContent(message.content)}</p>` : ''}`;
  } else {
    bodyHtml = renderContent(message.content || message.message_text);
  }

  const div = document.createElement("div");
  div.className = kelas;
  div.setAttribute("data-id", message.messageId);

  div.innerHTML = `
    <div class="message-content shadow-sm">
      <small class="d-block fw-bold mb-1">${username}</small>
      ${bodyHtml}
      <span class="new-message-badge" style="font-size: 9px; color: #dc3545;">baru</span>
    </div>
    <div class="message-time">${new Date(message.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
  `;

  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}
let conversationMap = {};
socket.on("newMessage", (message) => {
  console.log("Pesan baru masuk untuk list:", message);

  // A. Jika room chat yang bersangkutan sedang terbuka, tambah bubble chat
  if (conversationId && message.conversationId == conversationId) {
    appendMessage(message);
  }
  if (grupId && message.groupId == grupId) {
    appendMessage(message);
  }

  // B. UPDATE CONTACT LIST (Harus jalan terus terlepas chat sedang terbuka atau tidak)
  updateContactRealtime(message);
});
socket.on("updateContactList", (data) => {
  // Cari element kartu chat berdasarkan conversationId
  const contactCard = document.querySelector(`[data-conversation-id="${data.conversationId}"]`);
  const container = document.getElementById("contacts-list");

  if (contactCard) {
    // 1. Update pesan terakhir & waktu
    const lastMsg = contactCard.querySelector(".last-message");
    const timeMsg = contactCard.querySelector(".message-time");
    
    if (lastMsg) lastMsg.textContent = data.content;
    if (timeMsg) timeMsg.textContent = "Baru saja";

    // 2. Pindahkan ke posisi paling atas
    container.prepend(contactCard);
    
    // 3. Tambahkan efek 'blink' biar keren
    contactCard.style.transition = "background 0.5s";
    contactCard.style.backgroundColor = "#e8f0fe";
    setTimeout(() => { contactCard.style.backgroundColor = ""; }, 1000);
  } else {
    // Jika kontaknya belum ada di list (chat baru), ambil ulang list dari API
    loadAllChatList();
  }
});
function updateContactRealtime(message) {
  const container = document.getElementById("contacts-list");
  if (!container) return;

  let selector = message.conversationId
    ? `[data-conversation-id="${message.conversationId}"]`
    : `[data-group-id="${message.groupId}"]`;

  let contactElem = document.querySelector(selector);

  if (contactElem) {
    const lastMsgElem = contactElem.querySelector(".last-message");

    if (lastMsgElem) {
      // LOGIKA BARU: Cek tipe pesan
      let textDisplay = "";
      
      if (message.messageType === 'image' || message.imageUrl) {
        // Jika ada teks caption, tampilkan. Jika tidak, tampilkan label Gambar
        textDisplay = message.content ? `📷 ${message.content}` : "📷 Gambar";
      } else {
        textDisplay = message.content || "Pesan baru";
      }

      // Format tampilan untuk Grup (Nama Pengirim: Pesan)
      lastMsgElem.textContent = message.groupId
        ? `${message.senderName}: ${textDisplay}`
        : textDisplay;

      // Tandai pesan baru
      if (message.senderId != currentUserId) {
        lastMsgElem.classList.add("new-message");
      }
    }

    const timeElem = contactElem.querySelector(".message-time");
    if (timeElem) timeElem.textContent = "Baru saja";

    container.prepend(contactElem);
  } else {
    loadAllChatList();
  }
}

// ============================
// Fungsi: Ambil Pesan
// ============================
if (conversationId && !isNaN(conversationId)) {
  document.querySelector('.chat-container').style.display = 'block';
  loadMessages();

  // Hanya sembunyikan kontak jika di layar kecil (max-width: 768px)
  if (window.innerWidth <= 768) {
    document.getElementById('kontak').style.display = 'none';
  }

} else if (grupId && !isNaN(grupId)) {
  document.querySelector('.chat-container').style.display = 'block';
  loadMessagesGrup();

  if (window.innerWidth <= 768) {
    document.getElementById('kontak').style.display = 'none';
  }

} else {
  document.querySelector('.chat-container').style.display = 'none';
  document.getElementById('pesanBelumada').innerHTML = `
    <i class="bi bi-chat-dots"></i> <span>Silahkan pilih orang untuk chat</span>`;
}

function showContacts() {
  document.getElementById('kontak').style.display = 'block';
  document.querySelector('.chat-container').style.display = 'none';
}

let lawanChatId = null;
async function loadMessages() {
  socket.emit("joinConversation", conversationId);
  try {
    const response = await fetch(`https://projects-cherry-liabilities-dan.trycloudflare.com/api/${conversationId}/messages`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      document.getElementById('messages').textContent = 'Gagal memuat pesan.';
      return;
    }

    const data = await response.json();
    const messages = data.messages || [];
    const lawanChat = data.lawanChat || {};

    const isipesan = document.getElementById('messages');
    const namachat = document.getElementById('chat-name');

    isipesan.innerHTML = '';

    // Render Header
    const statusnya = lawanChat.status === 'online' ? 'online' : 'offline';
    namachat.innerHTML = `
      <div class="chat-header">
        <strong>#${lawanChat.username || 'Lawan Chat'}</strong>
        <div class="contact-status">
          <span class="status-indicator ${statusnya}"></span>
          <span class="status-text">${statusnya}</span>
        </div>
      </div>`;

    // ... kode header tetap sama ...

messages.forEach(p => {
  const isSent = p.sender.id === currentUserId;
  const kelas = isSent ? 'message sent' : 'message received';
  const username = p.sender.username || 'Anonim';

  let bodyPesan = '';

  // PERBAIKAN DI SINI: Gunakan messageType dan imageUrl (CamelCase)
  // Sesuai dengan mapping di ChatController: messages = rawMessages.map(msg => ({ messageType: msg.message_type ... }))
  
  if (p.messageType === 'image' && p.imageUrl) {
    bodyPesan = `
      <div class="chat-image-container">
        <img src="https://projects-cherry-liabilities-dan.trycloudflare.com/uploads/${p.imageUrl}" 
             alt="image" 
             class="chat-image img-fluid" 
             style="max-width: 200px; border-radius: 8px; cursor: pointer; display: block;"
             onclick="window.open(this.src)">
        ${p.content ? `<p class="mt-2 mb-0">${renderContent(p.content)}</p>` : ''}
      </div>`;
  } else {
    bodyPesan = renderContent(p.content || '');
  }

  // Gunakan p.messageType juga untuk pengecekan tombol edit
  const tombolHapus = isSent ? `<button class="btn btn-sm btn-outline-danger border-0" onclick="deleteMessage(${p.messageId})"><i class="bi bi-trash"></i></button>` : '';
  const tombolEdit = (isSent && p.messageType === 'text') ? `<button class="btn btn-sm btn-outline-primary border-0" onclick="editMessage(${p.messageId})"><i class="bi bi-pencil"></i></button>` : '';

  const pesanHtml = `
    <div class="${kelas}" data-id="${p.messageId}">
      <div class="message-content shadow-sm">
        <p class="mb-1">
          <strong>${username}:</strong> ${bodyPesan}
        </p>
        <div class="text-end">${tombolEdit} ${tombolHapus}</div>
      </div>
      <div class="message-time">${new Date(p.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
    </div>
  `;

  isipesan.insertAdjacentHTML('beforeend', pesanHtml);
});

// ... scroll ke bawah ...

    isipesan.scrollTop = isipesan.scrollHeight;

  } catch (error) {
    console.error('Gagal memuat pesan:', error);
  }
}

function renderContent(content) {
  // Jika content null atau undefined, kembalikan string kosong
  if (!content) return "";
  
  // Sanitasi teks dari tag HTML
  return content.toString().replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function loadMessagesGrup() {
  try {
    const response = await fetch(`https://projects-cherry-liabilities-dan.trycloudflare.com/api/grup/${grupId}/messages`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      if (response.status === 401) window.location.href = 'login.html';
      return;
    }

    const data = await response.json(); 
    const messages = data.messages; // Array pesan hasil mapping backend
    const myRole = data.role;       // 'admin' atau 'member'

    const isipesan = document.getElementById('messages');
    const namachat = document.getElementById('chat-name');

    // 1. Render Header (Nama Grup + Role + Tombol Add Member)
    const badgeColor = myRole === 'admin' ? 'bg-danger' : 'bg-secondary';
    let tombolAdd = '';
    
    if (myRole === 'admin') {
      tombolAdd = `
        <button id="btn_add_member" class="btn btn-sm btn-success shadow-sm">
          <i class="bi bi-person-plus-fill"></i> Add Member
        </button>`;
    }

    namachat.innerHTML = `
      <div class="d-flex justify-content-between align-items-center w-100">
        <div>
          <span class="fw-bold fs-5">#${lawanChat}</span>
          <span class="badge ${badgeColor} ms-1" style="font-size: 10px; vertical-align: middle;">
            ${myRole.toUpperCase()}
          </span>
        </div>
        ${tombolAdd}
      </div>
    `;

    // Pasang listener jika tombol render (untuk admin)
    if (myRole === 'admin') {
      document.getElementById('btn_add_member').addEventListener('click', () => {
        showAddMember(grupId, lawanChat);
      });
    }

    // 2. Render Daftar Pesan
    isipesan.innerHTML = ''; 
    
    if (!messages || messages.length === 0) {
      isipesan.innerHTML = `
        <div class="text-center text-muted my-5">
          <i class="bi bi-chat-dots fs-1 d-block mb-2"></i>
          Belum ada pesan di grup ini.
        </div>`;
    } else {
      messages.forEach(p => {
        // PENTING: Gunakan p.sender.id karena di backend kamu bungkus dalam objek sender
        const isSent = p.sender.id === currentUserId; 
        const kelas = isSent ? 'message sent' : 'message received';
        
        // PENTING: Gunakan p.sender.username agar tidak jadi "Anonim"
        const username = p.sender.username || 'User';
        
        // Tombol Edit/Hapus (Hanya muncul jika pesan milik sendiri)
        const tombolEdit = isSent ? `
          <button class="btn btn-sm btn-link text-primary p-0 me-1" onclick="editMessageGrup(${p.messageId})">
            <i class="bi bi-pencil-square"></i>
          </button>` : '';
          
        const tombolHapus = isSent ? `
          <button class="btn btn-sm btn-link text-danger p-0" onclick="deleteMessageGrup(${p.messageId})">
            <i class="bi bi-trash3"></i>
          </button>` : '';

          const pesanHtml = `
          <div class="${kelas}" data-id="${p.messageId}" data-username="${username}">
            <p>
              <strong>${username}:</strong> ${renderContent(p.content)}
              ${tombolEdit}
              ${tombolHapus}
            </p>
            <div class="message-time">
              ${new Date(p.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
            </div>
          </div>
        `;
        isipesan.insertAdjacentHTML('beforeend', pesanHtml);
      });
    }

    // Auto-scroll ke pesan paling bawah
    isipesan.scrollTop = isipesan.scrollHeight;

  } catch (error) {
    console.error('Gagal memuat pesan:', error);
  }
}
// Fungsi untuk memunculkan input tambah member
function showAddMember(groupId, groupName) {

  console.log("Tombol Add Member diklik");

  const section = document.getElementById('add-member-section');
  const targetNameSpan = document.getElementById('target-group-name');

  if (section) {
      section.style.display = 'block';
      section.dataset.activeGroupId = groupId;

      if (targetNameSpan) {
          targetNameSpan.innerText = `Tambah ke Grup: ${groupName}`;
      }
  } else {
      console.log("add-member-section tidak ditemukan");
  }
}

// Fungsi untuk sembunyikan input
function hideAddMember() {
  const section = document.getElementById('add-member-section');
  if (section) section.style.display = 'none';
}

// Listener untuk input pencarian
document.getElementById('search-username').addEventListener('input', async (e) => {
  const query = e.target.value;
  const resultsContainer = document.getElementById('search-results');
  const btnSubmit = document.getElementById('btn-submit-member');
  const targetIdInput = document.getElementById('target-user-id');

  // Kosongkan dan matikan tombol jika input kosong
  if (query.length < 2) {
      resultsContainer.innerHTML = '';
      btnSubmit.disabled = true;
      targetIdInput.value = '';
      return;
  }

  try {
      console.log("Mencari user:", query); // Debugging
      const response = await fetch(`https://projects-cherry-liabilities-dan.trycloudflare.com/api/usersgrup/search?username=${query}`, {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const users = await response.json();
      console.log("Hasil pencarian:", users); // Debugging

      resultsContainer.innerHTML = '';

      if (users.length === 0) {
          resultsContainer.innerHTML = '<div class="list-group-item small text-muted">User tidak ditemukan</div>';
          return;
      }

      users.forEach(user => {
          const item = document.createElement('button');
          item.className = 'list-group-item list-group-item-action small py-2';
          item.type = 'button';
          item.innerHTML = `<i class="bi bi-person"></i> ${user.username}`;
          
          item.onclick = () => {
              // Saat nama dipilih
              targetIdInput.value = user.user_id;
              document.getElementById('search-username').value = user.username;
              resultsContainer.innerHTML = ''; // Tutup dropdown
              btnSubmit.disabled = false; // Aktifkan tombol Tambahkan
              console.log("User dipilih ID:", user.user_id);
          };
          resultsContainer.appendChild(item);
      });
  } catch (err) {
      console.error("Error saat mencari user:", err);
  }
});
async function submitAddMember() {
  const section = document.getElementById('add-member-section');
  const groupId = section.dataset.activeGroupId;
  const targetUserId = document.getElementById('target-user-id').value;

  if (!targetUserId) {
      return alert("Masukkan User ID-nya dulu!");
  }

  try {
      const response = await fetch(`https://projects-cherry-liabilities-dan.trycloudflare.com/api/grup/${groupId}/add-member`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ targetUserId: targetUserId })
      });

      const result = await response.json();

      if (response.ok) {
          alert("Mantap! Anggota berhasil ditambahkan.");
          document.getElementById('target-user-id').value = '';
          hideAddMember();
      } else {
          alert(`Gagal: ${result.message}`);
          console.log('ada yang salah')
      }
  } catch (error) {
      console.error("Error submit member:", error);
      alert("Terjadi kesalahan koneksi ke server.");
  }
}
// ============================
// Fungsi: Delete Pesan
// ============================
async function deleteMessage(messageId) {
  
  const konfirmasi = confirm('Yakin ingin menghapus pesan ini?');

  if (!konfirmasi) return; // Kalau user batal, jangan lanjut

  try {
    const response = await fetch(`https://projects-cherry-liabilities-dan.trycloudflare.com/api/hapuspesan/${messageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      
      loadAllChatList();
    } else {
      alert('Gagal menghapus pesan!');
    }
  } catch (err) {
    console.error('Error:', err);
    alert('Gagal menghapus pesan. Silakan coba lagi.');
  }
}
async function deleteMessageGrup(messageId) {
  
  const konfirmasi = confirm('Yakin ingin menghapus pesan ini?');

  if (!konfirmasi) return; // Kalau user batal, jangan lanjut

  try {
    const response = await fetch(`https://projects-cherry-liabilities-dan.trycloudflare.com/api/delete/grup/${messageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    result = await response.json()
    if (response.ok) {
      loadMessagesGrup(); // Refresh ulang chat
      loadAllChatList();
      showAlert(` ${result.message}`)
    } else {
      showAlert(`Gagal menghapus pesan! ${result.message}`);
    }
  } catch (err) {
    console.error('Error:', err.message);
    alert(`Gagal menghapus pesan. Silakan coba lagi. ${err.message}`);
  }
}
async function editMessage(messageId) {
  try {
    // Ambil pesan lama
    const resGet = await fetch(`https://projects-cherry-liabilities-dan.trycloudflare.com/api/editpesan/${messageId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await resGet.json();
    const pesanLama = data;
    const pesanBaru = prompt( 'Ubah pesan:', pesanLama);

    if (!pesanBaru) {
      alert('Pesan tidak boleh kosong!');
      return;
    }

    // Kirim update ke server
    const resUpdate = await fetch(`https://projects-cherry-liabilities-dan.trycloudflare.com/api/updatepesan/${messageId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: pesanBaru })
    });

    if (resUpdate.ok) {
      showAlert('berhasil mengedit pesan')
      loadMessages(); // Refresh chat
      loadAllChatList();
    } else {
      alert('Gagal mengedit pesan!');
    }

  } catch (error) {
    console.error('Gagal mengedit pesan:', error);
    alert('Terjadi kesalahan saat mengedit pesan.');
  }
}
async function editMessageGrup(messageId) {
  try {
    // Ambil pesan lama
    const resGet = await fetch(`https://projects-cherry-liabilities-dan.trycloudflare.com/api/editpesangrup/${messageId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await resGet.json();
    const pesanLama = data;
    const pesanBaru = prompt( 'Ubah pesan:', pesanLama);

    if (!pesanBaru) {
      alert('Pesan tidak boleh kosong!');
      return;
    }

    // Kirim update ke server
    const resUpdate = await fetch(`https://projects-cherry-liabilities-dan.trycloudflare.com/api/updatepesangrup/${messageId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: pesanBaru })
    });

    if (resUpdate.ok) {
      console.log('berhasil mengedit pesan')
      loadMessagesGrup(); // Refresh chat
      loadAllChatList();
    } else {
      alert('Gagal mengedit pesan!');
    }

  } catch (error) {
    console.error('Gagal mengedit pesan:', error);
    alert('Terjadi kesalahan saat mengedit pesan.');
  }
}


// ============================
// Fungsi: Decode Token JWT
// ============================
function decodeToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.userId;
  } catch (err) {
    console.error('Gagal decode token:', err);
    return null;
  }
}

// untuk grup





async function sendMessageGrup() {
      const messageInput = document.getElementById('message-input');
      const content = messageInput.value.trim();
      const file = document.getElementById('file-input').files[0];
      if (!content && !file) return;
      const formData = new FormData();
      formData.append('content', content);
      if (file) {
      formData.append('image', file);
    }

  try {
    const response = await fetch(`https://projects-cherry-liabilities-dan.trycloudflare.com/api/grup/${grupId}/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (response.ok) {
      messageInput.value = '';
      loadMessagesGrup();
      loadAllChatList();
      console.log(`berhasil mengirim pesan`)
    } else {
      showAlert(`Gagal mengirim pesan!`);
    }
  } catch (error) {
    console.error('Error:', error.message);
    showAlert(`Gagal mengirim pesan. Silakan coba lagi. ${error.message}`);
  }
}