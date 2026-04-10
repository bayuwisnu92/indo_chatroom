
import { renderContent } from "./utils.js";
import { conversationId, grupId, token } from "./main.js";
import { showAlert } from "./utils.js";


export async function loadMessages(conversationId, token, currentUserId, socket) {
    socket.emit("joinConversation", conversationId);
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
    const senderId = p.sender.id || p.sender.user_id;
    const isSent = String(senderId) === String(currentUserId);
    const kelas = isSent ? 'message sent' : 'message received';
    const username = p.sender.username || 'Anonim';
    console.log("ID Pengirim:", senderId, "ID Saya:", currentUserId, "Apakah Sama?", String(senderId) === String(currentUserId));
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
          ${p.content ? `<p class="mt-2 mb-0">${renderContent(p.content)}</p>` : ''}
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
  <div class="message-bubble shadow-sm"> <p class="mb-1">
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
  
  
  
  export async function loadMessagesGrup(grupId, token, currentUserId, lawanChat) {
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
                        ${p.content ? `<p class="mt-2 mb-0" style="font-size: 14px;">${renderContent(p.content)}</p>` : ''}
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

  document.getElementById('chat-form').addEventListener('submit', (e) => {
    e.preventDefault();
    sendMessage(conversationId, grupId, token);
  });
  
  async function sendMessage(conversationId, grupId, token) {
  
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
  
      await sendMessageGrup(grupId, token);
  
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
  export function appendMessage(message ,currentUserId) {

    const chatBox = document.getElementById("messages");
    if (!chatBox) return;
  
    const isSent = message.senderId == currentUserId;
    const kelas = isSent ? 'message sent' : 'message received';
    const username = message.senderName || 'User';
  
    let bodyHtml = '';
    // Jika pesan mengandung image (dari socket biasanya membawa imageUrl atau messageType)
    if (message.messageType === 'image' || message.imageUrl) {
      bodyHtml = `
        <img src="http://localhost:3000/uploads/${message.imageUrl}" class="chat-image mb-2" style="max-width: 200px; border-radius: 8px;">
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

  async function sendMessageGrup(grupId, token, ) {
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
    loadMessagesGrup(grupId, token, currentUserId, lawanChat);
    
    console.log(`berhasil mengirim pesan`)
  } else {
    showAlert(`Gagal mengirim pesan!`);
  }
} catch (error) {
  console.error('Error:', error.message);
  showAlert(`Gagal mengirim pesan. Silakan coba lagi. ${error.message}`);
}
}

export function updateContactRealtime(message, currentUserId) {
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