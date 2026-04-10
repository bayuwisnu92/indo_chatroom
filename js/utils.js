export function formatDate(isoString) {
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

  export function renderContent(content) {
    // Jika content null atau undefined, kembalikan string kosong
    if (!content) return "";
    
    // Sanitasi teks dari tag HTML
    return content.toString().replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

 export function showAlert(message, type) {
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


  console.log("UTILS LOADED");




