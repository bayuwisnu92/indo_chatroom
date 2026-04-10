// socket.js

export function initSocket(token, currentUserId, handlers) {

    const socket = io("http://localhost:3000", {
      auth: { token }
    });
  
    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
  
      if (currentUserId) {
        socket.emit("joinPersonalRoom", currentUserId);
      }
  
      // if (handlers.conversationId) {
      //   socket.emit("joinConversation", handlers.conversationId);
      // }
  
      if (handlers.grupId) {
        socket.emit("joinGroup", handlers.grupId);
      }
    });
  
    // ========================
    // EVENT: MESSAGE MASUK
    // ========================
    socket.on("newMessage", (message) => {
  
      if (handlers.onNewMessage) {
        handlers.onNewMessage(message);
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
  
    return socket;
  }