
import { renderContent } from "./utils.js";
// import { conversationId, grupId, token } from "./main.js";
import { showAlert, formatDate } from "./utils.js";
import { loadAllChatList } from "./contacts.js";
const token = localStorage.getItem('token')
const urlParams = new URLSearchParams(window.location.search);
const gambarprofile = urlParams.get('image');
const usernamegrup = urlParams.get('username')

// Sekarang kamu bisa pakai variabel 'gambarprofile' tanpa error



export async function loadMessages(conversationId, token, currentUserId, socket) {
    socket.emit("joinConversation", conversationId);
    if (!conversationId || isNaN(conversationId)) {
      return; // ⛔ STOP kalau invalid
    }
    try {
      const response = await fetch(`http://localhost:3000/api/${conversationId}/messages`, {
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
      const menu = document.getElementById('menu')
      const blokir = `<li><a class="dropdown-item text-danger" href="#"><i class="fas fa-ban me-2"></i>Blokir</a></li>`;
menu.insertAdjacentHTML('beforeend', blokir);
      // Render Header
      const statusnya = lawanChat.status === 'online' ? 'online' : 'offline';
      namachat.innerHTML = `
  <div class="chat-header-content d-flex align-items-center">
    <div class="header-avatar-wrapper position-relative">
      <img src="http://localhost:3000/uploads/profile/${gambarprofile}" 
           onerror="this.src='http://localhost:3000/uploads/profile/none.png'" 
           alt="Foto" 
           class="header-profile-image" width='40' height='40'>
      <span class="status-indicator-dot ${statusnya}"></span>
    </div>

    <div class="header-info-wrapper ms-3">
      <h6 class="mb-0 chat-user-name">${lawanChat.username || 'Lawan Chat'}</h6>
      <div class="status-detail">
        <span class="status-text-small">${statusnya}</span>
      </div>
    </div>
  </div>`;
  
      // ... kode header tetap sama ...
  
  messages.forEach(p => {
    const senderId = p.sender.id || p.sender.user_id;
    const isSent = String(senderId) === String(currentUserId);
    const kelas = isSent ? 'message sent' : 'message received';
    const username = p.sender.username || 'Anonim';
    let bodyPesan = '';
  
    // PERBAIKAN DI SINI: Gunakan messageType dan imageUrl (CamelCase)
    // Sesuai dengan mapping di ChatController: messages = rawMessages.map(msg => ({ messageType: msg.message_type ... }))
    
    if (p.messageType === 'image' && p.imageUrl) {
      bodyPesan = `
        <div class="chat-image-container">
          <img src="http://localhost:3000/uploads/${p.imageUrl}" 
               alt="image" 
               class="chat-image img-fluid" 
               style="max-width: 200px; border-radius: 8px; cursor: pointer; display: block;"
               onclick="window.open(this.src)">
          ${p.content ? `<span>${renderContent(p.content)}</span>` : ''}
        </div>`;
    } else {
      bodyPesan = renderContent(p.content || '');
    }
  
    // Gunakan p.messageType juga untuk pengecekan tombol edit
    const tombolHapus = isSent ? `<button class="btn btn-sm btn-outline-danger border-0" onclick="deleteMessage(${p.messageId})"><i class="bi bi-trash"></i></button>` : '';
    const tombolEdit = (isSent && p.messageType === 'text') ? `<button class="btn btn-sm btn-outline-primary border-0" onclick="editMessage(${p.messageId})"><i class="bi bi-pencil"></i></button>` : '';
  
    // Di dalam loadMessages (Private Chat)
const pesanHtml = `
<div class="${kelas}" data-id="${p.messageId}">
  <div class="message-bubble shadow-sm"> <span class="mb-1">
      <strong>${username}:</strong> 
    </span> <span class="message-text">${bodyPesan}</span>
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
  
  
  
  export async function loadMessagesGrup(grupId, token, currentUserId, lawanChat, socket) {
    const chatBox = document.getElementById('messages');
    chatBox.dataset.groupId = grupId;
    socket.emit("joinGroup", grupId);
    if (!grupId || isNaN(grupId)) {
      return; // ⛔ STOP
    }
    
    try {
      const response = await fetch(`http://localhost:3000/api/grup/${grupId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
  
      if (!response.ok) {
        if (response.status === 401) window.location.href = 'login.html';
        return;
      }
  
      const data = await response.json(); 
      const messages = data.messages.map(m => ({
        messageId: m.messageId,
        content: m.content,
        messageType: m.messageType,
        imageUrl: m.imageUrl,
        timestamp: m.timestamp,
        sender: m.sender
      }));
      const myRole = data.role;       // 'admin' atau 'member'
  
      const isipesan = document.getElementById('messages');
      const namachat = document.getElementById('chat-name');
  
      // 1. Render Header (Nama Grup + Role + Tombol Add Member)
      const badgeColor = myRole === 'admin' ? 'bg-danger' : 'bg-secondary';
      // let tombolAdd = '';
      
      if (myRole === 'admin') {
        const tombolAdd = `
          <li>
            <a class="dropdown-item" href="#" id="btn_add_member">
              <i class="fas fa-user-plus me-2"></i>Tambah Member
            </a>
          </li>
          <li><a class="dropdown-item" href="#" data-bs-toggle="modal" data-bs-target="#photogrup"><i class="fas fa-camera me-2"></i>Ganti Foto Grup</a></li>
        `;
        const menu = document.getElementById('menu');
        menu.insertAdjacentHTML('beforeend', tombolAdd);
      }

      const membergrup = `          <li>
            <a class="dropdown-item" href="#" data-bs-toggle="modal" data-bs-target="#anggotagrup" id='lihatanggotagrup'>
              <i class="fas fa-user-plus me-2"></i>lihat anggota grup
            </a>
          </li>`
          const menunya = document.getElementById('menu')
          menunya.insertAdjacentHTML('beforeend',membergrup)

          // tempat untuk menampung data anggota grup
  
  // yang menjadi triger menampilkan anggota grup

  const tombollihatgrup = document.getElementById('lihatanggotagrup');

if (tombollihatgrup) {
  tombollihatgrup.addEventListener('click', () => {
    console.log('Tombol ditekan! Aman, nggak ngantuk lagi.');

    manampilkanmember(grupId)
  });
} else {
  console.error('Waduh, tombolnya nggak ketemu! Cek lagi ID-nya di HTML.');
}
      const gambargrup =`<img src="http://localhost:3000/uploads/profile/${gambarprofile}" 
           onerror="this.src='http://localhost:3000/uploads/profile/none.png'" 
           alt="Foto" 
           class="header-profile-image" width='40' height='40'>`
      console.log(`pengen tau ${lawanChat}`)
      namachat.innerHTML = `
        <div class="d-flex justify-content-between align-items-center w-100">
          <div>
          
          <span><a class="nav-link" href="#" data-bs-toggle="modal" data-bs-target="#photogrup" style="display:inline-block">
            ${gambargrup}</a></span>
            <span class="fw-bold fs-5">#${lawanChat}</span>
            <span class="badge ${badgeColor} ms-1" style="font-size: 10px; vertical-align: middle;">
              ${myRole.toUpperCase()}
            </span>
          </div>
          
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
            // 1. Definisikan ID pengirim dan status isSent
            const senderId = p.sender.id || p.sender.user_id;
            const isSent = String(senderId) === String(currentUserId);
            const kelas = isSent ? 'message sent' : 'message received';
            const username = p.sender.username || 'User';
        
            // 2. DEKLARASI contentHtml (Ini yang tadi error karena tidak didefinisikan)
            let contentHtml = ''; 
        
            // 3. Deteksi Pesan Gambar atau Teks
            const isImage = p.messageType === 'image' || (p.imageUrl && p.imageUrl !== 'null');
        
            if (isImage) {
                contentHtml = `
                    <div class="chat-image-wrap">
                        <img src="http://localhost:3000/uploads/${p.imageUrl}" 
                             class="img-fluid rounded shadow-sm" 
                             style="max-width: 200px; cursor: pointer;" 
                             onclick="window.open(this.src)">
                        ${p.content ? `<span class="mt-2 mb-0" style="font-size: 14px;">${renderContent(p.content)}</span>` : ''}
                    </div>`;
            } else {
                contentHtml = renderContent(p.content || '');
            }
        
            // 4. Tombol Aksi
            const tombolEdit = (isSent && !isImage) ? `<button class="btn btn-sm text-primary p-0 me-1" onclick="editMessageGrup(${p.messageId})"><i class="bi bi-pencil-square"></i></button>` : '';
            const tombolHapus = isSent ? `<button class="btn btn-sm text-danger p-0" onclick="deleteMessageGrup(${p.messageId})"><i class="bi bi-trash3"></i></button>` : '';
        
            // 5. Render ke HTML
            const pesanHtml = `
                <div class="${kelas}" data-id="${p.messageId}">
                    <div class="message-bubble p-2 rounded shadow-sm">
                        <small class="d-block fw-bold mb-1" style="font-size: 11px;">${username}</small>
                        <div class="message-text">${contentHtml}</div>
                        <div class="d-flex justify-content-end align-items-center mt-1" style="font-size: 10px; opacity: 0.8;">
                            ${tombolEdit} ${tombolHapus}
                            <span class="ms-1">${new Date(p.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                        </div>
                    </div>
                </div>`;
            
            isipesan.insertAdjacentHTML('beforeend', pesanHtml);
        });
      }
  
      // Auto-scroll ke pesan paling bawah
      isipesan.scrollTop = isipesan.scrollHeight;
  
    } catch (error) {
      console.error('Gagal memuat pesan:', error);
    }
  }
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

  // bagian kirim pesannya 

  export function initChatHandlers(conversationId, grupId, token, currentUserId, lawanChat) {
    document.getElementById('chat-form').addEventListener('submit', (e) => {
      e.preventDefault();
      sendMessage(conversationId, grupId, token, currentUserId, lawanChat);
    });
  }
  
  async function sendMessage(conversationId, grupId, token, currentUserId, lawanChat) {
  
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
  
      await sendMessageGrup(grupId, token, currentUserId, lawanChat);
  
    } else if (conversationId) {
  
      try {
  
        const response = await fetch(`http://localhost:3000/api/${conversationId}/send`, {
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
  export function appendMessage(message ,currentUserId, mode = 'private') {
if(message){
  console.log(message)
}else{
  console.log('pesan tidak ada')
}
    const chatBox = document.getElementById("messages");
    if (!chatBox) {
      console.log("CHATBOX TIDAK ADA (PRIVATE KEMUNGKINAN MASUK SAAT TAB KONTAK)");
      return;
    }
  
    const isSent = message.senderId == currentUserId;
    const kelas = isSent ? 'message sent' : 'message received';
    const username = message.senderName || 'User';
  
    let bodyHtml = '';
    // Jika pesan mengandung image (dari socket biasanya membawa imageUrl atau messageType)
    if (message.messageType === 'image' || message.imageUrl) {
      bodyHtml = `
        <img src="http://localhost:3000/uploads/${message.imageUrl}" 
             class="chat-image mb-2" 
             style="max-width: 200px; border-radius: 8px;">
        ${message.content ? `<span class=message-text>${renderContent(message.content)}</span>` : ''}
      `;
    } else {
      bodyHtml = `<span class=message-text>${renderContent(message.content || message.message_text)}</span>`;
    }

    const deleteFn = mode === "group" ? "deleteMessageGrup" : "deleteMessage";
const editFn = mode === "group" ? "editMessageGrup" : "editMessage";
const tombolHapus = isSent 
? `<button class="btn btn-sm btn-outline-danger border-0" onclick="${deleteFn}(${message.messageId})">
    <i class="bi bi-trash"></i>
  </button>` 
: '';

const tombolEdit = (isSent && message.messageType === 'text') 
? `<button class="btn btn-sm btn-outline-primary border-0" onclick="${editFn}(${message.messageId})">
    <i class="bi bi-pencil"></i>
  </button>` 
: '';
  
    const div = document.createElement("div");
    div.className = kelas;
    div.setAttribute("data-id", message.messageId);
  
    div.innerHTML = `
  <div class="message-bubble shadow-sm">
    <small class="d-block fw-bold mb-1">${username}</small>

    
      ${bodyHtml}
    

    <span class="new-message-badge" style="font-size: 9px; color: #dc3545;">baru</span>

    <div class="message-actions">
      ${tombolEdit} ${tombolHapus}
    </div>
  </div>

  <div class="message-time">
    ${new Date(message.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
  </div>
`;
  
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  async function sendMessageGrup(grupId, token, currentUserId, lawanChat) {
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
      const response = await fetch(`http://localhost:3000/api/grup/${grupId}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (response.ok) {
        messageInput.value = '';
        document.getElementById('file-input').value = '';
      
        console.log('berhasil mengirim pesan');
      } 
    } catch (error) {
      console.error('Error:', error.message);
      showAlert(`Gagal mengirim pesan. Silakan coba lagi. ${error.message}`);
    }
}

export function updateContactRealtime(message, currentUserId) {
  // Bunyi hanya kalau bukan pesan dari diri sendiri
if (message.senderId !== currentUserId) {
  playNotification();
}
console.log("senderId:", message.senderId);
console.log("currentUserId:", currentUserId);
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
  const notificationSound = new Audio('../notifikasi/pesan.mp3');
  function playNotification() {
    notificationSound.currentTime = 0; // reset biar bisa bunyi cepat
    notificationSound.play().catch(err => {
      console.log('Audio gagal:', err);
    });
  }

  export async function deleteMessage(messageId) {
    
    const token = localStorage.getItem("token"); 
  
    const konfirmasi = confirm('Yakin ingin menghapus pesan ini?');
  
    if (!konfirmasi) return; // Kalau user batal, jangan lanjut
  
    try {
      const response = await fetch(`http://localhost:3000/api/hapuspesan/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
  
      if (response.ok) {
        
        loadAllChatList(token);
      } else {
        alert('Gagal menghapus pesan!');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Gagal menghapus pesan. Silakan coba lagi.');
    }
  }
  window.deleteMessage = deleteMessage;

  export function buatgrup(){

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
  
      const response = await fetch('http://localhost:3000/api/newGroup', {
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
        loadAllChatList(token)
        formGroup.reset();
      } else {
        showAlert(json.message || 'Grup gagal dibuat', 'danger'); // Tampilkan pesan error dari server
      }
    } catch (error) {
      console.error('Error:', error);
      showAlert('Terjadi kesalahan saat membuat grup', 'danger');
    }
  });
  }
  async function manampilkanmember(grupId) {
    const container = document.getElementById('allmembergrup');
    if (!container) return;
  
    // Tampilkan indikator loading
    container.innerHTML = '<div class="loading">Memuat anggota...</div>';
  
    try {
      const response = await fetch(`http://localhost:3000/api/membergrup/${grupId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
  
      const { data: members, total: totalMembers } = await response.json();
      console.log(members)
  
      if (!members?.length) {
        container.innerHTML = '<div class="no-members">Tidak ada anggota ditemukan.</div>';
        return;
      }
      const namagrup = document.getElementById('namagrup')

      namagrup.innerHTML = `<p>${usernamegrup}</p>`
  
      // Bangun tampilan: header jumlah anggota + daftar kartu anggota
      let html = `
        <div class="member-header">
          <p>Jumlah anggota grup: <strong>${totalMembers}</strong></p>
        </div>
        <div class="member-list">
      `;
  
      members.forEach(member => {
        const profilePic = member.profile_picture
          ? `http://localhost:3000/uploads/profile/${member.profile_picture}`
          : 'http://localhost:3000/uploads/profile/none.png'; // ganti dengan path default avatar Anda
  
        // Logika sederhana: jika selisih waktu kurang dari 5 menit, dianggap Online
        const isOnline = (new Date() - new Date(member.last_online)) < 5 * 60 * 1000;
        const statusClass = isOnline ? 'status-online' : 'status-offline';
        const statusText = isOnline ? 'Online' : `Aktif ${formatDate(member.last_online)}`;
        
        html += `
          <div class="member-card">
            <div class="member-avatar">
              <img src="${profilePic}" alt="${escapeHtml(member.username)}" width="45" height="45">
              <span class="status-indicator ${statusClass}"></span>
            </div>
            
            <div class="member-info">
              <div class="member-header">
                <span class="member-username">${escapeHtml(member.username)}</span>
                <span class="badge-role" style='color:blue; font-size: 10px;'>${escapeHtml(member.role)}</span>
              </div>
              <div class="member-last-seen ${statusClass}" style='font-size: 11px'>${statusText}</div>
            </div>
        
            <div class="member-actions">
              <button class="btn btn-chat" onClick="startChat({otherUserId: ${member.user_id}, username: '${member.username}', image: '${member.profile_picture}'})">
                <i class="fas fa-comment-dots"></i>
              </button>
            </div>
          </div>
        `;
      });
  
      html += `</div>`;
      container.innerHTML = html;
  
    } catch (error) {
      console.error('Error:', error);
      container.innerHTML = '<div class="error-message">Gagal memuat anggota. Silakan coba lagi.</div>';
    }
  }
  
  // Fungsi helper untuk mencegah XSS
  
  
  // Helper function untuk mencegah XSS
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
      if (m === '&') return '&amp;';
      if (m === '<') return '&lt;';
      if (m === '>') return '&gt;';
      return m;
    });
  }
   export async function deleteMessageGrup(messageId) {
  
    const konfirmasi = confirm('Yakin ingin menghapus pesan ini?');
  
    if (!konfirmasi) return; // Kalau user batal, jangan lanjut
  
    try {
      const chatBox = document.getElementById('messages');
const grupId = chatBox.dataset.groupId;
      const response = await fetch(`http://localhost:3000/api/delete/grup/${messageId}?groupId=${grupId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json()
      if (response.ok) {
        showAlert(` ${result.message}`)
      } else {
        showAlert(`Gagal menghapus pesan! ${result.message}`);
      }
    } catch (err) {
      console.error('Error:', err.message);
      alert(`Gagal menghapus pesan. Silakan coba lagi. ${err.message}`);
    }
  }
  window.deleteMessageGrup = deleteMessageGrup
  async function editMessage(messageId) {
    try {
      // Ambil pesan lama
      const resGet = await fetch(`http://localhost:3000/api/editpesan/${messageId}`, {
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
      const resUpdate = await fetch(`http://localhost:3000/api/updatepesan/${messageId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: pesanBaru })
      });
  
      if (resUpdate.ok) {
        showAlert('berhasil mengedit pesan')
        
      } else {
        alert('Gagal mengedit pesan!');
      }
  
    } catch (error) {
      console.error('Gagal mengedit pesan:', error);
      alert('Terjadi kesalahan saat mengedit pesan.');
    }
  }
  window.editMessage = editMessage

  async function editMessageGrup(messageId) {
    try {

      // Ambil pesan lama
      const resGet = await fetch(`http://localhost:3000/api/editpesangrup/${messageId}`, {
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
      const resUpdate = await fetch(`http://localhost:3000/api/updatepesangrup/${messageId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: pesanBaru })
      });
  
      if (resUpdate.ok) {
        console.log('berhasil mengedit pesan')
        
      } else {
        alert('Gagal mengedit pesan!');
      }
  
    } catch (error) {
      console.error('Gagal mengedit pesan:', error);
      alert('Terjadi kesalahan saat mengedit pesan.');
    }
  }
window.editMessageGrup = editMessageGrup

export function removeMessageFromUI(messageId) {
  const el = document.querySelector(`[data-id="${messageId}"]`);
  if (el) el.remove();
}