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
  
    return socket;
  }