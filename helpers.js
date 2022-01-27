
const helperFunctions =  (users, bcrypt) => {

  const generateRandomString = (num) => {
    let str = '';
    const char = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < num; i++) {
      str += char.charAt(Math.floor(Math.random() * char.length));
    }
    return str;
  };
  
  const registeredEmail = (email) => {
    for (let id in users) {
      if (users[id].email === email) {
        return true;
      }
    }
    return false;
  };
  
  const verifyUser = (email, password) => {
    for (const user in users) {
      if (users[user].email === email && bcrypt.compareSync(password, users[user].password)) {
        return users[user];
      }
    }
    return false;
  };

  const getUserByEmail = function(email, database) {
    for (const user in database)
      if (email === database[user].email)
        return database[user].id;
  };

};


module.exports = helperFunctions;
