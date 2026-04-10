import { formatDate, renderContent, showAlert }
from "./utils.js";

import { verifyToken, decodeToken, logoutOnline }
from "./auth.js";
import { loadAllChatList, startChat } from "./contacts.js";
window.startChat = startChat;
import { initSocket } from "./socket.js";

import { initSearch } from "./search.js";
import { loadMessages, loadMessagesGrup, appendMessage, updateContactRealtime } from "./chat.js";


let currentUserId = null;
let currentGrupId = null;
let useridnya = null;



const urlParams = new URLSearchParams(window.location.search);
export const conversationId = urlParams.get('conversationId');
const lawanChat =urlParams.get('username');


export const grupId = urlParams.get('grupId')
export const token = localStorage.getItem("token");

verifyToken(token)
  .then(userData => {
    const user = userData.user || {};
      currentUserId = user.user_id || user.id || decodeToken(token); // fallback terakhir
    console.log(currentUserId)
      // Validasi user ID
      if (!currentUserId) {
        throw new Error("User ID tidak ditemukan di token atau respons");
      }
      useridnya = currentUserId;
      loadProtectedContent(userData);
      loadMessages(conversationId, token, currentUserId, socket);
      loadMessagesGrup(grupId, token, currentUserId, lawanChat);
      appendMessage(message, currentUserId);
      updateContactRealtime(message, currentUserId);
  })
  .catch(err => {
    console.error(err);
  });
  initSearch(token);
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
//   startChat({ otherUserId: currentUserId, username: lawanChat });

  const socket = initSocket(token, currentUserId, {

    conversationId,
    grupId,
  
    onNewMessage: (message) => {
      appendMessage(message, currentUserId);
      updateContactRealtime(message, currentUserId);
      
    },
  
    onGroupMessage: (data) => {
      appendMessage(data, currentUserId);
    },
    onUpdateContact: (data) => {
        updateContactRealtime(data, currentUserId);
      },
  
    onRefreshContact: () => {
      loadAllChatList(token);
    },
  
    onNewGroup: (data) => {
      showAlert(data.message);
      loadAllChatList(token);
    }
  
  });

  if (conversationId && !isNaN(conversationId)) {
    document.querySelector('.chat-container').style.display = 'block';
    loadMessages(conversationId, token, currentUserId, socket);
  
    // Hanya sembunyikan kontak jika di layar kecil (max-width: 768px)
    if (window.innerWidth <= 768) {
      document.getElementById('kontak').style.display = 'none';
    }
  
  } else if (grupId && !isNaN(grupId)) {
    document.querySelector('.chat-container').style.display = 'block';
    loadMessagesGrup(grupId, token, currentUserId, lawanChat);
  
    if (window.innerWidth <= 768) {
      document.getElementById('kontak').style.display = 'none';
    }
  
  } else {
    document.querySelector('.chat-container').style.display = 'none';
    document.getElementById('pesanBelumada').innerHTML = `
      <i class="bi bi-chat-dots"></i> <span>Silahkan pilih orang untuk chat</span>`;
  }