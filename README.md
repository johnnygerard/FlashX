# FlashX
FlashX is a flashcard web application.

Visit the website at this address: [flashx.azurewebsites.net](https://flashx.azurewebsites.net)

Users must create an account to get started.  
As indicated by the domain name, the website is hosted on [Microsoft Azure](https://azure.microsoft.com/en-us/).

## Architecture
FlashX is a single-page application that uses the [MEAN](https://www.mongodb.com/mean-stack) stack.

### Front-end
HTML, CSS and TypeScript using the [Angular](https://angular.io/) web framework.

### Back-end
The back-end has two main components:  
* an [Express](https://expressjs.com) HTTP server deployed with [Azure App Service](https://azure.microsoft.com/en-us/services/app-service/)
* a [MongoDB Atlas](https://www.mongodb.com/atlas) database (also uses the Azure cloud)

These two communicate together via a RESTful API.  

### Execution flow
At deployment time, a Linux VM starts a new Docker container which runs [Node.js](https://nodejs.dev/en/) (16 LTS).  
Node.js launches [PM2](https://pm2.keymetrics.io/) (a process manager) which in turn starts the Express server.

### Authentication
The authentication is provided by [Passport](https://www.passportjs.org/).  
Currently there is only one authentication strategy: username and password.  
More authentication strategies will be added later.

## Project version history


| version | description |
| --- | --- |
| 2.1.0 | Responsive mobile design |
| 2.0.0 | Angular migration |
| 1.0.0 | First release using [EJS](https://ejs.co/) for the front-end |

## Copyright
© 2022 Johnny Gérard
