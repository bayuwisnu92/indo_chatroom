import { formatDate, renderContent, showAlert ,showTypingIndicator, hideTypingIndicator}
from "./utils.js";
import { port } from "./port.js"
import { verifyToken, decodeToken, logoutOnline }
from "./auth.js";
import { loadAllChatList, startChat } from "./contacts.js";
window.startChat = startChat;
window.showContacts= showContacts;
import { initSocket } from "./socket.js";

import { initSearch, carikontak, submitAddMember } from "./search.js";
import { loadMessages, loadMessagesGrup, appendMessage, updateContactRealtime, initChatHandlers, buatgrup, removeMessageFromUI, renderStatus } from "./chat.js";
import { updateProfile, updateprofilegrup } from "./profile.js";
import { unlockAudio } from "./notifikasi.js";

document.addEventListener("click", () => {
   unlockAudio();
}, { once:true });

// const notificationSound = new Audio('../notifikasi/Jejak_Cinta_Abadi.mp3');
// function playNotification() {
//   notificationSound.currentTime = 0; // reset biar bisa bunyi cepat
//   notificationSound.play().catch(err => {
//     console.log('Audio gagal:', err);
//   });
// }
// Optional: supaya preload

let activeConversationId = null;
let activeGrupId = null
// 在页面加载后执行
document.addEventListener('DOMContentLoaded', function() {
  const fabToggle = document.getElementById('fabToggle');
  const fabMenu = document.getElementById('fabMenu');
  
  // 点击主按钮切换菜单
  fabToggle.addEventListener('click', function(e) {
    e.stopPropagation();
    fabMenu.classList.toggle('show');
  });
  
  // 点击页面其他地方关闭菜单
  document.addEventListener('click', function(e) {
    if (!fabToggle.contains(e.target) && !fabMenu.contains(e.target)) {
      fabMenu.classList.remove('show');
    }
  });
  
  // 点击菜单项后自动关闭（可选）
  const menuItems = fabMenu.querySelectorAll('.fab-item');
  menuItems.forEach(item => {
    item.addEventListener('click', function() {
      fabMenu.classList.remove('show');
    });
  });
  
  // 登出功能（保留原逻辑）
  
});

let currentUserId = null;
let currentGrupId = null;

const formPhoto = document.getElementById('formPhoto');

formPhoto.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(formPhoto);

  await updateProfile(formData); // tunggu selesai

  formPhoto.reset();
});




const urlParams = new URLSearchParams(window.location.search);
export const conversationId = urlParams.get('conversationId');

activeConversationId = conversationId;
const lawanChat =urlParams.get('username');
export const gambarprofile =urlParams.get('image');


export const grupId = urlParams.get('grupId')
activeGrupId= grupId
export const token = localStorage.getItem("token");
if(!token){
  window.location.href = 'login.html';
}else{
  verifyToken(token)
    .then(userData => {
      const user = userData.user || {};
        currentUserId = user.user_id || user.id || decodeToken(token); // fallback terakhir
      console.log(currentUserId)
        // Validasi user ID
        if (!currentUserId) {
          throw new Error("User ID tidak ditemukan di token atau respons");
        }
        
        loadProtectedContent(userData);
        initChatHandlers(conversationId, grupId, token, currentUserId, lawanChat);

        // bagian socket
        const socket = initSocket(token, currentUserId, {

          conversationId,
          grupId,
        
          onNewMessage: (message) => {
            const normalized = normalizeMessage(message);
            appendMessage(normalized, currentUserId,'private');
          },
        
          onGroupMessage: (data) => {
            const normalized = normalizeMessage(data);
            appendMessage(normalized, currentUserId,'group')
            console.log(data)
          }, 
          onUpdateContact: (data) => {
              updateContactRealtime(data, currentUserId);
              


            },

            onUpdateGroupContact: (data) => {
              updateContactRealtime(data, currentUserId);
            },
        
          onRefreshContact: () => {
            loadAllChatList(token);
          },
        
          onNewGroup: (data) => {
            showAlert(data.message);
            loadAllChatList(token);
          },
          onMessageDeleted: ({ messageId }) => {
            console.log(messageId)
            const messageElement = document.querySelector(`[data-id="${messageId}"]`);

            if (messageElement) {
              messageElement.remove(); // hapus dari tampilan
            }
          },
          onMessageEdited: (data) => {
            console.log("EDIT REALTIME:", data);
          
            const el = document.querySelector(`[data-id="${data.messageId}"]`);
            console.log(el)
          
            const contentEl = el.querySelector(".message-text");

            if(!contentEl){
              console.log('pesan tidak masuk')
            }
          
            if (contentEl) {
              contentEl.innerHTML = renderContent(data.content) + 
                `<span style="font-size:10px; color:gray;"> (diedit)</span>`;
            }
          },

          onUserStatus: (data) => {
            console.log("STATUS USER:", data);
            updateUserStatusUI(data);
            const contact = document.querySelector(`.contact-card[data-user-id="${data.userId}"]`);
              if (!contact) return;

              const statusDot = contact.querySelector(".status-indicator");
              const statusText = contact.querySelector(".status-text");

              if (statusDot) {
                statusDot.classList.remove("online", "offline");
                statusDot.classList.add(data.status);
              }

              if (statusText) {
                statusText.textContent = data.status;
              }
            
          },
          onUserTyping: (data) => {
            console.log("Typing:", data);
          
            if (
              String(data.id) !== String(activeConversationId) &&
              String(data.id) !== String(activeGrupId)
            ) return;
          
            if (String(data.senderId) !== String(currentUserId)) {
              showTypingIndicator(data);
            }
          },
          
          onUserStopTyping: (data) => {
            console.log("stopTyping:", data);
          
            if (
              String(data.id) !== String(activeConversationId) &&
              String(data.id) !== String(activeGrupId)
            ) return;
          
            hideTypingIndicator(data);
          },

          
          onGroupMessageDeleted: ({ messageId }) => {
            removeMessageFromUI(messageId);
            loadAllChatList(token)
          },
          onGroupMessageEdited: (data) => {
            console.log("GROUP EDIT:", data);
          
            const el = document.querySelector(`[data-id="${data.messageId}"]`);
            if (!el) return;
          
            const contentEl = el.querySelector(".message-text");
            if (!contentEl) return;
          
            contentEl.innerHTML = renderContent(data.content) +
              `<span style="font-size:10px; color:red;"> (diedit)</span>`;
          },
          
          
          messageDelivered: (data) => {
              if(data.senderId !== currentUserId) {
                socket.emit("messageDelivered", {
                  messageId: data.messageId,
                  conversationId: data.conversationId
                });
              }
            console.log("DELIVERED:", data);
          },
          onMessageStatus: (data) => {
            console.log("STATUS UPDATE:", data);
          
            // 🔥 CASE 1: single message (sent / delivered)
            if (data.messageId) {
              const msgEl = document.querySelector(`[data-id="${data.messageId}"]`);
              if (!msgEl) return;
          
              if (!msgEl.classList.contains("sent")) return;
          
              const statusEl = msgEl.querySelector(".status-icon");
              if (!statusEl) return;
          
              statusEl.innerHTML = renderStatus(data.status);
            }
          
            // 🔥 CASE 2: multiple message (read)
            if (data.messageIds && Array.isArray(data.messageIds)) {
              data.messageIds.forEach(id => {
                const msgEl = document.querySelector(`[data-id="${id}"]`);
                if (!msgEl) return;
          
                if (!msgEl.classList.contains("sent")) return;
          
                const statusEl = msgEl.querySelector(".status-icon");
                if (!statusEl) return;
          
                statusEl.innerHTML = renderStatus(data.status);
              });
            }
          }
        });

        
      
        if (conversationId && !isNaN(conversationId)) {
      
          document.querySelector('.chat-container').style.display = 'block';
          loadMessages(conversationId, token, currentUserId, socket);
        
          if (window.innerWidth <= 768) {
            document.getElementById('kontak').style.display = 'none';
          }
        
        } else if (grupId && !isNaN(grupId)) {
        
          document.querySelector('.chat-container').style.display = 'block';
          loadMessagesGrup(grupId, token, currentUserId, lawanChat, socket);;
        
          if (window.innerWidth <= 768) {
            document.getElementById('kontak').style.display = 'none';
          }
        
        } else {
        
          document.querySelector('.chat-container').style.display = 'none';
        
          const pesanKosong = document.getElementById('pesanBelumada');
          if (pesanKosong) {
            pesanKosong.innerHTML = `
              <i class="bi bi-chat-dots"></i> <span>Silahkan pilih orang untuk chat</span>`;
          }
        
        }
    })
    .catch(err => {
      console.error(err);
    });
}


function normalizeMessage(msg) {
  return {
    messageId: msg.messageId || msg.id,
    senderId: msg.senderId || msg.from,
    senderName: msg.senderName || msg.sender || 'User',
    content: msg.content || msg.message_text || msg.text,
    messageType: msg.messageType || 'text',
    imageUrl: msg.imageUrl || null,
    timestamp: msg.timestamp || msg.createdAt || new Date()
  };
}
  initSearch(token);
  carikontak(token)
  buatgrup()
  document.getElementById('btn-submit-member')
  .addEventListener('click', () => submitAddMember(token));
  function loadProtectedContent(userData) {
    try {
      
      const user = userData.user || {};
      const username = user.username || 'Guest';
      const userId = user.id || 'N/A';
      const photo = user.profil
      console.log(photo)
      document.title = `Chat App - ${username}`; // ⬅️ Tambahkan ini
      // 3. Update DOM
      const homeElement = document.getElementById('home');
      console.log(homeElement)
      const chatNameElement = document.getElementById('chat-name');
      if (homeElement) {
        homeElement.textContent = `${username} (ID: ${userId})`;
        homeElement.innerHTML = `
        <img src="${port}/uploads/profile/${photo}" alt="Profile" class="rounded-circle me-2" style="width: 30px; height: 30px;">
        ${username} (ID: ${userId})
      `;
      }
      if (chatNameElement) {
        chatNameElement.textContent = `#${lawanChat}`;
      }
  
    
      document.getElementById('logout').addEventListener('click', async () => {
        try{
          const response = await fetch(`${port}/api/logout`, {
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

  loadAllChatList(token);
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('Service Worker terdaftar!', reg))
        .catch(err => console.log('Gagal daftar SW', err));
    });
  }


  const formphotogrup = document.getElementById('formPhotogrup');

formphotogrup.addEventListener('submit', async (e) => {
  e.preventDefault();


  const formData = new FormData(formphotogrup);

  for (let [key, value] of formData.entries()) {
    console.log(key, value); 
}

  // Jalankan fungsi update
  await updateprofilegrup(grupId, formData);
 console.log(grupId)
 console.log(formData)

  formphotogrup.reset();
});

function showContacts() {
  document.getElementById('kontak').style.display = 'block';
  document.querySelector('.chat-container').style.display = 'none';
}

function updateUserStatusUI({ userId, status }) {

  // 🔥 update header chat (lawan bicara)
  const header = document.querySelector(`.chat-header-content[data-user-id="${userId}"]`);
  
  if (header) {
    const dot = header.querySelector(".status-indicator-dot");
    const text = header.querySelector(".status-text-small");

    if (dot) {
      dot.classList.remove("online", "offline");
      dot.classList.add(status);
    }

    if (text) {
      text.textContent = status;
    }
  }

}

