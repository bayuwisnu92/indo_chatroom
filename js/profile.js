import { showAlert } from "./utils.js";
import { loadAllChatList } from "./contacts.js";
export async function updateProfile(file) {
    const token = localStorage.getItem("token");

    
    file.append('photo', file); // ⬅️ HARUS MATCH BACKEND

    try {
        const response = await fetch('http://localhost:3000/api/update-photo', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: file
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Upload gagal');
        }

        showAlert(data.message);
        loadAllChatList(token);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

export async function updateprofilegrup(grupId, formData) {
    const token = localStorage.getItem("token");

    try {
        // Jangan tambahkan headers 'Content-Type', biarkan browser yang mengaturnya otomatis untuk FormData
        const response = await fetch(`http://localhost:3000/api/updategrupphoto/${grupId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData // Kirim formData langsung dari main.js
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Upload gagal');
        }

        showAlert(data.message);
        
        // Tutup modal jika perlu (opsional)
        // bootstrap.Modal.getInstance(document.getElementById('modalGantiFoto')).hide();

        loadAllChatList(token);
        
    } catch (error) {
        console.error('Error:', error.message);
        showAlert(error.message, 'danger');
    }
}
