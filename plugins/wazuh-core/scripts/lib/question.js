const readline = require('readline');

async function question(question) {
  return new Promise(res => {
    const rd = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rd.question(question, input => {
      rd.close();
      res(input);
    });
  });
}

module.exports = {
  question,
};
