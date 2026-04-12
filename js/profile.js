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