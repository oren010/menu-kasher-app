# 🚀 VibeCoder by Elestio

Welcome to your **Elestio development environment**, powered by **Claude AI**.  
Everything is ready and set up for you to start coding in a smooth and efficient workspace.

## 📝 VS Code Access

To access your VS Code environment:

1. Go to your **Elestio service overview** page.
2. Click on the **Tools** tab.
3. Click the **VS Code** button.
4. A popup will open — click **Copy** in the _Password_ section.
5. Click the **URL link**.
6. When the page opens, paste the password you copied earlier.

---

## 🤖 Claude Configuration

To authenticate the Claude CLI:

1. Open a terminal in your VS Code environment.
2. Type the following command and press Enter:
   ```bash
   claude
   ```
3. You will be prompted to sign in to your Claude account.
4. If a popup appears with a link, close it.
5. Instead, copy the link shown in the terminal and paste it into a new browser tab.
6. Authorize access in the browser.
7. Copy the password displayed on the success page.
8. Paste it into your terminal and press Enter to finish authentication.

---

## 📋 Useful Information

Your project is already configured and ready to use.

Here's what happens when you enter a prompt:

- A docker-compose file is automatically generated.
- The required ports for your app are exposed.
- The environment tells you which port your app is running on.

---

## 🌐 Custom Domain Configuration

By default, the environment uses the provided CNAME, for example:

```env
DOMAIN=[CI_CD_DOMAIN]
```

If you want to use your own custom domain, edit the `.env` file and change the DOMAIN variable like this:

```env
DOMAIN=[CI_CD_DOMAIN],your-custom-cname
```

# 🚀 Prompt Examples

You can start by writing prompts like the ones below:

---

### 🟢 WhatsApp Clone Project

```txt
Create a project named "ws-chat", a WhatsApp clone with the following specifications:

TECH STACK:
- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: Node.js with WebSockets
- Database: MySQL + phpMyAdmin
- Authentication: JWT

FEATURES:
- User registration/login system (email + password)
- Real-time chat via WebSockets (1-on-1 and group conversations)
- Image upload and display in chats
- All messages stored in the database
- Responsive interface similar to WhatsApp

TECHNICAL REQUIREMENTS:
- JWT stored in localStorage for session handling
- MySQL externally accessible
- phpMyAdmin for database management
- Real-time message sync across clients
- Support for private and group chats
- Chat image preview support
```

### 🟡 Simple Todo App

```txt
Create a project named "todo", a basic Todo list app.

TECH STACK:
- Frontend: HTML, CSS, Vanilla JavaScript

TECHNICAL REQUIREMENTS:
- Store data in localStorage
- Expose the app on port 2048
```

### 🔵 Minimal Hello World API

```txt
Create a project named "api", a minimal REST API that responds with "Hello, World!" on the root endpoint.

TECH STACK:
- Node.js with Express

TECHNICAL REQUIREMENTS:
- Listen on port 3000
- Root route `/` returns plain text "Hello, World!"
```

### 🟣 Static Portfolio Website

```txt
Create a project named "portfolio", a personal static portfolio website.

TECH STACK:
- HTML, CSS, JavaScript

FEATURES:
- Sections: About Me, Projects, Contact
- Responsive design
```

### 🟠 Notes App with Markdown Support

```txt
Create a project named "notes", a notes app with markdown support.

TECH STACK:
- Frontend: React
- Backend: Node.js with Express
- Storage: local JSON file

FEATURES:
- Create/edit/delete notes
- Markdown preview
```
