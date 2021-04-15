const request = window.indexedDB.open("budget", 1);
let db;

request.onupgradeneeded = (e) => {
  let db = e.target.result;
  db.createObjectStore("pending", { autoIncrement: true });
};

request.onerror = function (e) {
  console.log("There was an error");
};

function saveRecord(record) {
  const tx = db.transaction(["pending"], "readwrite");
  const store = tx.objectStore("pending");

  store.add(record);
}

request.onsuccess = function (e) {
  db = e.target.result;

  if (navigator.onLine) {
    const tx = db.transaction("pending", "readwrite");
    const store = tx.objectStore("pending");
    const getAll = store.getAll();

    getAll.onsuccess = function () {
      if (getAll.result.length > 0) {
        fetch("/api/transaction/bulk", {
          method: "POST",
          body: JSON.stringify(getAll.result),
          headers: {
            Accept: "application/json, text/plain, */*",
            "Content-Type": "application/json",
          },
        })
          .then((response) => {
            return response.json();
          })
          .then(() => {
            const tx = db.transaction(["pending"], "readwrite");
            const store = tx.objectStore("pending");
            store.clear();
          });
      }
    };
  }
};