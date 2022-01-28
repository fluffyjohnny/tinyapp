
const helpers = (users, bcrypt) => {

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
      if (database[user].email === email)
        return database[user].id;
  };

  const getDate = () => {
    let d = new Date();
    const whatMonth = () => {
      switch (d.getMonth()) {
      case 0:
        return 'Jan';
      case 1:
        return 'Feb';
      case 2:
        return 'Mar';
      case 3:
        return 'Apr';
      case 4:
        return 'May';
      case 5:
        return 'Jun';
      case 6:
        return 'Jul';
      case 7:
        return 'Aug';
      case 8:
        return 'Sept';
      case 9:
        return 'Oct';
      case 10:
        return 'Nov';
      case 11:
        return 'Dec';
      }
    };
    return (`${whatMonth()}/${d.getDate()}/${d.getFullYear()}`);
  };

  const getTime = () => {
    let d = new Date();
    return (`${d.getHours()}h ${d.getMinutes()}min ${d.getSeconds()}s`);
  };

  return { generateRandomString, registeredEmail, verifyUser, getUserByEmail, getDate, getTime };
};


module.exports = helpers;
