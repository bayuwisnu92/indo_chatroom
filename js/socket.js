// socket.js
import { getActiveConversation } from "./state.js";
export function initSocket(token, currentUserId, handlers) {

    const socket = io("http://localhost:3000", {
      auth: { token }
    });
  
    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    
      if (currentUserId) {
        socket.emit("joinPersonalRoom", currentUserId);
      }
    
      if (handlers.conversationId) {
        socket.emit("joinConversation", handlers.conversationId);
      }
    
      if (handlers.grupId) {
        socket.emit("joinGroup", handlers.grupId);
      }
    });
  
    // ========================
    // EVENT: MESSAGE MASUK
    // ========================
    socket.on("newMessage", (message) => {
     
      if(handlers.messageDelivered) {
        handlers.messageDelivered(message);
      }
      if (handlers.onNewMessage) {
        handlers.onNewMessage(message);
      }
      const activeConversationId = getActiveConversation();
       // 🔥 TAMBAHAN PENTING
        if (
          message.senderId !== currentUserId &&
          String(message.conversationId) === String(activeConversationId)
        ) {
          socket.emit("messageRead", {
            conversationId: message.conversationId
          });
        }
  
    });

    socket.on("messageStatus", (data) => {
      if(handlers.onMessageStatus){
        handlers.onMessageStatus(data)
      }
    });
  
    // ========================
    // UPDATE CONTACT LIST
    // ========================
    socket.on("updateContactList", (data) => {
  
      if (handlers.onUpdateContact) {
        handlers.onUpdateContact(data);
      }
  
    });
  
    // ========================
    // STATUS USER
    // ========================
    socket.on("user_status", (data) => {
  
      if (handlers.onUserStatus) {
        handlers.onUserStatus(data);
      }
  
    });
    socket.on("updateContactListAfterDelete", (data) => {
      console.log("UPDATE CONTACT DELETE:", data);
    
      if (handlers.onRefreshContact) {
        handlers.onRefreshContact();
      }
    });
  
    socket.on("updateGroupContactList", handlers.onUpdateGroupContact);

    
    // ========================
    // GROUP MESSAGE
    // ========================
    socket.on("newGroupMessage", (data) => {
  
      if (handlers.onGroupMessage) {
        handlers.onGroupMessage(data);
      }
  
    });
  
    socket.on("updateGroupContactList", () => {
      if (handlers.onRefreshContact) {
        handlers.onRefreshContact();
      }
    });
  
    socket.on("newGroupAssigned", (data) => {
      if (handlers.onNewGroup) {
        handlers.onNewGroup(data);
      }
    });

    socket.on("messageDeleted", (data) => {
      console.log("🔥 RECEIVER DAPAT DELETE:", data);
      if (handlers.onMessageDeleted) {
        handlers.onMessageDeleted(data);
      }
    });
    
    socket.on("groupMessageDeleted", (data) => {
      if (handlers.onGroupMessageDeleted) {
        handlers.onGroupMessageDeleted(data);
      }
    });

    socket.on("messageEdited", (data) => {
      if (handlers.onMessageEdited) {
        handlers.onMessageEdited(data);
      }
    });
    socket.on("groupMessageEdited", (data) => {
      if (handlers.onGroupMessageEdited) {
        handlers.onGroupMessageEdited(data);
      }
    });

    socket.on("userTyping", (data) => {
      console.log("🟢 RAW SOCKET userTyping:", data);
      if(handlers.onUserTyping) {
        handlers.onUserTyping(data);
      }
    });
    
    socket.on("userStopTyping", (data) => {
      if(handlers.onUserStopTyping) {
        handlers.onUserStopTyping(data);
      }
    });
  
    return socket;
  }