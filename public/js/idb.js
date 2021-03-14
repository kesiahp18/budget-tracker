let db;
const request = indexedDB.open('budget_tracker', 1);

request.onupgradeneeded = function(event) {
    // save a reference to the database 
    const db = event.target.result;
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

request.onsuccess = function(event) {
    //save reference to db in global variable
    db = event.target.result;
  
    if (navigator.onLine) {
      uploadTransaction();
    }
};
  
request.onerror = function(event) {
    console.log(event.target.errorCode);
};

function saveRecord(record) {
    // open a new transaction with the database with read and write permissions
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    //acess the object store 
    const transactionObjectStore = transaction.objectStore('new_transaction');

    //add record to your store with add method
    transactionObjectStore.add(record);
}

function uploadTransaction() {
    //open a transaction on your db
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    //access object store
    const transactionObjectStore = transaction.objectStore('new_transaction');

    //set to a variable
    const getAll = transactionObjectStore.getAll();

    getAll.onsuccess = function() {
        // if there was data in indexedDb's store send it to the api server
        if (getAll.result.length > 0) {
          fetch('/api/transaction', {
            method: 'POST',
            body: JSON.stringify(getAll.result),
            headers: {
              Accept: 'application/json, text/plain, */*',
              'Content-Type': 'application/json'
            }
          })
            .then(response => response.json())
            .then(serverResponse => {
              if (serverResponse.message) {
                throw new Error(serverResponse);
              }
    
              const transaction = db.transaction(['new_transaction'], 'readwrite');
              const transactionObjectStore = transaction.objectStore('new_transaction');
              // clear all items in your store
              transactionObjectStore.clear();
            })
            .catch(err => {
              // set reference to redirect back here
              console.log(err);
            });
        }
    };
}
    
window.addEventListener('online', uploadTransaction);