// cloud/main.js
Parse.Cloud.define("hello", async (request) => {
    return "Hello from Parse Cloud Code!";
});
