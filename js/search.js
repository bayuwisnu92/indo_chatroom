import {mapSearchUsers, listContact} from "./contacts.js";

export function initSearch(token) {
const pencarian = document.getElementById("pencarian");

let timeout;

pencarian.addEventListener("input", async function () {

  clearTimeout(timeout);

  timeout = setTimeout(async () => {

    const keyword = this.value.trim();

    if (keyword.length < 2) {
      listContact(dataGlobal);
      return;
    }

    try {

      const res = await fetch(`http://localhost:3000/api/users/search?q=${keyword}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const users = await res.json();

      const mappedUsers = mapSearchUsers(users);

      listContact(mappedUsers);

    } catch (err) {
      console.error("Search error:", err);
    }

  }, 300);

});

}