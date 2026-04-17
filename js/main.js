import { formatDate, renderContent, showAlert }
from "./utils.js";

import { verifyToken, decodeToken, logoutOnline }
from "./auth.js";
import { loadAllChatList, startChat } from "./contacts.js";
window.startChat = startChat;
window.showContacts= showContacts;
import { initSocket } from "./socket.js";

import { initSearch, carikontak, submitAddMember } from "./search.js";
import { loadMessages, loadMessagesGrup, appendMessage, updateContactRealtime, initChatHandlers, buatgrup, removeMessageFromUI } from "./chat.js";
import { updateProfile, updateprofilegrup } from "./profile.js";

// const notificationSound = new Audio('../notifikasi/Jejak_Cinta_Abadi.mp3');
// function playNotification() {
//   notificationSound.currentTime = 0; // reset biar bisa bunyi cepat
//   notificationSound.play().catch(err => {
//     console.log('Audio gagal:', err);
//   });
// }
// Optional: supaya preload


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
const lawanChat =urlParams.get('username');
export const gambarprofile =urlParams.get('image');


export const grupId = urlParams.get('grupId')
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
            appendMessage(message, currentUserId);
            

            console.log(message.senderId)
            
          },
        
          onGroupMessage: (data) => {
            appendMessage(data, currentUserId);
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
          
          onGroupMessageDeleted: ({ messageId }) => {
            removeMessageFromUI(messageId);
            loadAllChatList(token)
          },
        
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
        <img src="http://localhost:3000/uploads/profile/${photo}" alt="Profile" class="rounded-circle me-2" style="width: 30px; height: 30px;">
        ${username} (ID: ${userId})
      `;
      }
      if (chatNameElement) {
        chatNameElement.textContent = `#${lawanChat}`;
      }
  
    
      document.getElementById('logout').addEventListener('click', async () => {
        try{
          const response = await fetch('http://localhost:3000/api/logout', {
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