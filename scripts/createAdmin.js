/**
 * Script to create the first admin account
 * 
 * Usage:
 * 1. Make sure Convex is running: npx convex dev
 * 2. Run this script: node scripts/createAdmin.js
 * 
 * Or use Convex Dashboard:
 * 1. Go to https://dashboard.convex.dev
 * 2. Select your project
 * 3. Go to Functions tab
 * 4. Call admin.createAdmin with:
 *    {
 *      "username": "admin",
 *      "password": "your_secure_password"
 *    }
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('========================================');
console.log('Admin Account Creation');
console.log('========================================\n');

rl.question('Enter admin username: ', (username) => {
  rl.question('Enter admin password: ', (password) => {
    console.log('\n========================================');
    console.log('To create this admin account:');
    console.log('========================================\n');
    console.log('Option 1: Using Convex Dashboard');
    console.log('1. Go to https://dashboard.convex.dev');
    console.log('2. Select your project');
    console.log('3. Go to Functions tab');
    console.log('4. Find "admin.createAdmin" function');
    console.log('5. Call it with:');
    console.log(JSON.stringify({
      username: username,
      password: password
    }, null, 2));
    console.log('\nOption 2: Using Convex CLI');
    console.log('Run this command:');
    console.log(`npx convex run admin:createAdmin '{"username": "${username}", "password": "${password}"}'`);
    console.log('\n========================================');
    console.log('After creating the account, you can login with:');
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    console.log('========================================\n');
    rl.close();
  });
});

