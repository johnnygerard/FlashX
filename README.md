# FlashX
FlashX is a flashcard web application.

Visit the website at this address: [flashx.azurewebsites.net](https://flashx.azurewebsites.net)

Users must create an account to get started.  
As indicated by the domain name, the website is hosted on [Microsoft Azure](https://azure.microsoft.com/en-us/).

## Architecture
FlashX is a dynamic multi-page application.

### Front-end
The HTML is rendered dynamically thanks to the [EJS template engine](https://ejs.co/).  
The rest is pure CSS and JavaScript.

### Back-end
The back-end has two main components:  
* an [Express](https://expressjs.com) HTTP server deployed with [Azure App Service](https://azure.microsoft.com/en-us/services/app-service/)
* a [MongoDB Atlas](https://www.mongodb.com/atlas) database (also uses the Azure cloud)

These two communicate together via a RESTful API.  

### Execution Flow
At deployment time, a Linux VM starts a new Docker container which runs [Node.js](https://nodejs.dev/en/) (16 LTS).  
Node.js launches [PM2](https://pm2.keymetrics.io/) (a process manager) which in turn starts the Express server.

### Authentication
The authentication is provided by [Passport](https://www.passportjs.org/).  
Currently there is only one authentication strategy: username and password.  
More authentication strategies will be added later.

## Project Status
The current version is 1.0.0.  
This first version of FlashX is very limited.  
Notably there is no testing and no mobile responsive design.  

Initially I wanted to build FlashX using the popular MEAN stack.  
It felt too complicated, which is why I chose to build a traditional MPA instead.  
I plan to migrate the front-end to Angular at a later time.  

## Copyright
© 2022 Johnny Gérard
